/**
 * 通用 API 类型定义
 */

/** API 响应结构 */
export interface ApiResponse<T = unknown> {
  /** 响应码（0 表示成功） */
  code: number;
  /** 响应数据 */
  data: T;
  /** 响应消息 */
  message: string;
}

/** 基础查询参数（分页） */
export interface BaseQueryParams {
  /** 页码 */
  page: number;
  /** 每页记录数 */
  pageSize: number;
  /** 排序字段 */
  orderField?: string;
  /** 排序方式（asc / desc） */
  orderSort?: "asc" | "desc";
}

/** 分页数据结构 */
export interface PageResult<T> {
  /** 数据列表 */
  items: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
}

/** 下拉选项 */
export interface OptionItem {
  /** 选项值 */
  value: string | number;
  /** 选项标签 */
  label: string;
  /** 子选项 */
  children?: OptionItem[];
}

/** Excel 导入结果 */
export interface ExcelResult {
  /** 无效数据数量 */
  invalidCount: number;
  /** 有效数据数量 */
  validCount: number;
  /** 错误信息列表 */
  messageList: string[];
}
