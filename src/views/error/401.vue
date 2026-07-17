<template>
  <div class="p-5 pb-0 sm:p-10 lg:p-20 w-full">
    <el-button icon="arrow-left" @click="router.back()">{{ t("error.401.back") }}</el-button>
    <el-row>
      <el-col :xs="24" :span="12">
        <h1 class="text-6xl font-bold text-[#484848]">Oops!</h1>
        <h2>{{ t("error.401.noPermission") }}</h2>
        <h6>{{ t("error.401.contactAdmin") }}</h6>
        <div class="flex flex-col items-start gap-1.5 text-sm">
          <span>{{ t("error.401.orYouCan") }}</span>
          <el-link type="primary" @click="router.push('/dashboard')">{{ t("error.401.backHome") }}</el-link>
        </div>
      </el-col>
      <el-col :xs="24" :span="12">
        <img src="@/assets/images/error/401.svg" class="w-full" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineOptions({ name: "Page401" });
const { t } = useI18n();
const router = useRouter();
</script>
