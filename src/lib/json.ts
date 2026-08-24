export interface JsonParseError {
  message: string
  line?: number
  column?: number
}

export type JsonParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: JsonParseError }

class LenientJsonParseError extends Error {
  constructor(
    message: string,
    readonly index: number
  ) {
    super(message)
  }
}

function isIdentifierStart(ch: string): boolean {
  return /[A-Za-z_$]/.test(ch)
}

function isIdentifierPart(ch: string): boolean {
  return /[A-Za-z0-9_$]/.test(ch)
}

/**
 * 比 JSON.parse 更宽松的解析器：允许单引号字符串、不加引号的 key、
 * 数组/对象的结尾逗号、// 和 /* 注释，方便直接粘贴 JS 对象字面量。
 * 只做字面量解析，不会像 eval / new Function 那样执行代码。
 */
class LenientJsonParser {
  private i = 0

  constructor(private readonly text: string) {}

  parse(): unknown {
    this.skipTrivia()
    const value = this.parseValue()
    this.skipTrivia()
    if (this.i < this.text.length) {
      this.fail(`结尾存在多余内容："${this.text.slice(this.i, this.i + 10)}"`)
    }
    return value
  }

  private fail(message: string): never {
    throw new LenientJsonParseError(message, this.i)
  }

  private peek(offset = 0): string {
    return this.text[this.i + offset] ?? ""
  }

  private skipTrivia() {
    for (;;) {
      const ch = this.peek()
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
        this.i += 1
        continue
      }
      if (ch === "/" && this.peek(1) === "/") {
        this.i += 2
        while (this.i < this.text.length && this.peek() !== "\n") this.i += 1
        continue
      }
      if (ch === "/" && this.peek(1) === "*") {
        const end = this.text.indexOf("*/", this.i + 2)
        this.i = end === -1 ? this.text.length : end + 2
        continue
      }
      break
    }
  }

  private parseValue(): unknown {
    this.skipTrivia()
    const ch = this.peek()
    if (ch === "{") return this.parseObject()
    if (ch === "[") return this.parseArray()
    if (ch === '"' || ch === "'") return this.parseString(ch)
    if (ch === "-" && isIdentifierStart(this.peek(1))) {
      this.i += 1
      const keyword = this.parseKeyword()
      if (typeof keyword === "number") return -keyword
      this.fail("负号后面需要跟数字")
    }
    if (ch === "" || /[0-9+\-.]/.test(ch)) return this.parseNumber()
    if (isIdentifierStart(ch)) return this.parseKeyword()
    this.fail(`无法识别的字符 "${ch}"`)
  }

  private parseObject(): Record<string, unknown> {
    this.i += 1 // {
    const result: Record<string, unknown> = {}
    this.skipTrivia()
    if (this.peek() === "}") {
      this.i += 1
      return result
    }
    for (;;) {
      this.skipTrivia()
      const key = this.parseKey()
      this.skipTrivia()
      if (this.peek() !== ":") this.fail('期望 ":"')
      this.i += 1
      result[key] = this.parseValue()
      this.skipTrivia()
      const ch = this.peek()
      if (ch === ",") {
        this.i += 1
        this.skipTrivia()
        if (this.peek() === "}") {
          this.i += 1
          break
        }
        continue
      }
      if (ch === "}") {
        this.i += 1
        break
      }
      this.fail('期望 "," 或 "}"')
    }
    return result
  }

  private parseKey(): string {
    const ch = this.peek()
    if (ch === '"' || ch === "'") return this.parseString(ch)
    if (isIdentifierStart(ch) || /[0-9]/.test(ch)) {
      const start = this.i
      this.i += 1
      while (isIdentifierPart(this.peek())) this.i += 1
      return this.text.slice(start, this.i)
    }
    this.fail("期望对象的 key")
  }

  private parseArray(): unknown[] {
    this.i += 1 // [
    const result: unknown[] = []
    this.skipTrivia()
    if (this.peek() === "]") {
      this.i += 1
      return result
    }
    for (;;) {
      result.push(this.parseValue())
      this.skipTrivia()
      const ch = this.peek()
      if (ch === ",") {
        this.i += 1
        this.skipTrivia()
        if (this.peek() === "]") {
          this.i += 1
          break
        }
        continue
      }
      if (ch === "]") {
        this.i += 1
        break
      }
      this.fail('期望 "," 或 "]"')
    }
    return result
  }

  private parseString(quote: string): string {
    this.i += 1 // opening quote
    let result = ""
    for (;;) {
      const ch = this.peek()
      if (ch === "") this.fail("字符串没有正确闭合")
      if (ch === quote) {
        this.i += 1
        break
      }
      if (ch === "\\") {
        this.i += 1
        const esc = this.peek()
        if (esc === "u") {
          const hex = this.text.slice(this.i + 1, this.i + 5)
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) this.fail("非法的 \\u 转义")
          result += String.fromCharCode(Number.parseInt(hex, 16))
          this.i += 5
          continue
        }
        const simple: Record<string, string> = {
          '"': '"',
          "'": "'",
          "\\": "\\",
          "/": "/",
          b: "\b",
          f: "\f",
          n: "\n",
          r: "\r",
          t: "\t",
          "\n": "", // 反斜杠加换行：字符串跨行续写
        }
        result += esc in simple ? simple[esc] : esc
        this.i += 1
        continue
      }
      result += ch
      this.i += 1
    }
    return result
  }

  private parseNumber(): number {
    const start = this.i
    if (this.peek() === "+" || this.peek() === "-") this.i += 1
    if (this.peek() === "0" && (this.peek(1) === "x" || this.peek(1) === "X")) {
      this.i += 2
      while (/[0-9a-fA-F]/.test(this.peek())) this.i += 1
    } else {
      while (/[0-9]/.test(this.peek())) this.i += 1
      if (this.peek() === ".") {
        this.i += 1
        while (/[0-9]/.test(this.peek())) this.i += 1
      }
      if (this.peek() === "e" || this.peek() === "E") {
        this.i += 1
        if (this.peek() === "+" || this.peek() === "-") this.i += 1
        while (/[0-9]/.test(this.peek())) this.i += 1
      }
    }
    const text = this.text.slice(start, this.i)
    const value = Number(text)
    if (!text || Number.isNaN(value)) this.fail(`非法的数字 "${text}"`)
    return value
  }

  private parseKeyword(): unknown {
    const start = this.i
    this.i += 1
    while (isIdentifierPart(this.peek())) this.i += 1
    const word = this.text.slice(start, this.i)
    switch (word) {
      case "true":
        return true
      case "false":
        return false
      case "null":
        return null
      case "undefined":
        return undefined
      case "NaN":
        return Number.NaN
      case "Infinity":
        return Number.POSITIVE_INFINITY
      default:
        this.i = start
        this.fail(`无法识别的标识符 "${word}"`)
    }
  }
}

function locate(text: string, index: number): { line: number; column: number } {
  const before = text.slice(0, index).split("\n")
  return { line: before.length, column: before[before.length - 1].length + 1 }
}

/**
 * 解析 JSON，同时放宽到能接受常见的 JS 对象字面量写法
 * （单引号、无引号 key、结尾逗号、// 与 /* 注释）。
 * 只做字面量解析，不执行代码，比 eval / new Function 更安全。
 */
export function parseJson(text: string): JsonParseResult {
  try {
    return { ok: true, value: new LenientJsonParser(text).parse() }
  } catch (rawError) {
    if (rawError instanceof LenientJsonParseError) {
      return { ok: false, error: { message: rawError.message, ...locate(text, rawError.index) } }
    }
    const message = rawError instanceof Error ? rawError.message : String(rawError)
    return { ok: false, error: { message } }
  }
}

export type JsonOutputMode = "pretty" | "minified"

export function formatJson(value: unknown, mode: JsonOutputMode): string {
  return mode === "pretty" ? JSON.stringify(value, null, 2) : JSON.stringify(value)
}

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/** 把 ["user", "roles", 0] 这样的路径片段拼成 $.user.roles[0] 形式 */
export function buildJsonPath(segments: (string | number)[]): string {
  let path = "$"
  for (const segment of segments) {
    if (typeof segment === "number") {
      path += `[${segment}]`
    } else if (IDENTIFIER_RE.test(segment)) {
      path += `.${segment}`
    } else {
      path += `[${JSON.stringify(segment)}]`
    }
  }
  return path
}

export const SAMPLE_JSON = `{
  id: 1024,
  name: 'Ada Lovelace',
  active: true,
  tags: ['admin', 'beta'],
  // 宽松模式支持结尾逗号、注释、单引号和不加引号的 key
  profile: { age: 28, address: null },
}`
