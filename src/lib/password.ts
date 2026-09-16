export interface PasswordOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
  /** 参与生成的符号，留空视为不加符号；不传则用 DEFAULT_SYMBOLS */
  symbolChars?: string
  excludeAmbiguous: boolean
}

export const DEFAULT_SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?"

const CHAR_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
} as const

const AMBIGUOUS_CHARS = new Set(["I", "l", "1", "O", "0"])

export function buildCharPool(options: PasswordOptions): string {
  let pool = ""
  if (options.uppercase) pool += CHAR_SETS.uppercase
  if (options.lowercase) pool += CHAR_SETS.lowercase
  if (options.numbers) pool += CHAR_SETS.numbers
  if (options.symbols) pool += options.symbolChars ?? DEFAULT_SYMBOLS
  let chars = Array.from(pool).filter((ch) => !/\s/.test(ch))
  if (options.excludeAmbiguous) chars = chars.filter((ch) => !AMBIGUOUS_CHARS.has(ch))
  // 符号可以自定义，可能和内置字符集重复；不去重的话重复字符出现概率翻倍，熵也算多了
  return Array.from(new Set(chars)).join("")
}

/** 单字节拒绝采样，避免字符集大小不是 2 的幂时 % 取模引入的偏差 */
function secureRandomIndex(max: number): number {
  const limit = 256 - (256 % max)
  const byte = new Uint8Array(1)
  for (;;) {
    crypto.getRandomValues(byte)
    if (byte[0] < limit) return byte[0] % max
  }
}

export function generatePassword(options: PasswordOptions): string {
  const pool = buildCharPool(options)
  // 调用方（UI）保证至少勾选一类字符，走到这里说明是调用错误，不是用户输入问题，
  // 所以不进字典、不翻译
  if (!pool) throw new Error("generatePassword: empty character pool")
  let result = ""
  for (let i = 0; i < options.length; i += 1) {
    result += pool[secureRandomIndex(pool.length)]
  }
  return result
}

/** 按信息熵粗略估算密码强度，log2(字符集大小) * 长度 */
export function estimateEntropyBits(length: number, poolSize: number): number {
  if (poolSize <= 1) return 0
  return length * Math.log2(poolSize)
}
