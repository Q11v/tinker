import qrcode from "qrcode-generator"

/**
 * 库自带的 stringToBytes 只取每个字符的低 8 位（latin1），
 * 中文和 emoji 会被截断，所以统一换成 UTF-8 编码。
 * 这是模块级的全局改写，但整个应用只在这里用到 qrcode-generator。
 */
qrcode.stringToBytes = (text: string) => Array.from(new TextEncoder().encode(text))

/** 纠错等级：L≈7% / M≈15% / Q≈25% / H≈30% 的模块被遮挡仍可识别，越高码越密 */
export type QrEcc = "L" | "M" | "Q" | "H"

export const QR_ECC_LEVELS: QrEcc[] = ["L", "M", "Q", "H"]

/** 版本 40 下各纠错等级能装的最大字节数，用来提前给出容量提示 */
export const QR_MAX_BYTES: Record<QrEcc, number> = { L: 2953, M: 2331, Q: 1663, H: 1273 }

export interface QrMatrix {
  /** modules[row][col] 为 true 表示黑块 */
  modules: boolean[][]
  /** 边长（模块数），21 + 4 × (版本 - 1) */
  count: number
  /** QR 版本号 1..40 */
  version: number
}

export type QrError = "empty" | "tooLong"

export type QrResult = { ok: true; matrix: QrMatrix } | { ok: false; error: QrError }

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

/** 传 0 让库自己挑最小的版本；数据装不下时它会 throw 一个字符串 */
export function createQr(text: string, ecc: QrEcc): QrResult {
  if (!text) return { ok: false, error: "empty" }
  if (byteLength(text) > QR_MAX_BYTES[ecc]) return { ok: false, error: "tooLong" }

  const qr = qrcode(0, ecc)
  qr.addData(text, "Byte")
  try {
    qr.make()
  } catch {
    return { ok: false, error: "tooLong" }
  }

  const count = qr.getModuleCount()
  const modules = Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, col) => qr.isDark(row, col))
  )

  return { ok: true, matrix: { modules, count, version: (count - 17) / 4 } }
}

/**
 * 把所有黑块拼成一条 path，每个模块一段子路径。
 * 用一个 <path> 而不是成百上千个 <rect>，SVG 体积和渲染开销都小很多。
 * 坐标以模块为单位，缩放交给 viewBox。
 */
export function qrPathData(matrix: QrMatrix): string {
  const parts: string[] = []
  for (let row = 0; row < matrix.count; row += 1) {
    for (let col = 0; col < matrix.count; col += 1) {
      if (matrix.modules[row][col]) parts.push(`M${col} ${row}h1v1h-1z`)
    }
  }
  return parts.join("")
}

export interface QrSvgOptions {
  /** 静区宽度（模块数），规范建议 4 */
  margin?: number
  /** 每个模块的像素边长，决定导出文件的尺寸 */
  scale?: number
}

/** 可直接下载的独立 SVG 文件内容 */
export function qrSvg(matrix: QrMatrix, { margin = 4, scale = 8 }: QrSvgOptions = {}): string {
  const size = matrix.count + margin * 2
  const px = size * scale

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`,
    `<rect width="${size}" height="${size}" fill="#ffffff"/>`,
    `<path transform="translate(${margin} ${margin})" fill="#000000" d="${qrPathData(matrix)}"/>`,
    `</svg>`,
  ].join("")
}

/** Wi-Fi 二维码的加密方式，nopass 表示开放网络 */
export type WifiEncryption = "WPA" | "WEP" | "nopass"

export interface WifiConfig {
  ssid: string
  password: string
  encryption: WifiEncryption
  hidden: boolean
}

/** WIFI: 这串格式里 \ ; , : " 既是分隔符也是转义符，出现在值里必须转义 */
function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1")
}

/**
 * 生成 iOS / Android 相机都认的 WIFI: 串，格式见 ZXing 的约定：
 * WIFI:T:WPA;S:<ssid>;P:<password>;H:true;;
 */
export function buildWifiPayload({ ssid, password, encryption, hidden }: WifiConfig): string {
  if (!ssid) return ""

  const fields = [`T:${encryption}`, `S:${escapeWifiValue(ssid)}`]
  // 开放网络不带密码字段，带了反而有的相机会连不上
  if (encryption !== "nopass" && password) fields.push(`P:${escapeWifiValue(password)}`)
  if (hidden) fields.push("H:true")

  return `WIFI:${fields.join(";")};;`
}
