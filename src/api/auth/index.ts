import request from "@/utils/request";
import type {
  BindIdentityRequest,
  CaptchaInfo,
  LinkExistingRequest,
  LoginRequest,
  LoginResponse,
  OAuthAuthUrlResponse,
  OAuthExchangeRequest,
  OAuthIdentity,
  OAuthProvider,
  OAuthRegisterRequest,
  PublicKeyResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UserProfile,
} from "./types";

const AUTH_BASE_URL = "/api/v1/auth";

const AuthAPI = {
  /** 登录接口 */
  login(data: LoginRequest) {
    const payload: Pick<
      LoginRequest,
      "username" | "password" | "captchaKey" | "captchaCode"
    > = {
      username: data.username,
      password: data.password,
    };

    if (data.captchaKey) payload.captchaKey = data.captchaKey;
    if (data.captchaCode) payload.captchaCode = data.captchaCode;

    return request<unknown, LoginResponse>({
      url: `${AUTH_BASE_URL}/login`,
      method: "post",
      data: payload,
    });
  },

  /** 刷新 token 接口 */
  refreshToken(refreshToken: string) {
    return request<unknown, RefreshTokenResponse>({
      url: `${AUTH_BASE_URL}/refresh`,
      method: "post",
      data: { refreshToken } satisfies RefreshTokenRequest,
      headers: {
        Authorization: "no-auth",
      },
    });
  },

  /** 退出登录接口 */
  logout() {
    return request({
      url: `${AUTH_BASE_URL}/logout`,
      method: "post",
    });
  },

  /** 获取验证码接口 */
  getCaptcha() {
    return request<unknown, CaptchaInfo>({
      url: `${AUTH_BASE_URL}/captcha`,
      method: "get",
    });
  },

  /** 获取 RSA 公钥 */
  getPublicKey() {
    return request<unknown, PublicKeyResponse>({
      url: `${AUTH_BASE_URL}/public-key`,
      method: "get",
    });
  },

  /** 获取当前登录用户信息 */
  getProfile() {
    return request<unknown, UserProfile>({
      url: `${AUTH_BASE_URL}/profile`,
      method: "get",
    });
  },

  /** 获取 OAuth 授权 URL */
  getOAuthAuthUrl(provider: OAuthProvider, mode?: "login" | "bind") {
    return request<unknown, OAuthAuthUrlResponse>({
      url: `${AUTH_BASE_URL}/oauth/${provider}/auth-url`,
      method: "get",
      params: mode ? { mode } : undefined,
    });
  },

  /** 用一次性交换码换取 JWT */
  exchangeOAuthCode(data: OAuthExchangeRequest) {
    return request<unknown, LoginResponse>({
      url: `${AUTH_BASE_URL}/oauth/exchange`,
      method: "post",
      data,
    });
  },

  /** 首次 OAuth 登录：创建新账号 */
  registerOAuthAccount(data: OAuthRegisterRequest) {
    return request<unknown, LoginResponse>({
      url: `${AUTH_BASE_URL}/oauth/register`,
      method: "post",
      data,
    });
  },

  /** 首次 OAuth 登录：关联已有账号 */
  linkExistingOAuth(data: LinkExistingRequest) {
    return request<unknown, LoginResponse>({
      url: `${AUTH_BASE_URL}/oauth/link-existing`,
      method: "post",
      data,
    });
  },

  /** 绑定第三方账号 */
  bindOAuthIdentity(data: BindIdentityRequest) {
    return request({
      url: `${AUTH_BASE_URL}/oauth/bind`,
      method: "post",
      data,
    });
  },

  /** 解绑第三方账号 */
  unbindOAuthIdentity(identityId: string) {
    return request({
      url: `${AUTH_BASE_URL}/oauth/identities/${identityId}`,
      method: "delete",
    });
  },

  /** 查询已绑定的第三方账号 */
  getOAuthIdentities() {
    return request<unknown, OAuthIdentity[]>({
      url: `${AUTH_BASE_URL}/oauth/identities`,
      method: "get",
    });
  },
};

export default AuthAPI;

// 重导出类型
export * from "./types";
