<template>
  <div v-if="url" class="iframe-view">
    <iframe :src="url" frameborder="0" allowfullscreen class="iframe-view__frame" />
  </div>
  <el-empty v-else description="未配置外链地址" />
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

defineOptions({ name: "IframeView" });

const route = useRoute();

const url = computed(() => (route.meta?.externalUrl as string) || "");
</script>

<style scoped>
.iframe-view {
  width: 100%;
  height: 100%;
}

.iframe-view__frame {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
}
</style>
