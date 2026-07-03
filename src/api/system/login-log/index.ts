import request from "@/utils/request";
import type { PageResult } from "@/api/common";
import type { LoginLogQueryParams, LoginLogItem } from "./types";

const LOGIN_LOG_BASE_URL = "/api/v1/login-logs";

const LoginLogAPI = {
  /** 获取登录日志分页列表 */
  getPage(queryParams: LoginLogQueryParams) {
    return request<unknown, PageResult<LoginLogItem>>({
      url: `${LOGIN_LOG_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取登录日志详情 */
  getDetail(id: string) {
    return request<unknown, LoginLogItem>({
      url: `${LOGIN_LOG_BASE_URL}/${id}`,
      method: "get",
    });
  },
};

export default LoginLogAPI;

export * from "./types";
