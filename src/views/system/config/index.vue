<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="tableData.params" :inline="true">
        <el-form-item label="关键字" prop="keywords">
          <el-input
            v-model="tableData.params.keywords"
            placeholder="请输入配置键\配置名称"
            clearable
            @keyup.enter="handleQuery"
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
        <div class="page-toolbar__left">
          <el-button
            v-hasPerm="['sys:config:create']"
            type="primary"
            @click="openDialog()"
          >
            新增
          </el-button>
          <el-button
            v-hasPerm="['sys:config:refresh']"
            type="primary"
            @click="refreshCache"
          >
            刷新缓存
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
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column key="configName" label="配置名称" prop="configName" min-width="100" />
        <el-table-column key="configKey" label="配置键" prop="configKey" min-width="100" />
        <el-table-column key="configValue" label="配置值" prop="configValue" min-width="100" />
        <el-table-column key="remark" label="备注" prop="remark" min-width="100" />
        <el-table-column fixed="right" label="操作" width="220">
          <template #default="scope">
            <el-button
              v-hasPerm="['sys:config:update']"
              type="primary"
              size="small"
              link
              @click="openDialog(scope.row.id)"
            >
              编辑
            </el-button>
            <el-button
              v-hasPerm="['sys:config:delete']"
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
        @pagination="fetchData"
      />
    </el-card>

    <el-dialog
      v-model="dialogState.visible"
      :title="dialogState.title"
      width="500px"
      @close="closeDialog"
    >
      <el-form
        ref="dataFormRef"
        :model="formData"
        :rules="rules"
        label-suffix=":"
        label-width="100px"
      >
        <el-form-item label="配置名称" prop="configName">
          <el-input v-model="formData.configName" placeholder="请输入配置名称" :maxlength="50" />
        </el-form-item>
        <el-form-item label="配置键" prop="configKey">
          <el-input v-model="formData.configKey" placeholder="请输入配置键" :maxlength="128" />
        </el-form-item>
        <el-form-item label="配置值" prop="configValue">
          <el-input v-model="formData.configValue" placeholder="请输入配置值" :maxlength="512" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            :rows="4"
            :maxlength="100"
            show-word-limit
            type="textarea"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit">确定</el-button>
          <el-button @click="closeDialog">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Config",
  inheritAttrs: false,
});

import ConfigAPI from "@/api/system/config";
import type { ConfigItem, ConfigForm } from "@/api/system/config";
import type { PageResult } from "@/api/common";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import { useDebounceFn, useFullscreen } from "@vueuse/core";

const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

// 表单引用
const queryFormRef = ref<FormInstance>();
const dataFormRef = ref<FormInstance>();

// 列表数据
const loading = ref(false);
const selectIds = ref<string[]>([]);

const tableData = reactive<{
  items: ConfigItem[];
  total: number;
  params: { page: number; pageSize: number; keywords?: string };
}>({
  items: [],
  total: 0,
  params: {
    //查询参数
    page: 1,
    pageSize: 10,
    keywords: "",
  },
});

// 弹窗状态
const dialogState = reactive({
  title: "",
  visible: false,
});

// 表单数据
const formData = reactive<ConfigForm>({
  id: undefined,
  configName: "",
  configKey: "",
  configValue: "",
  remark: "",
});

// 验证规则
const rules: FormRules = {
  configName: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
  configKey: [{ required: true, message: "请输入配置键", trigger: "blur" }],
  configValue: [{ required: true, message: "请输入配置值", trigger: "blur" }],
};

/**
 * 加载配置列表数据
 */
function fetchData(): void {
  loading.value = true;
  ConfigAPI.getPage(tableData.params)
    .then((data) => {
      tableData.items = data.items ?? [];
      tableData.total = data.total ?? 0;
    })
    .finally(() => {
      loading.value = false;
    });
}

/**
 * 查询按钮点击事件
 */
function handleQuery(): void {
  tableData.params.page = 1;
  fetchData();
}

/**
 * 重置查询
 */
function handleResetQuery(): void {
  queryFormRef.value?.resetFields();
  tableData.params.page = 1;
  fetchData();
}

/**
 * 表格选择变化事件
 */
function handleSelectionChange(selection: ConfigItem[]): void {
  selectIds.value = selection.map((item) => item.id).filter(Boolean) as string[];
}

/**
 * 打开弹窗
 * @param id 配置ID（编辑时传入）
 */
function openDialog(id?: string): void {
  dialogState.visible = true;
  if (id) {
    dialogState.title = "修改系统设置";
    ConfigAPI.getFormData(id).then((data) => {
      Object.assign(formData, data);
    });
  } else {
    dialogState.title = "新增系统设置";
    formData.id = undefined;
  }
}

/**
 * 刷新缓存
 */
const refreshCache = useDebounceFn(() => {
  ConfigAPI.refreshCache().then(() => {
    ElMessage.success("刷新成功");
  });
}, 1000);

/**
 * 提交表单
 */
function handleSubmit(): void {
  dataFormRef.value?.validate((valid) => {
    if (valid) {
      loading.value = true;
      const id = formData.id;
      if (id) {
        ConfigAPI.update(id, formData)
          .then(() => {
            ElMessage.success("修改成功");
            closeDialog();
            handleResetQuery();
          })
          .finally(() => (loading.value = false));
      } else {
        ConfigAPI.create(formData)
          .then(() => {
            ElMessage.success("新增成功");
            closeDialog();
            handleResetQuery();
          })
          .finally(() => (loading.value = false));
      }
    }
  });
}

/**
 * 关闭弹窗
 */
function closeDialog(): void {
  dialogState.visible = false;
  dataFormRef.value?.resetFields();
  dataFormRef.value?.clearValidate();
  formData.id = undefined;
}

/**
 * 删除配置
 * @param id 配置ID
 */
function handleDelete(id: string): void {
  ElMessageBox.confirm("确认删除该项配置?", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    loading.value = true;
    ConfigAPI.deleteById(id)
      .then(() => {
        ElMessage.success("删除成功");
        handleResetQuery();
      })
      .finally(() => (loading.value = false));
  });
}

onMounted(() => {
  handleQuery();
});
</script>
