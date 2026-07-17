<template>
  <div class="login-page">
    <div class="login-toolbar">
      <ThemeSwitch />
      <LangSelect size="text-18px" />
    </div>

    <div class="login-layout">
      <div class="login-brand">
        <div class="login-brand__header">
          <el-image :src="logo" class="login-brand__logo" />
          <div class="login-brand__identity">
            <span class="login-brand__name">{{ appConfig.title }}</span>
            <span class="login-brand__version">v{{ appConfig.version }}</span>
          </div>
        </div>

        <div class="login-brand__hero">
          <div class="login-brand__main">
            <el-tag class="login-brand__tag" type="primary" effect="plain" round>
              <span class="login-brand__tag-dot" />
              {{ t("login.brand.enterpriseReady") }}
            </el-tag>
            <h1 class="login-brand__title">{{ t("login.brand.title") }}</h1>
            <p class="login-brand__desc">
              {{ t("login.brand.description") }}
            </p>
          </div>
          <div class="login-brand__features">
            <div class="login-brand__feature">
              <span class="login-brand__feature-mark">
                <span class="login-brand__feature-icon i-svg:security" />
              </span>
              <span class="login-brand__feature-text">{{ t("login.brand.secure") }}</span>
            </div>
            <div class="login-brand__feature">
              <span class="login-brand__feature-mark">
                <el-icon class="login-brand__feature-icon"><Clock /></el-icon>
              </span>
              <span class="login-brand__feature-text">{{ t("login.brand.efficient") }}</span>
            </div>
            <div class="login-brand__feature">
              <span class="login-brand__feature-mark">
                <span class="login-brand__feature-icon i-svg:flexible" />
              </span>
              <span class="login-brand__feature-text">{{ t("login.brand.flexible") }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="login-card">
        <div class="login-card__inner">
          <transition name="fade-slide" mode="out-in">
            <div v-if="component === 'login'" key="login" class="login-card__form">
              <h2 class="login-card__title">{{ t("login.welcomeBack") }}</h2>
              <p class="login-card__desc">{{ t("login.authPrompt") }}</p>

              <el-form
                ref="loginFormRef"
                :model="loginFormData"
                :rules="loginRules"
                size="large"
                :validate-on-rule-change="false"
              >
                <el-form-item prop="username">
                  <el-input
                    v-model.trim="loginFormData.username"
                    :placeholder="t('login.username')"
                    :prefix-icon="UserIcon"
                  />
                </el-form-item>

                <el-tooltip :visible="isCapsLock" :content="t('login.capsLockOn')" placement="right">
                  <el-form-item prop="password">
                    <el-input
                      v-model.trim="loginFormData.password"
                      :placeholder="t('login.password')"
                      type="password"
                      show-password
                      :prefix-icon="LockIcon"
                      @keyup="checkCapsLock"
                      @keyup.enter="handleLoginSubmit"
                    />
                  </el-form-item>
                </el-tooltip>

                <el-form-item prop="captchaCode">
                  <div class="captcha-row">
                    <el-input
                      v-model.trim="loginFormData.captchaCode"
                      :placeholder="t('login.captchaCode')"
                      class="captcha-row__input"
                      @keyup.enter="handleLoginSubmit"
                    >
                      <template #prefix>
                        <span class="input-prefix-icon i-svg:security" />
                      </template>
                    </el-input>
                    <div class="captcha-img" @click="getCaptcha">
                      <el-icon v-if="codeLoading" class="is-loading" :size="16">
                        <Loading />
                      </el-icon>
                      <div v-else-if="captchaSvg" class="captcha-svg" v-html="captchaSvg" />
                      <el-icon v-else :size="16"><Refresh /></el-icon>
                    </div>
                  </div>
                </el-form-item>

                <div class="login-options">
                  <el-checkbox v-model="loginFormData.rememberMe">{{ t("login.rememberMe") }}</el-checkbox>
                  <a class="login-options__link" @click="showForm('resetPwd')">{{ t("login.forgetPassword") }}</a>
                </div>

                <el-button
                  :loading="loading"
                  type="primary"
                  size="large"
                  class="login-btn"
                  @click="handleLoginSubmit"
                >
                  {{ t("login.login") }}
                </el-button>
              </el-form>

              <div class="login-alt">
                <div class="login-alt__divider">{{ t("login.otherLoginMethods") }}</div>
                <div class="login-alt__buttons">
                  <button
                    class="login-alt__btn"
                    :disabled="oauthLoading === 'google'"
                    @click="handleOAuthLogin('google')"
                  >
                    <span class="login-alt__icon i-svg:google" />
                    Google
                  </button>
                  <button
                    class="login-alt__btn"
                    :disabled="oauthLoading === 'github'"
                    @click="handleOAuthLogin('github')"
                  >
                    <span class="login-alt__icon i-svg:github" />
                    GitHub
                  </button>
                  <button
                    class="login-alt__btn"
                    :disabled="oauthLoading === 'gitee'"
                    @click="handleOAuthLogin('gitee')"
                  >
                    <span class="login-alt__icon i-svg:gitee" />
                    Gitee
                  </button>
                </div>
              </div>
            </div>

            <ResetPwd
              v-else
              key="resetPwd"
              class="login-card__form"
              @update:model-value="component = $event"
            />
          </transition>
        </div>

        <div class="login-footer">Copyright © 2026 nest-prisma-admin</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "LoginPage", inheritAttrs: false });

import { Clock, Lock, Loading, Refresh, User } from "@element-plus/icons-vue";
import type { FormInstance } from "element-plus";
import AuthAPI from "@/api/auth";
import type { LoginRequest, OAuthProvider } from "@/api/auth";
import router from "@/router";
import { useUserStore } from "@/stores";
import { useI18n } from "vue-i18n";
import { AuthStorage } from "@/utils/auth";
import { rsaEncrypt } from "@/utils/rsa";
import { appConfig } from "@/settings";
import ThemeSwitch from "@/components/ThemeSwitch/index.vue";
import ResetPwd from "./components/ResetPwd.vue";
import logo from "@/assets/images/logo.png";

const { t } = useI18n();
const userStore = useUserStore();
const route = useRoute();
const component = ref<"login" | "resetPwd">("login");

const loginFormRef = ref<FormInstance>();
const loading = ref(false);
const oauthLoading = ref<OAuthProvider | null>(null);
const isCapsLock = ref(false);
const captchaSvg = ref<string>();
const codeLoading = ref(false);
// RSA 公钥，获取成功则启用加密，获取失败则降级为明文
const rsaPublicKey = ref<string>();

const UserIcon = markRaw(User);
const LockIcon = markRaw(Lock);

const loginFormData = ref<LoginRequest>({
  username: "demo",
  password: "123456",
  captchaKey: "",
  captchaCode: "",
  rememberMe: AuthStorage.getRememberMe(),
});

const loginRules = computed(() => ({
  username: [{ required: true, trigger: "blur", message: t("login.message.username.required") }],
  password: [
    { required: true, trigger: "blur", message: t("login.message.password.required") },
    { min: 6, message: t("login.message.password.min"), trigger: "blur" },
  ],
  captchaCode: [{ required: true, trigger: "blur", message: t("login.message.captchaCode.required") }],
}));

function getCaptcha() {
  codeLoading.value = true;
  AuthAPI.getCaptcha()
    .then((d) => {
      loginFormData.value.captchaKey = d.key;
      captchaSvg.value = d.svg;
    })
    .finally(() => (codeLoading.value = false));
}

/** 尝试获取 RSA 公钥，失败则降级为明文密码模式 */
async function tryFetchPublicKey() {
  try {
    const { publicKey } = await AuthAPI.getPublicKey();
    rsaPublicKey.value = publicKey;
  } catch {
    // RSA 未启用或获取失败，降级为明文
    rsaPublicKey.value = undefined;
  }
}

async function handleLoginSubmit() {
  const valid = await loginFormRef.value?.validate().then(
    () => true,
    () => false
  );
  if (!valid) return;

  loading.value = true;
  try {
    const formData: LoginRequest = { ...loginFormData.value };

    // RSA 启用时加密密码，密文直接放入 password 字段
    if (rsaPublicKey.value && formData.password) {
      formData.password = rsaEncrypt(rsaPublicKey.value, formData.password);
    }

    await userStore.login(formData).then(
      async () => {
        const redirectPath = (route.query.redirect as string) || "/";
        await router.push(decodeURIComponent(redirectPath));
      },
      () => {
        getCaptcha();
        // 公钥可能已轮换，重新获取
        tryFetchPublicKey();
      }
    );
  } finally {
    loading.value = false;
  }
}

function checkCapsLock(event: KeyboardEvent) {
  if (event instanceof KeyboardEvent) {
    isCapsLock.value = event.getModifierState("CapsLock");
  }
}

function showForm(type: "resetPwd") {
  component.value = type;
}

async function handleOAuthLogin(provider: OAuthProvider) {
  oauthLoading.value = provider;
  try {
    const { url } = await AuthAPI.getOAuthAuthUrl(provider);
    window.location.href = url;
  } catch {
    oauthLoading.value = null;
  }
}

onMounted(() => {
  getCaptcha();
  tryFetchPublicKey();
});
</script>

<style lang="scss" scoped>
$primary: #5d87ff;
$bg: #f8fafc;
$text-primary: #273248;
$text-secondary: #667085;
$text-muted: #98a2b3;
$input-h: 44px;

.login-page {
  position: relative;
  display: flex;
  min-height: 100vh;
  overflow: auto;
  background: $bg;
}

.login-toolbar {
  position: fixed;
  top: 28px;
  right: 32px;
  z-index: 10;
  display: flex;
  gap: 12px;
  align-items: center;

  :deep(*) {
    cursor: pointer;
  }
}

.login-layout {
  display: flex;
  flex: 1;
  min-height: 100%;
}

.login-brand {
  position: relative;
  display: flex;
  flex: 0 0 65%;
  flex-direction: column;
  min-height: 100vh;
  padding: 28px 64px 48px;
  overflow: hidden;
  background: url("@/assets/images/login/bg.svg") center / cover no-repeat;
  animation: login-pane-in 0.36s ease-out both;

  &__header,
  &__hero {
    position: relative;
    z-index: 1;
  }

  &__header {
    display: flex;
    gap: 14px;
    align-items: center;
  }

  &__logo {
    width: 42px;
    height: 42px;
  }

  &__identity {
    display: inline-flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  &__name {
    font-size: 24px;
    font-weight: 600;
    line-height: 1;
    color: $text-primary;
  }

  &__version {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 8px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    color: rgba($primary, 0.88);
    background: rgba($primary, 0.07);
    border: 1px solid rgba($primary, 0.13);
    border-radius: 999px;
  }

  &__hero {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    width: min(720px, 100%);
    padding: 20px 0 88px;
  }

  &__main {
    width: 100%;
  }

  &__tag {
    gap: 8px;
    height: 28px;
    padding: 0 13px 0 11px;
    margin-bottom: 18px;
    font-weight: 700;
    color: $primary;
    background: rgba($primary, 0.035);
    border-color: rgba($primary, 0.14);

    :deep(.el-tag__content) {
      display: inline-flex;
      gap: 8px;
      align-items: center;
    }
  }

  &__tag-dot {
    display: inline-block;
    flex-shrink: 0;
    width: 7px;
    height: 7px;
    background: $primary;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba($primary, 0.12);
  }

  &__title {
    margin: 0 0 18px;
    font-size: 46px;
    font-weight: 800;
    line-height: 1.18;
    color: #222b3a;
    letter-spacing: 0;
  }

  &__desc {
    max-width: 560px;
    margin: 0;
    font-size: 16px;
    line-height: 1.75;
    color: $text-secondary;
  }

  &__features {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    max-width: 100%;
    margin-top: 28px;
  }

  &__feature {
    position: relative;
    display: inline-flex;
    gap: 8px;
    align-items: center;
    height: 28px;
    padding: 0 13px;
    font-size: 13px;
    font-weight: 600;
    color: $text-primary;
    background: transparent;

    &:first-child {
      padding-left: 0;
    }

    &:not(:last-child)::after {
      position: absolute;
      top: 7px;
      right: 0;
      width: 1px;
      height: 14px;
      content: "";
      background: rgba(39 50 72 / 12%);
    }
  }

  &__feature-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: $primary;
    background: rgba($primary, 0.08);
    border: 1px solid rgba($primary, 0.1);
    border-radius: 6px;
  }

  &__feature-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 13px;
    height: 13px;
    color: $primary;
  }

  &__feature-text {
    line-height: 1;
    white-space: nowrap;
  }
}

.login-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 0 0 35%;
  flex-direction: column;
  align-items: center;
  padding: 0 0 32px;
  background: #fff;
  animation: login-pane-in 0.36s ease-out 0.04s both;

  &__inner {
    box-sizing: border-box;
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    max-width: 430px;
    padding: 0 20px;
  }

  &__form {
    width: 100%;
  }

  &__title {
    margin: 0 0 4px;
    font-size: 34px;
    font-weight: 750;
    line-height: 1.1;
    color: $text-primary;
    letter-spacing: 0;
  }

  &__desc {
    margin: 8px 0 24px;
    font-size: 14px;
    color: $text-muted;
  }
}

::deep(.el-form-item) {
  margin-bottom: 14px;
}

::deep(.el-input__wrapper) {
  height: $input-h;
}

.input-prefix-icon {
  display: inline-flex;
  width: 14px;
  height: 14px;
  color: var(--el-text-color-placeholder);
}

.captcha-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.captcha-row__input {
  flex: 1;
  min-width: 0;
}

.captcha-img {
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 108px;
  height: $input-h;
  overflow: hidden;
  cursor: pointer;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .captcha-svg {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    :deep(svg) {
      width: 100%;
      height: 100%;
    }
  }
}

.login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
  font-size: 14px;
  color: $text-secondary;

  &__link {
    font-weight: 500;
    color: $primary;
    cursor: pointer;
    transition: opacity 0.15s;

    &:hover {
      opacity: 0.8;
    }
  }
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  box-shadow: 0 12px 24px rgba($primary, 0.18);

  &:hover {
    box-shadow: 0 14px 28px rgba($primary, 0.22);
  }

  &:focus,
  &:focus-visible {
    outline: none;
  }
}

.login-alt {
  margin-top: 28px;

  &__divider {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 14px;
    font-size: 13px;
    color: $text-muted;

    &::before,
    &::after {
      flex: 1;
      height: 1px;
      content: "";
      background: var(--el-border-color-lighter);
    }
  }

  &__buttons {
    display: flex;
    gap: 12px;
  }

  &__btn {
    display: flex;
    flex: 1;
    gap: 8px;
    align-items: center;
    justify-content: center;
    height: 44px;
    padding: 0;
    font-size: 13px;
    color: $text-secondary;
    cursor: pointer;
    background: transparent;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    transition:
      color 0.2s,
      background 0.2s,
      border-color 0.2s;

    &:hover {
      color: $primary;
      background: rgba($primary, 0.04);
      border-color: rgba($primary, 0.28);
    }
  }

  &__icon {
    width: 16px;
    height: 16px;
  }
}

.login-footer {
  flex-shrink: 0;
  font-size: 12px;
  color: $text-muted;
}

.dark .login-page {
  background: #0b1020;
}

.dark .login-brand {
  background-image: url("@/assets/images/login/bg-dark.svg");

  &__name {
    color: rgb(255 255 255 / 86%);
  }

  &__version {
    color: rgb(167 190 255 / 92%);
    background: rgba($primary, 0.12);
    border-color: rgba($primary, 0.2);
  }

  &__tag {
    color: rgba($primary, 0.95);
    background: rgba($primary, 0.08);
    border-color: rgba($primary, 0.18);
  }

  &__title {
    color: rgb(255 255 255 / 90%);
  }

  &__desc {
    color: rgb(226 232 240 / 62%);
  }

  &__feature {
    color: rgb(255 255 255 / 76%);

    &:not(:last-child)::after {
      background: rgba(255 255 255 / 12%);
    }
  }

  &__feature-mark {
    background: rgba($primary, 0.15);
    border-color: rgba($primary, 0.18);
  }
}

.dark .login-card {
  background: #0b1020;

  &__title {
    color: rgb(255 255 255 / 85%);
  }

  &__desc {
    color: rgb(255 255 255 / 30%);
  }
}

.dark .login-footer {
  color: rgb(255 255 255 / 15%);
}

.dark .login-alt__divider {
  color: rgb(255 255 255 / 20%);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@keyframes login-pane-in {
  from {
    opacity: 0;
    filter: blur(4px);
  }

  to {
    opacity: 1;
    filter: blur(0);
  }
}

@media (max-width: 1024px) {
  .login-layout {
    flex-direction: column;
  }

  .login-toolbar {
    position: absolute;
    top: 37px;
  }

  .login-brand {
    flex: none;
    height: auto;
    min-height: auto;
    padding: 28px 40px 0;
    background: #fff;

    &__hero {
      display: none;
    }
  }

  .dark .login-brand {
    background: #0b1020;
  }

  .login-card {
    flex: 1;
    justify-content: flex-start;
    padding: 96px 48px 0;
  }
}

@media (max-width: 640px) {
  .login-toolbar {
    top: 33px;
    right: 20px;
  }

  .login-brand {
    padding: 24px 0 0 24px;
  }

  .login-card {
    padding: 72px 24px 0;

    &__inner {
      width: 100%;
      padding: 0;
    }
  }
}
</style>
