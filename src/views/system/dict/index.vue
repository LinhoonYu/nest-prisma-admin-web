<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="tableData.params" :inline="true">
        <el-form-item :label="t('dict.name')" prop="name">
          <el-input
            v-model="tableData.params.name"
            :placeholder="t('dict.name')"
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
          <el-button type="primary" @click="handleCreateClick()">{{ t('common.add') }}</el-button>
          <el-button
            type="danger"
            :disabled="ids.length === 0"
            @click="handleDelete()"
          >
            {{ t('common.delete') }}
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
        v-loading="loading"
        class="page-table"
        highlight-current-row
        :data="tableData.items"
        height="100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column :label="t('dict.name')" prop="name" />
        <el-table-column :label="t('dict.code')" prop="code" />
        <el-table-column :label="t('common.status')" prop="status">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? t('common.enabled') : t('common.disabled') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column fixed="right" :label="t('common.operation')" align="center" width="220">
          <template #default="scope">
            <el-button type="primary" link size="small" @click.stop="openDictData(scope.row)">
              {{ t('dict.dictData') }}
            </el-button>

            <el-button
              type="primary"
              link
              size="small"
              @click.stop="handleEditClick(scope.row.id)"
            >
              {{ t('common.edit') }}
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click.stop="handleDelete(scope.row.id)"
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
      <el-form ref="dataFormRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item :label="t('dict.name')" prop="name">
          <el-input v-model="formData.name" :placeholder="t('dict.messages.enterName')" />
        </el-form-item>

        <el-form-item :label="t('dict.code')" prop="code">
          <el-input v-model="formData.code" :placeholder="t('dict.messages.enterCode')" />
        </el-form-item>

        <el-form-item :label="t('common.status')">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">{{ t('common.enabled') }}</el-radio>
            <el-radio :value="0">{{ t('common.disabled') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="t('common.remark')">
          <el-input v-model="formData.remark" type="textarea" :placeholder="t('common.remark')" />
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
  name: "Dict",
  inheritAttrs: false,
});

import { useI18n } from "vue-i18n";
import { useFullscreen } from "@vueuse/core";
import DictAPI from "@/api/system/dict";
import type { DictTypeItem, DictTypeForm } from "@/api/system/dict";
import type { PageResult } from "@/api/common";
import type { FormInstance, FormRules } from "element-plus";
import router from "@/router";

const { t } = useI18n();

const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

const queryFormRef = ref<FormInstance>();
const dataFormRef = ref<FormInstance>();

const loading = ref(false);
const ids = ref<string[]>([]);
const tableData = reactive<{
  items: DictTypeItem[];
  total: number;
  params: { page: number; pageSize: number; name?: string };
}>({
  items: [],
  total: 0,
  params: {
    page: 1,
    pageSize: 10,
  },
});

const dialogState = reactive({
  title: "",
  visible: false,
});

const formData = reactive<DictTypeForm>({
  status: 1,
});

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t("dict.messages.enterName"), trigger: "blur" }],
  code: [{ required: true, message: t("dict.messages.enterCode"), trigger: "blur" }],
}));

function fetchData(): void {
  loading.value = true;
  DictAPI.getPage(tableData.params)
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

function handleSelectionChange(selection: DictTypeItem[]): void {
  ids.value = selection.map((item) => item.id);
}

function handleCreateClick(): void {
  resetForm();
  dialogState.visible = true;
  dialogState.title = t("dict.addDict");
}

function handleEditClick(id: string): void {
  resetForm();
  dialogState.visible = true;
  dialogState.title = t("dict.editDict");
  DictAPI.getFormData(id).then((data) => {
    Object.assign(formData, data);
  });
}

function resetForm(): void {
  dataFormRef.value?.clearValidate();
  formData.id = undefined;
  formData.name = undefined;
  formData.code = undefined;
  formData.status = 1;
  formData.remark = undefined;
}

function handleSubmit(): void {
  dataFormRef.value?.validate((isValid) => {
    if (isValid) {
      loading.value = true;
      const id = formData.id;
      if (id) {
        DictAPI.update(id, formData)
          .then(() => {
            ElMessage.success(t("common.editSuccess"));
            closeDialog();
            handleQuery();
          })
          .finally(() => (loading.value = false));
      } else {
        DictAPI.create(formData)
          .then(() => {
            ElMessage.success(t("common.addSuccess"));
            closeDialog();
            handleQuery();
          })
          .finally(() => (loading.value = false));
      }
    }
  });
}

function closeDialog(): void {
  dialogState.visible = false;
  dataFormRef.value?.resetFields();
  resetForm();
}

function handleDelete(id?: number): void {
  const attrGroupIds = [id || ids.value].join(",");
  if (!attrGroupIds) {
    ElMessage.warning(t("common.selectDeleteItem"));
    return;
  }
  ElMessageBox.confirm(t("common.confirmDelete"), t("common.warning"), {
    confirmButtonText: t("common.confirm"),
    cancelButtonText: t("common.cancel"),
    type: "warning",
  }).then(
    () => {
      DictAPI.deleteByIds(attrGroupIds).then(() => {
        ElMessage.success(t("common.deleteSuccess"));
        handleResetQuery();
      });
    },
    () => {
      ElMessage.info(t("common.deleteCancelled"));
    }
  );
}

function openDictData(row: DictTypeItem): void {
  router.push({
    name: "DictItem",
    query: { dictTypeId: row.id, code: row.code, title: t("dict.item.dictDataTitle", { name: row.name }) },
  });
}

onMounted(() => {
  handleQuery();
});
</script>
