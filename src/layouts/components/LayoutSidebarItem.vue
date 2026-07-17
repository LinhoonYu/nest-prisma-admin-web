<template>
  <div v-if="!item.meta || !item.meta.hidden">
    <template
      v-if="
        (hasOneShowingChild(item.children, item) &&
          !item.meta?.alwaysShow &&
          (!onlyOneChild.children || onlyOneChild.noShowingChildren)) ||
        (item.meta?.alwaysShow && !item.children)
      "
    >
      <AppLink
        v-if="onlyOneChild.meta"
        :to="{
          path: resolvePath(onlyOneChild.path),
          meta: onlyOneChild.meta,
          query: onlyOneChild.meta.params,
        }"
      >
        <el-menu-item
          :index="resolvePath(onlyOneChild.path)"
          :class="{ 'submenu-title-noDropdown': !isNest }"
        >
          <template v-if="onlyOneChild.meta">
            <LayoutMenuIcon :icon="onlyOneChild.meta.icon || item.meta?.icon" />
            <span
              v-if="onlyOneChild.meta.title"
              class="ml-1"
              :title="translateRouteTitle(onlyOneChild.meta.title, String(onlyOneChild.name || ''))"
            >
              {{ translateRouteTitle(onlyOneChild.meta.title, String(onlyOneChild.name || '')) }}
            </span>
          </template>
        </el-menu-item>
      </AppLink>
    </template>

    <el-sub-menu v-else :index="resolvePath(item.path)" :data-path="item.path" teleported>
      <template #title>
        <template v-if="item.meta">
          <LayoutMenuIcon :icon="item.meta.icon" />
          <span v-if="item.meta.title" class="ml-1" :title="translateRouteTitle(item.meta.title, String(item.name || ''))">
            {{ translateRouteTitle(item.meta.title, String(item.name || '')) }}
          </span>
        </template>
      </template>

      <LayoutSidebarItem
        v-for="child in item.children"
        :key="child.path"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path)"
      />
    </el-sub-menu>
  </div>
</template>

<script setup lang="ts">
import path from "path-browserify";
import type { RouteRecordRaw } from "vue-router";
import { isExternal } from "@/utils";
import { translateRouteTitle } from "@/lang/utils";
import LayoutMenuIcon from "./LayoutMenuIcon.vue";

type SidebarRoute = RouteRecordRaw & {
  noShowingChildren?: boolean;
};

defineOptions({
  name: "LayoutSidebarItem",
  inheritAttrs: false,
});

const props = defineProps({
  item: {
    type: Object as PropType<RouteRecordRaw>,
    required: true,
  },
  basePath: {
    type: String,
    required: true,
  },
  isNest: {
    type: Boolean,
    default: false,
  },
});

const onlyOneChild = ref<SidebarRoute>({} as SidebarRoute);

function hasOneShowingChild(children: RouteRecordRaw[] | undefined, parent: RouteRecordRaw) {
  if (!children || children.length === 0) {
    onlyOneChild.value = { ...parent, path: "", noShowingChildren: true };
    return true;
  }

  const showingChildren = children.filter((route) => {
    if (route.meta?.hidden) return false;
    onlyOneChild.value = route;
    return true;
  });

  if (showingChildren.length === 1) {
    return true;
  }

  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: "", noShowingChildren: true };
    return true;
  }

  return false;
}

function resolvePath(routePath: string) {
  if (isExternal(routePath)) return routePath;
  if (isExternal(props.basePath)) return props.basePath;
  if (!props.basePath || props.basePath === "") return routePath;
  return path.resolve(props.basePath, routePath);
}
</script>
