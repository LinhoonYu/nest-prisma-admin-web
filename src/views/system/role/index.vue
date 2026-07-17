<template>
  <div class="page-container">
    <!-- 搜索区域 -->
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="tableData.params" :inline="true">
        <el-form-item prop="name" :label="t('role.name')">
          <el-input
            v-model="tableData.params.name"
            :placeholder="t('role.name')"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="code" :label="t('role.code')">
          <el-input
            v-model="tableData.params.code"
            :placeholder="t('role.code')"
            clearable
            @keyup.enter="handleQuery"
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
        <div class="page-toolbar__left">
          <el-button type="primary" @click="handleCreateClick()">{{ t('common.add') }}</el-button>
          <el-button
            type="danger"
            :disabled="ids.length === 0"
            @click="handleBatchDelete()"
          >
            {{ t('common.delete') }}
          </el-button>
        </div>
        <div class="page-toolbar__right">
          <el-tooltip :content="t('common.refresh')" placement="top">
            <el-button class="page-icon-btn" @click="fetchList">
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
        <el-table-column :label="t('role.name')" prop="name" min-width="100" />
        <el-table-column :label="t('role.code')" prop="code" width="150" />
        <el-table-column :label="t('common.status')" align="center" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">{{ t('common.enabled') }}</el-tag>
            <el-tag v-else type="info">{{ t('common.disabled') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.sort')" align="center" width="80" prop="sort" />
        <el-table-column :label="t('common.remark')" prop="remark" min-width="120" show-overflow-tooltip />

        <el-table-column fixed="right" :label="t('common.operation')" width="320">
          <template #default="scope">
            <el-button
              v-hasPerm="'iam:role:assign-menus'"
              type="primary"
              size="small"
              link
              @click="handleAssignMenuClick(scope.row)"
            >
              {{ t('role.assignMenu') }}
            </el-button>
            <el-button
              v-hasPerm="'iam:role:assign-perms'"
              type="primary"
              size="small"
              link
              @click="handleAssignPermClick(scope.row)"
            >
              {{ t('role.assignPerm') }}
            </el-button>
            <el-button
              type="primary"
              size="small"
              link
              @click="handleEditClick(scope.row.id)"
            >
              {{ t('common.edit') }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              @click="handleDelete(scope.row.id)"
            >
              {{ t('common.delete') }}
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
        <el-form-item :label="t('role.name')" prop="name">
          <el-input v-model="formData.name" :placeholder="t('role.messages.enterName')" />
        </el-form-item>

        <el-form-item :label="t('role.code')" prop="code">
          <el-input v-model="formData.code" :readonly="!!editingId" :placeholder="t('role.messages.enterCode')" />
        </el-form-item>

        <el-form-item :label="t('common.status')" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">{{ t('common.enabled') }}</el-radio>
            <el-radio :value="0">{{ t('common.disabled') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="t('common.sort')" prop="sort">
          <el-input-number
            v-model="formData.sort"
            controls-position="right"
            :min="0"
            style="width: 100px"
          />
        </el-form-item>

        <el-form-item :label="t('common.remark')" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :placeholder="t('common.remark')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
          <el-button @click="closeDialog">{{ t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分配菜单弹窗 -->
    <el-drawer
      v-model="assignMenuDialogVisible"
      :title="t('role.menuAssignTitle', { name: checkedRole.name })"
      :size="drawerSize"
    >
      <div class="flex-x-between">
        <el-input v-model="menuKeywords" clearable class="w-[150px]" :placeholder="t('role.menuName')">
          <template #prefix>
            <Search />
          </template>
        </el-input>

        <div class="flex-center ml-5">
          <el-button type="primary" size="small" plain @click="toggleMenuTree">
            <template #icon>
              <Switch />
            </template>
            {{ isMenuExpanded ? t('common.collapse') : t('common.expand') }}
          </el-button>
          <el-checkbox
            v-model="menuParentChildLinked"
            class="ml-5"
            @change="handleMenuLinkedChange"
          >
            {{ t('role.parentChildLinked') }}
          </el-checkbox>

          <el-tooltip placement="bottom">
            <template #content>
              {{ t('role.linkTip') }}
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
          <el-button v-hasPerm="'iam:role:assign-menus'" type="primary" @click="handleAssignMenuSubmit">
            {{ t('common.confirm') }}
          </el-button>
          <el-button @click="assignMenuDialogVisible = false">{{ t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 分配权限弹窗 -->
    <el-drawer
      v-model="assignPermDialogVisible"
      :title="t('role.permAssignTitle', { name: checkedRole.name })"
      :size="drawerSize"
    >
      <div class="flex-x-between">
        <el-input v-model="permKeywords" clearable class="w-[150px]" :placeholder="t('role.permName')">
          <template #prefix>
            <Search />
          </template>
        </el-input>

        <div class="flex-center ml-5">
          <el-button type="primary" size="small" plain @click="togglePermTree">
            <template #icon>
              <Switch />
            </template>
            {{ isPermExpanded ? t('common.collapse') : t('common.expand') }}
          </el-button>
          <el-checkbox
            v-model="permParentChildLinked"
            class="ml-5"
            @change="handlePermLinkedChange"
          >
            {{ t('role.parentChildLinked') }}
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
          <el-button v-hasPerm="'iam:role:assign-perms'" type="primary" @click="handleAssignPermSubmit">
            {{ t('common.confirm') }}
          </el-button>
          <el-button @click="assignPermDialogVisible = false">{{ t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
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

const { t } = useI18n();

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

const dialogState = reactive({
  title: "",
  visible: false,
});

const editingId = ref<string>();

const drawerSize = computed(() => (appStore.device === DeviceEnum.DESKTOP ? "600px" : "90%"));

const formData = reactive<RoleForm>({
  code: "",
  name: "",
  sort: 1,
  status: 1,
});

const rules = computed(() => ({
  name: [{ required: true, message: t("role.messages.enterName"), trigger: "blur" }],
  code: [{ required: true, message: t("role.messages.enterCode"), trigger: "blur" }],
  status: [{ required: true, message: t("role.messages.selectStatus"), trigger: "blur" }],
}));

interface CheckedRole {
  id?: string;
  name?: string;
}
const checkedRole = ref<CheckedRole>({});

const assignMenuDialogVisible = ref(false);
const menuKeywords = ref("");
const isMenuExpanded = ref(true);
const menuParentChildLinked = ref(true);

const assignPermDialogVisible = ref(false);
const permKeywords = ref("");
const isPermExpanded = ref(true);
const permParentChildLinked = ref(true);

interface ToggleableTreeNode {
  expand: () => void;
  collapse: () => void;
}

function transformMenuTree(items: MenuItem[]): OptionItem[] {
  return items.map((item) => ({
    value: item.id,
    label: item.title,
    children: item.children?.length ? transformMenuTree(item.children) : undefined,
  }));
}

function buildPermTree(items: PermissionItem[]): OptionItem[] {
  const groupMap = new Map<string, PermissionItem[]>();
  for (const item of items) {
    const g = item.group || t("permission.ungrouped");
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

function handleQuery(): void {
  tableData.params.page = 1;
  fetchList();
}

function handleResetQuery(): void {
  queryFormRef.value?.resetFields();
  handleQuery();
}

function handleSelectionChange(selection: RoleItem[]): void {
  ids.value = selection.flatMap((item) => (item.id ? [item.id] : []));
}

function closeDialog(): void {
  dialogState.visible = false;
  resetForm();
}

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

function handleCreateClick(): void {
  dialogState.title = t("role.addRole");
  dialogState.visible = true;
}

async function handleEditClick(roleId: string): Promise<void> {
  dialogState.title = t("role.editRole");
  const detail: RoleDetail = await RoleAPI.getDetail(roleId);
  editingId.value = roleId;
  formData.code = detail.code;
  formData.name = detail.name;
  formData.sort = detail.sort;
  formData.status = detail.status;
  formData.remark = detail.remark ?? undefined;
  dialogState.visible = true;
}

async function handleSubmit(): Promise<void> {
  const valid = await roleFormRef.value?.validate().then(
    () => true,
    () => false
  );
  if (!valid) return;

  loading.value = true;
  try {
    if (editingId.value) {
      const { code: _c, ...updateData } = formData;
      await RoleAPI.update(editingId.value, updateData);
      ElMessage.success(t("common.editSuccess"));
    } else {
      await RoleAPI.create(formData);
      ElMessage.success(t("common.addSuccess"));
    }
    closeDialog();
    handleResetQuery();
  } finally {
    loading.value = false;
  }
}

function handleDelete(roleId?: string): void {
  const roleIds = roleId ? [roleId] : ids.value;
  if (roleIds.length === 0) {
    ElMessage.warning(t("common.selectDeleteItem"));
    return;
  }

  ElMessageBox.confirm(t("common.confirmDelete"), t("common.warning"), {
    confirmButtonText: t("common.confirm"),
    cancelButtonText: t("common.cancel"),
    type: "warning",
  }).then(
    () => {
      loading.value = true;
      Promise.all(roleIds.map((id) => RoleAPI.deleteById(id)))
        .then(() => {
          ElMessage.success(t("common.deleteSuccess"));
          handleResetQuery();
        })
        .finally(() => (loading.value = false));
    },
    () => {
      ElMessage.info(t("common.deleteCancelled"));
    }
  );
}

function handleBatchDelete(): void {
  handleDelete();
}

async function handleAssignMenuClick(row: RoleItem): Promise<void> {
  const roleId = row.id;
  if (!roleId) return;

  assignMenuDialogVisible.value = true;
  loading.value = true;

  checkedRole.value.id = roleId;
  checkedRole.value.name = row.name;

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
      ElMessage.success(t("common.assignSuccess"));
      assignMenuDialogVisible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
}

async function handleAssignPermClick(row: RoleItem): Promise<void> {
  const roleId = row.id;
  if (!roleId) return;

  assignPermDialogVisible.value = true;
  loading.value = true;

  checkedRole.value.id = roleId;
  checkedRole.value.name = row.name;

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
      ElMessage.success(t("common.assignSuccess"));
      assignPermDialogVisible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
}

function toggleMenuTree(): void {
  isMenuExpanded.value = !isMenuExpanded.value;
  toggleTree(menuTreeRef.value, isMenuExpanded.value);
}

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

watch(menuKeywords, (val) => {
  menuTreeRef.value?.filter(val);
});

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
