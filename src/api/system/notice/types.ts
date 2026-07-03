/**
 * Notice 通知类型定义
 */

import type { BaseQueryParams } from "@/api/common";

/** 通知管理 - 分页查询参数 */
export interface NoticeQueryParams extends BaseQueryParams {
  title?: string;
  /** 发布状态：0=草稿 1=已发布 -1=已撤回 */
  publishStatus?: number;
}

/** 我的通知 - 分页查询参数 */
export interface MyNoticeQueryParams extends BaseQueryParams {
  title?: string;
  /** 是否已读：0=未读 1=已读 */
  isRead?: number;
}

/** 通知表单 */
export interface NoticeForm {
  id?: string;
  title: string;
  content: string;
  type: number;
  level: string;
  /** 目标类型：1=全体 2=指定用户 */
  targetType: number;
  /** 指定用户 ID 列表（targetType=2 时必填） */
  targetUserIds?: number[];
}

/** 通知列表项（管理端返回完整记录） */
export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  type: number;
  level: string;
  targetType: number;
  targetUserIds?: number[];
  publishStatus: number;
  publisherId?: string;
  publishTime?: string;
  revokeTime?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** 我的通知列表项 */
export interface MyNoticeItem {
  id: string;
  title: string;
  type: number;
  level: string;
  publishTime?: string;
  /** 是否已读：0=未读 1=已读 */
  isRead: number;
}

/** 通知详情（管理端，同列表项） */
export type NoticeDetail = NoticeItem;

/** 我的通知详情 */
export interface MyNoticeDetail {
  id: string;
  title: string;
  content: string;
  type: number;
  level: string;
  publisherId?: string;
  publishTime?: string;
}

/** 未读数量 */
export interface UnreadCountResult {
  count: number;
}

/** WebSocket 推送的通知事件数据 */
export interface NoticeWsPayload {
  id: string;
  title: string;
  type: number;
  level: string;
  publishTime: string | null;
}
