import { ref, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import NoticeAPI from "@/api/system/notice";
import type { MyNoticeItem, MyNoticeDetail, MyNoticeQueryParams, NoticeWsPayload } from "@/api/system/notice";
import { useSse } from "@/composables";
import router from "@/router";

const PAGE_SIZE = 5;
const NOTICE_EVENT = "notice";
const NOTICE_REVOKE_EVENT = "notice-revoke";

export function useNotice() {
  const { t } = useI18n();
  const { on } = useSse();

  const list = ref<MyNoticeItem[]>([]);
  const unreadTotal = ref(0);
  const activeStatus = ref<0 | 1>(0);
  const detail = ref<MyNoticeDetail | null>(null);
  const dialogVisible = ref(false);
  const emptyText = ref(t("notice.noUnread"));

  let unsubNotice: (() => void) | null = null;
  let unsubRevoke: (() => void) | null = null;

  async function fetchList(params?: Partial<MyNoticeQueryParams>) {
    const query: MyNoticeQueryParams = {
      page: 1,
      pageSize: PAGE_SIZE,
      isRead: activeStatus.value,
      ...params,
    };
    const page = await NoticeAPI.getMyNoticePage(query);
    list.value = page.items ?? [];

    if (query.isRead === 0) {
      unreadTotal.value = page.total ?? 0;
    }
  }

  async function fetchUnreadCount() {
    const { count } = await NoticeAPI.getUnreadCount();
    unreadTotal.value = count;
  }

  async function switchStatus(status: 0 | 1) {
    if (activeStatus.value === status) return;

    activeStatus.value = status;
    emptyText.value = status === 0 ? t("notice.noUnread") : t("notice.noRead");
    await fetchList();
  }

  async function refresh() {
    await Promise.all([
      fetchList(),
      activeStatus.value === 0 ? Promise.resolve() : fetchUnreadCount(),
    ]);
  }

  async function read(id: string) {
    const item = list.value.find((notice: MyNoticeItem) => notice.id === id);
    const wasUnread = item?.isRead !== 1;

    detail.value = await NoticeAPI.getMyNoticeDetail(id);
    dialogVisible.value = true;

    const idx = list.value.findIndex((item: MyNoticeItem) => item.id === id);
    if (idx >= 0) list.value.splice(idx, 1);
    if (wasUnread && unreadTotal.value > 0) unreadTotal.value -= 1;

    await refresh();
  }

  async function readAll() {
    if (unreadTotal.value <= 0) return;

    await NoticeAPI.readAll();
    unreadTotal.value = 0;
    if (activeStatus.value === 0) {
      list.value = [];
    } else {
      await fetchList();
    }
    ElMessage.success(t("notice.allMarkedRead"));
  }

  function goMore() {
    router.push({ name: "MyNotice" });
  }

  function setupSubscription() {
    unsubNotice = on<NoticeWsPayload>(NOTICE_EVENT, (data) => {
      if (!data?.id) return;
      if (list.value.some((item) => item.id === data.id)) return;

      unreadTotal.value += 1;

      if (activeStatus.value !== 0) return;

      list.value.unshift({
        id: data.id,
        title: data.title,
        type: data.type,
        level: data.level,
        publishTime: data.publishTime ?? undefined,
        isRead: 0,
      });

      if (list.value.length > PAGE_SIZE) {
        list.value.length = PAGE_SIZE;
      }

      ElNotification({
        title: t("notice.newNotice"),
        message: data.title,
        type: "success",
        position: "bottom-right",
      });
    });

    unsubRevoke = on<{ id: string }>(NOTICE_REVOKE_EVENT, (data) => {
      if (!data?.id) return;

      const idx = list.value.findIndex((item) => item.id === data.id);
      if (idx >= 0) {
        const wasUnread = list.value[idx].isRead !== 1;
        list.value.splice(idx, 1);
        if (wasUnread && unreadTotal.value > 0) unreadTotal.value -= 1;
      }
    });
  }

  onMounted(() => {
    refresh();
    setupSubscription();
  });

  onBeforeUnmount(() => {
    unsubNotice?.();
    unsubRevoke?.();
    unsubNotice = null;
    unsubRevoke = null;
  });

  return {
    list,
    unreadTotal,
    activeStatus,
    emptyText,
    detail,
    dialogVisible,
    switchStatus,
    refresh,
    read,
    readAll,
    goMore,
  };
}
