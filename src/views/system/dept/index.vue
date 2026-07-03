<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="部门名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="部门名称"
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="部门状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 100px">
            <el-option :value="1" label="正常" />
            <el-option :value="0" label="禁用" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            搜索
          </el-button>
          <el-button @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card ref="tableWrapperRef" class="page-content" shadow="never">
      <div class="page-toolbar">
        <div class="page-toolbar__left">
          <el-button
            v-hasPerm="['sys:dept:create']"
            type="primary"
            @click="openDialog()"
          >
            新增
          </el-button>
          <el-button
            v-hasPerm="['sys:dept:delete']"
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
        <el-table-column prop="name" label="部门名称" min-width="200" />
        <el-table-column prop="code" label="部门编号" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="sort" label="排序" width="100" />

        <el-table-column label="操作" fixed="right" align="left" width="200">
          <template #default="scope">
            <el-button
              v-hasPerm="['sys:dept:create']"
              type="primary"
              link
              size="small"
              @click.stop="openDialog(scope.row.id, undefined)"
            >
              新增
            </el-button>
            <el-button
              v-hasPerm="['sys:dept:update']"
              type="primary"
              link
              size="small"
              @click.stop="openDialog(scope.row.parentId, scope.row.id)"
            >
              编辑
            </el-button>
            <el-button
              v-hasPerm="['sys:dept:delete']"
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
    </el-card>

    <el-dialog
      v-model="dialogState.visible"
      :title="dialogState.title"
      width="600px"
      @closed="closeDialog"
    >
      <el-form ref="deptFormRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="上级部门" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            placeholder="选择上级部门"
            :data="deptOptions"
            filterable
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门编号" prop="code">
          <el-input v-model="formData.code" :readonly="!!editingId" placeholder="请输入部门编码" />
        </el-form-item>
        <el-form-item label="显示排序" prop="sort">
          <el-input-number
            v-model="formData.sort"
            controls-position="right"
            style="width: 100px"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="部门状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
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
  name: "Dept",
  inheritAttrs: false,
});

import { useFullscreen } from "@vueuse/core";
import DeptAPI from "@/api/system/dept";
import type { DeptItem, DeptForm, DeptQueryParams } from "@/api/system/dept";
import type { OptionItem } from "@/api/common";
import type { FormInstance, FormRules } from "element-plus";

const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

// 表单引用
const queryFormRef = ref<FormInstance>();
const deptFormRef = ref<FormInstance>();

// 查询参数
const queryParams = reactive<DeptQueryParams>({});

// 列表数据
const deptList = ref<DeptItem[]>([]);
const deptOptions = ref<OptionItem[]>();
const loading = ref(false);
const selectIds = ref<string[]>([]);

// 弹窗状态
const dialogState = reactive({
  title: "",
  visible: false,
});

// 正在编辑的部门ID
const editingId = ref<string>();

// 表单数据
const formData = reactive<DeptForm>({
  name: "",
  code: "",
  status: 1,
  sort: 1,
});

// 验证规则
const rules: FormRules = {
  name: [{ required: true, message: "部门名称不能为空", trigger: "blur" }],
  code: [{ required: true, message: "部门编号不能为空", trigger: "blur" }],
  sort: [{ required: true, message: "显示排序不能为空", trigger: "blur" }],
};

/**
 * 将 DeptItem 树转换为 OptionItem 树
 */
function transformDeptOptions(items: DeptItem[]): OptionItem[] {
  return items.map((item) => ({
    value: item.id,
    label: item.name,
    children: item.children?.length ? transformDeptOptions(item.children) : undefined,
  }));
}

/**
 * 加载部门列表数据
 */
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

/**
 * 查询按钮点击事件
 */
function handleQuery(): void {
  fetchData();
}

/**
 * 重置查询
 */
function handleResetQuery(): void {
  queryFormRef.value?.resetFields();
  fetchData();
}

/**
 * 表格选择变化事件
 */
function handleSelectionChange(selection: DeptItem[]): void {
  selectIds.value = selection.map((item) => item.id).filter(Boolean) as string[];
}

/**
 * 打开弹窗
 * @param parentId 父部门ID
 * @param deptId 部门ID（编辑时传入）
 */
async function openDialog(parentId?: string | null, deptId?: string): Promise<void> {
  // 加载部门选项树
  const tree = await DeptAPI.getList();
  deptOptions.value = [
    {
      value: "",
      label: "顶级部门",
      children: transformDeptOptions(tree),
    },
  ];

  dialogState.visible = true;
  if (deptId) {
    dialogState.title = "修改部门";
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
    dialogState.title = "新增部门";
    editingId.value = undefined;
    formData.parentId = parentId || undefined;
    formData.name = "";
    formData.code = "";
    formData.sort = 1;
    formData.status = 1;
  }
}

/**
 * 提交表单
 */
function handleSubmit(): void {
  deptFormRef.value?.validate((valid) => {
    if (!valid) return;

    loading.value = true;
    if (editingId.value) {
      DeptAPI.update(editingId.value, formData)
        .then(() => {
          ElMessage.success("修改成功");
          closeDialog();
          fetchData();
        })
        .finally(() => (loading.value = false));
    } else {
      DeptAPI.create(formData)
        .then(() => {
          ElMessage.success("新增成功");
          closeDialog();
          fetchData();
        })
        .finally(() => (loading.value = false));
    }
  });
}

/**
 * 删除部门
 * @param deptId 部门ID
 */
function handleDelete(deptId?: string): void {
  const targetIds = deptId ? [deptId] : selectIds.value;
  if (targetIds.length === 0) {
    ElMessage.warning("请勾选删除项");
    return;
  }

  ElMessageBox.confirm("确认删除已选中的数据项?", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      loading.value = true;
      Promise.all(targetIds.map((id) => DeptAPI.deleteById(id)))
        .then(() => {
          ElMessage.success("删除成功");
          handleResetQuery();
        })
        .finally(() => (loading.value = false));
    },
    () => {
      ElMessage.info("已取消删除");
    }
  );
}

/**
 * 关闭弹窗
 */
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
