<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="tableData.params" :inline="true" label-width="auto">
        <el-form-item prop="username" label="用户名">
          <el-input
            v-model="tableData.params.username"
            placeholder="用户名"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="ip" label="IP">
          <el-input
            v-model="tableData.params.ip"
            placeholder="IP地址"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="status" label="状态">
          <el-select v-model="tableData.params.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item prop="dateRange" label="登录时间">
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
        <el-table-column label="用户名" prop="username" width="140" />
        <el-table-column label="登录方式" prop="loginType" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getLoginTypeText(row.loginType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? "成功" : "失败" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="IP地址" prop="ip" width="140" />
        <el-table-column label="登录地点" prop="location" width="140" show-overflow-tooltip />
        <el-table-column label="浏览器" prop="browser" width="120" show-overflow-tooltip />
        <el-table-column label="操作系统" prop="os" width="120" show-overflow-tooltip />
        <el-table-column label="设备" prop="device" width="100" show-overflow-tooltip />
        <el-table-column label="失败原因" prop="failureReason" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.failureReason" class="color-danger">{{ row.failureReason }}</span>
            <span v-else class="color-text-placeholder">—</span>
          </template>
        </el-table-column>
        <el-table-column label="登录时间" prop="createdAt" width="180" />
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

    <el-dialog v-model="detailVisible" title="登录日志详情" width="640px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">{{ detailData.username }}</el-descriptions-item>
        <el-descriptions-item label="登录方式">{{ getLoginTypeText(detailData.loginType) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === 1 ? 'success' : 'danger'" size="small">
            {{ detailData.status === 1 ? "成功" : "失败" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="登录时间">{{ detailData.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ detailData.ip }}</el-descriptions-item>
        <el-descriptions-item label="登录地点">{{ detailData.location }}</el-descriptions-item>
        <el-descriptions-item label="浏览器">{{ detailData.browser }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ detailData.os }}</el-descriptions-item>
        <el-descriptions-item label="设备">{{ detailData.device }}</el-descriptions-item>
        <el-descriptions-item label="认证来源">{{ detailData.provider }}</el-descriptions-item>
        <el-descriptions-item v-if="detailData.failureReason" label="失败原因" :span="2">
          <span class="color-danger">{{ detailData.failureReason }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="User-Agent" :span="2">
          <span style="word-break: break-all">{{ detailData.userAgent }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "LoginLog",
  inheritAttrs: false,
});

import { useFullscreen } from "@vueuse/core";
import LoginLogAPI from "@/api/system/login-log";
import type { LoginLogItem, LoginLogQueryParams } from "@/api/system/login-log";
import type { PageResult } from "@/api/common";
import type { FormInstance } from "element-plus";

const LOGIN_TYPE_MAP: Record<number, string> = {
  1: "账号密码",
};

function getLoginTypeText(loginType?: number): string {
  if (loginType === undefined) return "—";
  return LOGIN_TYPE_MAP[loginType] ?? `类型${loginType}`;
}

const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

const queryFormRef = ref<FormInstance>();
const loading = ref(false);

const tableData = reactive<{
  items: LoginLogItem[];
  total: number;
  params: LoginLogQueryParams & { dateRange?: [string, string] };
}>({
  items: [],
  total: 0,
  params: {
    page: 1,
    pageSize: 10,
    username: "",
    ip: "",
    status: undefined,
    dateRange: undefined,
  },
});

const detailVisible = ref(false);
const detailData = ref<Partial<LoginLogItem>>({});

function fetchData(): void {
  loading.value = true;
  const { dateRange, ...params } = tableData.params;
  if (dateRange && dateRange.length === 2) {
    params.startTime = dateRange[0];
    params.endTime = dateRange[1];
  }
  LoginLogAPI.getPage(params)
    .then((data: PageResult<LoginLogItem>) => {
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

function handleDetail(row: LoginLogItem): void {
  detailData.value = row;
  detailVisible.value = true;
}

onMounted(() => {
  handleQuery();
});
</script>
