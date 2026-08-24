export function generateUuidV4(): string {
  return crypto.randomUUID()
}

function bytesToUuidString(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * UUID v7：前 48 位是毫秒时间戳，天然按时间排序，适合当数据库主键。
 * Web Crypto 目前只有 randomUUID() 生成 v4，v7 需要自己拼字节。
 */
export function generateUuidV7(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  // 48 位毫秒时间戳完全落在 JS 安全整数范围内，拆成两个 24 位段用位运算写入，
  // 不需要 BigInt（项目 tsconfig target 是 ES2017，不支持 BigInt 字面量）。
  const ms = Date.now()
  const high = Math.floor(ms / 0x1000000)
  const low = ms % 0x1000000
  bytes[0] = (high >> 16) & 0xff
  bytes[1] = (high >> 8) & 0xff
  bytes[2] = high & 0xff
  bytes[3] = (low >> 16) & 0xff
  bytes[4] = (low >> 8) & 0xff
  bytes[5] = low & 0xff

  bytes[6] = (bytes[6] & 0x0f) | 0x70 // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10xx

  return bytesToUuidString(bytes)
}

const NANOID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"

/** 64 个字符正好是 2^6，每字节取低 6 位即可映射到字母表，天然无偏 */
export function generateNanoId(size = 21): string {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  let id = ""
  for (let i = 0; i < size; i += 1) {
    id += NANOID_ALPHABET[bytes[i] & 0b111111]
  }
  return id
}
