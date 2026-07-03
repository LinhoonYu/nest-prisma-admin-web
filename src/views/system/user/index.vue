<!-- 用户管理 -->
<template>
  <div class="page-container page-container--split user-page">
    <!-- 部门树 -->
    <aside class="page-aside" :class="{ 'is-collapsed': sidebarCollapsed }">
      <div class="page-aside__inner">
        <UserDeptTree v-model="tableData.params.deptId" @node-click="handleQuery" />
      </div>
      <button class="page-aside__toggle" @click="sidebarCollapsed = !sidebarCollapsed">
        <el-icon :size="14">
          <ArrowLeft v-if="!sidebarCollapsed" />
          <ArrowRight v-else />
        </el-icon>
      </button>
    </aside>

    <!-- 用户列表 -->
    <div class="page-main">
        <!-- 搜索区域 -->
        <el-card shadow="never" class="page-search">
          <el-form ref="queryFormRef" :model="tableData.params" :inline="true" label-width="auto">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="tableData.params.username"
                placeholder="用户名"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>

            <el-form-item label="昵称" prop="nickname">
              <el-input
                v-model="tableData.params.nickname"
                placeholder="昵称"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>

            <el-form-item label="状态" prop="status">
              <el-select
                v-model="tableData.params.status"
                placeholder="全部"
                clearable
                style="width: 100px"
              >
                <el-option label="正常" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleQuery">搜索</el-button>
              <el-button @click="handleResetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card ref="tableWrapperRef" shadow="never" class="page-content">
          <div class="page-toolbar">
            <div class="page-toolbar__left">
              <el-button
                v-hasPerm="'sys:user:create'"
                type="primary"
                @click="handleCreateClick"
              >
                新增
              </el-button>
              <el-button
                v-hasPerm="'sys:user:delete'"
                type="danger"
                :disabled="!hasSelection"
                @click="handleDelete()"
              >
                删除
              </el-button>
            </div>
            <div class="page-toolbar__right">
              <el-tooltip content="刷新" placement="top">
                <el-button class="page-icon-btn" @click="handleQuery">
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
            :data="tableData.items"
            height="100%"
            border
            stripe
            highlight-current-row
            row-key="id"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column label="用户名" prop="username" min-width="120" show-overflow-tooltip />
            <el-table-column label="昵称" width="160" align="center" prop="nickname" />
            <el-table-column label="真实姓名" width="120" align="center" prop="realName" />
            <el-table-column label="手机号码" align="center" prop="phone" width="120" />
            <el-table-column label="邮箱" align="center" prop="email" width="160" show-overflow-tooltip />
            <el-table-column label="状态" align="center" prop="status" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.status === CommonStatus.ENABLED ? 'success' : 'info'">
                  {{ scope.row.status === CommonStatus.ENABLED ? "正常" : "禁用" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createdAt" width="180" />
            <el-table-column label="操作" fixed="right" width="220">
              <template #default="scope">
                <el-button
                  v-hasPerm="'sys:user:reset-password'"
                  type="primary"
                  size="small"
                  link
                  @click="handleResetPassword(scope.row)"
                >
                  重置密码
                </el-button>
                <el-button
                  v-hasPerm="'sys:user:update'"
                  type="primary"
                  link
                  size="small"
                  @click="handleEditClick(scope.row.id)"
                >
                  编辑
                </el-button>
                <el-button
                  v-hasPerm="'sys:user:delete'"
                  type="danger"
                  link
                  size="small"
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
    </div>

    <!-- 用户表单 -->
    <el-drawer
      v-model="dialogState.visible"
      :title="dialogState.title"
      append-to-body
      :size="drawerSize"
      @close="closeDialog"
    >
      <el-form ref="userFormRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formData.username"
            :readonly="!!editingId"
            placeholder="请输入用户名"
          />
        </el-form-item>

        <el-form-item v-if="!editingId" label="密码" prop="password">
          <el-input v-model="formData.password" type="password" show-password placeholder="请输入初始密码" />
        </el-form-item>

        <el-form-item label="用户昵称" prop="nickname">
          <el-input v-model="formData.nickname" placeholder="请输入用户昵称" />
        </el-form-item>

        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="formData.realName" placeholder="请输入真实姓名" />
        </el-form-item>

        <el-form-item label="所属部门" prop="deptId">
          <el-tree-select
            v-model="formData.deptId"
            placeholder="请选择所属部门"
            :data="deptOptions"
            filterable
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-select v-model="formData.gender" placeholder="请选择">
            <el-option label="未知" :value="0" />
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="角色" prop="roleIds">
          <el-select v-model="selectedRoleIds" multiple placeholder="请选择">
            <el-option
              v-for="item in roleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号码" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="formData.status"
            inline-prompt
            active-text="正常"
            inactive-text="禁用"
            :active-value="CommonStatus.ENABLED"
            :inactive-value="CommonStatus.DISABLED"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
          <el-button @click="closeDialog">取 消</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useDebounceFn, useFullscreen } from "@vueuse/core";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import type { UserForm, UserItem, UserDetail } from "@/api/system/user";
import UserAPI from "@/api/system/user";
import DeptAPI from "@/api/system/dept";
import type { DeptItem } from "@/api/system/dept";
import RoleAPI from "@/api/system/role";
import type { OptionItem, PageResult } from "@/api/common";
import type { RoleItem } from "@/api/system/role";
import { useUserStore, useAppStore } from "@/stores";
import { DeviceEnum, DialogMode, CommonStatus } from "@/enums";
import { useTableSelection } from "@/composables";
import UserDeptTree from "./components/UserDeptTree.vue";

defineOptions({
  name: "User",
  inheritAttrs: false,
});

const appStore = useAppStore();
const userStore = useUserStore();

const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

// 表单引用
const queryFormRef = ref<FormInstance>();
const userFormRef = ref<FormInstance>();

const loading = ref(false);
const sidebarCollapsed = ref(false);

const tableData = reactive<{
  items: UserItem[];
  total: number;
  params: {
    page: number;
    pageSize: number;
    username?: string;
    nickname?: string;
    deptId?: string;
    status?: number;
  };
}>({
  items: [],
  total: 0,
  params: {
    page: 1,
    pageSize: 10,
  },
});

// 弹窗状态
const dialogState = reactive({
  visible: false,
  title: "新增用户",
  mode: DialogMode.CREATE,
});

// 正在编辑的用户ID
const editingId = ref<string>();

// 表单初始数据
const initialFormData: UserForm = {
  username: "",
  password: "",
  status: CommonStatus.ENABLED,
  gender: 0,
};

// 表单数据
const formData = reactive<UserForm>({ ...initialFormData });

// 选中的角色ID列表（独立于 UserForm，通过 assignRoles API 单独提交）
const selectedRoleIds = ref<string[]>([]);

// 下拉选项
const deptOptions = ref<OptionItem[]>();
const roleOptions = ref<OptionItem[]>();

const drawerSize = computed(() => (appStore.device === DeviceEnum.DESKTOP ? "600px" : "90%"));

const rules: FormRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入初始密码", trigger: "blur" }],
  email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }],
};

/**
 * 加载用户列表数据
 */
async function fetchList(): Promise<void> {
  loading.value = true;
  try {
    const data = await UserAPI.getPage(tableData.params);
    tableData.items = data.items ?? [];
    tableData.total = data.total ?? 0;
  } finally {
    loading.value = false;
  }
}

/**
 * 将部门树转换为下拉选项
 */
function transformDeptOptions(items: DeptItem[]): OptionItem[] {
  return items.map((item) => ({
    value: item.id,
    label: item.name,
    children: item.children?.length ? transformDeptOptions(item.children) : undefined,
  }));
}

/**
 * 加载表单下拉选项数据
 */
async function loadFormOptions(): Promise<void> {
  const [rolePage, deptTree] = await Promise.all([
    RoleAPI.getPage({ page: 1, pageSize: 100 }),
    DeptAPI.getList(),
  ]);
  roleOptions.value = (rolePage.items ?? []).map((r: RoleItem) => ({
    value: r.id,
    label: r.name,
  }));
  deptOptions.value = transformDeptOptions(deptTree);
}

const { selectedIds, hasSelection, handleSelectionChange } = useTableSelection<UserItem>();

/**
 * 执行查询（重置页码）
 */
function handleQuery(): void {
  tableData.params.page = 1;
  fetchList();
}

/**
 * 重置搜索条件并重新查询。
 */
function handleResetQuery(): void {
  queryFormRef.value?.resetFields();
  tableData.params.deptId = undefined;
  handleQuery();
}

/**
 * 重置用户密码
 */
async function resetPassword(userId: string, password: string): Promise<void> {
  await UserAPI.resetPassword(userId, { password });
  ElMessage.success("密码重置成功");
}

/**
 * 删除用户（支持批量）
 */
async function deleteUsers(userIds: string[]): Promise<void> {
  // 后端仅支持单个删除，逐个调用
  await Promise.all(userIds.map((id) => UserAPI.deleteById(id)));
  ElMessage.success("删除成功");
  handleQuery();
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
  userFormRef.value?.resetFields();
  userFormRef.value?.clearValidate();
  Object.assign(formData, initialFormData);
  editingId.value = undefined;
  selectedRoleIds.value = [];
}

/**
 * 重置密码按钮点击事件
 */
function handleResetPassword(row: UserItem): void {
  ElMessageBox.prompt(`请输入用户【${row.username}】的新密码`, "重置密码", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /.{6,}/,
    inputErrorMessage: "密码至少需要6位字符",
  }).then(
    (result: { value: string }) => resetPassword(row.id, result.value),
    () => {
      /* 用户取消 */
    }
  );
}

/**
 * 新增按钮点击事件
 */
async function handleCreateClick(): Promise<void> {
  dialogState.title = "新增用户";
  dialogState.mode = DialogMode.CREATE;
  await loadFormOptions();
  dialogState.visible = true;
}

/**
 * 编辑按钮点击事件
 */
async function handleEditClick(id: string): Promise<void> {
  dialogState.title = "修改用户";
  dialogState.mode = DialogMode.EDIT;
  await loadFormOptions();
  const detail = await UserAPI.getDetail(id);
  editingId.value = id;
  formData.username = detail.username;
  formData.nickname = detail.nickname ?? undefined;
  formData.realName = detail.realName ?? undefined;
  formData.email = detail.email ?? undefined;
  formData.phone = detail.phone ?? undefined;
  formData.gender = detail.gender;
  formData.deptId = detail.deptId ?? undefined;
  formData.avatarFileId = detail.avatarFileId ?? undefined;
  formData.status = detail.status;
  formData.remark = detail.remark ?? undefined;
  selectedRoleIds.value = detail.roleIds ?? [];
  dialogState.visible = true;
}

/**
 * 提交表单（防抖处理）
 */
const handleSubmit = useDebounceFn(async () => {
  const valid = await userFormRef.value?.validate().then(
    () => true,
    () => false
  );
  if (!valid) return;

  loading.value = true;
  try {
    if (editingId.value) {
      // 修改用户：不含 username 和 password
      const { username: _u, password: _p, ...updateData } = formData;
      await UserAPI.update(editingId.value, updateData);
      // 分配角色
      await UserAPI.assignRoles(editingId.value, { roleIds: selectedRoleIds.value });
      ElMessage.success("修改用户成功");
    } else {
      // 新增用户
      await UserAPI.create(formData);
      ElMessage.success("新增用户成功");
    }
    closeDialog();
    handleQuery();
  } finally {
    loading.value = false;
  }
}, 300);

/**
 * 删除按钮点击事件
 */
function handleDelete(id?: string): void {
  const ids = id ? [id] : selectedIds.value.map(String);
  if (ids.length === 0) {
    ElMessage.warning("请勾选删除项");
    return;
  }

  // 安全检查：防止删除当前登录用户
  const currentUserId = userStore.userInfo?.userId;
  if (currentUserId && ids.includes(currentUserId)) {
    ElMessage.error("不能删除当前登录用户");
    return;
  }

  ElMessageBox.confirm("确认删除选中的用户吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => deleteUsers(ids),
    () => {
      /* 用户取消 */
    }
  );
}

onMounted(() => {
  handleQuery();
});
</script>
