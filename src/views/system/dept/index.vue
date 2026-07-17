<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item :label="t('dept.name')" prop="name">
          <el-input
            v-model="queryParams.name"
            :placeholder="t('dept.name')"
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item :label="t('dept.deptStatus')" prop="status">
          <el-select v-model="queryParams.status" :placeholder="t('common.all')" clearable style="width: 100px">
            <el-option :value="1" :label="t('common.enabled')" />
            <el-option :value="0" :label="t('common.disabled')" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            {{ t('common.search') }}
          </el-button>
          <el-button @click="handleResetQuery">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card ref="tableWrapperRef" class="page-content" shadow="never">
      <div class="page-toolbar">
        <div class="page-toolbar__left">
          <el-button
            v-hasPerm="['iam:dept:create']"
            type="primary"
            @click="openDialog()"
          >
            {{ t('common.add') }}
          </el-button>
          <el-button
            v-hasPerm="['iam:dept:delete']"
            type="danger"
            :disabled="selectIds.length === 0"
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
        :data="deptList"
        row-key="id"
        height="100%"
        default-expand-all
        border
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="name" :label="t('dept.name')" min-width="200" />
        <el-table-column prop="code" :label="t('dept.code')" width="200" />
        <el-table-column prop="status" :label="t('common.status')" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">{{ t('common.enabled') }}</el-tag>
            <el-tag v-else type="info">{{ t('common.disabled') }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="sort" :label="t('common.sort')" width="100" />

        <el-table-column :label="t('common.operation')" fixed="right" align="left" width="200">
          <template #default="scope">
            <el-button
              v-hasPerm="['iam:dept:create']"
              type="primary"
              link
              size="small"
              @click.stop="openDialog(scope.row.id, undefined)"
            >
              {{ t('common.add') }}
            </el-button>
            <el-button
              v-hasPerm="['iam:dept:update']"
              type="primary"
              link
              size="small"
              @click.stop="openDialog(scope.row.parentId, scope.row.id)"
            >
              {{ t('common.edit') }}
            </el-button>
            <el-button
              v-hasPerm="['iam:dept:delete']"
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
    </el-card>

    <el-dialog
      v-model="dialogState.visible"
      :title="dialogState.title"
      width="600px"
      @closed="closeDialog"
    >
      <el-form ref="deptFormRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item :label="t('dept.parentDept')" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :placeholder="t('dept.parentPlaceholder')"
            :data="deptOptions"
            filterable
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>
        <el-form-item :label="t('dept.deptName')" prop="name">
          <el-input v-model="formData.name" :placeholder="t('dept.messages.nameRequired')" />
        </el-form-item>
        <el-form-item :label="t('dept.deptCode')" prop="code">
          <el-input v-model="formData.code" :readonly="!!editingId" :placeholder="t('dept.messages.codeRequired')" />
        </el-form-item>
        <el-form-item :label="t('dept.sort')" prop="sort">
          <el-input-number
            v-model="formData.sort"
            controls-position="right"
            style="width: 100px"
            :min="0"
          />
        </el-form-item>
        <el-form-item :label="t('dept.deptStatus')">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">{{ t('common.enabled') }}</el-radio>
            <el-radio :value="0">{{ t('common.disabled') }}</el-radio>
          </el-radio-group>
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
  name: "Dept",
  inheritAttrs: false,
});

import { useI18n } from "vue-i18n";
import { useFullscreen } from "@vueuse/core";
import DeptAPI from "@/api/system/dept";
import type { DeptItem, DeptForm, DeptQueryParams } from "@/api/system/dept";
import type { OptionItem } from "@/api/common";
import type { FormInstance, FormRules } from "element-plus";

const { t } = useI18n();

const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

const queryFormRef = ref<FormInstance>();
const deptFormRef = ref<FormInstance>();

const queryParams = reactive<DeptQueryParams>({});

const deptList = ref<DeptItem[]>([]);
const deptOptions = ref<OptionItem[]>();
const loading = ref(false);
const selectIds = ref<string[]>([]);

const dialogState = reactive({
  title: "",
  visible: false,
});

const editingId = ref<string>();

const formData = reactive<DeptForm>({
  name: "",
  code: "",
  status: 1,
  sort: 1,
});

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t("dept.messages.nameRequired"), trigger: "blur" }],
  code: [{ required: true, message: t("dept.messages.codeRequired"), trigger: "blur" }],
  sort: [{ required: true, message: t("dept.messages.sortRequired"), trigger: "blur" }],
}));

function transformDeptOptions(items: DeptItem[]): OptionItem[] {
  return items.map((item) => ({
    value: item.id,
    label: item.name,
    children: item.children?.length ? transformDeptOptions(item.children) : undefined,
  }));
}

function fetchData(): void {
  loading.value = true;
  DeptAPI.getList(queryParams)
    .then((data) => {
      deptList.value = data;
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleQuery(): void {
  fetchData();
}

function handleResetQuery(): void {
  queryFormRef.value?.resetFields();
  fetchData();
}

function handleSelectionChange(selection: DeptItem[]): void {
  selectIds.value = selection.map((item) => item.id).filter(Boolean) as string[];
}

async function openDialog(parentId?: string | null, deptId?: string): Promise<void> {
  const tree = await DeptAPI.getList();
  deptOptions.value = [
    {
      value: "",
      label: t("dept.topDept"),
      children: transformDeptOptions(tree),
    },
  ];

  dialogState.visible = true;
  if (deptId) {
    dialogState.title = t("dept.editDept");
    const detail = await DeptAPI.getDetail(deptId);
    editingId.value = deptId;
    formData.parentId = detail.parentId ?? undefined;
    formData.name = detail.name;
    formData.code = detail.code;
    formData.sort = detail.sort;
    formData.status = detail.status;
    formData.phone = detail.phone ?? undefined;
    formData.email = detail.email ?? undefined;
    formData.remark = detail.remark ?? undefined;
  } else {
    dialogState.title = t("dept.addDept");
    editingId.value = undefined;
    formData.parentId = parentId || undefined;
    formData.name = "";
    formData.code = "";
    formData.sort = 1;
    formData.status = 1;
  }
}

function handleSubmit(): void {
  deptFormRef.value?.validate((valid) => {
    if (!valid) return;

    loading.value = true;
    if (editingId.value) {
      DeptAPI.update(editingId.value, formData)
        .then(() => {
          ElMessage.success(t("common.editSuccess"));
          closeDialog();
          fetchData();
        })
        .finally(() => (loading.value = false));
    } else {
      DeptAPI.create(formData)
        .then(() => {
          ElMessage.success(t("common.addSuccess"));
          closeDialog();
          fetchData();
        })
        .finally(() => (loading.value = false));
    }
  });
}

function handleDelete(deptId?: string): void {
  const targetIds = deptId ? [deptId] : selectIds.value;
  if (targetIds.length === 0) {
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
      Promise.all(targetIds.map((id) => DeptAPI.deleteById(id)))
        .then(() => {
          ElMessage.success(t("common.deleteSuccess"));
          handleResetQuery();
        })
        .finally(() => (loading.value = false));
    },
    () => {
      ElMessage.info(t("common.deleteCancelled"));
    }
  );
}

function closeDialog(): void {
  dialogState.visible = false;
  deptFormRef.value?.resetFields();
  deptFormRef.value?.clearValidate();
  editingId.value = undefined;
  formData.parentId = undefined;
  formData.name = "";
  formData.code = "";
  formData.status = 1;
  formData.sort = 1;
}

onMounted(() => {
  fetchData();
});
</script>
