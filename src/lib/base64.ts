export type Base64Variant = "standard" | "urlsafe"

export function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

export function bytesToText(bytes: Uint8Array): { ok: true; text: string } | { ok: false } {
  try {
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) }
  } catch {
    return { ok: false }
  }
}

export function encodeBase64(bytes: Uint8Array, variant: Base64Variant): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  const standard = btoa(binary)
  return variant === "urlsafe"
    ? standard.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")
    : standard
}

export type Base64DecodeResult = { ok: true; bytes: Uint8Array } | { ok: false; error: string }

/**
 * 解码时不强求变体，标准 / URL-safe 字母表都能识别；
 * 也会顺手去掉 data URL 前缀（data:image/png;base64,xxx）和空白字符。
 */
export function decodeBase64(input: string): Base64DecodeResult {
  // 先去掉所有空白（含换行），data URL 前缀里就不用再处理跨行的情况，不需要 /s 标志
  // （项目 tsconfig target 是 ES2017，dotAll 标志要 ES2018+ 才支持）
  let text = input.replace(/\s+/g, "")
  const dataUrlMatch = text.match(/^data:[^,]*;base64,(.*)$/)
  if (dataUrlMatch) text = dataUrlMatch[1]
  if (!text) return { ok: false, error: "请输入 Base64 文本" }

  const normalized = text.replaceAll("-", "+").replaceAll("_", "/")
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=")

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(padded)) {
    return { ok: false, error: "包含非法字符，不是合法的 Base64" }
  }

  try {
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return { ok: true, bytes }
  } catch {
    return { ok: false, error: "无法解码，不是合法的 Base64" }
  }
}

const IMAGE_SIGNATURES: { mime: string; ext: string; magic: number[] }[] = [
  { mime: "image/png", ext: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/jpeg", ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  { mime: "image/gif", ext: "gif", magic: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp", ext: "webp", magic: [0x52, 0x49, 0x46, 0x46] },
  { mime: "image/bmp", ext: "bmp", magic: [0x42, 0x4d] },
]

/** 按文件头 magic number 识别常见图片格式，不依赖文件扩展名 */
export function detectImage(bytes: Uint8Array): { mime: string; ext: string } | null {
  for (const sig of IMAGE_SIGNATURES) {
    if (sig.magic.every((byte, index) => bytes[index] === byte)) {
      return { mime: sig.mime, ext: sig.ext }
    }
  }
  return null
}
