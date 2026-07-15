<template>
  <div class="oauth-callback">
    <!-- 加载中 -->
    <template v-if="state === 'loading'">
      <el-icon class="oauth-callback__spinner is-loading" :size="32">
        <Loading />
      </el-icon>
      <p class="oauth-callback__text">{{ message }}</p>
    </template>

    <!-- 错误 -->
    <template v-else-if="state === 'error'">
      <el-icon class="oauth-callback__error" :size="32">
        <CircleClose />
      </el-icon>
      <p class="oauth-callback__text">{{ message }}</p>
    </template>

    <!-- 首次登录：选择创建或关联 -->
    <template v-else-if="state === 'pending'">
      <div class="oauth-pending">
        <h2 class="oauth-pending__title">首次使用 {{ providerLabel }} 登录</h2>
        <p class="oauth-pending__desc">请选择创建新账号或关联已有账号</p>

        <div class="oauth-pending__options">
          <button
            class="oauth-pending__option"
            :class="{ 'is-active': choice === 'register' }"
            @click="choice = 'register'"
          >
            <el-icon :size="20"><User /></el-icon>
            <span>创建新账号</span>
          </button>
          <button
            class="oauth-pending__option"
            :class="{ 'is-active': choice === 'link' }"
            @click="choice = 'link'"
          >
            <el-icon :size="20"><Link /></el-icon>
            <span>关联已有账号</span>
          </button>
        </div>

        <!-- 关联已有账号表单 -->
        <el-form
          v-if="choice === 'link'"
          ref="linkFormRef"
          :model="linkForm"
          :rules="linkRules"
          class="oauth-pending__form"
          @submit.prevent
        >
          <el-form-item prop="username">
            <el-input
              v-model="linkForm.username"
              placeholder="用户名"
              :prefix-icon="User"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="linkForm.password"
              type="password"
              placeholder="密码"
              show-password
              :prefix-icon="Lock"
              @keyup.enter="handleLinkExisting"
            />
          </el-form-item>
        </el-form>

        <el-button
          type="primary"
          size="large"
          class="oauth-pending__submit"
          :loading="submitLoading"
          :disabled="choice === 'link' && !linkForm.username"
          @click="handleSubmit"
        >
          {{ choice === 'register' ? '创建账号并登录' : '验证并关联' }}
        </el-button>

        <a class="oauth-pending__cancel" @click="goLogin">返回登录页</a>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "OAuthCallback", inheritAttrs: false });

import { Loading, CircleClose, User, Link, Lock } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import AuthAPI from "@/api/auth";
import type { OAuthProvider } from "@/api/auth";
import { AuthStorage } from "@/utils/auth";
import { rsaEncrypt } from "@/utils/rsa";
import router from "@/router";

const route = useRoute();

type CallbackState = "loading" | "error" | "pending";

const state = ref<CallbackState>("loading");
const message = ref("正在完成登录...");
const submitLoading = ref(false);
const pendingCode = ref("");
const provider = ref<OAuthProvider>("github");
const choice = ref<"register" | "link">("register");

const linkFormRef = ref<FormInstance>();
const linkForm = reactive({ username: "", password: "" });
const rsaPublicKey = ref<string>();

const linkRules: FormRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

const providerLabels: Record<OAuthProvider, string> = {
  google: "Google",
  github: "GitHub",
  gitee: "Gitee",
};

const providerLabel = computed(() => providerLabels[provider.value]);

onMounted(async () => {
  const code = route.query.code;
  const pending = route.query.pending;
  const stateParam = route.query.state;
  const mode = route.query.mode;
  const providerParam = route.query.provider;
  const error = route.query.error;

  if (typeof error === "string" && error) {
    state.value = "error";
    message.value = error;
    return;
  }

  // 绑定模式
  if (mode === "bind" && typeof code === "string" && code) {
    const stateVal = typeof stateParam === "string" ? stateParam : "";
    const prov =
      typeof providerParam === "string"
        ? (providerParam as OAuthProvider)
        : "github";
    await handleBind(code, stateVal, prov);
    return;
  }

  // 已绑定账号：交换码登录
  if (typeof code === "string" && code) {
    await handleExchange(code);
    return;
  }

  // 首次登录：待处理码
  if (typeof pending === "string" && pending) {
    pendingCode.value = pending;
    if (typeof providerParam === "string") {
      provider.value = providerParam as OAuthProvider;
    }
    state.value = "pending";
    await tryFetchPublicKey();
    return;
  }

  state.value = "error";
  message.value = "参数缺失";
});

async function handleExchange(code: string) {
  try {
    const { accessToken, refreshToken } = await AuthAPI.exchangeOAuthCode({ code });
    AuthStorage.setTokens(accessToken, refreshToken, false);
    await router.push("/");
  } catch {
    state.value = "error";
    message.value = "登录失败，即将返回登录页";
    await goLoginDelayed();
  }
}

async function handleBind(code: string, stateVal: string, prov: OAuthProvider) {
  message.value = "正在绑定第三方账号...";
  try {
    await AuthAPI.bindOAuthIdentity({ provider: prov, code, state: stateVal });
    ElMessage.success("绑定成功");
    await router.push("/profile");
  } catch {
    state.value = "error";
    message.value = "绑定失败，即将返回个人中心";
    await new Promise((r) => setTimeout(r, 2000));
    await router.push("/profile");
  }
}

async function tryFetchPublicKey() {
  try {
    const { publicKey } = await AuthAPI.getPublicKey();
    rsaPublicKey.value = publicKey;
  } catch {
    rsaPublicKey.value = undefined;
  }
}

async function handleSubmit() {
  if (choice.value === "register") {
    await handleRegister();
  } else {
    await handleLinkExisting();
  }
}

async function handleRegister() {
  submitLoading.value = true;
  try {
    const { accessToken, refreshToken } = await AuthAPI.registerOAuthAccount({
      pendingCode: pendingCode.value,
    });
    AuthStorage.setTokens(accessToken, refreshToken, false);
    ElMessage.success("账号创建成功");
    await router.push("/");
  } catch {
    state.value = "error";
    message.value = "创建账号失败，请重新登录";
    await goLoginDelayed();
  } finally {
    submitLoading.value = false;
  }
}

async function handleLinkExisting() {
  const valid = await linkFormRef.value?.validate().then(() => true, () => false);
  if (!valid) return;

  submitLoading.value = true;
  try {
    let password = linkForm.password;
    if (rsaPublicKey.value) {
      password = rsaEncrypt(rsaPublicKey.value, password);
    }

    const { accessToken, refreshToken } = await AuthAPI.linkExistingOAuth({
      pendingCode: pendingCode.value,
      username: linkForm.username,
      password,
    });
    AuthStorage.setTokens(accessToken, refreshToken, false);
    ElMessage.success("关联成功");
    await router.push("/");
  } catch {
    // 拦截器已提示，表单留在原处让用户重试
  } finally {
    submitLoading.value = false;
  }
}

async function goLoginDelayed() {
  await new Promise((r) => setTimeout(r, 2000));
  await router.push("/login");
}

function goLogin() {
  router.push("/login");
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

.oauth-pending {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 380px;
  max-width: 90vw;
  padding: 32px;
  background: var(--content-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  box-shadow: var(--card-shadow);
}

.oauth-pending__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  color: var(--el-text-color-primary);
}

.oauth-pending__desc {
  margin: 0;
  font-size: 13px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.oauth-pending__options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.oauth-pending__option {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: var(--el-fill-color-lighter);
  border: 2px solid transparent;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: var(--el-fill-color);
  }

  &.is-active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
  }
}

.oauth-pending__form {
  margin: 0;
}

.oauth-pending__submit {
  width: 100%;
}

.oauth-pending__cancel {
  font-size: 12px;
  text-align: center;
  color: var(--el-text-color-placeholder);
  cursor: pointer;

  &:hover {
    color: var(--el-text-color-secondary);
  }
}
</style>
