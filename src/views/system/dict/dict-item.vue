<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="tableData.params" :inline="true">
        <el-form-item :label="t('dict.item.label')" prop="label">
          <el-input
            v-model="tableData.params.label"
            :placeholder="t('dict.item.label')"
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
          <el-button type="primary" @click="openDialog()">{{ t('common.add') }}</el-button>
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
        <el-table-column :label="t('dict.item.label')" prop="label" />
        <el-table-column :label="t('dict.item.value')" prop="value" />
        <el-table-column :label="t('common.sort')" prop="sort" />
        <el-table-column :label="t('common.status')">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? t('common.enabled') : t('common.disabled') }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column fixed="right" :label="t('common.operation')" align="center" width="220">
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              @click.stop="openDialog(scope.row)"
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
      width="600px"
      @close="closeDialog"
    >
      <el-form ref="dataFormRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item :label="t('dict.item.label')" prop="label">
          <el-input v-model="formData.label" :placeholder="t('dict.messages.enterLabel')" />
        </el-form-item>
        <el-form-item :label="t('dict.item.value')" prop="value">
          <el-input v-model="formData.value" :placeholder="t('dict.messages.enterValue')" />
        </el-form-item>
        <el-form-item :label="t('common.status')">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">{{ t('common.enabled') }}</el-radio>
            <el-radio :value="0">{{ t('common.disabled') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('common.sort')">
          <el-input-number v-model="formData.sort" controls-position="right" />
        </el-form-item>
        <el-form-item>
          <template #label>
            <div class="flex-y-center">
              {{ t('dict.item.color') }}
              <el-tooltip>
                <template #content>{{ t('dict.item.colorTip') }}</template>
                <el-icon class="ml-1 cursor-pointer">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </template>
          <el-select
            v-model="formData.color"
            :placeholder="t('dict.item.colorPlaceholder')"
            clearable
            @clear="formData.color = ''"
          >
            <template #label="{ value }">
              <el-tag v-if="value" :type="value">
                {{ formData.label ? formData.label : t('dict.item.labelPlaceholder') }}
              </el-tag>
            </template>
            <el-option v-for="type in colorOptions" :key="type" :label="type" :value="type as string">
              <div flex-y-center gap-10px>
                <el-tag :type="type">{{ formData.label ?? t('dict.item.labelPlaceholder') }}</el-tag>
                <span>{{ type }}</span>
              </div>
            </el-option>
          </el-select>
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
import DictAPI from "@/api/system/dict";
import type { DictItem, DictItemForm } from "@/api/system/dict";
import type { PageResult } from "@/api/common";
import type { FormInstance, FormRules } from "element-plus";

const { t } = useI18n();

const route = useRoute();

const dictTypeId = ref(route.query.dictTypeId as string);

const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

const queryFormRef = ref<FormInstance>();
const dataFormRef = ref<FormInstance>();

const loading = ref(false);
const ids = ref<string[]>([]);

const tableData = reactive<{
  items: DictItem[];
  total: number;
  params: { page: number; pageSize: number; label?: string };
}>({
  items: [],
  total: 0,
  params: {
    page: 1,
    pageSize: 10,
    label: undefined,
  },
});

const dialogState = reactive({
  title: "",
  visible: false,
});

const formData = reactive<DictItemForm>({
  sort: 1,
  status: 1,
  color: "",
});

const colorOptions = ["primary", "success", "info", "warning", "danger"] as const;

const rules = computed<FormRules>(() => ({
  value: [{ required: true, message: t("dict.messages.enterItemValue"), trigger: "blur" }],
  label: [{ required: true, message: t("dict.messages.enterItemLabel"), trigger: "blur" }],
}));

function fetchData(): void {
  loading.value = true;
  DictAPI.getDictItemPage(dictTypeId.value, tableData.params)
    .then((data: any) => {
      tableData.items = data.items;
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

function handleSelectionChange(selection: DictItem[]): void {
  ids.value = selection.map((item) => item.id);
}

function openDialog(row?: DictItem): void {
  resetForm();
  dialogState.visible = true;
  dialogState.title = row ? t("dict.item.editTitle") : t("dict.item.addTitle");

  if (row?.id) {
    DictAPI.getDictItemFormData(row.id).then((data) => {
      Object.assign(formData, data);
    });
  }
}

function resetForm(): void {
  dataFormRef.value?.clearValidate();
  formData.id = undefined;
  formData.dictTypeId = dictTypeId.value;
  formData.label = undefined;
  formData.value = undefined;
  formData.sort = 1;
  formData.status = 1;
  formData.color = "";
}

function handleSubmit(): void {
  dataFormRef.value?.validate((isValid) => {
    if (isValid) {
      loading.value = true;
      const id = formData.id;

      formData.dictTypeId = dictTypeId.value;
      if (id) {
        DictAPI.updateDictItem(id, formData)
          .then(() => {
            ElMessage.success(t("common.editSuccess"));
            closeDialog();
            handleQuery();
          })
          .finally(() => (loading.value = false));
      } else {
        DictAPI.createDictItem(formData)
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
  const itemIds = [id || ids.value].join(",");

  if (!itemIds) {
    ElMessage.warning(t("common.selectDeleteItem"));
    return;
  }
  ElMessageBox.confirm(t("common.confirmDelete"), t("common.warning"), {
    confirmButtonText: t("common.confirm"),
    cancelButtonText: t("common.cancel"),
    type: "warning",
  }).then(
    () => {
      DictAPI.deleteDictItems(itemIds).then(() => {
        ElMessage.success(t("common.deleteSuccess"));
        handleResetQuery();
      });
    },
    () => {
      ElMessage.info(t("common.deleteCancelled"));
    }
  );
}

onMounted(() => {
  handleQuery();
});
</script>
