export const HASH_ALGORITHMS = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number]

export type HashEncoding = "hex" | "base64"

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function encodeDigest(bytes: Uint8Array, encoding: HashEncoding): string {
  return encoding === "hex" ? bytesToHex(bytes) : bytesToBase64(bytes)
}

/**
 * 计算摘要。SHA 系列走浏览器内置的 Web Crypto；MD5 不在 SubtleCrypto 的规范范围内
 * （已被认为不安全，规范故意没收），只能自己实现，仅用于校验旧文件/接口的场景。
 */
export async function digest(algorithm: HashAlgorithm, data: ArrayBuffer): Promise<Uint8Array> {
  if (algorithm === "MD5") return md5(new Uint8Array(data))
  const buffer = await crypto.subtle.digest(algorithm, data)
  return new Uint8Array(buffer)
}

/* ------------------------------------------------------------------ */
/* MD5（RFC 1321）                                                     */
/* ------------------------------------------------------------------ */

function rotl(x: number, c: number): number {
  return (x << c) | (x >>> (32 - c))
}

const MD5_K = new Int32Array([
  -680876936, -389564586, 606105819, -1044525330, -176418897, 1200080426, -1473231341, -45705983,
  1770035416, -1958414417, -42063, -1990404162, 1804603682, -40341101, -1502002290, 1236535329,
  -165796510, -1069501632, 643717713, -373897302, -701558691, 38016083, -660478335, -405537848,
  568446438, -1019803690, -187363961, 1163531501, -1444681467, -51403784, 1735328473, -1926607734,
  -378558, -2022574463, 1839030562, -35309556, -1530992060, 1272893353, -155497632, -1094730640,
  681279174, -358537222, -722521979, 76029189, -640364487, -421815835, 530742520, -995338651,
  -198630844, 1126891415, -1416354905, -57434055, 1700485571, -1894986606, -1051523, -2054922799,
  1873313359, -30611744, -1560198380, 1309151649, -145523070, -1120210379, 718787259, -343485551,
])

const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6,
  10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

function md5(message: Uint8Array): Uint8Array {
  const bitLength = message.length * 8
  // 补 0x80，再补 0，使长度满足 mod 64 == 56，最后补 8 字节原始长度（小端）
  const paddedLength = ((message.length + 8) >> 6) * 64 + 64
  const padded = new Uint8Array(paddedLength)
  padded.set(message)
  padded[message.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(paddedLength - 8, bitLength >>> 0, true)
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true)

  let a0 = 0x67452301
  let b0 = -0x10325477 // 0xefcdab89
  let c0 = -0x67452302 // 0x98badcfe
  let d0 = 0x10325476

  for (let offset = 0; offset < paddedLength; offset += 64) {
    const m = new Int32Array(16)
    for (let i = 0; i < 16; i += 1) m[i] = view.getInt32(offset + i * 4, true)

    let a = a0
    let b = b0
    let c = c0
    let d = d0

    for (let i = 0; i < 64; i += 1) {
      let f: number
      let g: number
      if (i < 16) {
        f = (b & c) | (~b & d)
        g = i
      } else if (i < 32) {
        f = (d & b) | (~d & c)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = b ^ c ^ d
        g = (3 * i + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * i) % 16
      }
      f = (f + a + MD5_K[i] + m[g]) | 0
      a = d
      d = c
      c = b
      b = (b + rotl(f, MD5_S[i])) | 0
    }

    a0 = (a0 + a) | 0
    b0 = (b0 + b) | 0
    c0 = (c0 + c) | 0
    d0 = (d0 + d) | 0
  }

  const result = new Uint8Array(16)
  const resultView = new DataView(result.buffer)
  resultView.setInt32(0, a0, true)
  resultView.setInt32(4, b0, true)
  resultView.setInt32(8, c0, true)
  resultView.setInt32(12, d0, true)
  return result
}
