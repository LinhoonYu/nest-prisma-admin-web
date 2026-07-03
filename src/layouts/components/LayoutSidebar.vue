<template>
  <el-menu
    ref="menuRef"
    :default-active="activeMenuPath"
    :collapse="props.collapseOverride ?? (props.alwaysExpand ? false : !appStore.sidebar.opened)"
    :background-color="menuThemeProps.backgroundColor"
    :text-color="menuThemeProps.textColor"
    :active-text-color="menuThemeProps.activeTextColor"
    :popper-effect="theme"
    :unique-opened="false"
    :collapse-transition="false"
    :mode="menuMode"
    @open="onMenuOpen"
    @close="onMenuClose"
  >
    <LayoutSidebarItem
      v-for="route in data"
      :key="route.path"
      :item="route"
      :base-path="resolveFullPath(route.path)"
    />
  </el-menu>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router";
import path from "path-browserify";
import type { MenuInstance } from "element-plus";
import type { RouteRecordRaw } from "vue-router";
import { SidebarColor, ThemeMode } from "@/enums/settings";
import { useSettingsStore, useAppStore } from "@/stores";
import { isExternal } from "@/utils/index";
import LayoutSidebarItem from "./LayoutSidebarItem.vue";
import variables from "@/styles/variables.module.scss";

const props = withDefaults(
  defineProps<{
    data: RouteRecordRaw[];
    basePath: string;
    menuMode?: "vertical" | "horizontal";
    alwaysExpand?: boolean;
    collapseOverride?: boolean | null;
  }>(),
  {
    menuMode: "vertical",
    alwaysExpand: false,
    collapseOverride: null,
  }
);

const menuRef = ref<MenuInstance>();
const settingsStore = useSettingsStore();
const appStore = useAppStore();
const currentRoute = useRoute();

const expandedMenuIndexes = ref<string[]>([]);

const theme = computed(() => settingsStore.resolvedTheme);

const sidebarColorScheme = computed(() => settingsStore.sidebarColorScheme);

const menuThemeProps = computed(() => {
  const isDarkOrClassicBlue =
    theme.value === ThemeMode.DARK || sidebarColorScheme.value === SidebarColor.CLASSIC_BLUE;

  return {
    backgroundColor: isDarkOrClassicBlue ? variables["menu-background"] : undefined,
    textColor: isDarkOrClassicBlue ? variables["menu-text"] : undefined,
    activeTextColor: isDarkOrClassicBlue ? variables["menu-active-text"] : undefined,
  };
});

const activeMenuPath = computed((): string => {
  const { meta, path } = currentRoute;

  if (meta?.activeMenu && typeof meta.activeMenu === "string") {
    return meta.activeMenu;
  }

  return path;
});

function resolveFullPath(routePath: string) {
  if (isExternal(routePath)) return routePath;
  if (isExternal(props.basePath)) return props.basePath;
  if (!props.basePath || props.basePath === "") return routePath;
  return path.resolve(props.basePath, routePath);
}

const onMenuOpen = (index: string) => {
  if (expandedMenuIndexes.value.includes(index)) return;
  expandedMenuIndexes.value.push(index);
};

const onMenuClose = (index: string) => {
  expandedMenuIndexes.value = expandedMenuIndexes.value.filter((item) => item !== index);
};

watch(
  () => expandedMenuIndexes.value,
  () => syncActiveParentMenus()
);

watch(
  () => props.menuMode,
  (newMode) => {
    if (newMode === "horizontal" && menuRef.value) {
      expandedMenuIndexes.value.forEach((item) => menuRef.value!.close(item));
    }
  }
);

watch(
  () => activeMenuPath.value,
  () => nextTick(() => syncActiveParentMenus()),
  { immediate: true }
);

watch(
  () => currentRoute.path,
  () => nextTick(() => syncActiveParentMenus())
);

function syncActiveParentMenus() {
  if (!menuRef.value?.$el) return;

  nextTick(() => {
    try {
      const menuEl = menuRef.value?.$el as HTMLElement;
      if (!menuEl) return;

      const allSubMenus = menuEl.querySelectorAll(".el-sub-menu");
      allSubMenus.forEach((subMenu) => subMenu.classList.remove("has-active-child"));

      const activeMenuItem = menuEl.querySelector(".el-menu-item.is-active");
      if (activeMenuItem) {
        let parent = activeMenuItem.parentElement;
        while (parent && parent !== menuEl) {
          if (parent.classList.contains("el-sub-menu")) parent.classList.add("has-active-child");
          parent = parent.parentElement;
        }
        return;
      }

      if (props.menuMode !== "horizontal") return;

      const currentPath = activeMenuPath.value;
      allSubMenus.forEach((subMenu) => {
        const subMenuEl = subMenu as HTMLElement;
        const subMenuPath =
          subMenuEl.getAttribute("data-path") ||
          subMenuEl.querySelector(".el-sub-menu__title")?.getAttribute("data-path");
        if (subMenuPath && currentPath.startsWith(subMenuPath)) subMenuEl.classList.add("has-active-child");
      });
    } catch (error) {
      console.error("Error updating parent menu styles:", error);
    }
  });
}

onMounted(() => syncActiveParentMenus());
</script>
