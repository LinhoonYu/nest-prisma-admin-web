<template>
  <div class="dash">
    <section class="dash-header">
      <div class="card dash-header__card">
        <div class="dash-header__start">
          <div class="dash-avatar">
            <UserAvatar
              :name="userStore.userInfo.nickname || userStore.userInfo.username"
              :avatar-file-id="userStore.userInfo.avatarFileId"
              :avatar-url="userStore.userInfo.avatarUrl"
              :size="44"
            />
          </div>
          <div class="dash-header__text">
            <h1 class="dash-header__greeting">{{ greetings }}</h1>
            <p class="dash-header__date">{{ currentDateStr }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="dash-stats">
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--blue">
          <el-icon :size="18"><User /></el-icon>
        </div>
        <div class="stat-card__body">
          <span class="stat-card__num">{{ onlineUserCount }}</span>
          <span class="stat-card__label">在线用户</span>
        </div>
        <span
          :class="[
            'stat-card__badge',
            isConnected ? 'stat-card__badge--on' : 'stat-card__badge--off',
          ]"
        >
          {{ isConnected ? "实时" : "离线" }}
        </span>
      </div>

      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--green">
          <el-icon :size="18"><Promotion /></el-icon>
        </div>
        <div class="stat-card__body">
          <span class="stat-card__num">{{ todayLoginCount }}</span>
          <span class="stat-card__label">今日登录</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--orange">
          <el-icon :size="18"><Bell /></el-icon>
        </div>
        <div class="stat-card__body">
          <span class="stat-card__num">{{ unreadNoticeCount }}</span>
          <span class="stat-card__label">未读通知</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--purple">
          <el-icon :size="18"><Avatar /></el-icon>
        </div>
        <div class="stat-card__body">
          <span class="stat-card__num">1,566</span>
          <span class="stat-card__label">系统用户</span>
        </div>
        <span class="stat-card__trend stat-card__trend--up">
          <el-icon :size="12"><ArrowUp /></el-icon>
          12.5%
        </span>
      </div>
    </section>

    <section class="dash-middle">
      <div class="card dash-middle__map">
        <div class="card__head">
          <h3 class="card__title">用户区域分布</h3>
        </div>
        <div class="card__body card__body--flush">
          <ECharts :options="mapOptions" height="640px" />
        </div>
      </div>

      <div class="dash-middle__side">
        <div class="card dash-side-card">
          <div class="card__head">
            <h3 class="card__title">最近登录</h3>
            <el-tag size="small" round>{{ loginLogs.length }} 条</el-tag>
          </div>
          <div class="card__body card__body--scroll dash-side-card__body">
            <div v-if="loginLogs.length" class="log-list">
              <div
                v-for="item in loginLogs"
                :key="item.id"
                class="log-row"
                :class="item.status === 1 ? 'log-row--success' : 'log-row--fail'"
              >
                <span class="log-row__status">
                  <el-icon :size="11">
                    <CircleCheck v-if="item.status === 1" />
                    <CloseBold v-else />
                  </el-icon>
                </span>
                <span class="log-row__provider" :class="`log-row__provider--${loginProviderType(item)}`">
                  <el-icon v-if="loginProviderType(item) === 'password'" :size="11">
                    <Lock />
                  </el-icon>
                  <span v-else-if="loginProviderType(item) === 'github'" class="i-svg:github" />
                  <span v-else-if="loginProviderType(item) === 'gitee'" class="i-svg:gitee" />
                  <span v-else-if="loginProviderType(item) === 'google'" class="i-svg:google" />
                  <el-icon v-else :size="11"><User /></el-icon>
                </span>
                <span class="log-row__user">{{ item.username || "—" }}</span>
                <span class="log-row__type">{{ loginTypeLabel(item.loginType) }}</span>
                <span class="log-row__ip">{{ item.ip || "—" }}</span>
                <span class="log-row__time">{{ formatTime(item.createdAt) }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无登录记录" :image-size="60" />
          </div>
        </div>

        <div class="card dash-side-card">
          <div class="card__head">
            <h3 class="card__title">最新通知 / 公告</h3>
            <el-tag size="small" round>{{ notices.length }} 条</el-tag>
          </div>
          <div class="card__body card__body--scroll dash-side-card__body">
            <div v-if="notices.length" class="notice-list">
              <div v-for="item in notices" :key="item.id" class="notice-row">
                <DictTag v-model="item.type" code="notice_type" size="small" />
                <DictTag
                  v-model="item.level"
                  code="notice_level"
                  size="small"
                  class="notice-row__tag"
                />
                <span class="notice-row__title">{{ item.title }}</span>
                <span class="notice-row__time">{{ formatTime(item.publishTime) }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无通知 / 公告" :image-size="60" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "Dashboard", inheritAttrs: false });

import * as echarts from "echarts/core";
import { MapChart } from "echarts/charts";
import { GeoComponent, VisualMapComponent } from "echarts/components";
import { dayjs } from "element-plus";
import { ref, computed, onMounted } from "vue";
import type { LoginLogItem, LoginLogQueryParams } from "@/api/system/login-log/types";
import type { MyNoticeItem } from "@/api/system/notice/types";
import LoginLogAPI from "@/api/system/login-log";
import NoticeAPI from "@/api/system/notice";
import { useUserStore } from "@/stores/user";
import { useOnlineCount } from "@/composables";
import UserAvatar from "@/components/UserAvatar/index.vue";
import chinaJson from "@/assets/map/china.json";
import {
  User,
  Avatar,
  Promotion,
  Bell,
  ArrowUp,
  CircleCheck,
  CloseBold,
  Lock,
} from "@element-plus/icons-vue";

// 注册中国地图（use(MapChart) 必须在 registerMap 之前）
echarts.use([MapChart, GeoComponent, VisualMapComponent]);
echarts.registerMap("china", chinaJson as Parameters<typeof echarts.registerMap>[1]);

const userStore = useUserStore();
const { onlineUserCount, isConnected } = useOnlineCount();

const hours = new Date().getHours();
const greetings = computed(() => {
  const n = userStore.userInfo.nickname || userStore.userInfo.username;
  if (hours >= 6 && hours < 8) return `早安，${n}`;
  if (hours >= 8 && hours < 12) return `上午好，${n}`;
  if (hours >= 12 && hours < 18) return `下午好，${n}`;
  if (hours >= 18 && hours < 24) return `晚上好，${n}`;
  return `夜深了，${n}`;
});

const currentDateStr = computed(() => {
  const d = new Date();
  const w = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${w[d.getDay()]}`;
});

function formatTime(t?: string) {
  if (!t) return "—";
  const d = dayjs(t);
  const now = dayjs();
  const diffMin = now.diff(d, "minute");
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = now.diff(d, "hour");
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = now.diff(d, "day");
  if (diffDay < 7) return `${diffDay}天前`;
  return d.format("MM-DD HH:mm");
}

function loginTypeLabel(type: number) {
  const map: Record<number, string> = {
    1: "密码",
    2: "第三方",
    3: "GitHub",
    4: "Gitee",
    5: "Google",
  };
  return map[type] ?? "其他";
}

type LoginProviderType = "password" | "github" | "gitee" | "google" | "other";

function loginProviderType(item: LoginLogItem): LoginProviderType {
  const provider = item.provider?.toLowerCase();
  if (item.loginType === 1) return "password";
  if (item.loginType === 3 || provider === "github") return "github";
  if (item.loginType === 4 || provider === "gitee") return "gitee";
  if (item.loginType === 5 || provider === "google") return "google";
  return "other";
}

const todayLoginCount = ref(0);

function fetchTodayLoginCount() {
  const today = dayjs().format("YYYY-MM-DD");
  const params: LoginLogQueryParams = {
    page: 1,
    pageSize: 1,
    status: 1,
    startTime: `${today} 00:00:00`,
    endTime: `${today} 23:59:59`,
  };
  LoginLogAPI.getPage(params)
    .then((res) => {
      todayLoginCount.value = res.total;
    })
    .catch(() => {
      todayLoginCount.value = 0;
    });
}

const unreadNoticeCount = ref(0);

function fetchUnreadNoticeCount() {
  NoticeAPI.getUnreadCount()
    .then((res) => {
      unreadNoticeCount.value = res.count;
    })
    .catch(() => {
      unreadNoticeCount.value = 0;
    });
}

const notices = ref<MyNoticeItem[]>([]);

function fetchNotices() {
  NoticeAPI.getMyNoticePage({ page: 1, pageSize: 5 })
    .then((res) => {
      notices.value = res.items;
    })
    .catch(() => {
      notices.value = [];
    });
}

const loginLogs = ref<LoginLogItem[]>([]);

function fetchLoginLogs() {
  LoginLogAPI.getPage({ page: 1, pageSize: 10 })
    .then((res) => {
      loginLogs.value = res.items;
    })
    .catch(() => {
      loginLogs.value = [];
    });
}
const mapOptions = computed(() => ({
  tooltip: {
    trigger: "item" as const,
    borderWidth: 0,
    padding: [8, 12],
    formatter: (params: { name: string; value: number; data?: { name: string; value: number } }) => {
      if (!params.data) return `${params.name}<br/>暂无数据`;
      return `${params.name}<br/>用户数：<b>${params.data.value}</b>`;
    },
  },
  visualMap: {
    min: 0,
    max: 3500,
    text: ["高", "低"],
    textStyle: { fontSize: 12 },
    inRange: {
      color: ["#e6f2ff", "#91c8ff", "#409eff", "#1c6fbf", "#0d3b6e"],
    },
    calculable: true,
    left: 10,
    bottom: 20,
    itemWidth: 12,
    itemHeight: 100,
  },
  series: [
    {
      name: "用户分布",
      type: "map",
      map: "china",
      roam: "scale",
      aspectScale: 0.82,
      layoutCenter: ["50%", "50%"],
      layoutSize: "92%",
      selectedMode: false,
      label: {
        show: true,
        fontSize: 11,
        color: "#333",
      },
      itemStyle: {
        borderColor: "#fff",
        borderWidth: 1.5,
      },
      emphasis: {
        label: { fontSize: 14, fontWeight: "bold" },
        itemStyle: {
          areaColor: "#ffd666",
        },
      },
      data: [
        { name: "广东省", value: 3200 },
        { name: "浙江省", value: 2800 },
        { name: "江苏省", value: 2500 },
        { name: "北京市", value: 1890 },
        { name: "上海市", value: 1650 },
        { name: "四川省", value: 1800 },
        { name: "山东省", value: 1400 },
        { name: "河南省", value: 1200 },
        { name: "湖北省", value: 1100 },
        { name: "湖南省", value: 1050 },
        { name: "福建省", value: 980 },
        { name: "河北省", value: 900 },
        { name: "安徽省", value: 850 },
        { name: "辽宁省", value: 780 },
        { name: "陕西省", value: 720 },
        { name: "重庆市", value: 950 },
        { name: "江西省", value: 680 },
        { name: "天津市", value: 620 },
        { name: "广西壮族自治区", value: 580 },
        { name: "云南省", value: 550 },
        { name: "山西省", value: 520 },
        { name: "黑龙江省", value: 480 },
        { name: "吉林省", value: 450 },
        { name: "贵州省", value: 420 },
        { name: "甘肃省", value: 380 },
        { name: "内蒙古自治区", value: 350 },
        { name: "新疆维吾尔自治区", value: 300 },
        { name: "海南省", value: 280 },
        { name: "宁夏回族自治区", value: 220 },
        { name: "青海省", value: 180 },
        { name: "西藏自治区", value: 120 },
        { name: "台湾省", value: 0 },
        { name: "香港特别行政区", value: 0 },
        { name: "澳门特别行政区", value: 0 },
      ],
    },
  ],
}));

onMounted(() => {
  fetchTodayLoginCount();
  fetchUnreadNoticeCount();
  fetchNotices();
  fetchLoginLogs();
});
</script>

<style lang="scss" scoped>
$gap: 16px;
$pad: 16px;
$radius: 10px;

%card {
  overflow: hidden;
  background: var(--content-bg);
  border: 1px solid var(--border-color);
  border-radius: $radius;
}

.dash {
  display: flex;
  flex-direction: column;
  gap: $gap;
  padding: $pad;
}

.dash-header {
  &__card {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
  }

  &__start {
    display: flex;
    gap: 14px;
    align-items: center;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__greeting {
    margin: 0;
    font-size: 20px;
    font-weight: 400;
    line-height: 1.3;
    color: var(--el-text-color-primary);
    letter-spacing: -0.01em;
  }

  &__date {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.dash-avatar {
  display: flex;
  flex-shrink: 0;
}

.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $gap;
}

.stat-card {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 24px;
  @extend %card;

  &__icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;

    &--blue {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
    &--green {
      color: var(--el-color-success);
      background: var(--el-color-success-light-9);
    }
    &--orange {
      color: var(--el-color-warning);
      background: var(--el-color-warning-light-9);
    }
    &--purple {
      color: var(--el-color-primary-light-3);
      background: var(--el-color-primary-light-9);
    }
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  &__num {
    font-size: 28px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--el-text-color-primary);
    letter-spacing: -0.02em;
  }

  &__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__badge {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 500;

    &--on {
      color: var(--el-color-success);
    }
    &--off {
      color: var(--el-color-danger);
    }
  }

  &__trend {
    display: inline-flex;
    flex-shrink: 0;
    gap: 2px;
    align-items: center;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);

    &--up {
      color: var(--el-color-danger);
    }
  }
}

.card {
  @extend %card;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
  }

  &__title {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__body {
    padding: 0 20px 16px;

    &--flush {
      padding: 0;
    }

    &--scroll {
      max-height: 400px;
      padding: 0;
      overflow-y: auto;
    }
  }
}

.dash-middle {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: $gap;
  min-height: 640px;

  &__map {
    min-width: 0;
  }

  &__side {
    display: flex;
    flex-direction: column;
    gap: $gap;
    min-width: 0;
  }
}

.dash-side-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  &__body {
    flex: 1;
    max-height: none;
    overflow-y: auto;
  }
}

.notice-list {
  padding: 4px 12px 8px;
}

.notice-row {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 9px 0;

  & + & {
    border-top: 1px solid var(--el-border-color-lighter);
  }

  &__tag {
    flex-shrink: 0;
  }

  &__title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: 13px;
    color: var(--el-text-color-regular);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    white-space: nowrap;
  }
}

.log-list {
  padding: 4px 12px 8px;
}

.log-row {
  display: grid;
  grid-template-columns: 14px 20px 200px 68px minmax(80px, 1fr) 60px;
  gap: 8px;
  align-items: center;
  padding: 7px 0;

  & + & {
    border-top: 1px solid var(--el-border-color-lighter);
  }

  &--success {
    .log-row__status {
      color: var(--el-color-success);
    }
  }

  &--fail {
    .log-row__status {
      color: var(--el-color-danger);
    }
  }

  &__status {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__provider {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    font-size: 13px;

    .el-icon {
      color: var(--el-text-color-secondary);
    }

    &--password {
      .el-icon {
        color: #409eff;
      }
    }

    &--github {
      color: #24292f;
    }

    &--gitee {
      color: #c71d23;
    }

    &--google {
      color: #4285f4;
    }

    &--other {
      color: #909399;
    }
  }

  &__user {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__type {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__ip {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    font-family: "SF Mono", "Menlo", monospace;
    color: var(--el-text-color-placeholder);
    white-space: nowrap;
  }

  &__time {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    white-space: nowrap;
  }
}

@media (max-width: 1200px) {
  .dash-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .dash-header__card {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 992px) {
  .dash-middle {
    grid-template-columns: 1fr;
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .dash {
    gap: 14px;
    padding: 14px;
  }

  .dash-stats {
    grid-template-columns: 1fr;
  }
}
</style>
