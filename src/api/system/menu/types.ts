/**
 * Menu 菜单类型定义
 */

/** 菜单查询参数 */
export interface MenuQueryParams {
  /** 显示标题 */
  title?: string;
  /** 类型（1=目录 2=菜单 3=链接 4=iframe） */
  type?: number;
  /** 状态（0=禁用 1=启用） */
  status?: number;
}

/** 菜单类型枚举 */
export const enum MenuType {
  /** 目录 */
  DIRECTORY = 1,
  /** 菜单 */
  MENU = 2,
  /** 外链 */
  LINK = 3,
  /** 内嵌 */
  IFRAME = 4,
}

/** 菜单树形列表项 */
export interface MenuItem {
  /** 子菜单 */
  children?: MenuItem[];
  /** 菜单ID */
  id: string;
  /** 父菜单ID */
  parentId: string | null;
  /** 类型（1=目录 2=菜单 3=链接 4=iframe） */
  type: number;
  /** 路由名称（唯一） */
  name: string;
  /** 显示标题 */
  title: string;
  /** 路由路径 */
  path: string | null;
  /** 组件路径 */
  component: string | null;
  /** 重定向路径 */
  redirect: string | null;
  /** 图标 */
  icon: string | null;
  /** 排序 */
  sort: number;
  /** 是否隐藏（0=显示 1=隐藏） */
  hidden: number;
  /** 是否缓存（0=否 1=是） */
  keepAlive: number;
  /** 始终显示（0=否 1=是） */
  alwaysShow: number;
  /** 外链 URL */
  externalUrl: string | null;
  /** 高亮菜单ID */
  activeMenuId: string | null;
  /** 状态（0=禁用 1=启用） */
  status: number;
  /** 备注 */
  remark: string | null;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** 菜单表单对象 */
export interface MenuForm {
  /** 父菜单ID */
  parentId?: string;
  /** 类型（1=目录 2=菜单 3=链接 4=iframe） */
  type: number;
  /** 路由名称（唯一） */
  name: string;
  /** 显示标题 */
  title: string;
  /** 路由路径 */
  path?: string;
  /** 组件路径 */
  component?: string;
  /** 重定向路径 */
  redirect?: string;
  /** 图标 */
  icon?: string;
  /** 排序 */
  sort?: number;
  /** 是否隐藏（0=显示 1=隐藏） */
  hidden?: number;
  /** 是否缓存（0=否 1=是） */
  keepAlive?: number;
  /** 始终显示（0=否 1=是） */
  alwaysShow?: number;
  /** 外链 URL */
  externalUrl?: string;
  /** 高亮菜单ID */
  activeMenuId?: string;
  /** 状态（0=禁用 1=启用） */
  status?: number;
  /** 备注 */
  remark?: string;
}

/** 路由对象（前端动态路由用） */
export interface RouteItem {
  /** 子路由列表 */
  children: RouteItem[];
  /** 组件路径（"Layout" 表示布局组件） */
  component?: string;
  /** 路由名称 */
  name?: string;
  /** 路由路径 */
  path?: string;
  /** 路由属性 */
  meta?: Meta;
  /** 跳转链接 */
  redirect?: string;
}

/** 路由属性 */
export interface Meta {
  /** 目录只有一个子路由时是否始终显示 */
  alwaysShow?: boolean;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 图标 */
  icon?: string;
  /** 是否开启页面缓存 */
  keepAlive?: boolean;
  /** 路由参数 */
  params?: Record<string, unknown>;
  /** 角色集合 */
  roles?: string[];
  /** 路由标题 */
  title?: string;
}
