import request from "@/utils/request";
import type { PageResult } from "@/api/common";
import type {
  NoticeQueryParams,
  MyNoticeQueryParams,
  NoticeForm,
  NoticeItem,
  NoticeDetail,
  MyNoticeItem,
  MyNoticeDetail,
  UnreadCountResult,
} from "./types";

const NOTICE_BASE_URL = "/api/v1/notices";
const MY_NOTICE_BASE_URL = "/api/v1/my-notices";

const NoticeAPI = {
  /** 通知分页列表 */
  getPage(queryParams?: NoticeQueryParams) {
    return request<unknown, PageResult<NoticeItem>>({
      url: NOTICE_BASE_URL,
      method: "get",
      params: queryParams,
    });
  },

  /** 通知详情 */
  getDetail(id: string) {
    return request<unknown, NoticeDetail>({
      url: `${NOTICE_BASE_URL}/${id}`,
      method: "get",
    });
  },

  /** 新增通知 */
  create(data: NoticeForm) {
    return request({ url: NOTICE_BASE_URL, method: "post", data });
  },

  /** 修改通知 */
  update(id: string, data: Partial<NoticeForm>) {
    return request({ url: `${NOTICE_BASE_URL}/${id}`, method: "put", data });
  },

  /** 删除通知（支持逗号分隔批量删除） */
  deleteByIds(ids: string) {
    return request({ url: `${NOTICE_BASE_URL}/${ids}`, method: "delete" });
  },

  /** 发布通知 */
  publish(id: string) {
    return request({ url: `${NOTICE_BASE_URL}/${id}/publish`, method: "put" });
  },

  /** 撤回通知 */
  revoke(id: string) {
    return request({ url: `${NOTICE_BASE_URL}/${id}/revoke`, method: "put" });
  },

  /** 重试发送失败的通知 */
  retry(id: string) {
    return request({ url: `${NOTICE_BASE_URL}/${id}/retry`, method: "put" });
  },

  /** 我的通知分页列表 */
  getMyNoticePage(queryParams?: MyNoticeQueryParams) {
    return request<unknown, PageResult<MyNoticeItem>>({
      url: MY_NOTICE_BASE_URL,
      method: "get",
      params: queryParams,
    });
  },

  /** 我的通知详情（同时标记已读） */
  getMyNoticeDetail(id: string) {
    return request<unknown, MyNoticeDetail>({
      url: `${MY_NOTICE_BASE_URL}/${id}`,
      method: "get",
    });
  },

  /** 未读通知数量 */
  getUnreadCount() {
    return request<unknown, UnreadCountResult>({
      url: `${MY_NOTICE_BASE_URL}/unread-count`,
      method: "get",
    });
  },

  /** 全部已读 */
  readAll() {
    return request({ url: `${MY_NOTICE_BASE_URL}/read-all`, method: "put" });
  },
};

export default NoticeAPI;

// 重导出类型
export * from "./types";
