/**
 * User 用户类型定义
 */

import type { BaseQueryParams } from "@/api/common";

/** 登录用户信息（前端使用，由后端 UserProfile 转换而来） */
export interface UserInfo {
  /** 用户ID */
  userId?: string;
  /** 用户名 */
  username?: string;
  /** 用户昵称 */
  nickname?: string | null;
  /** 真实姓名 */
  realName?: string | null;
  /** 头像文件 ID */
  avatarFileId?: string | null;
  /** 邮箱 */
  email?: string | null;
  /** 手机号 */
  phone?: string | null;
  /** 性别（0=未知 1=男 2=女） */
  gender?: number;
  /** 状态（0=禁用 1=启用） */
  status?: number;
  /** 是否超级管理员 */
  isSuperAdmin?: boolean;
  /** 部门ID */
  deptId?: string | null;
  /** 数据范围 */
  dataScope?: number;
  /** 角色集合 */
  roles: string[];
  /** 权限集合 */
  perms: string[];
}

/** 用户分页查询参数 */
export interface UserQueryParams extends BaseQueryParams {
  /** 用户名 */
  username?: string;
  /** 昵称 */
  nickname?: string;
  /** 部门ID */
  deptId?: string;
  /** 状态 */
  status?: number;
}

/** 用户列表项 */
export interface UserItem {
  /** 用户ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname: string | null;
  /** 真实姓名 */
  realName: string | null;
  /** 头像文件 ID */
  avatarFileId: string | null;
  /** 邮箱 */
  email: string | null;
  /** 手机号 */
  phone: string | null;
  /** 性别 */
  gender: number;
  /** 状态（0=禁用 1=启用） */
  status: number;
  /** 是否超级管理员 */
  isSuperAdmin: boolean;
  /** 部门ID */
  deptId: string | null;
  /** 数据范围 */
  dataScope: number;
  /** 备注 */
  remark: string | null;
  /** 最后登录时间 */
  lastLoginAt: string | null;
  /** 最后登录IP */
  lastLoginIp: string | null;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** 用户表单对象（新增/编辑） */
export interface UserForm {
  /** 用户ID（编辑时使用） */
  id?: string;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname?: string;
  /** 真实姓名 */
  realName?: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 性别（0=未知 1=男 2=女） */
  gender?: number;
  /** 部门ID */
  deptId?: string;
  /** 头像文件 ID */
  avatarFileId?: string | null;
  /** 状态（0=禁用 1=启用） */
  status?: number;
  /** 备注 */
  remark?: string;
  /** 初始密码（仅新增） */
  password?: string;
}

/** 用户详情（含角色ID列表） */
export interface UserDetail {
  id: string;
  username: string;
  nickname: string | null;
  realName: string | null;
  avatarFileId: string | null;
  email: string | null;
  phone: string | null;
  gender: number;
  status: number;
  isSuperAdmin: boolean;
  deptId: string | null;
  dataScope: number;
  remark: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
  updatedAt: string;
  /** 角色 ID 列表 */
  roleIds: string[];
}

/** 分配角色请求 */
export interface AssignRolesRequest {
  /** 角色 ID 列表 */
  roleIds: string[];
}

/** 设置数据范围请求 */
export interface AssignDataScopeRequest {
  /** 数据范围：1=全部 2=本人 3=本部门 4=本部门及以下 5=自定义 */
  dataScope: number;
  /** 自定义部门 ID 列表（dataScope=5 时有效） */
  deptIds?: string[];
}

/** 重置密码请求 */
export interface ResetPasswordRequest {
  /** 新密码 */
  password: string;
}

// ============================================
// 以下类型用于个人中心页面兼容（部分功能后端暂未实现）
// ============================================

/** 用户详情（个人中心用） */
export interface UserProfileDetail {
  id?: string;
  userId?: string;
  username?: string;
  nickname?: string | null;
  realName?: string | null;
  avatarFileId?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  mobile?: string | null;
  phone?: string | null;
  gender?: number;
  deptId?: string | null;
  deptName?: string;
  roles?: string[];
  roleNames?: string;
  perms?: string[];
  createTime?: string;
}

/** 修改密码表单 */
export interface PasswordChangeForm {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

/** 手机号绑定表单 */
export interface MobileUpdateForm {
  mobile?: string;
  code?: string;
  password?: string;
}

/** 邮箱绑定表单 */
export interface EmailUpdateForm {
  email?: string;
  code?: string;
  password?: string;
}

/** 个人资料表单 */
export interface UserProfileForm {
  nickname?: string | null;
  avatarFileId?: string | null;
  gender?: number;
}
