<template>
  <div class="page-container">
    <el-card class="page-search" shadow="never">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item :label="t('menu.name')" prop="title">
          <el-input
            v-model="queryParams.title"
            :placeholder="t('menu.name')"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item :label="t('common.status')" prop="status">
          <el-select v-model="queryParams.status" :placeholder="t('common.all')" clearable style="width: 100px">
            <el-option :value="1" :label="t('common.enabled')" />
            <el-option :value="0" :label="t('common.disabled')" />
          </el-select>
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
          <el-button
            v-hasPerm="['iam:menu:create']"
            type="primary"
            @click="openDialog()"
          >
            {{ t('common.add') }}
          </el-button>
        </div>
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
        <el-table-column :label="t('menu.name')" min-width="200">
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

        <el-table-column :label="t('menu.type')" align="center" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.type === MenuTypeEnum.CATALOG" type="warning">{{ t('menu.typeOptions.catalog') }}</el-tag>
            <el-tag v-else-if="scope.row.type === MenuTypeEnum.MENU" type="success">{{ t('menu.typeOptions.menu') }}</el-tag>
            <el-tag v-else-if="scope.row.type === MenuTypeEnum.LINK" type="primary">{{ t('menu.typeOptions.link') }}</el-tag>
            <el-tag v-else-if="scope.row.type === MenuTypeEnum.IFRAME" type="info">{{ t('menu.typeOptions.iframe') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('menu.routeName')" align="left" width="150" prop="name" />
        <el-table-column :label="t('menu.routePath')" align="left" width="150" prop="path" />
        <el-table-column :label="t('menu.componentPath')" align="left" width="250" prop="component" show-overflow-tooltip />

        <el-table-column :label="t('common.status')" align="center" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">{{ t('common.enabled') }}</el-tag>
            <el-tag v-else type="info">{{ t('common.disabled') }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('menu.isHidden')" align="center" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.hidden === 1" type="info">{{ t('menu.hiddenOptions.hidden') }}</el-tag>
            <el-tag v-else type="success">{{ t('menu.hiddenOptions.visible') }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('common.sort')" align="center" width="80" prop="sort" />
        <el-table-column fixed="right" align="center" :label="t('common.operation')" width="220">
          <template #default="scope">
            <el-button
              v-if="scope.row.type === MenuTypeEnum.CATALOG || scope.row.type === MenuTypeEnum.MENU"
              v-hasPerm="['iam:menu:create']"
              type="primary"
              link
              size="small"
              @click.stop="openDialog(scope.row.id)"
            >
              {{ t('common.add') }}
            </el-button>

            <el-button
              v-hasPerm="['iam:menu:update']"
              type="primary"
              link
              size="small"
              @click.stop="openDialog(undefined, scope.row.id)"
            >
              {{ t('common.edit') }}
            </el-button>
            <el-button
              v-hasPerm="['iam:menu:delete']"
              type="danger"
              link
              size="small"
              @click.stop="handleDelete(scope.row.id)"
            >
              {{ t('common.delete') }}
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
        <el-form-item :label="t('menu.parentMenu')" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :placeholder="t('menu.parentPlaceholder')"
            :data="menuOptions"
            filterable
            check-strictly
            clearable
            :render-after-expand="false"
          />
        </el-form-item>

        <el-form-item :label="t('menu.displayTitle')" prop="title">
          <el-input v-model="formData.title" :placeholder="t('menu.messages.enterTitle')" />
        </el-form-item>

        <el-form-item :label="t('menu.menuType')" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio :value="MenuTypeEnum.CATALOG">{{ t('menu.typeOptions.catalog') }}</el-radio>
            <el-radio :value="MenuTypeEnum.MENU">{{ t('menu.typeOptions.menu') }}</el-radio>
            <el-radio :value="MenuTypeEnum.LINK">{{ t('menu.typeOptions.link') }}</el-radio>
            <el-radio :value="MenuTypeEnum.IFRAME">{{ t('menu.typeOptions.iframe') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="needsRouteName" prop="name">
          <template #label>
            <div class="flex-y-center">
              {{ t('menu.routeName') }}
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  {{ t('menu.routeNameTip') }}
                </template>
                <el-icon class="ml-1 cursor-pointer">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </template>
          <el-input v-model="formData.name" placeholder="SysUser" />
        </el-form-item>

        <el-form-item v-if="needsPath" prop="path">
          <template #label>
            <div class="flex-y-center">
              {{ t('menu.routePath') }}
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  {{ t('menu.routePathTip') }}
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
              {{ t('menu.componentPath') }}
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  {{ t('menu.componentPathTip') }}
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
              {{ t('menu.externalUrl') }}
            </div>
          </template>
          <el-input v-model="formData.externalUrl" placeholder="https://example.com" />
        </el-form-item>

        <el-form-item v-if="needsVisibility" prop="hidden">
          <template #label>
            <div class="flex-y-center">
              {{ t('menu.isHidden') }}
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  {{ t('menu.hiddenTip') }}
                </template>
                <el-icon class="ml-1 cursor-pointer">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </template>
          <el-radio-group v-model="formData.hidden">
            <el-radio :value="0">{{ t('menu.hiddenOptions.visible') }}</el-radio>
            <el-radio :value="1">{{ t('menu.hiddenOptions.hidden') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="needsVisibility">
          <template #label>
            <div class="flex-y-center">
              {{ t('menu.alwaysShow') }}
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  {{ t('menu.alwaysShowTip') }}
                </template>
                <el-icon class="ml-1 cursor-pointer">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </template>

          <el-radio-group v-model="formData.alwaysShow">
            <el-radio :value="0">{{ t('menu.yesNo.no') }}</el-radio>
            <el-radio :value="1">{{ t('menu.yesNo.yes') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="formData.type === MenuTypeEnum.MENU && !isExternalLink" :label="t('menu.cachePage')">
          <el-radio-group v-model="formData.keepAlive">
            <el-radio :value="1">{{ t('menu.cacheOptions.on') }}</el-radio>
            <el-radio :value="0">{{ t('menu.cacheOptions.off') }}</el-radio>
          </el-radio-group>
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
            style="width: 100px"
            controls-position="right"
            :min="0"
          />
        </el-form-item>

        <el-form-item v-if="needsVisibility" :label="t('menu.icon')" prop="icon">
          <icon-select v-model="formData.icon" />
        </el-form-item>

        <el-form-item v-if="formData.type === MenuTypeEnum.CATALOG" :label="t('menu.redirect')">
          <el-input v-model="formData.redirect" :placeholder="t('menu.redirect')" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
          <el-button @click="closeDialog">{{ t('common.cancel') }}</el-button>
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
import MenuAPI from "@/api/system/menu";
import type { MenuQueryParams, MenuForm, MenuItem } from "@/api/system/menu";
import type { OptionItem } from "@/api/common";
import type { FormInstance, FormRules } from "element-plus";
import { MenuTypeEnum } from "@/enums/business";

const { t } = useI18n();

defineOptions({
  name: "SysMenu",
  inheritAttrs: false,
});

const appStore = useAppStore();

const tableWrapperRef = ref<HTMLElement | null>(null);
const { toggle: toggleFullscreen } = useFullscreen(tableWrapperRef);

const queryFormRef = ref<FormInstance>();
const menuFormRef = ref<FormInstance>();

const queryParams = reactive<MenuQueryParams>({});

const menuTableData = ref<MenuItem[]>([]);
const menuOptions = ref<OptionItem[]>([]);
const loading = ref(false);

const dialogState = reactive({
  title: t("menu.addMenu"),
  visible: false,
});

const editingId = ref<string>();

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

const drawerSize = computed(() => (appStore.device === DeviceEnum.DESKTOP ? "600px" : "90%"));

const isExternalLink = computed(
  () =>
    formData.type === MenuTypeEnum.LINK ||
    formData.type === MenuTypeEnum.IFRAME ||
    (!!formData.path && /^https?:\/\//.test(formData.path))
);

const needsRouteName = computed(
  () => formData.type === MenuTypeEnum.MENU || formData.type === MenuTypeEnum.CATALOG
);

const needsPath = computed(
  () => formData.type === MenuTypeEnum.MENU || formData.type === MenuTypeEnum.CATALOG
);

const needsVisibility = computed(
  () => formData.type === MenuTypeEnum.MENU || formData.type === MenuTypeEnum.CATALOG
);

const rules = computed<FormRules>(() => ({
  title: [{ required: true, message: t("menu.messages.enterTitle"), trigger: "blur" }],
  type: [{ required: true, message: t("menu.messages.selectType"), trigger: "blur" }],
  name: [{ required: true, message: t("menu.messages.enterRouteName"), trigger: "blur" }],
  path: [{ required: true, message: t("menu.messages.enterRoutePath"), trigger: "blur" }],
}));

function transformMenuOptions(items: MenuItem[]): OptionItem[] {
  return items.map((item) => ({
    value: item.id,
    label: item.title,
    children: item.children?.length ? transformMenuOptions(item.children) : undefined,
  }));
}

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

function handleQuery(): void {
  fetchData();
}

function handleResetQuery(): void {
  queryFormRef.value?.resetFields();
  fetchData();
}

function handleRowClick(row: MenuItem): void {
  void row;
}

async function openDialog(parentId?: string, menuId?: string): Promise<void> {
  const tree = await MenuAPI.getList();
  menuOptions.value = transformMenuOptions(tree);

  dialogState.visible = true;

  if (menuId) {
    dialogState.title = t("menu.editMenu");
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
    dialogState.title = t("menu.addMenu");
    editingId.value = undefined;
    Object.assign(formData, initialFormData);
    formData.parentId = parentId;
  }
}

function handleSubmit(): void {
  menuFormRef.value?.validate((isValid) => {
    if (!isValid) return;

    if (editingId.value) {
      if (formData.parentId === editingId.value) {
        ElMessage.error(t("menu.messages.parentNotSelf"));
        return;
      }
      MenuAPI.update(editingId.value, formData).then(() => {
        ElMessage.success(t("common.editSuccess"));
        closeDialog();
        fetchData();
      });
    } else {
      MenuAPI.create(formData).then(() => {
        ElMessage.success(t("common.addSuccess"));
        closeDialog();
        fetchData();
      });
    }
  });
}

function handleDelete(menuId: string): void {
  if (!menuId) {
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
      MenuAPI.deleteById(menuId)
        .then(() => {
          ElMessage.success(t("common.deleteSuccess"));
          fetchData();
        })
        .finally(() => {
          loading.value = false;
        });
    },
    () => {
      ElMessage.info(t("common.deleteCancelled"));
    }
  );
}

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
