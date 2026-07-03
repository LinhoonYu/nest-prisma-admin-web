/**
 * 业务相关枚举
 *
 * @description
 * 包含菜单、用户、角色等业务实体的枚举定义
 */

/**
 * 菜单类型枚举
 *
 * 与后端 MenuType 保持一致
 */
export enum MenuTypeEnum {
  /** 目录 */
  CATALOG = 1,
  /** 菜单 */
  MENU = 2,
  /** 外链 */
  LINK = 3,
  /** 内嵌 */
  IFRAME = 4,
}

/**
 * 用户性别枚举
 */
export enum UserGender {
  /** 未知 */
  UNKNOWN = 0,
  /** 男 */
  MALE = 1,
  /** 女 */
  FEMALE = 2,
}
