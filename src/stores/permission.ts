import type { RouteRecordRaw } from "vue-router";
import { constantRoutes } from "@/router";
import { store } from "@/stores";
import router from "@/router";
import { useUserStoreHook } from "@/stores/user";

import MenuAPI from "@/api/system/menu";
import type { MenuItem, RouteItem } from "@/api/system/menu";
import { MenuType } from "@/api/system/menu";

const modules = import.meta.glob("../views/**/**.vue");
const Layout = () => import("../layouts/index.vue");

function resolveViewComponent(componentPath: string) {
  const normalized = componentPath
    .trim()
    .replace(/^\/+/, "")
    .replace(/\.vue$/i, "");
  return (
    modules[`../views/${normalized}.vue`] ||
    modules[`../views/${normalized}/index.vue`] ||
    modules[`../views/error/404.vue`]
  );
}

/**
 * 将后端菜单树节点转换为前端路由项
 */
function transformMenuToRoute(menu: MenuItem, isTopLevel: boolean): RouteItem | null {
  // 只处理目录和菜单类型（1=目录 2=菜单），链接和 iframe 暂不生成路由
  if (menu.type !== MenuType.DIRECTORY && menu.type !== MenuType.MENU) {
    return null;
  }

  // 禁用的菜单不生成路由
  if (menu.status === 0) {
    return null;
  }

  const route: RouteItem = {
    path: menu.path ?? "",
    name: menu.name,
    component: undefined,
    meta: {
      title: menu.title,
      icon: menu.icon ?? undefined,
      hidden: menu.hidden === 1,
      keepAlive: menu.keepAlive === 1,
      alwaysShow: menu.alwaysShow === 1,
    },
    redirect: menu.redirect ?? undefined,
    children: [],
  };

  // 处理组件
  if (isTopLevel && (menu.type === MenuType.DIRECTORY || !menu.component)) {
    // 顶级目录使用 Layout 组件
    route.component = "Layout";
  } else if (menu.component) {
    route.component = menu.component;
  }

  // 递归处理子菜单
  if (menu.children && menu.children.length > 0) {
    const childRoutes: RouteItem[] = [];
    for (const child of menu.children) {
      const childRoute = transformMenuToRoute(child, false);
      if (childRoute) {
        childRoutes.push(childRoute);
      }
    }
    route.children = childRoutes;
  }

  return route;
}

/**
 * 将 RouteItem 递归转换为 RouteRecordRaw
 */
function transformRouteItems(items: RouteItem[], isTopLevel: boolean): RouteRecordRaw[] {
  return items
    .map((item) => {
      const { component, children, ...args } = item;
      const normalizedRoute = { ...args } as RouteRecordRaw;

      if (!component) {
        normalizedRoute.component = undefined;
      } else if (component === "Layout" && isTopLevel) {
        normalizedRoute.component = Layout;
      } else if (component !== "Layout") {
        normalizedRoute.component = resolveViewComponent(component);
      }

      if (children && children.length > 0) {
        normalizedRoute.children = transformRouteItems(children, false);
      }

      return normalizedRoute;
    });
}

export const usePermissionStore = defineStore("permission", () => {
  // 所有路由（静态路由 + 动态路由）
  const routes = ref<RouteRecordRaw[]>([]);
  // 混合布局的左侧菜单路由
  const mixLayoutSideMenus = ref<RouteRecordRaw[]>([]);
  // 动态路由是否已生成
  const isRouteGenerated = ref(false);

  /** 生成动态路由 */
  async function generateRoutes(): Promise<RouteRecordRaw[]> {
    try {
      const menuTree = await MenuAPI.getList();
      const routeItems: RouteItem[] = [];

      for (const menu of menuTree) {
        const route = transformMenuToRoute(menu, true);
        if (route) {
          routeItems.push(route);
        }
      }

      const dynamicRoutes = transformRouteItems(routeItems, true);

      routes.value = [...constantRoutes, ...dynamicRoutes];
      isRouteGenerated.value = true;

      return dynamicRoutes;
    } catch (error) {
      isRouteGenerated.value = false;
      throw error;
    }
  }

  /** 设置混合布局左侧菜单 */
  const setMixLayoutSideMenus = (parentPath: string) => {
    const parentMenu = routes.value.find((item: RouteRecordRaw) => item.path === parentPath);
    mixLayoutSideMenus.value = parentMenu?.children || [];
  };

  /** 重置路由状态 */
  const resetRouter = () => {
    const constantRouteNames = new Set(constantRoutes.map((route) => route.name).filter(Boolean));
    routes.value.forEach((route: RouteRecordRaw) => {
      if (route.name && !constantRouteNames.has(route.name)) {
        router.removeRoute(route.name);
      }
    });

    routes.value = [...constantRoutes];
    mixLayoutSideMenus.value = [];
    isRouteGenerated.value = false;
  };

  let reloadPromise: Promise<RouteRecordRaw[]> | null = null;

  /**
   * 重新加载动态路由（单飞）。
   */
  async function reloadDynamicRoutesOnce(): Promise<RouteRecordRaw[]> {
    if (reloadPromise) return reloadPromise;

    reloadPromise = (async () => {
      try {
        resetRouter();
        const dynamicRoutes = await generateRoutes();
        dynamicRoutes.forEach((route: RouteRecordRaw) => {
          router.addRoute(route);
        });
        return dynamicRoutes;
      } finally {
        reloadPromise = null;
      }
    })();

    return reloadPromise;
  }

  let snapshotPromise: Promise<void> | null = null;

  /**
   * 刷新权限快照（单飞）。
   */
  async function reloadPermissionSnapshotOnce(): Promise<void> {
    if (snapshotPromise) return snapshotPromise;

    snapshotPromise = (async () => {
      try {
        const userStore = useUserStoreHook();
        await userStore.getUserInfo();
        await reloadDynamicRoutesOnce();
      } finally {
        snapshotPromise = null;
      }
    })();

    return snapshotPromise;
  }

  return {
    routes,
    mixLayoutSideMenus,
    isRouteGenerated,
    generateRoutes,
    setMixLayoutSideMenus,
    resetRouter,
    reloadDynamicRoutesOnce,
    reloadPermissionSnapshotOnce,
  };
});

export function usePermissionStoreHook() {
  return usePermissionStore();
}
