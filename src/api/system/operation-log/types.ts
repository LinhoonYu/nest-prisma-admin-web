import type { BaseQueryParams } from "@/api/common";

/** 操作日志查询参数 */
export interface OperationLogQueryParams extends BaseQueryParams {
  /** 用户名 */
  username?: string;
  /** 模块 */
  module?: string;
  /** 操作 */
  action?: string;
  /** 请求方法 */
  method?: string;
  /** 请求路径 */
  path?: string;
  /** 是否成功 */
  success?: number;
  /** 起始时间 */
  startTime?: string;
  /** 结束时间 */
  endTime?: string;
}

/** 操作日志列表项 */
export interface OperationLogItem {
  id: string;
  userId?: string;
  username?: string;
  module?: string;
  action?: string;
  description?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  durationMs?: number;
  createdAt: string;
}
