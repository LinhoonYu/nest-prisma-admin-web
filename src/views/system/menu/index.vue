<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="菜单名称" prop="title">
          <el-input
            v-model="queryParams.title"
            placeholder="菜单名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 100px">
            <el-option :value="1" label="正常" />
            <el-option :value="0" label="禁用" />
          </el-select>
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
            v-hasPerm="['iam:menu:create']"
            type="primary"
            @click="openDialog()"
          >
            新增
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
        row-key="id"
        height="100%"
        :data="menuTableData"
        border
        :tree-props="{
          children: 'children',
          hasChildren: 'hasChildren',
        }"
        @row-click="handleRowClick"
      >
        <el-table-column label="菜单名称" min-width="200">
          <template #default="scope">
            <div class="menu-name-cell">
              <span class="menu-name-cell__icon">
                <template v-if="scope.row.icon && scope.row.icon.startsWith('el-icon')">
                  <el-icon style="vertical-align: -0.15em">
                    <component :is="scope.row.icon.replace('el-icon-', '')" />
                  </el-icon>
                </template>
                <template v-else-if="scope.row.icon">
                  <span :class="`i-svg:${scope.row.icon}`" />
                </template>
              </span>
              <span class="menu-name-cell__text">{{ scope.row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="类型" align="center" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.type === MenuTypeEnum.CATALOG" type="warning">目录</el-tag>
            <el-tag v-else-if="scope.row.type === MenuTypeEnum.MENU" type="success">菜单</el-tag>
            <el-tag v-else-if="scope.row.type === MenuTypeEnum.LINK" type="primary">外链</el-tag>
            <el-tag v-else-if="scope.row.type === MenuTypeEnum.IFRAME" type="info">内嵌</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="路由名称" align="left" width="150" prop="name" />
        <el-table-column label="路由路径" align="left" width="150" prop="path" />
        <el-table-column label="组件路径" align="left" width="250" prop="component" show-overflow-tooltip />

        <el-table-column label="状态" align="center" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="是否隐藏" align="center" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.hidden === 1" type="info">隐藏</el-tag>
            <el-tag v-else type="success">显示</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="排序" align="center" width="80" prop="sort" />
        <el-table-column fixed="right" align="center" label="操作" width="220">
          <template #default="scope">
            <el-button
              v-if="scope.row.type === MenuTypeEnum.CATALOG || scope.row.type === MenuTypeEnum.MENU"
              v-hasPerm="['iam:menu:create']"
              type="primary"
              link
              size="small"
              @click.stop="openDialog(scope.row.id)"
            >
              新增
            </el-button>

            <el-button
              v-hasPerm="['iam:menu:update']"
              type="primary"
              link
              size="small"
              @click.stop="openDialog(undefined, scope.row.id)"
            >
              编辑
            </el-button>
            <el-button
              v-hasPerm="['iam:menu:delete']"
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

    <el-drawer
      v-model="dialogState.visible"
      :title="dialogState.title"
      :size="drawerSize"
      @close="closeDialog"
    >
      <el-form ref="menuFormRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="父级菜单" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            placeholder="选择上级菜单（留空为顶级）"
            :data="menuOptions"
            filterable
            check-strictly
            clearable
            :render-after-expand="false"
          />
        </el-form-item>

        <el-form-item label="显示标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入显示标题" />
        </el-form-item>

        <el-form-item label="菜单类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio :value="MenuTypeEnum.CATALOG">目录</el-radio>
            <el-radio :value="MenuTypeEnum.MENU">菜单</el-radio>
            <el-radio :value="MenuTypeEnum.LINK">外链</el-radio>
            <el-radio :value="MenuTypeEnum.IFRAME">内嵌</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="needsRouteName" prop="name">
          <template #label>
            <div class="flex-y-center">
              路由名称
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  路由名称（唯一），建议使用驼峰式。如果需要开启缓存，需保证页面 defineOptions 中的 name 与此处一致。
                </template>
                <el-icon class="ml-1 cursor-pointer">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </template>
          <el-input v-model="formData.name" placeholder="如：SysUser" />
        </el-form-item>

        <el-form-item v-if="needsPath" prop="path">
          <template #label>
            <div class="flex-y-center">
              路由路径
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  定义应用中不同页面对应的 URL 路径，目录需以 / 开头，菜单项不用。例如：系统管理目录
                  /system，系统管理下的用户管理菜单 user。
                </template>
                <el-icon class="ml-1 cursor-pointer">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </template>
          <el-input v-model="formData.path" placeholder="system 或 user" />
        </el-form-item>

        <el-form-item v-if="formData.type === MenuTypeEnum.MENU && !isExternalLink" prop="component">
          <template #label>
            <div class="flex-y-center">
              组件路径
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  组件页面完整路径，相对于 src/views/，如 system/user/index，缺省后缀 .vue
                </template>
                <el-icon class="ml-1 cursor-pointer">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </template>

          <el-input v-model="formData.component" placeholder="system/user/index" style="width: 95%">
            <template #prepend>src/views/</template>
            <template #append>.vue</template>
          </el-input>
        </el-form-item>

        <el-form-item v-if="formData.type === MenuTypeEnum.LINK || formData.type === MenuTypeEnum.IFRAME" prop="externalUrl">
          <template #label>
            <div class="flex-y-center">
              外链地址
            </div>
          </template>
          <el-input v-model="formData.externalUrl" placeholder="https://example.com" />
        </el-form-item>

        <el-form-item v-if="needsVisibility" prop="hidden">
          <template #label>
            <div class="flex-y-center">
              是否隐藏
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  选择"隐藏"后，该菜单不会在侧边栏显示，但路由仍然可以访问。
                </template>
                <el-icon class="ml-1 cursor-pointer">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </template>
          <el-radio-group v-model="formData.hidden">
            <el-radio :value="0">显示</el-radio>
            <el-radio :value="1">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="needsVisibility">
          <template #label>
            <div class="flex-y-center">
              始终显示
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  选择"是"，即使目录或菜单下只有一个子节点，也会显示父节点。
                  <br />
                  选择"否"，如果目录或菜单下只有一个子节点，则只显示该子节点，隐藏父节点。
                </template>
                <el-icon class="ml-1 cursor-pointer">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </template>

          <el-radio-group v-model="formData.alwaysShow">
            <el-radio :value="0">否</el-radio>
            <el-radio :value="1">是</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="formData.type === MenuTypeEnum.MENU && !isExternalLink" label="缓存页面">
          <el-radio-group v-model="formData.keepAlive">
            <el-radio :value="1">开启</el-radio>
            <el-radio :value="0">关闭</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="formData.sort"
            style="width: 100px"
            controls-position="right"
            :min="0"
          />
        </el-form-item>

        <el-form-item v-if="needsVisibility" label="图标" prop="icon">
          <icon-select v-model="formData.icon" />
        </el-form-item>

        <el-form-item v-if="formData.type === MenuTypeEnum.CATALOG" label="跳转路由">
          <el-input v-model="formData.redirect" placeholder="跳转路由" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit">确定</el-button>
          <el-button @click="closeDialog">取消</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { useFullscreen } from "@vueuse/core";
import { useAppStore } from "@/stores/app";
import { DeviceEnum } from "@/enums/settings";
import MenuAPI from "@/api/system/menu";
import type { MenuQueryParams, MenuForm, MenuItem } from "@/api/system/menu";
import type { OptionItem } from "@/api/common";
import type { FormInstance, FormRules } from "element-plus";
import { MenuTypeEnum } from "@/enums/business";

defineOptions({
  name: "SysMenu",
  inheritAttrs: false,
});

const appStore = useAppStore();

const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

// 表单引用
const queryFormRef = ref<FormInstance>();
const menuFormRef = ref<FormInstance>();

// 查询参数
const queryParams = reactive<MenuQueryParams>({});

// 列表数据
const menuTableData = ref<MenuItem[]>([]);
const menuOptions = ref<OptionItem[]>([]);
const loading = ref(false);

// 弹窗状态
const dialogState = reactive({
  title: "新增菜单",
  visible: false,
});

// 正在编辑的菜单ID
const editingId = ref<string>();

// 表单初始数据
const initialFormData: MenuForm = {
  parentId: undefined,
  type: MenuTypeEnum.MENU,
  name: "",
  title: "",
  path: "",
  component: "",
  redirect: "",
  icon: "",
  sort: 1,
  hidden: 0,
  keepAlive: 1,
  alwaysShow: 0,
  status: 1,
};

const formData = reactive<MenuForm>({ ...initialFormData });

// 抽屉宽度
const drawerSize = computed(() => (appStore.device === DeviceEnum.DESKTOP ? "600px" : "90%"));

// 是否外链
const isExternalLink = computed(
  () =>
    formData.type === MenuTypeEnum.LINK ||
    formData.type === MenuTypeEnum.IFRAME ||
    (!!formData.path && /^https?:\/\//.test(formData.path))
);

// 是否需要路由名称
const needsRouteName = computed(
  () => formData.type === MenuTypeEnum.MENU || formData.type === MenuTypeEnum.CATALOG
);

// 是否需要路由路径
const needsPath = computed(
  () => formData.type === MenuTypeEnum.MENU || formData.type === MenuTypeEnum.CATALOG
);

// 是否需要可见性设置
const needsVisibility = computed(
  () => formData.type === MenuTypeEnum.MENU || formData.type === MenuTypeEnum.CATALOG
);

// 验证规则
const rules: FormRules = {
  title: [{ required: true, message: "请输入显示标题", trigger: "blur" }],
  type: [{ required: true, message: "请选择菜单类型", trigger: "blur" }],
  name: [{ required: true, message: "请输入路由名称", trigger: "blur" }],
  path: [{ required: true, message: "请输入路由路径", trigger: "blur" }],
};

/**
 * 将菜单树转换为选项树
 */
function transformMenuOptions(items: MenuItem[]): OptionItem[] {
  return items.map((item) => ({
    value: item.id,
    label: item.title,
    children: item.children?.length ? transformMenuOptions(item.children) : undefined,
  }));
}

/**
 * 加载菜单列表数据
 */
function fetchData(): void {
  loading.value = true;
  MenuAPI.getList(queryParams)
    .then((data) => {
      menuTableData.value = data;
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
 * 行点击事件
 */
function handleRowClick(row: MenuItem): void {
  // 可以用于选中行
  void row;
}

/**
 * 打开弹窗
 * @param parentId 父菜单ID
 * @param menuId 菜单ID（编辑时传入）
 */
async function openDialog(parentId?: string, menuId?: string): Promise<void> {
  // 加载菜单选项树
  const tree = await MenuAPI.getList();
  menuOptions.value = transformMenuOptions(tree);

  dialogState.visible = true;

  if (menuId) {
    dialogState.title = "编辑菜单";
    const detail = await MenuAPI.getDetail(menuId);
    editingId.value = menuId;
    formData.parentId = detail.parentId ?? undefined;
    formData.type = detail.type;
    formData.name = detail.name;
    formData.title = detail.title;
    formData.path = detail.path ?? "";
    formData.component = detail.component ?? "";
    formData.redirect = detail.redirect ?? "";
    formData.icon = detail.icon ?? "";
    formData.sort = detail.sort;
    formData.hidden = detail.hidden;
    formData.keepAlive = detail.keepAlive;
    formData.alwaysShow = detail.alwaysShow;
    formData.externalUrl = detail.externalUrl ?? "";
    formData.status = detail.status;
  } else {
    dialogState.title = "新增菜单";
    editingId.value = undefined;
    Object.assign(formData, initialFormData);
    formData.parentId = parentId;
  }
}

/**
 * 提交表单
 */
function handleSubmit(): void {
  menuFormRef.value?.validate((isValid) => {
    if (!isValid) return;

    if (editingId.value) {
      if (formData.parentId === editingId.value) {
        ElMessage.error("父级菜单不能为当前菜单");
        return;
      }
      MenuAPI.update(editingId.value, formData).then(() => {
        ElMessage.success("修改成功");
        closeDialog();
        fetchData();
      });
    } else {
      MenuAPI.create(formData).then(() => {
        ElMessage.success("新增成功");
        closeDialog();
        fetchData();
      });
    }
  });
}

/**
 * 删除菜单
 */
function handleDelete(menuId: string): void {
  if (!menuId) {
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
      MenuAPI.deleteById(menuId)
        .then(() => {
          ElMessage.success("删除成功");
          fetchData();
        })
        .finally(() => {
          loading.value = false;
        });
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
  menuFormRef.value?.resetFields();
  menuFormRef.value?.clearValidate();
  editingId.value = undefined;
  Object.assign(formData, initialFormData);
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.menu-name-cell {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
}

.menu-name-cell__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  min-width: 18px;
  margin-right: 6px;
}

.menu-name-cell__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
