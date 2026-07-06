<template>
  <div
    class="user-avatar"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${Math.round(size * 0.42)}px`,
      backgroundColor: resolvedUrl ? 'transparent' : bgColor,
    }"
  >
    <img v-if="resolvedUrl" :src="resolvedUrl" alt="" />
    <span v-else class="user-avatar__text">{{ initial }}</span>
  </div>
</template>

<script setup lang="ts">
import { fileProxyUrl } from "@/api/file";

const props = withDefaults(
  defineProps<{
    /** 用户名 / 昵称，用于提取首字 */
    name?: string | null;
    /** 头像文件 ID */
    avatarFileId?: string | null;
    /** 外部头像 URL（OAuth 等，avatarFileId 为空时使用） */
    avatarUrl?: string | null;
    /** 头像尺寸（px） */
    size?: number;
  }>(),
  { size: 36, name: "", avatarFileId: null, avatarUrl: null },
);

const resolvedUrl = computed(() => {
  if (props.avatarFileId) return fileProxyUrl(props.avatarFileId);
  if (props.avatarUrl) return props.avatarUrl;
  return "";
});

const initial = computed(() => {
  const n = props.name?.trim();
  if (!n) return "?";
  return n.charAt(0).toUpperCase();
});

// 根据名字哈希取色，同一用户始终是同一颜色
const palette = [
  "#5b8def",
  "#e27d60",
  "#41b883",
  "#f6a623",
  "#9b59b6",
  "#e74c3c",
  "#1abc9c",
  "#3498db",
  "#e67e22",
  "#2ecc71",
];

const bgColor = computed(() => {
  const n = props.name ?? "";
  let hash = 0;
  for (let i = 0; i < n.length; i++) {
    hash = n.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
});
</script>

<style lang="scss" scoped>
.user-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  &__text {
    font-weight: 600;
    line-height: 1;
    color: #fff;
    user-select: none;
  }
}
</style>
