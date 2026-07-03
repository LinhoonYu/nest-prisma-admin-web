/**
 * Dept 部门类型定义
 */

/** 部门查询参数 */
export interface DeptQueryParams {
  /** 部门名称 */
  name?: string;
  /** 部门编码 */
  code?: string;
  /** 状态 */
  status?: number;
}

/** 部门树形列表项 */
export interface DeptItem {
  /** 子部门 */
  children?: DeptItem[];
  /** 部门ID */
  id: string;
  /** 父部门ID */
  parentId: string | null;
  /** 部门名称 */
  name: string;
  /** 部门编码 */
  code: string;
  /** 排序 */
  sort: number;
  /** 负责人ID */
  leaderUserId: string | null;
  /** 联系电话 */
  phone: string | null;
  /** 邮箱 */
  email: string | null;
  /** 状态（0=禁用 1=启用） */
  status: number;
  /** 备注 */
  remark: string | null;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** 部门表单对象 */
export interface DeptForm {
  /** 父部门ID */
  parentId?: string;
  /** 部门名称 */
  name: string;
  /** 部门编码 */
  code: string;
  /** 排序 */
  sort?: number;
  /** 负责人ID */
  leaderUserId?: string;
  /** 联系电话 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 状态（0=禁用 1=启用） */
  status?: number;
  /** 备注 */
  remark?: string;
}
