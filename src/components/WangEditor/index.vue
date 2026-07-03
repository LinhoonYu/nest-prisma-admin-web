<template>
  <div style="z-index: 999; border: 1px solid var(--el-border-color)">
    <!-- 工具栏 -->
    <Toolbar
      v-if="editorRef"
      :key="editorKey"
      :editor="editorRef"
      mode="simple"
      :default-config="toolbarConfig"
      style="border-bottom: 1px solid var(--el-border-color)"
    />

    <!-- 编辑器 -->
    <Editor
      :key="editorKey"
      v-model="modelValue"
      :style="{ height, overflowY: 'hidden' }"
      :default-config="editorConfig"
      mode="simple"
      @on-created="handleCreated"
      @on-change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import "@wangeditor-next/editor/dist/css/style.css";
import { Toolbar, Editor } from "@wangeditor-next/editor-for-vue";
import { IToolbarConfig, IEditorConfig } from "@wangeditor-next/editor";
import { shallowRef, ref, watch, onBeforeUnmount } from "vue";

import FileAPI from "@/api/file";
import { fileProxyUrl } from "@/api/file";

type InsertFnType = (_url: string, _alt: string, _href: string) => void;

defineProps({
  height: {
    type: String,
    default: "500px",
  },
});

// v-model
const modelValue = defineModel<string>({
  default: "",
});

// editor 实例
const editorRef = shallowRef<any>(null);

const editorKey = ref(0);
const innerUpdating = ref(false);

// 工具栏配置
const toolbarConfig: Partial<IToolbarConfig> = {};

// 编辑器配置
const editorConfig: Partial<IEditorConfig> = {
  placeholder: "请输入内容...",
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: InsertFnType) {
        const res = await FileAPI.uploadFile(file);
        const url = fileProxyUrl(res.id);
        insertFn(url, res.name || "", url);
      },
    } as any,
  },
};

// 初始化 editor
const handleCreated = (editor: any) => {
  editorRef.value = editor;
};

// 内容变化
const handleChange = () => {
  innerUpdating.value = true;
  Promise.resolve().then(() => {
    innerUpdating.value = false;
  });
};

// 外部 v-model 变化时重建 editor（避免状态错乱）
watch(
  () => modelValue.value,
  () => {
    if (innerUpdating.value) return;
    editorRef.value = null;
    editorKey.value++;
  }
);

// 销毁 editor
onBeforeUnmount(() => {
  editorRef.value?.destroy?.();
  editorRef.value = null;
});
</script>