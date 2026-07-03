<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="params" :inline="true">
        <el-form-item label="通知标题" prop="title">
          <el-input
            v-model="params.title"
            placeholder="关键字"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <template #icon>
              <Search />
            </template>
            搜索
          </el-button>
          <el-button @click="handleResetQuery">
            <template #icon>
              <Refresh />
            </template>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="page-content" shadow="never">
      <div class="page-table-wrapper">
        <el-table
          v-loading="loading"
          :data="list"
          class="page-table"
          height="100%"
          highlight-current-row
        >
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="通知标题" prop="title" min-width="200" />
          <el-table-column align="center" label="通知类型" width="150">
            <template #default="scope">
              <DictTag v-model="scope.row.type" code="notice_type" />
            </template>
          </el-table-column>
          <el-table-column align="center" label="通知等级" width="100">
            <template #default="scope">
              <DictTag v-model="scope.row.level" code="notice_level" />
            </template>
          </el-table-column>
          <el-table-column
            align="center"
            label="发布时间"
            prop="publishTime"
            width="180"
          />
          <el-table-column align="center" label="状态" width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.isRead === 1" type="success">已读</el-tag>
              <el-tag v-else type="info">未读</el-tag>
            </template>
          </el-table-column>
          <el-table-column align="center" fixed="right" label="操作" width="80">
            <template #default="scope">
              <el-button type="primary" size="small" link @click="handleReadNotice(scope.row.id)">
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="params.page"
        v-model:limit="params.pageSize"
        @pagination="fetchData"
      />
    </el-card>

    <el-dialog
      v-model="noticeDialogVisible"
      :title="noticeDetail?.title ?? '通知详情'"
      width="800px"
      custom-class="notice-detail"
    >
      <div v-if="noticeDetail" class="notice-detail__wrapper">
        <div class="notice-detail__meta">
          <span>
            <el-icon><Timer /></el-icon>
            {{ noticeDetail.publishTime || "-" }}
          </span>
        </div>

        <div class="notice-detail__content">
          <div v-html="noticeDetail.content"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Refresh, Search, Timer, User } from "@element-plus/icons-vue";

import NoticeAPI from "@/api/system/notice";
import type { MyNoticeItem, MyNoticeDetail, MyNoticeQueryParams } from "@/api/system/notice";
import { usePageTable } from "@/composables";

defineOptions({
  name: "MyNotice",
  inheritAttrs: false,
});

const NOTICE_READ = 1;

const queryFormRef = ref();

const { loading, list, total, params, fetchData, handleQuery, handleResetQuery } = usePageTable<
  MyNoticeItem,
  MyNoticeQueryParams
>({
  initialParams: {
    page: 1,
    pageSize: 10,
  },
  request: NoticeAPI.getMyNoticePage,
  onBeforeReset: () => queryFormRef.value?.resetFields(),
});

const noticeDialogVisible = ref(false);
const noticeDetail = ref<MyNoticeDetail | null>(null);

async function handleReadNotice(id: string): Promise<void> {
  const data = await NoticeAPI.getMyNoticeDetail(id);
  noticeDetail.value = data;
  noticeDialogVisible.value = true;
}

onMounted(() => {
  handleQuery();
});
</script>

<style lang="scss" scoped>
:deep(.el-dialog__header) {
  text-align: center;
}

.notice-detail {
  &__wrapper {
    padding: 0 20px;
  }

  &__meta {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__content {
    max-height: 60vh;
    padding-top: 16px;
    margin-bottom: 24px;
    overflow-y: auto;
    border-top: 1px solid var(--el-border-color);

    &::-webkit-scrollbar {
      width: 6px;
    }
  }
}
</style>
