import { ref, watch, type Ref } from "vue";

import FileAPI from "@/api/file";
import { fileProxyUrl } from "@/api/file";

interface CacheEntry {
  url: string;
  expiry: number;
}

const urlCache = new Map<string, CacheEntry>();
const CACHE_SAFETY_MARGIN = 60_000;

function getCachedUrl(key: string): string | undefined {
  const entry = urlCache.get(key);
  if (entry && entry.expiry > Date.now() + CACHE_SAFETY_MARGIN) {
    return entry.url;
  }
  if (entry) {
    urlCache.delete(key);
  }
  return undefined;
}

function setCachedUrl(key: string, url: string, ttlMs: number): void {
  urlCache.set(key, { url, expiry: Date.now() + ttlMs });
  if (urlCache.size > 200) {
    const now = Date.now();
    for (const [k, v] of urlCache) {
      if (v.expiry <= now) urlCache.delete(k);
    }
  }
}

/**
 * 根据文件 key 获取预签名 URL（带缓存）
 *
 * 用于需要直接访问 S3 的场景（大文件下载等）。
 * 图片展示请直接用 fileProxyUrl，无需走预签名。
 */
export async function getPresignedUrl(
  key: string,
  ttlMs = 3000_000,
): Promise<string> {
  const cached = getCachedUrl(key);
  if (cached) return cached;

  const { url } = await FileAPI.presign(key);
  setCachedUrl(key, url, ttlMs);
  return url;
}

/**
 * 响应式地根据文件 key 获取预签名 URL
 *
 * 自动处理加载和过期刷新
 */
export function useFileUrl(key: string | Ref<string | null | undefined>) {
  const url = ref<string>("");
  const loading = ref(false);

  const keyRef = typeof key === "string" ? ref(key) : key;

  async function load() {
    const k = keyRef.value;
    if (!k) {
      url.value = "";
      return;
    }

    const cached = getCachedUrl(k);
    if (cached) {
      url.value = cached;
      return;
    }

    loading.value = true;
    try {
      const res = await FileAPI.presign(k);
      setCachedUrl(k, res.url, 3000_000);
      url.value = res.url;
    } finally {
      loading.value = false;
    }
  }

  watch(keyRef, load, { immediate: true });

  return { url, loading, refresh: load };
}

export { fileProxyUrl };
