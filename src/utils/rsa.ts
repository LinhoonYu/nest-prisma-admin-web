/**
 * RSA 加密工具（基于 Web Crypto API）
 *
 * 后端使用 RSA-OAEP + SHA-256，公钥为 PEM 格式（SPKI 编码）。
 * 前端使用 crypto.subtle 对应的 RSA-OAEP + SHA-256 进行加密。
 */

/**
 * 将 PEM 格式的公钥转换为 ArrayBuffer（DER 编码）
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s/g, "");

  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 使用 RSA-OAEP/SHA-256 加密文本，返回 Base64 编码的密文
 */
export async function rsaEncrypt(publicKeyPem: string, plaintext: string): Promise<string> {
  const keyData = pemToArrayBuffer(publicKeyPem);

  const cryptoKey = await crypto.subtle.importKey(
    "spki",
    keyData,
    { name: "RSA-OAEP", hash: "SHA-256" } as RsaOaepParams,
    false,
    ["encrypt"]
  );

  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP", hash: "SHA-256" } as RsaOaepParams,
    cryptoKey,
    encoded
  );

  // ArrayBuffer → Base64
  const bytes = new Uint8Array(encrypted);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
