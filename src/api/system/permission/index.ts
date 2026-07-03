import request from "@/utils/request";
import type { PageResult, OptionItem } from "@/api/common";
import type {
  PermissionQueryParams,
  PermissionItem,
  PermissionForm,
} from "./types";

const PERMISSION_BASE_URL = "/api/v1/permissions";

const PermissionAPI = {
  /** 权限分页列表 */
  getPage(queryParams?: PermissionQueryParams) {
    return request<unknown, PageResult<PermissionItem>>({
      url: PERMISSION_BASE_URL,
      method: "get",
      params: queryParams,
    });
  },

  /** 权限下拉选项（全量） */
  async getOptions(
    queryParams?: PermissionQueryParams
  ): Promise<OptionItem[]> {
    const data = await request<unknown, PageResult<PermissionItem>>({
      url: PERMISSION_BASE_URL,
      method: "get",
      params: { ...queryParams, page: 1, pageSize: 0 },
    });
    return (data.items ?? []).map((item) => ({
      value: item.id,
      label: item.name,
    }));
  },

  /** 权限详情 */
  getDetail(id: string) {
    return request<unknown, PermissionItem>({
      url: `${PERMISSION_BASE_URL}/${id}`,
      method: "get",
    });
  },

  /** 新增权限 */
  create(data: PermissionForm) {
    return request({ url: PERMISSION_BASE_URL, method: "post", data });
  },

  /** 修改权限 */
  update(id: string, data: Partial<PermissionForm>) {
    return request({
      url: `${PERMISSION_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /** 删除权限 */
  deleteById(id: string) {
    return request({
      url: `${PERMISSION_BASE_URL}/${id}`,
      method: "delete",
    });
  },
};

export default PermissionAPI;

export * from "./types";
