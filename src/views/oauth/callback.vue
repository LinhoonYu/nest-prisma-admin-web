<template>
  <div class="oauth-callback">
    <el-icon
      v-if="!errorMessage"
      class="oauth-callback__spinner is-loading"
      :size="32"
    >
      <Loading />
    </el-icon>
    <el-icon v-else class="oauth-callback__error" :size="32">
      <CircleClose />
    </el-icon>
    <p class="oauth-callback__text">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "OAuthCallback", inheritAttrs: false });

import { Loading, CircleClose } from "@element-plus/icons-vue";
import AuthAPI from "@/api/auth";
import { AuthStorage } from "@/utils/auth";
import router from "@/router";

const route = useRoute();
const errorMessage = ref("");
const message = ref("正在完成登录...");

onMounted(async () => {
  const code = route.query.code;
  const error = route.query.error;

  if (typeof error === "string" && error) {
    errorMessage.value = error;
    message.value = error;
    await redirectToLogin();
    return;
  }

  if (typeof code !== "string" || !code) {
    message.value = "授权码缺失，即将返回登录页";
    await redirectToLogin();
    return;
  }

  try {
    const { accessToken, refreshToken } = await AuthAPI.exchangeOAuthCode({ code });
    AuthStorage.setTokens(accessToken, refreshToken, false);
    await router.push("/");
  } catch {
    message.value = "登录失败，即将返回登录页";
    await redirectToLogin();
  }
});

async function redirectToLogin() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await router.push("/login");
}
</script>

<style lang="scss" scoped>
.oauth-callback {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
  min-height: 100vh;

  &__spinner {
    color: var(--el-color-primary);
  }

  &__error {
    color: var(--el-color-danger);
  }

  &__text {
    margin: 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}
</style>
