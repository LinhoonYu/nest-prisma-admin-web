/**
 * Role 角色类型定义
 */

import type { BaseQueryParams } from "@/api/common";

/** 角色分页查询参数 */
export interface RoleQueryParams extends BaseQueryParams {
  /** 角色名称 */
  name?: string;
  /** 角色编码 */
  code?: string;
  /** 状态 */
  status?: number;
}

/** 角色列表项 */
export interface RoleItem {
  /** 角色ID */
  id: string;
  /** 角色编码 */
  code: string;
  /** 角色名称 */
  name: string;
  /** 排序 */
  sort: number;
  /** 状态（0=禁用 1=启用） */
  status: number;
  /** 是否系统内置 */
  isSystem: boolean;
  /** 备注 */
  remark: string | null;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** 角色表单对象 */
export interface RoleForm {
  /** 角色编码 */
  code: string;
  /** 角色名称 */
  name: string;
  /** 排序 */
  sort?: number;
  /** 状态（0=禁用 1=启用） */
  status?: number;
  /** 备注 */
  remark?: string;
}

/** 角色详情（含菜单ID和权限ID列表） */
export interface RoleDetail {
  id: string;
  code: string;
  name: string;
  sort: number;
  status: number;
  isSystem: boolean;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
  /** 菜单 ID 列表 */
  menuIds: string[];
  /** 权限 ID 列表 */
  permissionIds: string[];
}

/** 分配菜单请求 */
export interface AssignMenusRequest {
  /** 菜单 ID 列表 */
  menuIds: string[];
}

/** 分配权限请求 */
export interface AssignPermissionsRequest {
  /** 权限 ID 列表 */
  permissionIds: string[];
}
