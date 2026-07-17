<template>
  <div class="page-container">
    <!-- 搜索区域 -->
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="tableData.params" :inline="true">
        <el-form-item prop="name" :label="t('permission.name')">
          <el-input
            v-model="tableData.params.name"
            :placeholder="t('permission.name')"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="code" :label="t('permission.code')">
          <el-input
            v-model="tableData.params.code"
            :placeholder="t('permission.code')"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="group" :label="t('permission.group')">
          <el-input
            v-model="tableData.params.group"
            :placeholder="t('permission.group')"
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
          <el-button type="primary" @click="handleCreateClick">{{ t('common.add') }}</el-button>
          <el-button
            type="danger"
            :disabled="ids.length === 0"
            @click="handleBatchDelete"
          >
            {{ t('common.delete') }}
          </el-button>
        </div>
        <div class="page-toolbar__right">
          <el-tooltip :content="t('common.refresh')" placement="top">
            <el-button class="page-icon-btn" @click="fetchList">
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
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column :label="t('permission.name')" prop="name" min-width="120" />
        <el-table-column :label="t('permission.code')" prop="code" min-width="180" show-overflow-tooltip />
        <el-table-column :label="t('permission.group')" prop="group" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.group" size="small">{{ row.group }}</el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('permission.method')" prop="method" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.method" :type="getMethodTagType(row.method)" size="small" effect="plain">
              {{ row.method }}
            </el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('permission.path')" prop="path" min-width="200" show-overflow-tooltip />
        <el-table-column :label="t('common.status')" align="center" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success">{{ t('common.enabled') }}</el-tag>
            <el-tag v-else type="info">{{ t('common.disabled') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.sort')" prop="sort" width="80" align="center" />
        <el-table-column fixed="right" :label="t('common.operation')" width="160">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleEditClick(row.id)"
            >
              {{ t('common.edit') }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              @click="handleDelete(row.id)"
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
        @pagination="fetchList"
      />
    </el-card>

    <!-- 表单弹窗 -->
    <el-dialog
      v-model="dialogState.visible"
      :title="dialogState.title"
      width="600px"
      @close="closeDialog"
    >
      <el-form ref="permFormRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item :label="t('permission.name')" prop="name">
          <el-input v-model="formData.name" :placeholder="t('permission.messages.enterName')" />
        </el-form-item>

        <el-form-item :label="t('permission.code')" prop="code">
          <el-input
            v-model="formData.code"
            :readonly="!!editingId"
            :placeholder="t('permission.codePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('permission.group')" prop="group">
          <el-input v-model="formData.group" :placeholder="t('permission.groupPlaceholder')" />
        </el-form-item>

        <el-form-item :label="t('permission.method')" prop="method">
          <el-select v-model="formData.method" :placeholder="t('permission.methodPlaceholder')" clearable>
            <el-option v-for="m in methods" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('permission.path')" prop="path">
          <el-input v-model="formData.path" :placeholder="t('permission.pathPlaceholder')" />
        </el-form-item>

        <el-form-item :label="t('common.sort')" prop="sort">
          <el-input-number
            v-model="formData.sort"
            controls-position="right"
            :min="0"
            style="width: 100px"
          />
        </el-form-item>

        <el-form-item :label="t('common.status')" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">{{ t('common.enabled') }}</el-radio>
            <el-radio :value="0">{{ t('common.disabled') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="t('common.remark')" prop="remark">
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
import { useI18n } from "vue-i18n";
import { useFullscreen } from "@vueuse/core";
import type { TagProps } from "element-plus";

import PermissionAPI from "@/api/system/permission";
import type {
  PermissionItem,
  PermissionForm,
  PermissionQueryParams,
} from "@/api/system/permission";
import type { PageResult } from "@/api/common";

const { t } = useI18n();

defineOptions({
  name: "Permission",
  inheritAttrs: false,
});

const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

function getMethodTagType(method: string): TagProps["type"] {
  const map: Record<string, TagProps["type"]> = {
    GET: undefined,
    POST: "success",
    PUT: "warning",
    DELETE: "danger",
    PATCH: "info",
  };
  return map[method?.toUpperCase()] ?? "info";
}

const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

const queryFormRef = ref();
const permFormRef = ref();

const loading = ref(false);
const ids = ref<string[]>([]);

const tableData = reactive<{
  items: PermissionItem[];
  total: number;
  params: PermissionQueryParams;
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

const editingId = ref<string>();

const formData = reactive<PermissionForm>({
  code: "",
  name: "",
  sort: 0,
  status: 1,
});

const rules = computed(() => ({
  name: [{ required: true, message: t("permission.messages.enterName"), trigger: "blur" }],
  code: [{ required: true, message: t("permission.messages.enterCode"), trigger: "blur" }],
}));

async function fetchList() {
  loading.value = true;
  try {
    const data = await PermissionAPI.getPage(tableData.params);
    tableData.items = data.items ?? [];
    tableData.total = data.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  tableData.params.page = 1;
  fetchList();
}

function handleResetQuery() {
  queryFormRef.value?.resetFields();
  handleQuery();
}

function handleSelectionChange(selection: PermissionItem[]) {
  ids.value = selection.flatMap((item) => (item.id ? [item.id] : []));
}

function closeDialog() {
  dialogState.visible = false;
  resetForm();
}

function resetForm() {
  permFormRef.value?.resetFields();
  permFormRef.value?.clearValidate();
  editingId.value = undefined;
  formData.code = "";
  formData.name = "";
  formData.group = undefined;
  formData.method = undefined;
  formData.path = undefined;
  formData.sort = 0;
  formData.status = 1;
  formData.remark = undefined;
}

function handleCreateClick() {
  dialogState.title = t("permission.addPermission");
  dialogState.visible = true;
}

async function handleEditClick(id: string) {
  dialogState.title = t("permission.editPermission");
  const detail = await PermissionAPI.getDetail(id);
  editingId.value = id;
  formData.code = detail.code;
  formData.name = detail.name;
  formData.group = detail.group ?? undefined;
  formData.method = detail.method ?? undefined;
  formData.path = detail.path ?? undefined;
  formData.sort = detail.sort;
  formData.status = detail.status;
  formData.remark = detail.remark ?? undefined;
  dialogState.visible = true;
}

async function handleSubmit() {
  const valid = await permFormRef.value?.validate().then(
    () => true,
    () => false
  );
  if (!valid) return;

  loading.value = true;
  try {
    if (editingId.value) {
      const { code: _c, ...updateData } = formData;
      await PermissionAPI.update(editingId.value, updateData);
      ElMessage.success(t("common.editSuccess"));
    } else {
      await PermissionAPI.create(formData);
      ElMessage.success(t("common.addSuccess"));
    }
    closeDialog();
    handleResetQuery();
  } finally {
    loading.value = false;
  }
}

function handleDelete(id?: string) {
  const permIds = id ? [id] : ids.value;
  if (permIds.length === 0) {
    ElMessage.warning(t("common.selectDeleteItem"));
    return;
  }

  ElMessageBox.confirm(t("common.confirmDelete"), t("common.warning"), {
    confirmButtonText: t("common.confirm"),
    cancelButtonText: t("common.cancel"),
    type: "warning",
  }).then(
    () => {
      loading.value = true;
      Promise.all(permIds.map((pid) => PermissionAPI.deleteById(pid)))
        .then(() => {
          ElMessage.success(t("common.deleteSuccess"));
          handleResetQuery();
        })
        .finally(() => (loading.value = false));
    },
    () => ElMessage.info(t("common.deleteCancelled"))
  );
}

function handleBatchDelete() {
  handleDelete();
}

onMounted(() => {
  handleQuery();
});
</script>
