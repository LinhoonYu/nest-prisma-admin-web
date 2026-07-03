import request from "@/utils/request";
import type { PageResult } from "@/api/common";
import type { OperationLogQueryParams, OperationLogItem } from "./types";

const OPERATION_LOG_BASE_URL = "/api/v1/operation-logs";

const OperationLogAPI = {
  /** 获取操作日志分页列表 */
  getPage(queryParams: OperationLogQueryParams) {
    return request<unknown, PageResult<OperationLogItem>>({
      url: `${OPERATION_LOG_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取操作日志详情 */
  getDetail(id: string) {
    return request<unknown, OperationLogItem>({
      url: `${OPERATION_LOG_BASE_URL}/${id}`,
      method: "get",
    });
  },
};

export default OperationLogAPI;

export * from "./types";
