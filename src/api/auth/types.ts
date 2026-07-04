/**
 * 认证相关类型定义
 */

/**
 * 登录请求参数
 */
export interface LoginRequest {
  /** 用户名 */
  username: string;
  /** 密码（RSA 关闭时为明文，开启时为加密密文） */
  password: string;
  /** 验证码缓存 key */
  captchaKey?: string;
  /** 验证码 */
  captchaCode?: string;
  /** 记住我 */
  rememberMe?: boolean;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 是否需要修改密码 */
  mustChangePassword?: boolean;
}

/**
 * 验证码响应
 */
export interface CaptchaInfo {
  /** 验证码缓存 key */
  key: string;
  /** 验证码 SVG 图片 */
  svg: string;
}

/**
 * RSA 公钥响应
 */
export interface PublicKeyResponse {
  /** RSA 公钥（PEM 格式，SPKI 编码） */
  publicKey: string;
}

/**
 * 刷新令牌请求参数
 */
export interface RefreshTokenRequest {
  /** 刷新令牌 */
  refreshToken: string;
}

/**
 * 刷新令牌响应
 */
export interface RefreshTokenResponse {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
}

/**
 * 当前用户信息（GET /auth/profile 返回）
 */
export interface UserProfile {
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
  /** 性别（0=未知 1=男 2=女） */
  gender: number;
  /** 状态（0=禁用 1=启用） */
  status: number;
  /** 是否超级管理员 */
  isSuperAdmin: boolean;
  /** 部门ID */
  deptId: string | null;
  /** 部门名称 */
  deptName?: string;
  /** 数据范围（1=全部 2=本人 3=本部门 4=本部门及以下 5=自定义） */
  dataScope: number;
  /** 角色编码集合 */
  roles: string[];
  /** 权限编码集合 */
  permissions: string[];
}
