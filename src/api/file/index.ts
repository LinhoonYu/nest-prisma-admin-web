import request from "@/utils/request";
import type { FileInfo, FilePresignResult } from "./types";

const FILE_BASE_URL = "/api/v1/files";

/**
 * 拼接文件代理访问 URL（永久有效，可被浏览器缓存）
 *
 * 用于 <img :src> 等需要永久 URL 的场景（头像、富文本图片等）
 * 需要带上 API 前缀，因为这些 URL 不走 axios，浏览器直接请求
 */
export function fileProxyUrl(
  fileId: string | number | null | undefined,
): string {
  if (!fileId) return "";
  return `${import.meta.env.VITE_APP_BASE_API}${FILE_BASE_URL}/proxy/${fileId}`;
}

const FileAPI = {
  /** 上传文件（传入 FormData，支持上传进度回调） */
  upload(formData: FormData, onProgress?: (percent: number) => void) {
    return request<unknown, FileInfo>({
      url: FILE_BASE_URL,
      method: "post",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress?.(percent);
        }
      },
    });
  },

  /** 上传文件（传入 File 对象） */
  uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<unknown, FileInfo>({
      url: FILE_BASE_URL,
      method: "post",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** 删除文件 */
  delete(key: string) {
    return request({
      url: FILE_BASE_URL,
      method: "delete",
      params: { key },
    });
  },

  /** 获取文件预签名 URL（用于大文件下载，URL 有过期时间） */
  presign(key: string) {
    return request<unknown, FilePresignResult>({
      url: `${FILE_BASE_URL}/presign`,
      method: "get",
      params: { key },
    });
  },

  /**
   * 下载文件（先获取预签名 URL，再通过 blob 下载）
   *
   * 走预签名直连 S3，避免大文件经过后端代理
   */
  async download(key: string, fileName?: string) {
    const { url } = await FileAPI.presign(key);
    const res = await fetch(url);
    if (!res.ok) throw new Error("文件下载失败");
    const blob = await res.blob();
    const a = document.createElement("a");
    const objectUrl = window.URL.createObjectURL(blob);
    a.href = objectUrl;
    a.download = fileName || "下载文件";
    a.click();
    window.URL.revokeObjectURL(objectUrl);
  },
};

export default FileAPI;

export * from "./types";
