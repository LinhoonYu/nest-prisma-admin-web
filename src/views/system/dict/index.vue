<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="tableData.params" :inline="true">
        <el-form-item label="字典名称" prop="name">
          <el-input
            v-model="tableData.params.name"
            placeholder="字典名称"
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
          <el-button type="primary" @click="handleCreateClick()">新增</el-button>
          <el-button
            type="danger"
            :disabled="ids.length === 0"
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
        v-loading="loading"
        class="page-table"
        highlight-current-row
        :data="tableData.items"
        height="100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="字典名称" prop="name" />
        <el-table-column label="字典编码" prop="code" />
        <el-table-column label="状态" prop="status">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" align="center" width="220">
          <template #default="scope">
            <el-button type="primary" link size="small" @click.stop="openDictData(scope.row)">
              字典数据
            </el-button>

            <el-button
              type="primary"
              link
              size="small"
              @click.stop="handleEditClick(scope.row.id)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click.stop="handleDelete(scope.row.id)"
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
      <el-form ref="dataFormRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="字典名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入字典名称" />
        </el-form-item>

        <el-form-item label="字典编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入字典编码" />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
          <el-button @click="closeDialog">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Dict",
  inheritAttrs: false,
});

import { useFullscreen } from "@vueuse/core";
import DictAPI from "@/api/system/dict";
import type { DictTypeItem, DictTypeForm } from "@/api/system/dict";
import type { PageResult } from "@/api/common";
import type { FormInstance, FormRules } from "element-plus";
import router from "@/router";

const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

// 表单引用
const queryFormRef = ref<FormInstance>();
const dataFormRef = ref<FormInstance>();

// 列表数据
const loading = ref(false);
const ids = ref<string[]>([]);
const tableData = reactive<{
  items: DictTypeItem[];
  total: number;
  params: { page: number; pageSize: number; name?: string };
}>({
  items: [],
  total: 0,
  params: {
    //查询参数
    page: 1,
    pageSize: 10,
  },
});

// 弹窗状态
const dialogState = reactive({
  title: "",
  visible: false,
});

// 表单数据
const formData = reactive<DictTypeForm>({
  status: 1,
});

// 验证规则
const rules: FormRules = {
  name: [{ required: true, message: "请输入字典名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入字典编码", trigger: "blur" }],
};

/**
 * 加载字典列表数据
 */
function fetchData(): void {
  loading.value = true;
  DictAPI.getPage(tableData.params)
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
function handleSelectionChange(selection: DictTypeItem[]): void {
  ids.value = selection.map((item) => item.id);
}

/**
 * 新增按钮点击事件
 */
function handleCreateClick(): void {
  resetForm();
  dialogState.visible = true;
  dialogState.title = "新增字典";
}

/**
 * 编辑按钮点击事件
 * @param id 字典ID
 */
function handleEditClick(id: string): void {
  resetForm();
  dialogState.visible = true;
  dialogState.title = "修改字典";
  DictAPI.getFormData(id).then((data) => {
    Object.assign(formData, data);
  });
}

function resetForm(): void {
  dataFormRef.value?.clearValidate();
  formData.id = undefined;
  formData.name = undefined;
  formData.code = undefined;
  formData.status = 1;
  formData.remark = undefined;
}

/**
 * 提交表单
 */
function handleSubmit(): void {
  dataFormRef.value?.validate((isValid) => {
    if (isValid) {
      loading.value = true;
      const id = formData.id;
      if (id) {
        DictAPI.update(id, formData)
          .then(() => {
            ElMessage.success("修改成功");
            closeDialog();
            handleQuery();
          })
          .finally(() => (loading.value = false));
      } else {
        DictAPI.create(formData)
          .then(() => {
            ElMessage.success("新增成功");
            closeDialog();
            handleQuery();
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
  resetForm();
}

/**
 * 删除字典
 * @param id 字典ID
 */
function handleDelete(id?: number): void {
  const attrGroupIds = [id || ids.value].join(",");
  if (!attrGroupIds) {
    ElMessage.warning("请勾选删除项");
    return;
  }
  ElMessageBox.confirm("确认删除已选中的数据项?", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      DictAPI.deleteByIds(attrGroupIds).then(() => {
        ElMessage.success("删除成功");
        handleResetQuery();
      });
    },
    () => {
      ElMessage.info("已取消删除");
    }
  );
}

/**
 * 打开字典数据页面
 * @param row 字典数据
 */
function openDictData(row: DictTypeItem): void {
  router.push({
    name: "DictItem",
    query: { dictTypeId: row.id, code: row.code, title: `【${row.name}】字典数据` },
  });
}

onMounted(() => {
  handleQuery();
});
</script>
