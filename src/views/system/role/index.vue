<template>
  <div class="page-container">
    <!-- 搜索区域 -->
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="tableData.params" :inline="true">
        <el-form-item prop="name" label="角色名称">
          <el-input
            v-model="tableData.params.name"
            placeholder="角色名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="code" label="角色编码">
          <el-input
            v-model="tableData.params.code"
            placeholder="角色编码"
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
            @click="handleBatchDelete()"
          >
            删除
          </el-button>
        </div>
        <div class="page-toolbar__right">
          <el-tooltip content="刷新" placement="top">
            <el-button class="page-icon-btn" @click="fetchList">
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
        <el-table-column label="角色名称" prop="name" min-width="100" />
        <el-table-column label="角色编码" prop="code" width="150" />
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" align="center" width="80" prop="sort" />
        <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />

        <el-table-column fixed="right" label="操作" width="320">
          <template #default="scope">
            <el-button
              v-hasPerm="'sys:role:assign'"
              type="primary"
              size="small"
              link
              @click="handleAssignMenuClick(scope.row)"
            >
              分配菜单
            </el-button>
            <el-button
              v-hasPerm="'sys:role:assign'"
              type="primary"
              size="small"
              link
              @click="handleAssignPermClick(scope.row)"
            >
              分配权限
            </el-button>
            <el-button
              type="primary"
              size="small"
              link
              @click="handleEditClick(scope.row.id)"
            >
              编辑
            </el-button>
            <el-button
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
        @pagination="fetchList"
      />
    </el-card>

    <!-- 角色表单弹窗 -->
    <el-dialog
      v-model="dialogState.visible"
      :title="dialogState.title"
      width="600px"
      @close="closeDialog"
    >
      <el-form ref="roleFormRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入角色名称" />
        </el-form-item>

        <el-form-item label="角色编码" prop="code">
          <el-input v-model="formData.code" :readonly="!!editingId" placeholder="请输入角色编码" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="formData.sort"
            controls-position="right"
            :min="0"
            style="width: 100px"
          />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit">确定</el-button>
          <el-button @click="closeDialog">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分配菜单弹窗 -->
    <el-drawer
      v-model="assignMenuDialogVisible"
      :title="'【' + checkedRole.name + '】菜单分配'"
      :size="drawerSize"
    >
      <div class="flex-x-between">
        <el-input v-model="menuKeywords" clearable class="w-[150px]" placeholder="菜单名称">
          <template #prefix>
            <Search />
          </template>
        </el-input>

        <div class="flex-center ml-5">
          <el-button type="primary" size="small" plain @click="toggleMenuTree">
            <template #icon>
              <Switch />
            </template>
            {{ isMenuExpanded ? "收缩" : "展开" }}
          </el-button>
          <el-checkbox
            v-model="menuParentChildLinked"
            class="ml-5"
            @change="handleMenuLinkedChange"
          >
            父子联动
          </el-checkbox>

          <el-tooltip placement="bottom">
            <template #content>
              如果只需勾选菜单权限，不需要勾选子菜单或者按钮权限，请关闭父子联动
            </template>
            <el-icon class="ml-1 color-[--el-color-primary] inline-block cursor-pointer">
              <QuestionFilled />
            </el-icon>
          </el-tooltip>
        </div>
      </div>

      <el-tree
        ref="menuTreeRef"
        node-key="value"
        show-checkbox
        :data="menuPermOptions"
        :filter-node-method="handleMenuFilter"
        :default-expand-all="true"
        :check-strictly="!menuParentChildLinked"
        class="mt-5"
      >
        <template #default="{ data }">
          {{ data.label }}
        </template>
      </el-tree>

      <template #footer>
        <div class="dialog-footer">
          <el-button v-hasPerm="'sys:role:assign'" type="primary" @click="handleAssignMenuSubmit">
            确定
          </el-button>
          <el-button @click="assignMenuDialogVisible = false">取消</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 分配权限弹窗 -->
    <el-drawer
      v-model="assignPermDialogVisible"
      :title="'【' + checkedRole.name + '】权限分配'"
      :size="drawerSize"
    >
      <div class="flex-x-between">
        <el-input v-model="permKeywords" clearable class="w-[150px]" placeholder="权限名称">
          <template #prefix>
            <Search />
          </template>
        </el-input>

        <div class="flex-center ml-5">
          <el-button type="primary" size="small" plain @click="togglePermTree">
            <template #icon>
              <Switch />
            </template>
            {{ isPermExpanded ? "收缩" : "展开" }}
          </el-button>
          <el-checkbox
            v-model="permParentChildLinked"
            class="ml-5"
            @change="handlePermLinkedChange"
          >
            父子联动
          </el-checkbox>
        </div>
      </div>

      <el-tree
        ref="permTreeRef"
        node-key="value"
        show-checkbox
        :data="permOptions"
        :filter-node-method="handlePermFilter"
        :default-expand-all="true"
        :check-strictly="!permParentChildLinked"
        class="mt-5"
      >
        <template #default="{ data }">
          {{ data.label }}
        </template>
      </el-tree>

      <template #footer>
        <div class="dialog-footer">
          <el-button v-hasPerm="'sys:role:assign'" type="primary" @click="handleAssignPermSubmit">
            确定
          </el-button>
          <el-button @click="assignPermDialogVisible = false">取消</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { useFullscreen } from "@vueuse/core";
import { useAppStore } from "@/stores/app";
import { DeviceEnum } from "@/enums/settings";
import type { TreeNodeData } from "element-plus/es/components/tree";

import RoleAPI from "@/api/system/role";
import type { RoleItem, RoleForm, RoleDetail } from "@/api/system/role";
import MenuAPI from "@/api/system/menu";
import type { MenuItem } from "@/api/system/menu";
import PermissionAPI from "@/api/system/permission";
import type { PermissionItem } from "@/api/system/permission";
import type { OptionItem, PageResult } from "@/api/common";

defineOptions({
  name: "Role",
  inheritAttrs: false,
});

const appStore = useAppStore();

const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

const queryFormRef = ref();
const roleFormRef = ref();
const menuTreeRef = ref();
const permTreeRef = ref();

const loading = ref(false);
const ids = ref<string[]>([]);

const tableData = reactive<{
  items: RoleItem[];
  total: number;
  params: {
    page: number;
    pageSize: number;
    name?: string;
    code?: string;
  };
}>({
  items: [],
  total: 0,
  params: {
    page: 1,
    pageSize: 10,
  },
});

const menuPermOptions = ref<OptionItem[]>([]);
const permOptions = ref<OptionItem[]>([]);

// 弹窗
const dialogState = reactive({
  title: "",
  visible: false,
});

// 正在编辑的角色ID
const editingId = ref<string>();

const drawerSize = computed(() => (appStore.device === DeviceEnum.DESKTOP ? "600px" : "90%"));

// 角色表单
const formData = reactive<RoleForm>({
  code: "",
  name: "",
  sort: 1,
  status: 1,
});

const rules = reactive({
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入角色编码", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "blur" }],
});

// 选中的角色
interface CheckedRole {
  id?: string;
  name?: string;
}
const checkedRole = ref<CheckedRole>({});

// 分配菜单弹窗
const assignMenuDialogVisible = ref(false);
const menuKeywords = ref("");
const isMenuExpanded = ref(true);
const menuParentChildLinked = ref(true);

// 分配权限弹窗
const assignPermDialogVisible = ref(false);
const permKeywords = ref("");
const isPermExpanded = ref(true);
const permParentChildLinked = ref(true);

interface ToggleableTreeNode {
  expand: () => void;
  collapse: () => void;
}

/**
 * 将后端菜单树转换为前端 OptionItem 树
 */
function transformMenuTree(items: MenuItem[]): OptionItem[] {
  return items.map((item) => ({
    value: item.id,
    label: item.title,
    children: item.children?.length ? transformMenuTree(item.children) : undefined,
  }));
}

/**
 * 将权限列表按 group 字段分组为两级树
 */
function buildPermTree(items: PermissionItem[]): OptionItem[] {
  const groupMap = new Map<string, PermissionItem[]>();
  for (const item of items) {
    const g = item.group || "未分组";
    if (!groupMap.has(g)) groupMap.set(g, []);
    groupMap.get(g)!.push(item);
  }
  return Array.from(groupMap.entries()).map(([groupName, perms]) => ({
    value: `group:${groupName}`,
    label: groupName,
    children: perms.map((p) => ({
      value: p.id,
      label: p.name,
    })),
  }));
}

/**
 * 加载角色列表数据
 */
async function fetchList(): Promise<void> {
  loading.value = true;
  try {
    const data = await RoleAPI.getPage(tableData.params);
    tableData.items = data.items ?? [];
    tableData.total = data.total ?? 0;
  } finally {
    loading.value = false;
  }
}

// 查询（重置页码后获取数据）
function handleQuery(): void {
  tableData.params.page = 1;
  fetchList();
}

/**
 * 重置搜索条件并重新查询。
 */
function handleResetQuery(): void {
  queryFormRef.value?.resetFields();
  handleQuery();
}

// 行复选框选中
function handleSelectionChange(selection: RoleItem[]): void {
  ids.value = selection.flatMap((item) => (item.id ? [item.id] : []));
}

/**
 * 关闭表单弹窗
 */
function closeDialog(): void {
  dialogState.visible = false;
  resetForm();
}

/**
 * 重置表单数据和验证状态
 */
function resetForm(): void {
  roleFormRef.value?.resetFields();
  roleFormRef.value?.clearValidate();

  editingId.value = undefined;
  formData.code = "";
  formData.name = "";
  formData.sort = 1;
  formData.status = 1;
  formData.remark = undefined;
}

/**
 * 新增按钮点击事件
 */
function handleCreateClick(): void {
  dialogState.title = "新增角色";
  dialogState.visible = true;
}

/**
 * 编辑按钮点击事件
 */
async function handleEditClick(roleId: string): Promise<void> {
  dialogState.title = "修改角色";
  const detail: RoleDetail = await RoleAPI.getDetail(roleId);
  editingId.value = roleId;
  formData.code = detail.code;
  formData.name = detail.name;
  formData.sort = detail.sort;
  formData.status = detail.status;
  formData.remark = detail.remark ?? undefined;
  dialogState.visible = true;
}

// 提交角色表单
async function handleSubmit(): Promise<void> {
  const valid = await roleFormRef.value?.validate().then(
    () => true,
    () => false
  );
  if (!valid) return;

  loading.value = true;
  try {
    if (editingId.value) {
      // 修改时不含 code（系统内置角色不可改 code）
      const { code: _c, ...updateData } = formData;
      await RoleAPI.update(editingId.value, updateData);
      ElMessage.success("修改成功");
    } else {
      await RoleAPI.create(formData);
      ElMessage.success("新增成功");
    }
    closeDialog();
    handleResetQuery();
  } finally {
    loading.value = false;
  }
}

// 删除角色
function handleDelete(roleId?: string): void {
  const roleIds = roleId ? [roleId] : ids.value;
  if (roleIds.length === 0) {
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
      Promise.all(roleIds.map((id) => RoleAPI.deleteById(id)))
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
 * 批量删除按钮点击事件
 */
function handleBatchDelete(): void {
  handleDelete();
}

// 打开分配菜单弹窗
async function handleAssignMenuClick(row: RoleItem): Promise<void> {
  const roleId = row.id;
  if (!roleId) return;

  assignMenuDialogVisible.value = true;
  loading.value = true;

  checkedRole.value.id = roleId;
  checkedRole.value.name = row.name;

  // 获取菜单树和角色详情（含 menuIds）
  const [menuTree, detail] = await Promise.all([
    MenuAPI.getList(),
    RoleAPI.getDetail(roleId),
  ]);
  menuPermOptions.value = transformMenuTree(menuTree);

  nextTick(() => {
    (detail.menuIds ?? []).forEach((menuId) =>
      menuTreeRef.value?.setChecked(menuId, true, false)
    );
  });

  loading.value = false;
}

// 分配菜单提交
function handleAssignMenuSubmit() {
  const roleId = checkedRole.value.id;
  if (!roleId) return;

  const checkedMenuIds = menuTreeRef
    .value!.getCheckedNodes(false, true)
    .map((node: TreeNodeData) => String(node.value))
    .filter((value: string) => value);

  loading.value = true;
  RoleAPI.assignMenus(roleId, { menuIds: checkedMenuIds })
    .then(() => {
      ElMessage.success("分配成功");
      assignMenuDialogVisible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
}

// 打开分配权限弹窗
async function handleAssignPermClick(row: RoleItem): Promise<void> {
  const roleId = row.id;
  if (!roleId) return;

  assignPermDialogVisible.value = true;
  loading.value = true;

  checkedRole.value.id = roleId;
  checkedRole.value.name = row.name;

  // 获取权限列表和角色详情（含 permissionIds）
  const [permPage, detail] = await Promise.all([
    PermissionAPI.getPage({ page: 1, pageSize: 0 }),
    RoleAPI.getDetail(roleId),
  ]);
  permOptions.value = buildPermTree(permPage.items ?? []);

  nextTick(() => {
    (detail.permissionIds ?? []).forEach((permId) =>
      permTreeRef.value?.setChecked(permId, true, false)
    );
  });

  loading.value = false;
}

// 分配权限提交
function handleAssignPermSubmit() {
  const roleId = checkedRole.value.id;
  if (!roleId) return;

  const checkedPermIds = permTreeRef
    .value!.getCheckedNodes(true, false)
    .map((node: TreeNodeData) => String(node.value))
    .filter((value: string) => value);

  loading.value = true;
  RoleAPI.assignPermissions(roleId, { permissionIds: checkedPermIds })
    .then(() => {
      ElMessage.success("分配成功");
      assignPermDialogVisible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
}

// 展开/收缩 菜单树
function toggleMenuTree(): void {
  isMenuExpanded.value = !isMenuExpanded.value;
  toggleTree(menuTreeRef.value, isMenuExpanded.value);
}

// 展开/收缩 权限树
function togglePermTree(): void {
  isPermExpanded.value = !isPermExpanded.value;
  toggleTree(permTreeRef.value, isPermExpanded.value);
}

function toggleTree(treeRef: any, expanded: boolean): void {
  if (!treeRef) return;
  Object.values(treeRef.store.nodesMap).forEach((node) => {
    const treeNode = node as ToggleableTreeNode;
    if (expanded) {
      treeNode.expand();
    } else {
      treeNode.collapse();
    }
  });
}

// 菜单筛选
watch(menuKeywords, (val) => {
  menuTreeRef.value?.filter(val);
});

// 权限筛选
watch(permKeywords, (val) => {
  permTreeRef.value?.filter(val);
});

function handleMenuFilter(value: string, data: TreeNodeData) {
  if (!value) return true;
  return String(data.label ?? "").includes(value);
}

function handlePermFilter(value: string, data: TreeNodeData) {
  if (!value) return true;
  return String(data.label ?? "").includes(value);
}

function handleMenuLinkedChange(val: string | number | boolean): void {
  menuParentChildLinked.value = Boolean(val);
}

function handlePermLinkedChange(val: string | number | boolean): void {
  permParentChildLinked.value = Boolean(val);
}

onMounted(() => {
  handleQuery();
});
</script>
