import request from "@/utils/request";
import type { OptionItem } from "@/api/common";
import type { MenuQueryParams, MenuItem, MenuForm } from "./types";

const MENU_BASE_URL = "/api/v1/menus";

/** 将菜单树转换为选项树 */
const toOptionTree = (
  items: MenuItem[],
  includeButton = false
): OptionItem[] =>
  items
    .filter((item) => includeButton || item.type !== 5)
    .map((item) => ({
      value: item.id,
      label: item.title,
      children: item.children?.length
        ? toOptionTree(item.children, includeButton)
        : undefined,
    }));

const MenuAPI = {
  /** 获取菜单树形列表 */
  getList(queryParams?: MenuQueryParams) {
    return request<unknown, MenuItem[]>({
      url: `${MENU_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取菜单下拉选项（树形） */
  async getOptions(includeButton = false): Promise<OptionItem[]> {
    const data = await MenuAPI.getList({ status: 1 });
    return toOptionTree(data, includeButton);
  },

  /** 获取菜单详情 */
  getDetail(id: string) {
    return request<unknown, MenuItem>({
      url: `${MENU_BASE_URL}/${id}`,
      method: "get",
    });
  },

  /** 新增菜单 */
  create(data: MenuForm) {
    return request({ url: `${MENU_BASE_URL}`, method: "post", data });
  },

  /** 修改菜单 */
  update(id: string, data: Partial<MenuForm>) {
    return request({ url: `${MENU_BASE_URL}/${id}`, method: "put", data });
  },

  /** 删除菜单 */
  deleteById(id: string) {
    return request({ url: `${MENU_BASE_URL}/${id}`, method: "delete" });
  },
};

export default MenuAPI;

// 重导出类型
export * from "./types";
