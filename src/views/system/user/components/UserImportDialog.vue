<template>
  <div>
    <el-dialog
      v-model="visible"
      :align-center="true"
      :title="t('userImport.title')"
      width="600px"
      @close="closeDialog"
    >
      <el-scrollbar max-height="60vh">
        <el-form
          ref="importFormRef"
          style="padding-right: var(--el-dialog-padding-primary)"
          :model="importFormData"
          :rules="importFormRules"
        >
          <el-form-item :label="t('common.file')" prop="files">
            <el-upload
              ref="uploadRef"
              v-model:file-list="importFormData.files"
              class="w-full"
              accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              :drag="true"
              :limit="1"
              :auto-upload="false"
              :on-exceed="handleFileExceed"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                {{ t('common.dragFileHere') }}
                <em>{{ t('common.clickUpload') }}</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  {{ t('userImport.formatTip') }}
                  <el-link
                    type="primary"
                    icon="download"
                    underline="never"
                    @click="downloadTemplate"
                  >
                    {{ t('common.downloadTemplate') }}
                  </el-link>
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>
      </el-scrollbar>
      <template #footer>
        <div style="padding-right: var(--el-dialog-padding-primary)">
          <el-button v-if="resultData.length > 0" type="primary" @click="showResult">
            {{ t('userImport.errorMessage') }}
          </el-button>
          <el-button
            type="primary"
            :disabled="importFormData.files.length === 0"
            @click="handleUpload"
          >
            {{ t('common.confirm') }}
          </el-button>
          <el-button @click="closeDialog">{{ t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="resultVisible" :title="t('userImport.resultTitle')" width="600px">
      <el-alert
        :title="t('userImport.resultSummary', { invalid: invalidCount, valid: validCount })"
        type="warning"
        :closable="false"
      />
      <el-table :data="resultData" style="width: 100%; max-height: 400px">
        <el-table-column prop="index" align="center" width="100" type="index" :label="t('common.index')" />
        <el-table-column prop="message" :label="t('userImport.errorMessage')" width="400">
          <template #default="scope">
            {{ scope.row }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeResultDialog">{{ t('common.close') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { ElMessage, type UploadUserFile } from "element-plus";
import UserAPI from "@/api/system/user";
import { ApiCodeEnum } from "@/enums/api";
import { downloadFile } from "@/utils/download";

const { t } = useI18n();

const emit = defineEmits(["import-success"]);

// 弹窗可见状态
const visible = defineModel("modelValue", {
  type: Boolean,
  required: true,
  default: false,
});

// 结果弹窗状态
const resultVisible = ref(false);
const resultData = ref<string[]>([]);
const invalidCount = ref(0);
const validCount = ref(0);

// 表单引用
const importFormRef = ref(null);
const uploadRef = ref(null);

// 表单数据
const importFormData = reactive<{
  files: UploadUserFile[];
}>({
  files: [],
});

// 验证规则
const importFormRules = computed(() => ({
  files: [{ required: true, message: t("userImport.fileRequired"), trigger: "blur" }],
}));

watch(visible, (newValue) => {
  if (newValue) {
    resultData.value = [];
    resultVisible.value = false;
    invalidCount.value = 0;
    validCount.value = 0;
  }
});

/**
 * 文件超出个数限制
 */
function handleFileExceed(): void {
  ElMessage.warning(t("userImport.fileLimit"));
}

/**
 * 下载导入模板
 */
function downloadTemplate(): void {
  UserAPI.downloadTemplate().then((response: any) => {
    downloadFile(response);
  });
}

/**
 * 上传文件
 */
async function handleUpload(): Promise<void> {
  if (!importFormData.files.length) {
    ElMessage.warning(t("userImport.selectFile"));
    return;
  }

  const result = await UserAPI.import(importFormData.files[0].raw as File);
  if (result.invalidCount === 0) {
    ElMessage.success(t("userImport.uploadSuccess", { count: result.validCount }));
    emit("import-success");
    closeDialog();
  } else {
    ElMessage.error(t("userImport.uploadFailed"));
    resultVisible.value = true;
    resultData.value = result.messageList;
    invalidCount.value = result.invalidCount;
    validCount.value = result.validCount;
  }
}

/**
 * 显示错误信息
 */
function showResult(): void {
  resultVisible.value = true;
}

/**
 * 关闭错误信息弹窗
 */
function closeResultDialog(): void {
  resultVisible.value = false;
}

/**
 * 关闭弹窗
 */
function closeDialog(): void {
  importFormData.files.length = 0;
  visible.value = false;
}
</script>
