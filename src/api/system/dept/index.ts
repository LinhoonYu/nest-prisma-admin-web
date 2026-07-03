import request from "@/utils/request";
import type { OptionItem } from "@/api/common";
import type { DeptQueryParams, DeptItem, DeptForm } from "./types";

const DEPT_BASE_URL = "/api/v1/depts";

/** 将 DeptItem 树转换为 OptionItem 树 */
const toOptionTree = (items: DeptItem[]): OptionItem[] =>
  items.map((item) => ({
    value: item.id,
    label: item.name,
    children: item.children?.length ? toOptionTree(item.children) : undefined,
  }));

const DeptAPI = {
  /** 获取部门树形列表 */
  getList(queryParams?: DeptQueryParams) {
    return request<unknown, DeptItem[]>({
      url: `${DEPT_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取部门下拉选项（树形） */
  async getOptions(queryParams?: DeptQueryParams): Promise<OptionItem[]> {
    const data = await DeptAPI.getList(queryParams);
    return toOptionTree(data);
  },

  /** 获取部门详情 */
  getDetail(id: string) {
    return request<unknown, DeptItem>({
      url: `${DEPT_BASE_URL}/${id}`,
      method: "get",
    });
  },

  /** 新增部门 */
  create(data: DeptForm) {
    return request({ url: `${DEPT_BASE_URL}`, method: "post", data });
  },

  /** 修改部门 */
  update(id: string, data: Partial<DeptForm>) {
    return request({ url: `${DEPT_BASE_URL}/${id}`, method: "put", data });
  },

  /** 删除部门 */
  deleteById(id: string) {
    return request({ url: `${DEPT_BASE_URL}/${id}`, method: "delete" });
  },
};

export default DeptAPI;

// 重导出类型
export * from "./types";
