<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="tableData.params" :inline="true" label-width="auto">
        <el-form-item prop="username" :label="t('loginLog.username')">
          <el-input
            v-model="tableData.params.username"
            :placeholder="t('loginLog.username')"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="ip" :label="t('loginLog.ip')">
          <el-input
            v-model="tableData.params.ip"
            :placeholder="t('loginLog.ipAddress')"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="status" :label="t('loginLog.status')">
          <el-select v-model="tableData.params.status" :placeholder="t('common.all')" clearable style="width: 120px">
            <el-option :label="t('loginLog.statusOptions.success')" :value="1" />
            <el-option :label="t('loginLog.statusOptions.failure')" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item prop="dateRange" :label="t('loginLog.loginTime')">
          <el-date-picker
            v-model="tableData.params.dateRange"
            :editable="false"
            type="daterange"
            range-separator="~"
            :start-placeholder="t('loginLog.startTime')"
            :end-placeholder="t('loginLog.endTime')"
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
        <el-table-column :label="t('loginLog.username')" prop="username" width="140" />
        <el-table-column :label="t('loginLog.loginType')" prop="loginType" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getLoginTypeText(row.loginType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('loginLog.status')" prop="status" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? t('loginLog.statusOptions.success') : t('loginLog.statusOptions.failure') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('loginLog.ipAddress')" prop="ip" width="140" />
        <el-table-column :label="t('loginLog.location')" prop="location" width="140" show-overflow-tooltip />
        <el-table-column :label="t('loginLog.browser')" prop="browser" width="120" show-overflow-tooltip />
        <el-table-column :label="t('loginLog.os')" prop="os" width="120" show-overflow-tooltip />
        <el-table-column :label="t('loginLog.device')" prop="device" width="100" show-overflow-tooltip />
        <el-table-column :label="t('loginLog.failureReason')" prop="failureReason" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.failureReason" class="color-danger">{{ row.failureReason }}</span>
            <span v-else class="color-text-placeholder">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('loginLog.loginTime')" prop="createdAt" width="180">
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

    <el-dialog v-model="detailVisible" :title="t('loginLog.detailTitle')" width="640px">
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="t('loginLog.username')">{{ detailData.username }}</el-descriptions-item>
        <el-descriptions-item :label="t('loginLog.loginType')">{{ getLoginTypeText(detailData.loginType) }}</el-descriptions-item>
        <el-descriptions-item :label="t('loginLog.status')">
          <el-tag :type="detailData.status === 1 ? 'success' : 'danger'" size="small">
            {{ detailData.status === 1 ? t('loginLog.statusOptions.success') : t('loginLog.statusOptions.failure') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('loginLog.loginTime')">{{ formatDateTime(detailData.createdAt) }}</el-descriptions-item>
        <el-descriptions-item :label="t('loginLog.ipAddress')">{{ detailData.ip }}</el-descriptions-item>
        <el-descriptions-item :label="t('loginLog.location')">{{ detailData.location }}</el-descriptions-item>
        <el-descriptions-item :label="t('loginLog.browser')">{{ detailData.browser }}</el-descriptions-item>
        <el-descriptions-item :label="t('loginLog.os')">{{ detailData.os }}</el-descriptions-item>
        <el-descriptions-item :label="t('loginLog.device')">{{ detailData.device }}</el-descriptions-item>
        <el-descriptions-item :label="t('loginLog.provider')">{{ detailData.provider }}</el-descriptions-item>
        <el-descriptions-item v-if="detailData.failureReason" :label="t('loginLog.failureReason')" :span="2">
          <span class="color-danger">{{ detailData.failureReason }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('loginLog.userAgent')" :span="2">
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

import { useI18n } from "vue-i18n";
import { useFullscreen } from "@vueuse/core";
import LoginLogAPI from "@/api/system/login-log";
import type { LoginLogItem, LoginLogQueryParams } from "@/api/system/login-log";
import type { PageResult } from "@/api/common";
import type { FormInstance } from "element-plus";
import { formatDateTime } from "@/utils/format";

const { t } = useI18n();

function getLoginTypeText(loginType?: number): string {
  if (loginType === undefined) return "—";
  if (loginType === 1) return t("loginLog.loginTypeOptions.accountPassword");
  return `${loginType}`;
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
