import request from "@/utils/request";
import type { PageResult, OptionItem } from "@/api/common";
import type {
  RoleQueryParams,
  RoleItem,
  RoleForm,
  RoleDetail,
  AssignMenusRequest,
  AssignPermissionsRequest,
} from "./types";

const ROLE_BASE_URL = "/api/v1/roles";

const RoleAPI = {
  /** 获取角色分页数据 */
  getPage(queryParams?: RoleQueryParams) {
    return request<unknown, PageResult<RoleItem>>({
      url: `${ROLE_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取角色下拉选项 */
  async getOptions(queryParams?: RoleQueryParams): Promise<OptionItem[]> {
    const data = await RoleAPI.getPage({
      ...queryParams,
      page: 1,
      pageSize: 9999,
    });
    return (data.items ?? []).map((item) => ({
      value: item.id,
      label: item.name,
    }));
  },

  /** 获取角色详情（含菜单ID和权限ID列表） */
  getDetail(id: string) {
    return request<unknown, RoleDetail>({
      url: `${ROLE_BASE_URL}/${id}`,
      method: "get",
    });
  },

  /** 新增角色 */
  create(data: RoleForm) {
    return request({ url: `${ROLE_BASE_URL}`, method: "post", data });
  },

  /** 更新角色 */
  update(id: string, data: Partial<RoleForm>) {
    return request({ url: `${ROLE_BASE_URL}/${id}`, method: "put", data });
  },

  /** 删除角色 */
  deleteById(id: string) {
    return request({ url: `${ROLE_BASE_URL}/${id}`, method: "delete" });
  },

  /** 分配菜单 */
  assignMenus(id: string, data: AssignMenusRequest) {
    return request({ url: `${ROLE_BASE_URL}/${id}/menus`, method: "put", data });
  },

  /** 分配权限 */
  assignPermissions(id: string, data: AssignPermissionsRequest) {
    return request({ url: `${ROLE_BASE_URL}/${id}/permissions`, method: "put", data });
  },
};

export default RoleAPI;

// 重导出类型
export * from "./types";
