<template>
  <div class="wh-full mx-auto flex-center flex-col lg:flex-row">
    <img class="min-w-[23.4375rem] sm:w-150" src="@/assets/images/error/404.svg" alt="404" />
    <div class="w-75">
      <div class="oops mb-5 text-[2rem] font-bold">{{ t("error.404.oops") }}</div>
      <div class="info text-gray mb-7 text-[0.8125rem]">
        {{ t("error.404.pageInaccessible") }}
      </div>
      <div class="headline mb-2.5 text-xl font-bold text-[#222]">{{ t("error.404.notFound") }}</div>
      <div class="info text-gray mb-7 text-[0.8125rem]">
        {{ t("error.404.notFoundDesc") }}
      </div>
      <el-button round type="primary" class="btn h-9 w-28 mb-10" @click="back">{{ t("error.404.backHome") }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineOptions({ name: "Page404" });
const { t } = useI18n();
const router = useRouter();
const back = () => router.push("/");
</script>

<style lang="scss" scoped>
@mixin slide-up-animation($delay: 0s) {
  opacity: 0;
  animation-name: slideUp;
  animation-duration: 0.5s;
  animation-delay: $delay;
  animation-fill-mode: forwards;
}

@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(60px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.oops {
  color: var(--el-color-primary);
  @include slide-up-animation(0s);
}

.headline {
  @include slide-up-animation(0.1s);
}

.info {
  @include slide-up-animation(0.2s);
}

.btn {
  @include slide-up-animation(0.3s);
}
</style>
