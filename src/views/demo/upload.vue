<!-- 文件上传组件示例 -->
<template>
  <div class="page-container">
    <el-form>
      <el-form-item label="单图上传">
        <SingleImageUpload v-model="picId" />
      </el-form-item>

      <el-form-item label="多图上传">
        <MultiImageUpload v-model="picIds" :limit="2" />
      </el-form-item>

      <el-form-item label="文件上传">
        <FileUpload v-model="files" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import MultiImageUpload from "@/components/Upload/MultiImageUpload.vue";

const picId = ref<string | null>(null);
const picIds = ref<string[]>([]);
const files = ref<{ name: string; id: string; key: string }[]>([]);
</script>
