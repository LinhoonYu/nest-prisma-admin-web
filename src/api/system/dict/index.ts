import request from "@/utils/request";
import type { PageResult, OptionItem } from "@/api/common";
import type {
  DictTypeQueryParams,
  DictTypeItem,
  DictTypeForm,
  DictItemQueryParams,
  DictItem,
  DictItemForm,
  DictItemOption,
} from "./types";

const DICT_TYPE_URL = "/api/v1/dict-types";
const DICT_ITEM_URL = "/api/v1/dict-items";

const DictAPI = {
  /** 字典类型分页列表 */
  getPage(queryParams: DictTypeQueryParams) {
    return request<unknown, PageResult<DictTypeItem>>({
      url: DICT_TYPE_URL,
      method: "get",
      params: queryParams,
    });
  },

  /** 字典类型下拉选项 */
  async getList(): Promise<OptionItem[]> {
    const data = await request<unknown, PageResult<DictTypeItem>>({
      url: DICT_TYPE_URL,
      method: "get",
      params: { page: 1, pageSize: 0 },
    });
    return (data.items ?? []).map((item) => ({
      value: item.id,
      label: item.name,
    }));
  },

  /** 字典类型详情（表单回显） */
  getFormData(id: string) {
    return request<unknown, DictTypeForm>({
      url: `${DICT_TYPE_URL}/${id}`,
      method: "get",
    });
  },

  /** 新增字典类型 */
  create(data: DictTypeForm) {
    return request({ url: DICT_TYPE_URL, method: "post", data });
  },

  /** 修改字典类型 */
  update(id: string, data: DictTypeForm) {
    return request({ url: `${DICT_TYPE_URL}/${id}`, method: "put", data });
  },

  /** 删除字典类型（支持批量） */
  deleteByIds(ids: string) {
    const idList = ids.split(",").filter(Boolean);
    return Promise.all(
      idList.map((id) =>
        request({ url: `${DICT_TYPE_URL}/${id}`, method: "delete" })
      )
    );
  },

  /** 字典项分页列表 */
  getDictItemPage(dictTypeId: string, queryParams: DictItemQueryParams) {
    return request<unknown, PageResult<DictItem>>({
      url: DICT_ITEM_URL,
      method: "get",
      params: { ...queryParams, dictTypeId },
    });
  },

  /** 按编码获取字典项（供下拉/标签组件使用） */
  getDictItems(dictCode: string) {
    return request<unknown, DictItemOption[]>({
      url: `${DICT_TYPE_URL}/${dictCode}/items`,
      method: "get",
    });
  },

  /** 新增字典项 */
  createDictItem(data: DictItemForm) {
    return request({ url: DICT_ITEM_URL, method: "post", data });
  },

  /** 字典项详情（表单回显） */
  getDictItemFormData(id: string) {
    return request<unknown, DictItemForm>({
      url: `${DICT_ITEM_URL}/${id}`,
      method: "get",
    });
  },

  /** 修改字典项 */
  updateDictItem(id: string, data: DictItemForm) {
    return request({ url: `${DICT_ITEM_URL}/${id}`, method: "put", data });
  },

  /** 删除字典项（支持批量） */
  deleteDictItems(ids: string) {
    const idList = ids.split(",").filter(Boolean);
    return Promise.all(
      idList.map((id) =>
        request({ url: `${DICT_ITEM_URL}/${id}`, method: "delete" })
      )
    );
  },
};

export default DictAPI;

export * from "./types";
