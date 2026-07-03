import type { BaseQueryParams } from "@/api/common";

/** 登录日志查询参数 */
export interface LoginLogQueryParams extends BaseQueryParams {
  /** 用户名 */
  username?: string;
  /** 登录方式 */
  loginType?: number;
  /** IP */
  ip?: string;
  /** 状态：0=失败 1=成功 */
  status?: number;
  /** 起始时间 */
  startTime?: string;
  /** 结束时间 */
  endTime?: string;
}

/** 登录日志列表项 */
export interface LoginLogItem {
  id: string;
  userId?: string;
  username?: string;
  loginType: number;
  provider?: string;
  ip?: string;
  location?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  status: number;
  failureReason?: string;
  createdAt: string;
}
