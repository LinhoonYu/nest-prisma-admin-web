/** 文件上传结果 */
export interface FileInfo {
  /** 文件 ID */
  id: string;
  /** 原始文件名 */
  name: string;
  /** 存储 key */
  key: string;
  /** 文件大小（字节） */
  size: string;
  /** MIME 类型 */
  mimeType: string;
}

/** 预签名 URL 结果 */
export interface FilePresignResult {
  /** 原始文件名 */
  name: string;
  /** MIME 类型 */
  mimeType: string;
  /** 预签名 URL（有过期时间） */
  url: string;
}
