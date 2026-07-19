/**
 * 数据格式化相关工具函数
 */

import { dayjs } from "element-plus";

/**
 * 格式化日期时间
 *
 * 后端返回 ISO 8601 字符串（如 "2026-07-17T12:23:50.831Z"），
 * 该函数将其转为本地时区的可读格式。
 *
 * @param value 日期值（ISO 字符串、Date 对象、时间戳）
 * @param format 格式模板，默认 "YYYY-MM-DD HH:mm:ss"
 * @returns 格式化后的字符串，空值返回 "-"
 *
 * @example
 * ```ts
 * formatDateTime("2026-07-17T12:23:50.831Z");  // "2026-07-17 20:23:50"（UTC+8）
 * formatDateTime(null);                         // "-"
 * formatDateTime("2026-07-17T12:23:50.831Z", "YYYY-MM-DD");  // "2026-07-17"
 * ```
 */
export function formatDateTime(
  value: string | Date | number | null | undefined,
  format: string = "YYYY-MM-DD HH:mm:ss",
): string {
  if (!value) return "-";
  return dayjs(value).format(format);
}

/**
 * 格式化增长率
 * 保留两位小数，去掉末尾的 0，取绝对值
 *
 * @param growthRate 增长率（小数形式，如 0.15 表示 15%）
 * @returns 格式化后的增长率字符串
 *
 * @example
 * ```ts
 * formatGrowthRate(0.1234);  // "12.34%"
 * formatGrowthRate(0.1000);  // "10%"
 * formatGrowthRate(0);       // "-"
 * formatGrowthRate(-0.05);   // "5%"（取绝对值）
 * ```
 */
export function formatGrowthRate(growthRate: number): string {
  if (growthRate === 0) {
    return "-";
  }

  const formattedRate = Math.abs(growthRate * 100)
    .toFixed(2)
    .replace(/\.?0+$/, "");

  return formattedRate + "%";
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 保留小数位数，默认 2
 * @returns 格式化后的文件大小字符串
 *
 * @example
 * ```ts
 * formatFileSize(1024);      // "1 KB"
 * formatFileSize(1048576);   // "1 MB"
 * formatFileSize(1234567);   // "1.18 MB"
 * ```
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}

/**
 * 格式化数字，添加千分位分隔符
 * @param num 数字
 * @returns 格式化后的字符串
 *
 * @example
 * ```ts
 * formatNumber(1234567);     // "1,234,567"
 * formatNumber(1234567.89);  // "1,234,567.89"
 * ```
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * 格式化金额（人民币）
 * @param amount 金额
 * @param decimals 保留小数位数，默认 2
 * @returns 格式化后的金额字符串
 *
 * @example
 * ```ts
 * formatCurrency(1234567);      // "¥1,234,567.00"
 * formatCurrency(1234567.8);    // "¥1,234,567.80"
 * formatCurrency(1234567, 0);   // "¥1,234,567"
 * ```
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  const formatted = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return "¥" + formatted;
}
