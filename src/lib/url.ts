/**
 * component -> encodeURIComponent：连 / ? & = # 也一并编码，适合放进查询参数的值
 * uri       -> encodeURI：保留 URL 的结构字符，适合编码一整条链接
 */
export type UrlEncodeVariant = "component" | "uri"

export function encodeUrlText(text: string, variant: UrlEncodeVariant): string {
  return variant === "component" ? encodeURIComponent(text) : encodeURI(text)
}

/**
 * 解码失败分两种成因，用码区分；strayPercent 还要带上出错位置，
 * 文案里用 {position} 占位。
 */
export type UrlDecodeError = { code: "strayPercent"; position: number } | { code: "badUtf8" }

export type UrlDecodeResult = { ok: true; text: string } | { ok: false; error: UrlDecodeError }

/**
 * plusAsSpace 对应 application/x-www-form-urlencoded 的约定：
 * 查询串里的 + 表示空格，而路径里的 + 就是加号本身，所以交给调用方决定。
 * 注意要先替换 + 再解码，否则 %2B 解出来的加号会被误当成空格。
 */
export function decodeUrlText(text: string, plusAsSpace: boolean): UrlDecodeResult {
  if (!text) return { ok: true, text: "" }

  const prepared = plusAsSpace ? text.replaceAll("+", " ") : text

  try {
    return { ok: true, text: decodeURIComponent(prepared) }
  } catch {
    // decodeURIComponent 只会抛一句 "URI malformed"，这里区分两种成因给出可操作的提示
    const stray = /%(?![0-9a-fA-F]{2})/.exec(prepared)
    if (stray) {
      return { ok: false, error: { code: "strayPercent", position: stray.index + 1 } }
    }
    return { ok: false, error: { code: "badUtf8" } }
  }
}

/** 解不开就原样返回，用于展示场景（比如路径里混了非法序列也不该整块报错） */
export function safeDecodeUrl(text: string): string {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

/** part 只带 key，显示名由 UI 层从字典的 url.parts 里取 */
export interface UrlPart {
  key: UrlPartKey
  value: string
}

export type UrlPartKey =
  | "protocol"
  | "username"
  | "password"
  | "hostname"
  | "port"
  | "origin"
  | "pathname"
  | "pathnameDecoded"
  | "search"
  | "hash"
  | "href"

export interface UrlQueryParam {
  /** 同名参数可以重复出现，用下标保证 key 唯一 */
  key: string
  name: string
  value: string
}

export interface ParsedUrl {
  parts: UrlPart[]
  params: UrlQueryParam[]
  /** 输入没写协议，已按 https 补全 */
  inferredProtocol: boolean
  /** 输入是相对路径，只有路径/查询/锚点有意义 */
  relative: boolean
}

export type UrlParseErrorCode = "empty" | "unparsable"

export type ParseUrlResult =
  { ok: true; parsed: ParsedUrl } | { ok: false; error: UrlParseErrorCode }

const HAS_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/

/**
 * 只有 authority 看起来像主机名时才补协议。
 * 否则 new URL("https://" + "随便一段文字") 也能构造成功，
 * 会把普通文本当成域名解析出一堆没意义的字段。
 */
function looksLikeHost(text: string): boolean {
  const authority = text.split(/[/?#]/)[0]
  return authority.includes(".") || /^localhost(:\d+)?$/i.test(authority)
}

/**
 * host:port 会被 new URL 误判成 scheme —— new URL("localhost:3000/api") 能构造成功，
 * 但解出来的 protocol 是 "localhost:"、路径是 "3000/api"，全是垃圾。
 * 这类输入要跳过绝对解析，直接走补协议的分支。
 */
const HOST_WITH_PORT = /^[^\s/?#:@]+:\d+(?:[/?#]|$)/

/** 仅用于解析相对路径，不会出现在结果里 */
const RELATIVE_BASE = "https://relative.invalid"

export function parseUrl(input: string): ParseUrlResult {
  const text = input.trim()
  if (!text) return { ok: false, error: "empty" }

  let url: URL | null = null
  let inferredProtocol = false
  let relative = false

  const hostWithPort = HOST_WITH_PORT.test(text) && looksLikeHost(text)

  if (!hostWithPort) {
    try {
      url = new URL(text)
    } catch {
      url = null
    }
  }

  if (!url && looksLikeHost(text) && (hostWithPort || !HAS_SCHEME.test(text))) {
    try {
      url = new URL(`https://${text}`)
      inferredProtocol = true
    } catch {
      url = null
    }
  }

  if (!url && /^[/?#]/.test(text)) {
    try {
      url = new URL(text, RELATIVE_BASE)
      relative = true
    } catch {
      url = null
    }
  }

  if (!url) return { ok: false, error: "unparsable" }

  const parts: UrlPart[] = []
  const push = (key: UrlPartKey, value: string) => {
    if (value) parts.push({ key, value })
  }

  if (!relative) {
    push("protocol", url.protocol.replace(/:$/, ""))
    push("username", url.username)
    push("password", url.password)
    push("hostname", url.hostname)
    push("port", url.port)
    push("origin", url.origin === "null" ? "" : url.origin)
  }

  // 输入是纯查询串或纯锚点时，URL 会补出一个 "/"，那不是用户写的东西
  if (!(relative && url.pathname === "/" && !text.startsWith("/"))) {
    push("pathname", url.pathname)
  }

  // 路径里带中文或空格时，解码后的样子才是用户真正想看的
  const decodedPath = safeDecodeUrl(url.pathname)
  if (decodedPath !== url.pathname) push("pathnameDecoded", decodedPath)

  push("search", url.search)
  push("hash", url.hash)

  // 浏览器规范化之后的样子（补默认端口、编码非法字符、punycode 域名等）
  if (!relative && url.href !== text) push("href", url.href)

  // URLSearchParams 会自动解码、按 form-urlencoded 把 + 当空格，并保留重复的同名参数
  const params = [...url.searchParams.entries()].map(([name, value], index) => ({
    key: `${index}-${name}`,
    name,
    value,
  }))

  return { ok: true, parsed: { parts, params, inferredProtocol, relative } }
}
