<!-- 单图上传组件 -->
<template>
  <el-upload
    class="single-upload"
    list-type="picture-card"
    :show-file-list="false"
    :accept="props.accept"
    :before-upload="handleBeforeUpload"
    :http-request="handleUpload"
    :on-success="onSuccess"
    :on-error="onError"
  >
    <template #default>
      <template v-if="modelValue">
        <el-image
          class="single-upload__image"
          :src="previewUrl"
          :preview-src-list="[previewUrl]"
          @click.stop
        />
        <el-icon class="single-upload__delete-btn" @click.stop="handleDelete">
          <CircleCloseFilled />
        </el-icon>
      </template>
      <template v-else>
        <el-icon>
          <Plus />
        </el-icon>
      </template>
    </template>
  </el-upload>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { UploadRawFile, UploadRequestOptions } from "element-plus";

import FileAPI from "@/api/file";
import { fileProxyUrl } from "@/api/file";
import type { FileInfo } from "@/api/file";

const { t } = useI18n();

const props = defineProps({
  data: {
    type: Object,
    default: () => ({} as Record<string, unknown>),
  },
  name: {
    type: String,
    default: "file",
  },
  maxFileSize: {
    type: Number,
    default: 10,
  },
  accept: {
    type: String,
    default: "image/*",
  },
  style: {
    type: Object,
    default: () => ({ width: "150px", height: "150px" }),
  },
});

/** v-model 绑定文件 ID */
const modelValue = defineModel<string | null>({
  default: null,
});

const previewUrl = computed(() => fileProxyUrl(modelValue.value));

function handleBeforeUpload(file: UploadRawFile) {
  const acceptTypes = props.accept.split(",").map((type) => type.trim());

  const isValidType = acceptTypes.some((type) => {
    if (type === "image/*") return file.type.startsWith("image/");
    if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type);
    return file.type === type;
  });

  if (!isValidType) {
    ElMessage.warning(t("upload.invalidFormat", { accept: props.accept }));
    return false;
  }

  if (file.size > props.maxFileSize * 1024 * 1024) {
    ElMessage.warning(t("upload.imageTooLarge", { size: props.maxFileSize }));
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

function handleDelete() {
  modelValue.value = null;
}

const onSuccess = (fileInfo: FileInfo) => {
  ElMessage.success(t("upload.success"));
  modelValue.value = fileInfo.id;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const onError = (error: unknown) => {
  ElMessage.error(t("upload.failedWithError", { error: getErrorMessage(error) }));
};
</script>

<style scoped lang="scss">
:deep(.el-upload--picture-card) {
  position: relative;
  width: v-bind("props.style.width ?? '150px'");
  height: v-bind("props.style.height ?? '150px'");
}

.single-upload {
  &__image {
    border-radius: 6px;
  }

  &__delete-btn {
    position: absolute;
    top: 1px;
    right: 1px;
    font-size: 16px;
    color: #ff7901;
    cursor: pointer;
    background: var(--el-bg-color);
    border-radius: 100%;

    :hover {
      color: #ff4500;
    }
  }
}
</style>
