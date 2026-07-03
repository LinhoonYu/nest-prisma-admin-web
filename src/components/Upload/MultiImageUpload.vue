<!-- 图片上传组件 -->
<template>
  <el-upload
    v-model:file-list="fileList"
    list-type="picture-card"
    :before-upload="handleBeforeUpload"
    :http-request="handleUpload"
    :on-success="handleSuccess"
    :on-error="handleError"
    :on-exceed="handleExceed"
    :accept="props.accept"
    :limit="props.limit"
    multiple
  >
    <el-icon><Plus /></el-icon>
    <template #file="{ file }">
      <div style="width: 100%">
        <img class="el-upload-list__item-thumbnail" :src="file.url" />
        <span class="el-upload-list__item-actions">
          <span @click="handlePreviewImage(file.url!)">
            <el-icon><zoom-in /></el-icon>
          </span>
          <span @click="handleRemove(file.url!)">
            <el-icon><Delete /></el-icon>
          </span>
        </span>
      </div>
    </template>
  </el-upload>

  <el-image-viewer
    v-if="previewVisible"
    :zoom-rate="1.2"
    :initial-index="previewImageIndex"
    :url-list="previewUrlList"
    @close="handlePreviewClose"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { UploadRawFile, UploadRequestOptions, UploadUserFile } from "element-plus";

import FileAPI from "@/api/file";
import { fileProxyUrl } from "@/api/file";
import type { FileInfo } from "@/api/file";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({} as Record<string, unknown>),
  },
  name: {
    type: String,
    default: "file",
  },
  limit: {
    type: Number,
    default: 10,
  },
  maxFileSize: {
    type: Number,
    default: 10,
  },
  accept: {
    type: String,
    default: "image/*",
  },
});

const previewVisible = ref(false);
const previewImageIndex = ref(0);

/** v-model 绑定文件 ID 数组 */
const modelValue = defineModel<string[]>({
  default: () => [],
});

const fileList = ref<UploadUserFile[]>([]);

const previewUrlList = computed(() =>
  modelValue.value.map((id) => fileProxyUrl(id)),
);

function handleRemove(imageUrl: string) {
  const fileId = extractFileIdFromUrl(imageUrl);
  if (fileId) {
    const index = modelValue.value.indexOf(fileId);
    if (index !== -1) {
      modelValue.value.splice(index, 1);
      fileList.value.splice(index, 1);
    }
  }
}

function extractFileIdFromUrl(url: string): string | null {
  const match = url.match(/\/proxy\/(\d+)$/);
  return match ? match[1] : null;
}

function handleBeforeUpload(file: UploadRawFile) {
  const acceptTypes = props.accept.split(",").map((type) => type.trim());

  const isValidType = acceptTypes.some((type) => {
    if (type === "image/*") return file.type.startsWith("image/");
    if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type);
    return file.type === type;
  });

  if (!isValidType) {
    ElMessage.warning("上传文件的格式不正确，仅支持 " + props.accept);
    return false;
  }

  if (file.size > props.maxFileSize * 1024 * 1024) {
    ElMessage.warning("上传图片不能大于" + props.maxFileSize + "M");
    return false;
  }
  return true;
}

function handleUpload(options: UploadRequestOptions) {
  return new Promise<FileInfo>((resolve, reject) => {
    const file = options.file;
    const formData = new FormData();
    formData.append(props.name, file);

    Object.keys(props.data).forEach((key) => {
      formData.append(key, String(props.data[key]));
    });

    FileAPI.upload(formData).then(resolve, reject);
  });
}

function handleExceed() {
  ElMessage.warning("最多只能上传 " + props.limit + " 张图片");
}

const handleSuccess = (fileInfo: FileInfo, uploadFile: UploadUserFile) => {
  ElMessage.success("上传成功");
  const index = fileList.value.findIndex((file) => file.uid === uploadFile.uid);
  if (index !== -1) {
    const url = fileProxyUrl(fileInfo.id);
    fileList.value[index].url = url;
    fileList.value[index].status = "success";
    modelValue.value[index] = fileInfo.id;
  }
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const handleError = (error: unknown) => {
  ElMessage.error("上传失败: " + getErrorMessage(error));
};

const handlePreviewImage = (imageUrl: string) => {
  const fileId = extractFileIdFromUrl(imageUrl);
  if (fileId) {
    previewImageIndex.value = modelValue.value.indexOf(fileId);
    previewVisible.value = true;
  }
};

const handlePreviewClose = () => {
  previewVisible.value = false;
};

onMounted(() => {
  fileList.value = modelValue.value.map((id) => ({
    url: fileProxyUrl(id),
  }) as UploadUserFile);
});

watch(
  () => modelValue.value,
  (newVal) => {
    fileList.value = newVal.map((id) => ({
      url: fileProxyUrl(id),
    }) as UploadUserFile);
  },
);
</script>
