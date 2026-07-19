import type { RouteRecordRaw } from "vue-router";
import { constantRoutes } from "@/router";
import { store } from "@/stores";
import router from "@/router";
import { useUserStoreHook } from "@/stores/user";
import { isExternal } from "@/utils";

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
 * 规范化路由路径：顶级路由不以 / 开头时自动补全
 */
function normalizePath(path: string, isTopLevel: boolean): string {
  if (!path || isExternal(path)) return path;
  if (isTopLevel && !path.startsWith("/")) {
    return `/${path}`;
  }
  return path;
}

/**
 * 过滤掉外链路由，递归清理 children
 *
 * 外链路由只用于侧边栏展示（AppLink 渲染为 <a>），不注册到 vue-router。
 * 过滤后若目录的 children 全部是外链（变空），则该目录也不注册。
 */
function filterExternalRoutes(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  return routes
    .filter((route) => !isExternal(route.path))
    .map((route) => {
      if (!route.children?.length) return route;
      const filteredChildren = filterExternalRoutes(route.children);
      return { ...route, children: filteredChildren };
    });
}

/**
 * 将后端菜单树节点转换为前端路由项
 */
function transformMenuToRoute(menu: MenuItem, isTopLevel: boolean): RouteItem | null {
  // 禁用的菜单不生成路由
  if (menu.status === 0) {
    return null;
  }

  // 外链类型：path 放 externalUrl，侧边栏 AppLink 会渲染为 <a target="_blank">
  if (menu.type === MenuType.LINK) {
    if (!menu.externalUrl) return null;
    return {
      path: menu.externalUrl,
      name: menu.name,
      component: undefined,
      meta: {
        title: menu.title,
        icon: menu.icon ?? undefined,
        hidden: menu.hidden === 1,
      },
      children: [],
    };
  }

  // 内嵌类型：系统内 iframe 展示外部页面
  if (menu.type === MenuType.IFRAME) {
    if (!menu.externalUrl) return null;
    const iframeMeta = {
      title: menu.title,
      icon: menu.icon ?? undefined,
      hidden: menu.hidden === 1,
      keepAlive: menu.keepAlive === 1,
      alwaysShow: menu.alwaysShow === 1,
      externalUrl: menu.externalUrl,
    };

    // 顶级 IFRAME 自动包 Layout，保证侧边栏和导航栏正常显示
    if (isTopLevel) {
      return {
        path: normalizePath(menu.path ?? "", isTopLevel),
        name: menu.name,
        component: "Layout",
        meta: iframeMeta,
        children: [
          {
            path: "",
            name: `${menu.name}Inner`,
            component: "iframe/index",
            meta: iframeMeta,
            children: [],
          },
        ],
      };
    }

    return {
      path: normalizePath(menu.path ?? "", isTopLevel),
      name: menu.name,
      component: "iframe/index",
      meta: iframeMeta,
      children: [],
    };
  }

  // 目录和菜单类型
  if (menu.type !== MenuType.DIRECTORY && menu.type !== MenuType.MENU) {
    return null;
  }

  const route: RouteItem = {
    path: normalizePath(menu.path ?? "", isTopLevel),
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

      // routes.value 保留完整路由（含外链），供侧边栏渲染
      routes.value = [...constantRoutes, ...dynamicRoutes];
      isRouteGenerated.value = true;

      // 返回过滤掉外链的版本，外链不注册到 vue-router
      return filterExternalRoutes(dynamicRoutes);
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
