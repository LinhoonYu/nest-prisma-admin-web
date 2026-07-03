import request from "@/utils/request";
import type {
  LoginRequest,
  LoginResponse,
  CaptchaInfo,
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
      "username" | "password" | "encPassword" | "captchaKey" | "captchaCode"
    > = {
      username: data.username,
    };

    // 密码字段：RSA 加密时传 encPassword，否则传 password
    if (data.encPassword) {
      payload.encPassword = data.encPassword;
    } else if (data.password) {
      payload.password = data.password;
    }

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
};

export default AuthAPI;

// 重导出类型
export * from "./types";
