<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="tableData.params" :inline="true" label-width="auto">
        <el-form-item prop="username" label="操作人">
          <el-input
            v-model="tableData.params.username"
            placeholder="操作人用户名"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="module" label="模块">
          <el-input
            v-model="tableData.params.module"
            placeholder="模块名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="dateRange" label="操作时间">
          <el-date-picker
            v-model="tableData.params.dateRange"
            :editable="false"
            type="daterange"
            range-separator="~"
            start-placeholder="开始时间"
            end-placeholder="截止时间"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card ref="tableWrapperRef" class="page-content" shadow="never">
      <div class="page-toolbar">
        <div class="page-toolbar__right">
          <el-tooltip content="刷新" placement="top">
            <el-button class="page-icon-btn" @click="fetchData">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="全屏" placement="top">
            <el-button class="page-icon-btn" @click="toggleFullscreen">
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <div class="page-table-wrapper">
      <el-table v-loading="loading" class="page-table" :data="tableData.items" height="100%" highlight-current-row border>
        <el-table-column label="模块" prop="module" width="120" show-overflow-tooltip />
        <el-table-column label="操作" prop="action" width="120" show-overflow-tooltip />
        <el-table-column label="描述" prop="description" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" prop="success" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">
              {{ row.success ? "成功" : "失败" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="请求方法" prop="method" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.method" :type="getMethodTagType(row.method)" size="small" effect="plain">
              {{ row.method }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="请求路径" prop="path" min-width="180" show-overflow-tooltip />
        <el-table-column label="耗时(ms)" prop="durationMs" width="100" align="center" />
        <el-table-column label="操作人" prop="username" width="120" />
        <el-table-column label="IP" prop="ip" width="140" />
        <el-table-column label="操作时间" prop="createdAt" width="180" />
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
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

    <el-dialog v-model="detailVisible" title="操作日志详情" width="720px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="模块">{{ detailData.module }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ detailData.action }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ detailData.description }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.success ? 'success' : 'danger'" size="small">
            {{ detailData.success ? "成功" : "失败" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detailData.durationMs }}ms</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detailData.username }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ detailData.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ detailData.ip }}</el-descriptions-item>
        <el-descriptions-item label="请求方法">{{ detailData.method }}</el-descriptions-item>
        <el-descriptions-item label="请求路径" :span="2">{{ detailData.path }}</el-descriptions-item>
        <el-descriptions-item label="状态码">{{ detailData.statusCode }}</el-descriptions-item>
        <el-descriptions-item label="请求ID">{{ detailData.requestId }}</el-descriptions-item>
        <el-descriptions-item v-if="detailData.errorMessage" label="错误信息" :span="2">
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

import { useFullscreen } from "@vueuse/core";
import OperationLogAPI from "@/api/system/operation-log";
import type { OperationLogItem, OperationLogQueryParams } from "@/api/system/operation-log";
import type { PageResult } from "@/api/common";
import type { FormInstance, TagProps } from "element-plus";

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
