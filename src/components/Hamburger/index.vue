<template>
  <div class="hamburger-wrapper" @click="toggleClick">
    <div :class="['i-svg:collapse', { hamburger: true, 'is-active': isActive }, hamburgerClass]" />
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from "@/stores";
import { ThemeMode, SidebarColor, LayoutMode } from "@/enums/settings";

defineProps({
  isActive: { type: Boolean, required: true },
});

const emit = defineEmits(["toggleClick"]);

const settingsStore = useSettingsStore();
const layout = computed(() => settingsStore.layout);

const hamburgerClass = computed(() => {
  // 如果暗黑主题
  if (settingsStore.resolvedTheme === ThemeMode.DARK) {
    return "hamburger--white";
  }

  // 如果是混合布局 && 侧边栏配色方案是经典蓝
  if (
    layout.value === LayoutMode.MIX &&
    settingsStore.sidebarColorScheme === SidebarColor.CLASSIC_BLUE
  ) {
    return "hamburger--white";
  }

  // 默认返回空字符串
  return "";
});

function toggleClick() {
  emit("toggleClick");
}
</script>

<style scoped lang="scss">
.hamburger-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0 4px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  border-radius: 6px;
  transition:
    color 0.16s,
    background-color 0.16s;

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-fill-color-light);
  }

  .hamburger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-size: 16px;
    color: currentColor !important;
    background-color: currentColor !important;
    vertical-align: middle;
    transform: scaleX(-1);
    transition: transform 0.3s ease;

    &--white {
      color: #fff !important;
    }

    &.is-active {
      transform: scaleX(1);
    }
  }
}
</style>
