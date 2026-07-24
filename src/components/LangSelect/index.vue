<template>
  <el-dropdown trigger="click" @command="handleLanguageChange">
    <div class="i-svg:language" :class="size" />
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in langOptions"
          :key="item.value"
          :disabled="appStore.language === item.value"
          :command="item.value"
        >
          {{ item.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useAppStore } from "@/stores/app";
import { usePermissionStoreHook } from "@/stores/permission";
import { supportedLanguages } from "@/enums/settings";

defineProps({
  size: {
    type: String,
    required: false,
  },
});

const langOptions = supportedLanguages;

const appStore = useAppStore();
const { locale, t } = useI18n();

/**
 * 处理语言切换
 *
 * @param lang  语言（zh-cn、en�?
 */
function handleLanguageChange(lang: string) {
  locale.value = lang;
  appStore.changeLanguage(lang);

  // 重新拉取菜单树，后端会返回新语言的 title
  usePermissionStoreHook().reloadDynamicRoutesOnce();

  ElMessage.success(t("langSelect.message.success"));
}
</script>
