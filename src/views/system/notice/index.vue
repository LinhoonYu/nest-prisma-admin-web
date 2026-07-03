﻿<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="tableData.params" :inline="true" label-suffix=":">
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="tableData.params.title"
            placeholder="标题"
            clearable
            @keyup.enter="handleQuery()"
          />
        </el-form-item>

        <el-form-item label="发布状态" prop="publishStatus">
          <el-select
            v-model="tableData.params.publishStatus"
            clearable
            placeholder="全部"
            style="width: 100px"
          >
            <el-option :value="0" label="草稿" />
            <el-option :value="1" label="已发布" />
            <el-option :value="-1" label="已撤回" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery()">搜索</el-button>
          <el-button @click="handleResetQuery()">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card ref="tableWrapperRef" class="page-content" shadow="never">
      <div class="page-toolbar">
        <div class="page-toolbar__left">
          <el-button
            v-hasPerm="['sys:notice:create']"
            type="primary"
            @click="openDialog()"
          >
            新增通知
          </el-button>
          <el-button
            v-hasPerm="['sys:notice:delete']"
            type="danger"
            :disabled="selectIds.length === 0"
            @click="handleDelete()"
          >
            删除
          </el-button>
        </div>
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
        <el-table-column align="center" label="目标类型" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.targetType === 1" type="warning">全体</el-tag>
            <el-tag v-else-if="scope.row.targetType === 2" type="success">指定</el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="发布状态" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.publishStatus === 0" type="info">草稿</el-tag>
            <el-tag v-else-if="scope.row.publishStatus === 1" type="success">已发布</el-tag>
            <el-tag v-else-if="scope.row.publishStatus === -1" type="warning">已撤回</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="250">
          <template #default="scope">
            <div class="flex-x-start">
              <span>创建：</span>
              <span>{{ scope.row.createdAt || "-" }}</span>
            </div>
            <div v-if="scope.row.publishStatus === 1" class="flex-x-start">
              <span>发布：</span>
              <span>{{ scope.row.publishTime || "-" }}</span>
            </div>
            <div v-else-if="scope.row.publishStatus === -1" class="flex-x-start">
              <span>撤回：</span>
              <span>{{ scope.row.revokeTime || "-" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column align="center" fixed="right" label="操作" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="openDetailDialog(scope.row.id)">
              查看
            </el-button>
            <el-button
              v-if="scope.row.publishStatus === 0"
              v-hasPerm="['sys:notice:publish']"
              type="primary"
              size="small"
              link
              @click="handlePublish(scope.row.id)"
            >
              发布
            </el-button>
            <el-button
              v-if="scope.row.publishStatus === 1"
              v-hasPerm="['sys:notice:revoke']"
              type="warning"
              size="small"
              link
              @click="handleRevoke(scope.row.id)"
            >
              撤回
            </el-button>
            <el-button
              v-if="scope.row.publishStatus !== 1"
              v-hasPerm="['sys:notice:update']"
              type="primary"
              size="small"
              link
              @click="openDialog(scope.row.id)"
            >
              编辑
            </el-button>
            <el-button
              v-if="scope.row.publishStatus !== 1"
              v-hasPerm="['sys:notice:delete']"
              type="danger"
              size="small"
              link
              @click="handleDelete(scope.row.id)"
            >
              删除
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
        @pagination="fetchData()"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogState.visible"
      :show-close="false"
      :fullscreen="dialogState.fullscreen"
      top="6vh"
      width="70%"
      @close="closeDialog"
    >
      <template #header>
        <div class="flex-x-between">
          <span>{{ dialogState.title }}</span>
          <div class="dialog-toolbar">
            <el-button circle @click="toggleDialogFullscreen">
              <template #icon>
                <FullScreen v-if="!dialogState.fullscreen" />
                <CopyDocument v-else />
              </template>
            </el-button>
            <el-button circle @click="closeDialog">
              <template #icon>
                <Close />
              </template>
            </el-button>
          </div>
        </div>
      </template>
      <el-form ref="dataFormRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="通知标题" prop="title">
          <el-input v-model="formData.title" placeholder="通知标题" clearable />
        </el-form-item>
        <el-form-item label="通知类型" prop="type">
          <DictSelect v-model="formData.type" code="notice_type" />
        </el-form-item>
        <el-form-item label="通知等级" prop="level">
          <DictSelect v-model="formData.level" code="notice_level" />
        </el-form-item>
        <el-form-item label="目标类型" prop="targetType">
          <el-radio-group v-model="formData.targetType">
            <el-radio :value="1">全体</el-radio>
            <el-radio :value="2">指定用户</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="formData.targetType === 2" label="指定用户" prop="targetUserIds">
          <el-select v-model="formData.targetUserIds" multiple filterable placeholder="请选择用户">
            <el-option
              v-for="item in userOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="通知内容" prop="content">
          <WangEditor v-model="formData.content" height="350px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit()">确定</el-button>
          <el-button @click="closeDialog()">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialog.visible"
      :show-close="false"
      width="50%"
      append-to-body
      @close="closeDetailDialog"
    >
      <template #header>
        <div class="flex-x-between">
          <span>通知详情</span>
          <div class="dialog-toolbar">
            <el-button circle @click="closeDetailDialog">
              <template #icon>
                <Close />
              </template>
            </el-button>
          </div>
        </div>
      </template>
      <el-descriptions :column="1">
        <el-descriptions-item label="标题：">
          {{ currentNotice?.title }}
        </el-descriptions-item>
        <el-descriptions-item label="发布状态：">
          <el-tag v-if="currentNotice?.publishStatus === 0" type="info">草稿</el-tag>
          <el-tag v-else-if="currentNotice?.publishStatus === 1" type="success">已发布</el-tag>
          <el-tag v-else-if="currentNotice?.publishStatus === -1" type="warning">已撤回</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发布时间：">
          {{ currentNotice?.publishTime || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="内容：">
          <div class="notice-content" v-html="currentNotice?.content" />
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Notice",
  inheritAttrs: false,
});

import { useFullscreen } from "@vueuse/core";
import NoticeAPI from "@/api/system/notice";
import type {
  NoticeItem,
  NoticeForm,
  NoticeDetail,
  NoticeQueryParams,
} from "@/api/system/notice";
import UserAPI from "@/api/system/user";
import type { OptionItem } from "@/api/common";
import type { FormInstance, FormRules } from "element-plus";

const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

const queryFormRef = ref<FormInstance>();
const dataFormRef = ref<FormInstance>();

const userOptions = ref<OptionItem[]>([]);
const loading = ref(false);
const selectIds = ref<string[]>([]);

const tableData = reactive<{
  items: NoticeItem[];
  total: number;
  params: NoticeQueryParams;
}>({
  items: [],
  total: 0,
  params: {
    page: 1,
    pageSize: 10,
    title: "",
    publishStatus: undefined,
  },
});

const dialogState = reactive({
  title: "",
  visible: false,
  fullscreen: false,
});

function defaultForm(): NoticeForm {
  return {
    title: "",
    content: "",
    type: 0,
    level: "L",
    targetType: 1,
    targetUserIds: [],
  };
}

const formData = reactive<NoticeForm>(defaultForm());

const rules: FormRules = {
  title: [{ required: true, message: "请输入通知标题", trigger: "blur" }],
  content: [
    {
      required: true,
      message: "请输入通知内容",
      trigger: "blur",
      validator: (_rule, value: string, callback) => {
        if (!value || !value.replace(/<[^>]+>/g, "").trim()) {
          callback(new Error("请输入通知内容"));
        } else {
          callback();
        }
      },
    },
  ],
  type: [{ required: true, message: "请选择通知类型", trigger: "change" }],
  targetUserIds: [
    {
      validator: (_rule, value: number[] | undefined, callback) => {
        if (formData.targetType === 2 && (value ?? []).length === 0) {
          callback(new Error("请选择指定用户"));
        } else {
          callback();
        }
      },
      trigger: "change",
    },
  ],
};

const detailDialog = reactive({ visible: false });
const currentNotice = ref<NoticeDetail | null>(null);

function handleQuery(): void {
  tableData.params.page = 1;
  fetchData();
}

function fetchData(): void {
  loading.value = true;
  NoticeAPI.getPage(tableData.params)
    .then((data) => {
      tableData.items = data.items ?? [];
      tableData.total = data.total ?? 0;
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleResetQuery(): void {
  queryFormRef.value?.resetFields();
  tableData.params.page = 1;
  fetchData();
}

function handleSelectionChange(selection: NoticeItem[]): void {
  selectIds.value = selection.map((item) => item.id);
}

function loadUserOptions() {
  UserAPI.getOptions().then((data) => {
    userOptions.value = data.map((item) => ({
      value: Number(item.value),
      label: item.label,
    }));
  });
}

function openDialog(id?: string): void {
  dialogState.fullscreen = false;
  loadUserOptions();

  if (id) {
    dialogState.title = "修改通知";
    NoticeAPI.getDetail(id).then((data) => {
      Object.assign(formData, {
        id: data.id,
        title: data.title,
        content: data.content,
        type: data.type,
        level: data.level,
        targetType: data.targetType,
        targetUserIds: Array.isArray(data.targetUserIds) ? data.targetUserIds : [],
      });
    });
  } else {
    Object.assign(formData, defaultForm());
    dialogState.title = "新增通知";
  }

  dialogState.visible = true;
}

function handlePublish(id: string): void {
  NoticeAPI.publish(id).then(() => {
    ElMessage.success("发布成功");
    fetchData();
  });
}

function handleRevoke(id: string): void {
  NoticeAPI.revoke(id).then(() => {
    ElMessage.success("撤回成功");
    fetchData();
  });
}

function handleSubmit(): void {
  dataFormRef.value?.validate((valid) => {
    if (!valid) return;
    loading.value = true;

    const payload: NoticeForm = {
      title: formData.title,
      content: formData.content,
      type: formData.type,
      level: formData.level,
      targetType: formData.targetType,
      targetUserIds:
        formData.targetType === 2 ? (formData.targetUserIds ?? []) : undefined,
    };

    const req = formData.id
      ? NoticeAPI.update(formData.id, payload)
      : NoticeAPI.create(payload);

    req
      .then(() => {
        ElMessage.success(formData.id ? "修改成功" : "新增成功");
        closeDialog();
        handleResetQuery();
      })
      .finally(() => (loading.value = false));
  });
}

function closeDialog(): void {
  dialogState.visible = false;
  dialogState.fullscreen = false;
  dataFormRef.value?.resetFields();
  dataFormRef.value?.clearValidate();
  Object.assign(formData, defaultForm());
}

function toggleDialogFullscreen(): void {
  dialogState.fullscreen = !dialogState.fullscreen;
}

function handleDelete(id?: string): void {
  const deleteIds = id ?? selectIds.value.join(",");
  if (!deleteIds) {
    ElMessage.warning("请勾选删除项");
    return;
  }

  ElMessageBox.confirm("确认删除已选中的数据项吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      loading.value = true;
      NoticeAPI.deleteByIds(deleteIds)
        .then(() => {
          ElMessage.success("删除成功");
          handleResetQuery();
        })
        .finally(() => (loading.value = false));
    },
    () => {
      ElMessage.info("已取消删除");
    },
  );
}

async function openDetailDialog(id: string): Promise<void> {
  currentNotice.value = await NoticeAPI.getDetail(id);
  detailDialog.visible = true;
}

function closeDetailDialog(): void {
  detailDialog.visible = false;
  currentNotice.value = null;
}

onMounted(() => {
  handleQuery();
});
</script>
