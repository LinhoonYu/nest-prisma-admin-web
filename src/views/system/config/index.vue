<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="tableData.params" :inline="true">
        <el-form-item :label="t('config.keywords')" prop="keywords">
          <el-input
            v-model="tableData.params.keywords"
            :placeholder="t('config.keywordsPlaceholder')"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">{{ t('common.search') }}</el-button>
          <el-button @click="handleResetQuery">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card ref="tableWrapperRef" class="page-content" shadow="never">
      <div class="page-toolbar">
        <div class="page-toolbar__left">
          <el-button
            v-hasPerm="['sys:config:create']"
            type="primary"
            @click="openDialog()"
          >
            {{ t('common.add') }}
          </el-button>
          <el-button
            v-hasPerm="['sys:config:refresh']"
            type="primary"
            @click="refreshCache"
          >
            {{ t('config.refreshCache') }}
          </el-button>
        </div>
        <div class="page-toolbar__right">
          <el-tooltip :content="t('common.refresh')" placement="top">
            <el-button class="page-icon-btn" @click="fetchData">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip :content="t('common.fullscreen')" placement="top">
            <el-button class="page-icon-btn" @click="toggleFullscreen">
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <div class="page-table-wrapper">
      <el-table
        ref="dataTableRef"
        v-loading="loading"
        class="page-table"
        :data="tableData.items"
        height="100%"
        highlight-current-row
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="index" :label="t('common.index')" width="60" />
        <el-table-column key="configName" :label="t('config.configName')" prop="configName" min-width="100" />
        <el-table-column key="configKey" :label="t('config.configKey')" prop="configKey" min-width="100" />
        <el-table-column key="configValue" :label="t('config.configValue')" prop="configValue" min-width="100" />
        <el-table-column key="remark" :label="t('common.remark')" prop="remark" min-width="100" />
        <el-table-column fixed="right" :label="t('common.operation')" width="220">
          <template #default="scope">
            <el-button
              v-hasPerm="['sys:config:update']"
              type="primary"
              size="small"
              link
              @click="openDialog(scope.row.id)"
            >
              {{ t('common.edit') }}
            </el-button>
            <el-button
              v-hasPerm="['sys:config:delete']"
              type="danger"
              size="small"
              link
              @click="handleDelete(scope.row.id)"
            >
              {{ t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>

      <pagination
        v-if="tableData.total > 0"
        v-model:total="tableData.total"
        v-model:page="tableData.params.page"
        v-model:limit="tableData.params.pageSize"
        class="page-pagination"
        @pagination="fetchData"
      />
    </el-card>

    <el-dialog
      v-model="dialogState.visible"
      :title="dialogState.title"
      width="500px"
      @close="closeDialog"
    >
      <el-form
        ref="dataFormRef"
        :model="formData"
        :rules="rules"
        label-suffix=":"
        label-width="100px"
      >
        <el-form-item :label="t('config.configName')" prop="configName">
          <el-input v-model="formData.configName" :placeholder="t('config.messages.enterName')" :maxlength="50" />
        </el-form-item>
        <el-form-item :label="t('config.configKey')" prop="configKey">
          <el-input v-model="formData.configKey" :placeholder="t('config.messages.enterKey')" :maxlength="128" />
        </el-form-item>
        <el-form-item :label="t('config.configValue')" prop="configValue">
          <el-input v-model="formData.configValue" :placeholder="t('config.messages.enterValue')" :maxlength="512" />
        </el-form-item>
        <el-form-item :label="t('common.remark')" prop="remark">
          <el-input
            v-model="formData.remark"
            :rows="4"
            :maxlength="100"
            show-word-limit
            type="textarea"
            :placeholder="t('config.messages.enterDescription')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
          <el-button @click="closeDialog">{{ t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Config",
  inheritAttrs: false,
});

import { useI18n } from "vue-i18n";
import ConfigAPI from "@/api/system/config";
import type { ConfigItem, ConfigForm } from "@/api/system/config";
import type { PageResult } from "@/api/common";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import { useDebounceFn, useFullscreen } from "@vueuse/core";

const { t } = useI18n();

const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

const queryFormRef = ref<FormInstance>();
const dataFormRef = ref<FormInstance>();

const loading = ref(false);
const selectIds = ref<string[]>([]);

const tableData = reactive<{
  items: ConfigItem[];
  total: number;
  params: { page: number; pageSize: number; keywords?: string };
}>({
  items: [],
  total: 0,
  params: {
    page: 1,
    pageSize: 10,
    keywords: "",
  },
});

const dialogState = reactive({
  title: "",
  visible: false,
});

const formData = reactive<ConfigForm>({
  id: undefined,
  configName: "",
  configKey: "",
  configValue: "",
  remark: "",
});

const rules = computed<FormRules>(() => ({
  configName: [{ required: true, message: t("config.messages.enterName"), trigger: "blur" }],
  configKey: [{ required: true, message: t("config.messages.enterKey"), trigger: "blur" }],
  configValue: [{ required: true, message: t("config.messages.enterValue"), trigger: "blur" }],
}));

function fetchData(): void {
  loading.value = true;
  ConfigAPI.getPage(tableData.params)
    .then((data) => {
      tableData.items = data.items ?? [];
      tableData.total = data.total ?? 0;
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleQuery(): void {
  tableData.params.page = 1;
  fetchData();
}

function handleResetQuery(): void {
  queryFormRef.value?.resetFields();
  tableData.params.page = 1;
  fetchData();
}

function handleSelectionChange(selection: ConfigItem[]): void {
  selectIds.value = selection.map((item) => item.id).filter(Boolean) as string[];
}

function openDialog(id?: string): void {
  dialogState.visible = true;
  if (id) {
    dialogState.title = t("config.editConfig");
    ConfigAPI.getFormData(id).then((data) => {
      Object.assign(formData, data);
    });
  } else {
    dialogState.title = t("config.addConfig");
    formData.id = undefined;
  }
}

const refreshCache = useDebounceFn(() => {
  ConfigAPI.refreshCache().then(() => {
    ElMessage.success(t("config.messages.refreshSuccess"));
  });
}, 1000);

function handleSubmit(): void {
  dataFormRef.value?.validate((valid) => {
    if (valid) {
      loading.value = true;
      const id = formData.id;
      if (id) {
        ConfigAPI.update(id, formData)
          .then(() => {
            ElMessage.success(t("common.editSuccess"));
            closeDialog();
            handleResetQuery();
          })
          .finally(() => (loading.value = false));
      } else {
        ConfigAPI.create(formData)
          .then(() => {
            ElMessage.success(t("common.addSuccess"));
            closeDialog();
            handleResetQuery();
          })
          .finally(() => (loading.value = false));
      }
    }
  });
}

function closeDialog(): void {
  dialogState.visible = false;
  dataFormRef.value?.resetFields();
  dataFormRef.value?.clearValidate();
  formData.id = undefined;
}

function handleDelete(id: string): void {
  ElMessageBox.confirm(t("config.messages.confirmDelete"), t("common.warning"), {
    confirmButtonText: t("common.confirm"),
    cancelButtonText: t("common.cancel"),
    type: "warning",
  }).then(() => {
    loading.value = true;
    ConfigAPI.deleteById(id)
      .then(() => {
        ElMessage.success(t("common.deleteSuccess"));
        handleResetQuery();
      })
      .finally(() => (loading.value = false));
  });
}

onMounted(() => {
  handleQuery();
});
</script>
