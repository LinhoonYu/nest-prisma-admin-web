<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="tableData.params" :inline="true" label-width="auto">
        <el-form-item prop="username" :label="t('operationLog.operator')">
          <el-input
            v-model="tableData.params.username"
            :placeholder="t('operationLog.operatorPlaceholder')"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="module" :label="t('operationLog.module')">
          <el-input
            v-model="tableData.params.module"
            :placeholder="t('operationLog.modulePlaceholder')"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="dateRange" :label="t('operationLog.operationTime')">
          <el-date-picker
            v-model="tableData.params.dateRange"
            :editable="false"
            type="daterange"
            range-separator="~"
            :start-placeholder="t('operationLog.startTime')"
            :end-placeholder="t('operationLog.endTime')"
            value-format="YYYY-MM-DD"
            style="width: 260px"
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
      <el-table v-loading="loading" class="page-table" :data="tableData.items" height="100%" highlight-current-row border>
        <el-table-column :label="t('operationLog.module')" prop="module" width="120" show-overflow-tooltip />
        <el-table-column :label="t('operationLog.action')" prop="action" width="120" show-overflow-tooltip />
        <el-table-column :label="t('operationLog.description')" prop="description" min-width="180" show-overflow-tooltip />
        <el-table-column :label="t('operationLog.status')" prop="success" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">
              {{ row.success ? t('operationLog.statusOptions.success') : t('operationLog.statusOptions.failure') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('operationLog.method')" prop="method" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.method" :type="getMethodTagType(row.method)" size="small" effect="plain">
              {{ row.method }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('operationLog.path')" prop="path" min-width="180" show-overflow-tooltip />
        <el-table-column :label="t('operationLog.duration')" prop="durationMs" width="100" align="center" />
        <el-table-column :label="t('operationLog.operator')" prop="username" width="120" />
        <el-table-column :label="t('operationLog.ip')" prop="ip" width="140" />
        <el-table-column :label="t('operationLog.operationTime')" prop="createdAt" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('common.operation')" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">{{ t('common.detail') }}</el-button>
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

    <el-dialog v-model="detailVisible" :title="t('operationLog.detailTitle')" width="720px">
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="t('operationLog.module')">{{ detailData.module }}</el-descriptions-item>
        <el-descriptions-item :label="t('operationLog.action')">{{ detailData.action }}</el-descriptions-item>
        <el-descriptions-item :label="t('operationLog.description')" :span="2">{{ detailData.description }}</el-descriptions-item>
        <el-descriptions-item :label="t('operationLog.status')">
          <el-tag :type="detailData.success ? 'success' : 'danger'" size="small">
            {{ detailData.success ? t('operationLog.statusOptions.success') : t('operationLog.statusOptions.failure') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('operationLog.duration')">{{ detailData.durationMs }}ms</el-descriptions-item>
        <el-descriptions-item :label="t('operationLog.operator')">{{ detailData.username }}</el-descriptions-item>
        <el-descriptions-item :label="t('operationLog.operationTime')">{{ formatDateTime(detailData.createdAt) }}</el-descriptions-item>
        <el-descriptions-item :label="t('operationLog.ip')">{{ detailData.ip }}</el-descriptions-item>
        <el-descriptions-item :label="t('operationLog.method')">{{ detailData.method }}</el-descriptions-item>
        <el-descriptions-item :label="t('operationLog.path')" :span="2">{{ detailData.path }}</el-descriptions-item>
        <el-descriptions-item :label="t('operationLog.statusCode')">{{ detailData.statusCode }}</el-descriptions-item>
        <el-descriptions-item :label="t('operationLog.requestId')">{{ detailData.requestId }}</el-descriptions-item>
        <el-descriptions-item v-if="detailData.errorMessage" :label="t('operationLog.errorMessage')" :span="2">
          <span class="color-danger">{{ detailData.errorMessage }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "OperationLog",
  inheritAttrs: false,
});

import { useI18n } from "vue-i18n";
import { useFullscreen } from "@vueuse/core";
import OperationLogAPI from "@/api/system/operation-log";
import type { OperationLogItem, OperationLogQueryParams } from "@/api/system/operation-log";
import type { PageResult } from "@/api/common";
import type { FormInstance, TagProps } from "element-plus";
import { formatDateTime } from "@/utils/format";

const { t } = useI18n();

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

const queryFormRef = ref<FormInstance>();
const loading = ref(false);

const tableData = reactive<{
  items: OperationLogItem[];
  total: number;
  params: OperationLogQueryParams & { dateRange?: [string, string] };
}>({
  items: [],
  total: 0,
  params: {
    page: 1,
    pageSize: 10,
    username: "",
    module: "",
    dateRange: undefined,
  },
});

const detailVisible = ref(false);
const detailData = ref<Partial<OperationLogItem>>({});

function fetchData(): void {
  loading.value = true;
  const { dateRange, ...params } = tableData.params;
  if (dateRange && dateRange.length === 2) {
    params.startTime = dateRange[0];
    params.endTime = dateRange[1];
  }
  OperationLogAPI.getPage(params)
    .then((data: PageResult<OperationLogItem>) => {
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
  tableData.params.dateRange = undefined;
  fetchData();
}

function handleDetail(row: OperationLogItem): void {
  detailData.value = row;
  detailVisible.value = true;
}

onMounted(() => {
  handleQuery();
});
</script>
