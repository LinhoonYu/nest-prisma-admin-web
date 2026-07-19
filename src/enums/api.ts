/**
 * API 相关枚举
 *
 * @description
 * 与后端 error-code.ts 保持一致
 */

/**
 * API 响应码枚举
 */
export const enum ApiCodeEnum {
  /** 成功 */
  SUCCESS = 0,

  /** 通用错误 */
  ERROR = 1,

  /** 未认证（HTTP 401） */
  UNAUTHORIZED = 401,

  /** 禁止访问（HTTP 403） */
  FORBIDDEN = 403,

  /** 资源不存在（HTTP 404） */
  NOT_FOUND = 404,

  /** 请求过多（HTTP 429） */
  TOO_MANY_REQUESTS = 429,

  /** 服务器内部错误（HTTP 500） */
  INTERNAL_SERVER_ERROR = 500,

  // ===== 业务错误码 1xxx =====
  /** 账号已禁用 */
  ACCOUNT_DISABLED = 1001,

  /** 账号已过期 */
  ACCOUNT_EXPIRED = 1002,

  /** 账号不存在 */
  ACCOUNT_NOT_FOUND = 1003,

  /** 密码错误 */
  PASSWORD_ERROR = 1004,

  /** 验证码错误 */
  CAPTCHA_ERROR = 1005,

  /** Token 已过期 */
  TOKEN_EXPIRED = 1006,

  /** Token 无效 */
  TOKEN_INVALID = 1007,

  /** Token 缺失 */
  TOKEN_MISSING = 1008,

  /** 用户名或密码错误 */
  ACCOUNT_OR_PASSWORD_ERROR = 1009,

  /** 用户名已存在 */
  DUPLICATE_USERNAME = 1010,

  /** 邮箱已存在 */
  DUPLICATE_EMAIL = 1011,

  /** 账号已锁定 */
  ACCOUNT_LOCKED = 1012,

  /** 请求参数错误 */
  BAD_REQUEST = 1013,

  /** 系统数据不可修改 */
  SYSTEM_DATA_CODE_IMMUTABLE = 1014,

  /** 演示账号受保护 */
  PROTECTED_USER = 1015,

  /** 系统内置数据不可删除 */
  SYSTEM_DATA_CANNOT_DELETE = 1016,

  // ===== 权限相关 2xxx =====
  /** 权限不足 */
  PERMISSION_DENIED = 2001,

  /** 角色不存在 */
  ROLE_NOT_FOUND = 2002,

  /** 菜单不存在 */
  MENU_NOT_FOUND = 2003,

  /** 部门不存在 */
  DEPT_NOT_FOUND = 2004,

  /** 字典不存在 */
  DICT_NOT_FOUND = 2005,

  /** 权限不存在 */
  PERMISSION_NOT_FOUND = 2006,

  /** 用户不存在 */
  USER_NOT_FOUND = 2007,

  // ===== 会话相关 3xxx =====
  /** 会话已过期 */
  SESSION_EXPIRED = 3001,

  /** 会话已撤销 */
  SESSION_REVOKED = 3002,

  /** 检测到刷新令牌复用 */
  REFRESH_TOKEN_REUSE_DETECTED = 3004,

  /** 刷新令牌无效或已过期 */
  REFRESH_TOKEN_INVALID = 3005,

  /** 需要修改密码 */
  MUST_CHANGE_PASSWORD = 3006,

  // ===== RSA 加密相关 4xxx =====
  /** RSA 加密未启用 */
  RSA_DISABLED = 4001,

  /** RSA 公钥不可用 */
  RSA_PUBLIC_KEY_UNAVAILABLE = 4002,

  /** RSA 解密失败 */
  RSA_DECRYPT_FAILED = 4003,

  // ===== 文件相关 5xxx =====
  /** 文件不存在 */
  FILE_NOT_FOUND = 5001,

  /** 文件过大 */
  FILE_TOO_LARGE = 5002,

  // ===== 通知相关 6xxx =====
  /** 通知不存在 */
  NOTICE_NOT_FOUND = 6001,

  /** 通知已发布 */
  NOTICE_ALREADY_PUBLISHED = 6002,

  /** 通知未发布 */
  NOTICE_NOT_PUBLISHED = 6003,

  // ===== 系统配置相关 7xxx =====
  /** 配置不存在 */
  CONFIG_NOT_FOUND = 7001,

  /** 配置键已存在 */
  DUPLICATE_CONFIG_KEY = 7002,

  /** 系统配置不可修改 */
  SYSTEM_CONFIG_CANNOT_MODIFY = 7003,

  // ===== OAuth 相关 8xxx =====
  /** OAuth 提供商未启用 */
  OAUTH_PROVIDER_DISABLED = 8001,

  /** OAuth 提供商不存在 */
  OAUTH_PROVIDER_NOT_FOUND = 8002,

  /** OAuth state 无效 */
  OAUTH_STATE_INVALID = 8003,

  /** OAuth code 交换失败 */
  OAUTH_CODE_EXCHANGE_FAILED = 8004,

  /** OAuth 用户信息获取失败 */
  OAUTH_USER_INFO_FAILED = 8005,

  /** OAuth 交换码无效或已过期 */
  OAUTH_EXCHANGE_CODE_INVALID = 8006,

  /** 第三方账号已被绑定 */
  OAUTH_IDENTITY_ALREADY_BOUND = 8007,

  /** 已绑定该登录方式 */
  OAUTH_PROVIDER_ALREADY_LINKED = 8008,

  /** 无法解绑最后一个登录方式 */
  OAUTH_CANNOT_UNBIND_LAST_IDENTITY = 8009,

  /** OAuth 待处理码无效或已过期 */
  OAUTH_PENDING_INVALID = 8010,
}
