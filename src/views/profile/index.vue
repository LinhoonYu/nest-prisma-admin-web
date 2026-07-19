<template>
  <div class="profile-page">
    <section class="profile-hero">
      <div class="profile-hero__body">
        <div class="profile-avatar">
          <UserAvatar
            :name="displayName"
            :avatar-file-id="userProfile.avatarFileId"
            :avatar-url="userProfile.avatarUrl"
            :size="72"
          />
          <el-button
            type="info"
            class="profile-avatar__action"
            circle
            :icon="Camera"
            size="small"
            :title="t('profile.changeAvatar')"
            @click="triggerFileUpload"
          />
          <input
            ref="fileInput"
            class="profile-avatar__input"
            type="file"
            accept="image/*"
            @change="handleFileChange"
          />
        </div>

        <div class="profile-hero__info">
          <div class="profile-hero__title">
            <h2 class="profile-hero__name">{{ displayName }}</h2>
            <el-tag type="primary" effect="light" round>{{ primaryRole }}</el-tag>
          </div>
          <p class="profile-hero__desc">
            {{ userProfile.username || "-" }} / {{ userProfile.deptName || t('profile.noDept') }}
          </p>
          <div class="profile-hero__meta">
            <span class="profile-hero__meta-item">
              <el-icon><Calendar /></el-icon>
              {{ t('profile.joinedAt') }} {{ formatDateTime(userProfile.createTime) }}
            </span>
          </div>
        </div>
      </div>

      <div class="profile-hero__actions">
        <el-button :icon="Edit" @click="handleOpenDialog(DialogType.ACCOUNT)">{{ t('profile.editProfile') }}</el-button>
        <el-button type="primary" :icon="Lock" @click="handleOpenDialog(DialogType.PASSWORD)">
          {{ t('profile.changePassword') }}
        </el-button>
      </div>
    </section>

    <div class="profile-page__layout">
      <aside class="profile-page__side">
        <section class="profile-card">
          <header class="profile-card__header">
            <h3 class="profile-card__title">{{ t('profile.personalInfo') }}</h3>
            <el-tag size="small" effect="plain">{{ genderText }}</el-tag>
          </header>

          <dl class="profile-info">
            <div v-for="item in profileInfoItems" :key="item.label" class="profile-info__item">
              <dt class="profile-info__label">
                <el-icon><component :is="item.icon" /></el-icon>
                {{ item.label }}
              </dt>
              <dd class="profile-info__value" :class="{ 'is-muted': item.muted }">
                {{ item.value }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="profile-card">
          <header class="profile-card__header">
            <h3 class="profile-card__title">{{ t('profile.accountOverview') }}</h3>
          </header>

          <div class="profile-stats">
            <div v-for="item in profileStats" :key="item.label" class="profile-stats__item">
              <span :class="['profile-icon', 'profile-icon--' + item.tone]">
                <el-icon><component :is="item.icon" /></el-icon>
              </span>
              <div class="profile-stats__body">
                <span class="profile-stats__label">{{ item.label }}</span>
                <strong class="profile-stats__value">
                  {{ item.value }}
                  <em>{{ item.suffix }}</em>
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section class="profile-card">
          <header class="profile-card__header">
            <h3 class="profile-card__title">{{ t('profile.rolePermissions') }}</h3>
            <span class="profile-card__extra">{{ t('profile.permissions', { n: permissionCount }) }}</span>
          </header>

          <div class="profile-tags">
            <el-tag v-for="role in roleList" :key="role" class="m-0" size="small" effect="light">
              {{ role }}
            </el-tag>
            <span v-if="!roleList.length" class="profile-empty">{{ t('profile.noRoles') }}</span>
          </div>
        </section>
      </aside>

      <main class="profile-page__main">
        <section class="profile-card">
          <header class="profile-card__header">
            <div>
              <h3 class="profile-card__title">{{ t('profile.securitySettings') }}</h3>
              <p class="profile-card__desc">{{ t('profile.securityDesc') }}</p>
            </div>
            <el-tag :type="securityLevel.type" effect="light">
              {{ t('profile.securityLevel') }} {{ securityLevel.label }}
            </el-tag>
          </header>

          <div class="profile-security">
            <div v-for="item in securityItems" :key="item.key" class="profile-security__item">
              <span :class="['profile-icon', 'profile-icon--large', 'profile-icon--' + item.tone]">
                <el-icon><component :is="item.icon" /></el-icon>
              </span>
              <div class="profile-security__body">
                <div class="profile-security__title">
                  <span>{{ item.title }}</span>
                  <el-tag size="small" :type="item.statusType" effect="plain">
                    {{ item.status }}
                  </el-tag>
                </div>
                <p class="profile-security__desc">{{ item.description }}</p>
              </div>
              <div class="profile-security__actions">
                <el-button
                  v-for="action in item.actions"
                  :key="action.label"
                  :type="action.type"
                  link
                  @click="action.onClick"
                >
                  {{ action.label }}
                </el-button>
              </div>
            </div>
          </div>
        </section>

        <section class="profile-card">
          <header class="profile-card__header">
            <div>
              <h3 class="profile-card__title">{{ t('profile.thirdPartyAccounts') }}</h3>
              <p class="profile-card__desc">{{ t('profile.thirdPartyDesc') }}</p>
            </div>
          </header>

          <div class="profile-security">
            <div v-for="item in oauthProviderList" :key="item.code" class="profile-security__item">
              <span class="profile-icon profile-icon--large">
                <span :class="item.icon" class="profile-oauth__icon" />
              </span>
              <div class="profile-security__body">
                <div class="profile-security__title">
                  <span>{{ item.label }}</span>
                  <el-tag size="small" :type="item.bound ? 'success' : 'info'" effect="plain">
                    {{ item.bound ? t('profile.bound') : t('profile.unbound') }}
                  </el-tag>
                </div>
                <p class="profile-security__desc">
                  {{ item.bound ? (item.identity?.providerUsername || t('profile.bound')) : t('profile.clickToBind') }}
                </p>
              </div>
              <div class="profile-security__actions">
                <el-button
                  v-if="item.bound"
                  type="danger"
                  link
                  :loading="oauthUnbindLoading === item.identity!.id"
                  @click="handleUnbindIdentity(item.identity!.id)"
                >
                  {{ t('profile.unbind') }}
                </el-button>
                <el-button
                  v-else
                  type="primary"
                  link
                  :loading="oauthBindLoading === item.code"
                  @click="handleBindProvider(item.code)"
                >
                  {{ t('profile.bind') }}
                </el-button>
              </div>
            </div>
          </div>
        </section>

        <div class="profile-page__grid">
          <section class="profile-card">
            <header class="profile-card__header">
              <h3 class="profile-card__title">{{ t('profile.accountStatus') }}</h3>
              <span class="profile-card__extra">{{ t('profile.completion') }} {{ profileCompletion }}%</span>
            </header>

            <div class="profile-status">
              <div
                v-for="item in accountStatusItems"
                :key="item.label"
                class="profile-status__item"
                :class="{ 'is-warning': !item.done }"
              >
                <el-icon class="profile-status__icon">
                  <CircleCheck v-if="item.done" />
                  <Warning v-else />
                </el-icon>
                <div class="profile-status__body">
                  <strong class="profile-status__title">{{ item.label }}</strong>
                  <span class="profile-status__desc">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>

    <el-dialog v-model="dialogState.visible" :title="dialogState.title" width="520px">
      <el-form
        v-if="dialogState.type === DialogType.ACCOUNT"
        ref="userProfileFormRef"
        :model="userProfileForm"
        :rules="userProfileRules"
        label-width="88px"
        class="pr-10px"
      >
        <el-form-item :label="t('user.nickname')" prop="nickname">
          <el-input v-model="userProfileForm.nickname" :placeholder="t('profile.enterNickname')" />
        </el-form-item>
        <el-form-item :label="t('user.gender')">
          <DictSelect v-model="userProfileForm.gender" code="gender" />
        </el-form-item>
      </el-form>

      <el-form
        v-else-if="dialogState.type === DialogType.PASSWORD"
        ref="passwordChangeFormRef"
        :model="passwordChangeForm"
        :rules="passwordChangeRules"
        label-width="88px"
        class="pr-10px"
      >
        <el-form-item :label="t('profile.oldPassword')" prop="oldPassword">
          <el-input v-model="passwordChangeForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item :label="t('profile.newPassword')" prop="newPassword">
          <el-input v-model="passwordChangeForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item :label="t('profile.confirmPassword')" prop="confirmPassword">
          <el-input v-model="passwordChangeForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="inline-flex gap-2">
          <el-button @click="handleCancel">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import UserAPI from "@/api/system/user";
import type {
  UserProfileDetail,
  PasswordChangeForm,
  UserProfileForm as UserProfileFormType,
} from "@/api/system/user";
import AuthAPI from "@/api/auth";
import type { OAuthIdentity, OAuthProvider } from "@/api/auth";

import type { Component } from "vue";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import FileAPI from "@/api/file";
import { fileProxyUrl } from "@/api/file";
import { useUserStoreHook } from "@/stores";
import { redirectToLogin } from "@/utils/auth";
import { formatDateTime } from "@/utils/format";
import UserAvatar from "@/components/UserAvatar/index.vue";

import {
  Calendar,
  Camera,
  CircleCheck,
  DataLine,
  Edit,
  Female,
  Iphone,
  Key,
  Lock,
  Male,
  Message,
  OfficeBuilding,
  Timer,
  User,
  UserFilled,
  Warning,
} from "@element-plus/icons-vue";

interface ProfileInfoItem {
  label: string;
  value: string;
  icon: Component;
  muted?: boolean;
}

interface SecurityAction {
  label: string;
  type: "primary" | "danger";
  onClick: () => void;
}

interface SecurityItem {
  key: string;
  title: string;
  description: string;
  status: string;
  statusType: "success" | "warning" | "info";
  icon: Component;
  tone: "primary" | "success" | "warning";
  actions: SecurityAction[];
}

const userStore = useUserStoreHook();
const { t } = useI18n();

const userProfile = ref<UserProfileDetail>({});
const oauthIdentities = ref<OAuthIdentity[]>([]);
const oauthBindLoading = ref<OAuthProvider | null>(null);
const oauthUnbindLoading = ref<string | null>(null);

const OAUTH_PROVIDERS: { code: OAuthProvider; label: string; icon: string }[] = [
  { code: "google", label: "Google", icon: "i-svg:google" },
  { code: "github", label: "GitHub", icon: "i-svg:github" },
  { code: "gitee", label: "Gitee", icon: "i-svg:gitee" },
];

const oauthProviderList = computed(() =>
  OAUTH_PROVIDERS.map((p) => {
    const identity = oauthIdentities.value.find((i) => i.providerCode === p.code);
    return { ...p, identity, bound: !!identity };
  })
);

const enum DialogType {
  ACCOUNT = "account",
  PASSWORD = "password",
  MOBILE = "mobile",
  EMAIL = "email",
}

const dialogState = reactive({
  visible: false,
  title: "",
  type: "" as DialogType,
});

const userProfileFormRef = ref();
const passwordChangeFormRef = ref();

const userProfileForm = reactive<UserProfileFormType>({});
const passwordChangeForm = reactive<PasswordChangeForm>({});

const userProfileRules = {
  nickname: [{ required: true, message: t("profile.enterNickname"), trigger: "blur" }],
};

const passwordChangeRules = {
  oldPassword: [{ required: true, message: t("profile.enterOldPassword"), trigger: "blur" }],
  newPassword: [{ required: true, message: t("profile.enterNewPassword"), trigger: "blur" }],
  confirmPassword: [
    { required: true, message: t("profile.reenterNewPassword"), trigger: "blur" },
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (value !== passwordChangeForm.newPassword) {
          callback(new Error(t("profile.passwordMismatch")));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
};

const displayName = computed(() => {
  return (
    userProfile.value.nickname ||
    userStore.userInfo.nickname ||
    userProfile.value.username ||
    userStore.userInfo.username ||
    t("profile.unnamedUser")
  );
});

const roleList = computed(() => {
  return (userProfile.value.roleNames || "")
    .split(/[,，]/)
    .map((role) => role.trim())
    .filter(Boolean);
});

const primaryRole = computed(() => roleList.value[0] || t("profile.normalUser"));

const permissionCount = computed(() => userStore.userInfo.perms?.length || 0);

const genderText = computed(() => {
  if (userProfile.value.gender === 1) return t("user.genderOptions.male");
  if (userProfile.value.gender === 2) return t("user.genderOptions.female");
  return t("profile.genderNotSet");
});

const boundCount = computed(() => {
  return [userProfile.value.mobile, userProfile.value.email].filter(Boolean).length;
});

const profileCompletion = computed(() => {
  const fields = [
    userProfile.value.username,
    userProfile.value.nickname,
    fileProxyUrl(userProfile.value.avatarFileId),
    userProfile.value.mobile,
    userProfile.value.email,
    userProfile.value.deptName,
    userProfile.value.roleNames,
    userProfile.value.createTime,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
});

const securityLevel = computed(() => {
  const score = 60 + boundCount.value * 20;
  if (score >= 100) {
    return { score, label: t("profile.level.high"), type: "success" as const };
  }
  if (score >= 80) {
    return { score, label: t("profile.level.medium"), type: "warning" as const };
  }
  return { score, label: t("profile.level.low"), type: "info" as const };
});

const profileInfoItems = computed<ProfileInfoItem[]>(() => [
  {
    label: t("profile.username"),
    value: userProfile.value.username || "-",
    icon: userProfile.value.gender === 2 ? Female : userProfile.value.gender === 1 ? Male : User,
  },
  {
    label: t("profile.phone"),
    value: userProfile.value.mobile || t("profile.unbound"),
    icon: Iphone,
    muted: !userProfile.value.mobile,
  },
  {
    label: t("profile.email"),
    value: userProfile.value.email || t("profile.unbound"),
    icon: Message,
    muted: !userProfile.value.email,
  },
  {
    label: t("profile.dept"),
    value: userProfile.value.deptName || "-",
    icon: OfficeBuilding,
    muted: !userProfile.value.deptName,
  },
  {
    label: t("profile.createTime"),
    value: formatDateTime(userProfile.value.createTime),
    icon: Timer,
    muted: !userProfile.value.createTime,
  },
]);

const profileStats = computed(() => [
  {
    label: t("profile.securityScore"),
    value: securityLevel.value.score,
    suffix: t("profile.unit.points"),
    icon: Key,
    tone: "primary",
  },
  {
    label: t("profile.boundItems"),
    value: boundCount.value,
    suffix: "/2",
    icon: CircleCheck,
    tone: "success",
  },
  {
    label: t("profile.roleCount"),
    value: roleList.value.length,
    suffix: t("profile.unit.count"),
    icon: UserFilled,
    tone: "warning",
  },
  {
    label: t("profile.permissionCount"),
    value: permissionCount.value,
    suffix: t("profile.unit.count"),
    icon: DataLine,
    tone: "info",
  },
]);

const accountStatusItems = computed(() => [
  {
    label: t("profile.loginAccount"),
    value: userProfile.value.username || t("profile.notRetrieved"),
    done: !!userProfile.value.username,
  },
  {
    label: t("profile.phoneVerification"),
    value: userProfile.value.mobile ? t("profile.bound") : t("profile.unbound"),
    done: !!userProfile.value.mobile,
  },
  {
    label: t("profile.emailVerification"),
    value: userProfile.value.email ? t("profile.bound") : t("profile.unbound"),
    done: !!userProfile.value.email,
  },
  {
    label: t("profile.profileCompletion"),
    value: `${profileCompletion.value}%`,
    done: profileCompletion.value >= 80,
  },
]);

const securityItems = computed<SecurityItem[]>(() => [
  {
    key: "password",
    title: t("profile.accountPassword"),
    description: t("profile.passwordDesc"),
    status: t("profile.set"),
    statusType: "success",
    icon: Lock,
    tone: "primary",
    actions: [
      {
        label: t("profile.change"),
        type: "primary",
        onClick: () => handleOpenDialog(DialogType.PASSWORD),
      },
    ],
  },
  {
    key: "mobile",
    title: t("profile.phoneNumber"),
    description: mobileSecurityDesc.value,
    status: userProfile.value.mobile ? t("profile.bound") : t("profile.unbound"),
    statusType: userProfile.value.mobile ? "success" : "warning",
    icon: Iphone,
    tone: "success",
    actions: userProfile.value.mobile
      ? [
          {
            label: t("profile.change"),
            type: "primary",
            onClick: () => handleOpenDialog(DialogType.MOBILE),
          },
          {
            label: t("profile.unbind"),
            type: "danger",
            onClick: handleUnbindMobile,
          },
        ]
      : [
          {
            label: t("profile.bind"),
            type: "primary",
            onClick: () => handleOpenDialog(DialogType.MOBILE),
          },
        ],
  },
  {
    key: "email",
    title: t("profile.email"),
    description: emailSecurityDesc.value,
    status: userProfile.value.email ? t("profile.bound") : t("profile.unbound"),
    statusType: userProfile.value.email ? "success" : "warning",
    icon: Message,
    tone: "warning",
    actions: userProfile.value.email
      ? [
          {
            label: t("profile.change"),
            type: "primary",
            onClick: () => handleOpenDialog(DialogType.EMAIL),
          },
          {
            label: t("profile.unbind"),
            type: "danger",
            onClick: handleUnbindEmail,
          },
        ]
      : [
          {
            label: t("profile.bind"),
            type: "primary",
            onClick: () => handleOpenDialog(DialogType.EMAIL),
          },
        ],
  },
]);

function maskMobile(mobile?: string) {
  if (!mobile) return "";
  return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
}

function maskEmail(email?: string) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  if (name.length <= 2) return `${name[0] || ""}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}

const mobileSecurityDesc = computed(() => {
  return userProfile.value.mobile
    ? t("profile.boundPrefix", { value: maskMobile(userProfile.value.mobile) })
    : t("profile.unbindMobileDesc");
});

const emailSecurityDesc = computed(() => {
  return userProfile.value.email
    ? t("profile.boundPrefix", { value: maskEmail(userProfile.value.email) })
    : t("profile.unbindEmailDesc");
});

const handleOpenDialog = (type: DialogType) => {
  dialogState.type = type;
  dialogState.visible = true;
  switch (type) {
    case DialogType.ACCOUNT:
      dialogState.title = t("profile.editProfile");
      userProfileForm.nickname = userProfile.value.nickname;
      userProfileForm.avatarFileId = userProfile.value.avatarFileId;
      userProfileForm.gender = userProfile.value.gender;
      break;
    case DialogType.PASSWORD:
      dialogState.title = t("profile.changePassword");
      break;
  }
};

async function handleUnbindMobile() {
  if (!userProfile.value.mobile) return;
  try {
    const result = await ElMessageBox.prompt(t("profile.unbindMobilePrompt"), t("profile.unbindMobileTitle"), {
      type: "warning",
      confirmButtonText: t("common.confirm"),
      cancelButtonText: t("common.cancel"),
      inputType: "password",
      inputPlaceholder: t("profile.currentPassword"),
      inputValidator: (val) => !!val || t("profile.enterCurrentPassword"),
    });
    const value = (result as any).value;
    await UserAPI.unbindMobile({ password: value });
    ElMessage.success(t("profile.mobileUnbound"));
    await loadUserProfile();
  } catch {
    // ignore
  }
}

async function handleUnbindEmail() {
  if (!userProfile.value.email) return;
  try {
    const result = await ElMessageBox.prompt(t("profile.unbindEmailPrompt"), t("profile.unbindEmailTitle"), {
      type: "warning",
      confirmButtonText: t("common.confirm"),
      cancelButtonText: t("common.cancel"),
      inputType: "password",
      inputPlaceholder: t("profile.currentPassword"),
      inputValidator: (val) => !!val || t("profile.enterCurrentPassword"),
    });
    const value = (result as any).value;
    await UserAPI.unbindEmail({ password: value });
    ElMessage.success(t("profile.emailUnbound"));
    await loadUserProfile();
  } catch {
    // ignore
  }
}

const handleSubmit = async () => {
  try {
    if (dialogState.type === DialogType.ACCOUNT) {
      const valid = await userProfileFormRef.value?.validate();
      if (!valid) return;

      await UserAPI.updateProfile(userProfileForm);
      ElMessage.success(t("profile.profileUpdated"));
      dialogState.visible = false;
      if (userProfileForm.nickname) {
        userStore.userInfo.nickname = userProfileForm.nickname;
      }
      await loadUserProfile();
    } else if (dialogState.type === DialogType.PASSWORD) {
      const valid = await passwordChangeFormRef.value?.validate();
      if (!valid) return;

      await UserAPI.changePassword(passwordChangeForm);
      dialogState.visible = false;
      await redirectToLogin(t("profile.passwordChanged"));
    }
  } catch {
    // ignore
  }
};

const handleCancel = () => {
  dialogState.visible = false;
  if (dialogState.type === DialogType.ACCOUNT) {
    userProfileFormRef.value?.resetFields();
  } else if (dialogState.type === DialogType.PASSWORD) {
    passwordChangeFormRef.value?.resetFields();
  }
};

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files ? target.files[0] : null;
  if (!file) return;

  try {
    const data = await FileAPI.uploadFile(file);
    await UserAPI.updateProfile({ avatarFileId: data.id });
    userStore.userInfo.avatarFileId = data.id;
    ElMessage.success(t("profile.avatarUpdated"));
  } catch {
    // axios 拦截器已弹出错误提示
  } finally {
    target.value = "";
  }
};

const loadUserProfile = async () => {
  const data = await UserAPI.getProfile();
  userProfile.value = data;
  // 同步顶栏等依赖 userStore 的组件
  userStore.userInfo.nickname = data.nickname;
};

async function loadOAuthIdentities() {
  try {
    oauthIdentities.value = await AuthAPI.getOAuthIdentities();
  } catch {
    // 拦截器已处理
  }
}

async function handleBindProvider(provider: OAuthProvider) {
  oauthBindLoading.value = provider;
  try {
    const { url } = await AuthAPI.getOAuthAuthUrl(provider, "bind");
    window.location.href = url;
  } catch {
    oauthBindLoading.value = null;
  }
}

async function handleUnbindIdentity(identityId: string) {
  try {
    await ElMessageBox.confirm(t("profile.unbindConfirm"), t("profile.unbindTitle"), {
      type: "warning",
      confirmButtonText: t("common.confirm"),
      cancelButtonText: t("common.cancel"),
    });
    oauthUnbindLoading.value = identityId;
    await AuthAPI.unbindOAuthIdentity(identityId);
    ElMessage.success(t("profile.unbindSuccess"));
    await loadOAuthIdentities();
  } catch {
    // cancel or error
  } finally {
    oauthUnbindLoading.value = null;
  }
}

onMounted(async () => {
  await loadUserProfile();
  await loadOAuthIdentities();
});
</script>

<style lang="scss" scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  padding: 16px;
}

.profile-hero,
.profile-card {
  background: var(--content-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.profile-hero {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
}

.profile-hero__body,
.profile-hero__title,
.profile-hero__meta,
.profile-hero__actions,
.profile-hero__meta-item {
  display: flex;
  align-items: center;
}

.profile-hero__body {
  gap: 16px;
  min-width: 0;
}

.profile-hero__info {
  min-width: 0;
}

.profile-hero__title {
  flex-wrap: wrap;
  gap: 10px;
}

.profile-hero__name {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 30px;
  color: var(--el-text-color-primary);
}

.profile-hero__desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.profile-hero__meta {
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.profile-hero__meta-item {
  gap: 4px;
}

.profile-hero__actions {
  flex-shrink: 0;
  gap: 8px;
}

.profile-avatar {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar__action {
  position: absolute;
  right: -2px;
  bottom: -2px;
  border: 2px solid var(--content-bg);
}

.profile-avatar__input {
  display: none;
}

.profile-page__layout {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.profile-page__side,
.profile-page__main {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.profile-page__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.profile-card {
  padding: 18px 20px;
}

.profile-card__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.profile-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
  color: var(--el-text-color-primary);
}

.profile-card__desc {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.profile-card__extra,
.profile-empty {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.profile-info {
  display: grid;
  gap: 10px;
  margin: 0;
}

.profile-info__item {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 34px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.profile-info__item:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.profile-info__label {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.profile-info__value {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.profile-stats__item {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 8px;
}

.profile-stats__body {
  min-width: 0;
}

.profile-stats__label,
.profile-stats__value {
  display: block;
}

.profile-stats__label {
  margin-bottom: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.profile-stats__value {
  font-size: 20px;
  line-height: 24px;
  color: var(--el-text-color-primary);
}

.profile-stats__value em {
  display: inline;
  margin-left: 2px;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.profile-icon {
  display: flex;
  flex: 0 0 36px;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 18px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
}

.profile-icon--large {
  flex-basis: 40px;
  width: 40px;
  height: 40px;
  font-size: 20px;
}

.profile-icon--success {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.profile-icon--warning {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

.profile-icon--info {
  color: var(--el-color-info);
  background: var(--el-fill-color-light);
}

.profile-security,
.profile-status {
  display: grid;
  gap: 12px;
}

.profile-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-security__item {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 8px;
}

.profile-security__body,
.profile-status__body {
  min-width: 0;
}

.profile-security__title {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.profile-security__desc {
  margin: 4px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.profile-security__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.profile-security__actions .el-button + .el-button {
  margin-left: 0;
}

.profile-status__item {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 38px;
  color: var(--el-color-success);
}

.profile-status__item.is-warning {
  color: var(--el-color-warning);
}

.profile-status__title {
  margin-bottom: 2px;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.profile-status__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.profile-oauth__icon {
  display: inline-block;
  width: 20px;
  height: 20px;
}

.is-muted {
  color: var(--el-text-color-placeholder);
}

@media (width <= 1200px) {
  .profile-page__layout {
    grid-template-columns: 1fr;
  }
}

@media (width <= 768px) {
  .profile-page {
    padding: 12px;
  }

  .profile-hero {
    align-items: flex-start;
  }

  .profile-hero,
  .profile-hero__body,
  .profile-hero__actions {
    flex-direction: column;
  }

  .profile-hero__actions {
    align-items: stretch;
    width: 100%;
  }

  .profile-hero__actions .el-button {
    width: 100%;
    margin-left: 0;
  }

  .profile-security__item {
    grid-template-columns: 40px minmax(0, 1fr);
  }

  .profile-security__actions {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
