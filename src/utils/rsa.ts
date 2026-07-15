/**
 * RSA 加密工具（基于 node-forge）
 *
 * 后端使用 RSA-OAEP + SHA-256，公钥为 PEM 格式（SPKI 编码）。
 * node-forge 为纯 JS 实现，不依赖 crypto.subtle，HTTP / HTTPS 环境下均可使用。
 */
import forge from "node-forge";

/**
 * 使用 RSA-OAEP/SHA-256 加密文本，返回 Base64 编码的密文
 */
export function rsaEncrypt(publicKeyPem: string, plaintext: string): string {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const encrypted = publicKey.encrypt(
    forge.util.encodeUtf8(plaintext),
    "RSA-OAEP",
    {
      md: forge.md.sha256.create(),
      mgf1: { md: forge.md.sha256.create() },
    },
  );
  return forge.util.encode64(encrypted);
}
