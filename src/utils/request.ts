import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios";
import qs from "qs";
import { ApiCodeEnum } from "@/enums/api";
import { useUserStoreHook } from "@/stores/user";
import { usePermissionStoreHook } from "@/stores/permission";
import { AuthStorage, redirectToLogin } from "@/utils/auth";
import { STORAGE_KEYS } from "@/constants";
import type { ApiResponse } from "@/api/common";

// 延迟获取 i18n 的 t 函数，避免模块加载阶段的循环依赖
async function tt(key: string): Promise<string> {
  const { default: i18n } = await import("@/lang");
  return i18n.global.t(key);
}

// 记录已重试的请求，防止无限循环
const retriedConfigs = new WeakSet<InternalAxiosRequestConfig>();

// HTTP 请求实例
const http = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 50000,
  headers: { "Content-Type": "application/json;charset=utf-8" },
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
});

// 请求拦截器
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = AuthStorage.getAccessToken();

    if (config.headers.Authorization === "no-auth") {
      delete config.headers.Authorization;
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["Accept-Language"] =
      localStorage.getItem(STORAGE_KEYS.LANGUAGE) || "zh-cn";

    return config;
  },
  (error) => Promise.reject(error)
);

// 需要刷新 token 的错误码
const TOKEN_EXPIRED_CODES = new Set<number>([
  ApiCodeEnum.TOKEN_EXPIRED,
  ApiCodeEnum.TOKEN_INVALID,
  ApiCodeEnum.UNAUTHORIZED,
]);

// 需要直接跳登录的错误码（无法续期）
const FORCE_LOGIN_CODES = new Set<number>([
  ApiCodeEnum.REFRESH_TOKEN_INVALID,
  ApiCodeEnum.REFRESH_TOKEN_REUSE_DETECTED,
  ApiCodeEnum.SESSION_EXPIRED,
  ApiCodeEnum.SESSION_REVOKED,
  ApiCodeEnum.TOKEN_MISSING,
]);

// 权限不足的错误码
const PERMISSION_DENIED_CODES = new Set<number>([
  ApiCodeEnum.PERMISSION_DENIED,
  ApiCodeEnum.FORBIDDEN,
]);

/**
 * 处理业务错误码（HTTP 200 但 code !== 0）
 *
 * 后端 ApiException 全部以 HTTP 200 返回，错误码在 body.code 中。
 */
async function handleBusinessError(
  code: number,
  message: string,
  config: InternalAxiosRequestConfig | undefined
): Promise<unknown> {
  // 需要刷新 token 的错误码
  if (TOKEN_EXPIRED_CODES.has(code)) {
    if (!config || retriedConfigs.has(config)) {
      await redirectToLogin(await tt("request.tokenExpired"));
      throw new Error("Token Invalid");
    }

    retriedConfigs.add(config);

    try {
      const userStore = useUserStoreHook();
      await userStore.refreshTokenOnce();

      const token = AuthStorage.getAccessToken();
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }

      return http(config);
    } catch {
      await redirectToLogin(await tt("request.tokenExpired"));
      throw new Error("Token refresh failed");
    }
  }

  // 无法续期，直接跳登录
  if (FORCE_LOGIN_CODES.has(code)) {
    await redirectToLogin(await tt("request.tokenExpired"), false);
    throw new Error(message || "Token Invalid");
  }

  // 权限不足：刷新权限快照后提示
  if (PERMISSION_DENIED_CODES.has(code)) {
    const permissionStore = usePermissionStoreHook();
    await permissionStore.reloadPermissionSnapshotOnce();
    const fallback = await tt("request.permissionDenied");
    ElMessage.error(message || fallback);
    throw new Error(message || fallback);
  }

  // 其他业务错误
  const fallback = await tt("request.systemError");
  ElMessage.error(message || fallback);
  throw new Error(message || fallback);
}

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>): any => {
    const { responseType } = response.config;

    // 二进制数据直接返回
    if (responseType === "blob" || responseType === "arraybuffer") {
      return response;
    }

    const { code, data, message } = response.data;

    if (code === ApiCodeEnum.SUCCESS) {
      return data;
    }

    // 业务错误（HTTP 200 但 code !== 0）
    return handleBusinessError(code, message, response.config);
  },

  async (error) => {
    const { config, response } = error;

    if (!response) {
      ElMessage.error(await tt("request.networkError"));
      throw error;
    }

    // HTTP 非 2xx 错误，尝试从 body 读取错误信息
    const body = response.data as ApiResponse | undefined;
    const code = body?.code ?? response.status;
    const message = body?.message ?? (await tt("request.requestFailed"));

    // 走统一的业务错误处理
    return handleBusinessError(code, message, config);
  }
);

export default http;
