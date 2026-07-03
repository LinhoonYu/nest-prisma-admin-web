<!-- 文件上传组件 -->
<template>
  <div>
    <el-upload
      v-model:file-list="fileList"
      :style="props.style"
      :before-upload="handleBeforeUpload"
      :http-request="handleUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-exceed="handleExceed"
      :accept="props.accept"
      :limit="props.limit"
      multiple
    >
      <el-button type="primary" :disabled="fileList.length >= props.limit">
        {{ props.uploadBtnText }}
      </el-button>

      <template #file="{ file }">
        <template v-if="file.status === 'success'">
          <div class="el-upload-list__item-info">
            <a class="el-upload-list__item-name" @click="handleDownload(file)">
              <el-icon>
                <Document />
              </el-icon>
              <span class="el-upload-list__item-file-name">{{ file.name }}</span>
              <span class="el-icon--close" @click.stop="handleRemove(file)">
                <el-icon>
                  <Close />
                </el-icon>
              </span>
            </a>
          </div>
        </template>
        <template v-else>
          <div class="el-upload-list__item-info">
            <el-progress style="display: inline-flex" :percentage="file.percentage" />
          </div>
        </template>
      </template>
    </el-upload>
  </div>
</template>
<script lang="ts" setup>
import {
  UploadRawFile,
  UploadUserFile,
  UploadFile,
  UploadFiles,
  UploadRequestOptions,
} from "element-plus";

import FileAPI from "@/api/file";
import type { FileInfo } from "@/api/file";

interface FileItem {
  name: string;
  id: string;
  key: string;
}

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
    default: "*",
  },
  uploadBtnText: {
    type: String,
    default: "上传文件",
  },
  style: {
    type: Object,
    default: () => ({ width: "300px" }),
  },
});

const modelValue = defineModel<FileItem[]>({
  type: Array,
  required: true,
  default: () => [],
});

const fileList = ref([] as UploadFile[]);

watch(
  modelValue,
  (value) => {
    fileList.value = value.map((item) => ({
      name: item.name,
      url: item.id,
      status: "success",
      uid: getUid(),
    }) as UploadFile);
  },
  { immediate: true },
);

function handleBeforeUpload(file: UploadRawFile) {
  if (file.size > props.maxFileSize * 1024 * 1024) {
    ElMessage.warning("上传文件不能大于" + props.maxFileSize + "M");
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

    FileAPI.upload(formData, (percent) => {
      const uid = file.uid;
      const fileItem = fileList.value.find((f) => f.uid === uid);
      if (fileItem) {
        fileItem.percentage = percent;
      }
    }).then(resolve, reject);
  });
}

function handleExceed() {
  ElMessage.warning("最多只能上传 " + props.limit + " 个文件");
}

const handleSuccess = (
  _response: FileInfo,
  _uploadFile: UploadFile,
  files: UploadFiles,
) => {
  ElMessage.success("上传成功");
  if (
    files.every((file: UploadFile) => {
      return file.status === "success" || file.status === "fail";
    })
  ) {
    const fileItems: FileItem[] = [];
    files.forEach((file: UploadFile) => {
      if (file.status === "success") {
        const res = file.response as FileInfo;
        if (res) {
          fileItems.push({ name: res.name, id: res.id, key: res.key });
        }
      } else {
        fileList.value.splice(
          fileList.value.findIndex((e) => e.uid === file.uid),
          1,
        );
      }
    });
    if (fileItems.length > 0) {
      modelValue.value = [...modelValue.value, ...fileItems];
    }
  }
};

const handleError = (_error: unknown) => {
  ElMessage.error("上传失败");
};

function handleRemove(file: UploadFile) {
  const res = file.response as FileInfo | undefined;
  if (res?.key) {
    FileAPI.delete(res.key);
  }
  modelValue.value = modelValue.value.filter((item) => item.id !== file.url);
}

async function handleDownload(file: UploadUserFile) {
  const item = modelValue.value.find((f) => f.id === file.url);
  if (!item) return;

  try {
    await FileAPI.download(item.key, item.name);
  } catch {
    ElMessage.error("文件下载失败");
  }
}

function getUid(): number {
  return (Date.now() << 13) | Math.floor(Math.random() * 8192);
}
</script>
<style lang="scss" scoped>
.el-upload-list__item .el-icon--close {
  position: absolute;
  top: 50%;
  right: 5px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  opacity: 0.75;
  transform: translateY(-50%);
  transition: opacity var(--el-transition-duration);
}

:deep(.el-upload-list) {
  margin: 0;
}

:deep(.el-upload-list__item) {
  margin: 0;
}
</style>
