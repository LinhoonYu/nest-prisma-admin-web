<template>
  <el-card shadow="never" class="dept-card">
    <el-input v-model="deptName" class="dept-card__search" :placeholder="t('user.searchDept')" clearable>
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>

    <el-tree
      ref="deptTreeRef"
      class="dept-card__tree"
      :data="deptList"
      :props="{ children: 'children', label: 'label', disabled: '' }"
      :expand-on-click-node="false"
      :filter-node-method="handleFilter"
      default-expand-all
      @node-click="handleNodeClick"
    />
  </el-card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import DeptAPI from "@/api/system/dept";
import type { DeptItem } from "@/api/system/dept";
import type { OptionItem } from "@/api/common";
import type { TreeNodeData } from "element-plus/es/components/tree";

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: undefined,
  },
});

// 部门树数据（OptionItem 格式）
const deptList = ref<OptionItem[]>();
const deptTreeRef = ref();
const deptName = ref("");

const emits = defineEmits(["node-click"]);

const deptId = useVModel(props, "modelValue", emits);

watchEffect(
  () => {
    deptTreeRef.value?.filter(deptName.value);
  },
  {
    flush: "post",
  }
);

/**
 * 将后端 DeptItem 树转换为前端 OptionItem 树
 */
function transformDeptTree(items: DeptItem[]): OptionItem[] {
  return items.map((item) => ({
    value: item.id,
    label: item.name,
    children: item.children?.length
      ? transformDeptTree(item.children)
      : undefined,
  }));
}

/**
 * 部门筛选
 */
function handleFilter(value: string, data: TreeNodeData): boolean {
  if (!value) {
    return true;
  }
  return String(data.label ?? "").includes(value);
}

/**
 * 部门树节点点击事件
 */
function handleNodeClick(data: OptionItem): void {
  deptId.value = data.value;
  emits("node-click");
}

onBeforeMount(() => {
  DeptAPI.getList().then((data) => {
    deptList.value = transformDeptTree(data);
  });
});
</script>

<style lang="scss" scoped>
.dept-card {
  height: 100%;
  background: transparent;
  border: 0;
  border-radius: inherit;
  box-shadow: none;

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    padding: 12px;
  }
}

.dept-card__search {
  margin-bottom: 10px;
}

.dept-card__tree {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;

  :deep(.el-tree-node__content) {
    height: 32px;
  }
}
</style>
