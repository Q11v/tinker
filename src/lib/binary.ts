export const NUMBER_BASES = ["2", "8", "10", "16"] as const
export type NumberBase = (typeof NUMBER_BASES)[number]

export function formatInteger(
  raw: string,
  base: NumberBase,
  options: { prefix: boolean; uppercase: boolean; grouped: boolean }
) {
  const sign = raw.startsWith("-") ? "-" : ""
  let digits = raw.replace(/^-/, "")
  digits = options.uppercase ? digits.toUpperCase() : digits.toLowerCase()
  if (options.grouped) {
    const size = base === "10" || base === "8" ? 3 : 4
    const groups: string[] = []
    for (let end = digits.length; end > 0; end -= size) {
      groups.unshift(digits.slice(Math.max(0, end - size), end))
    }
    digits = groups.join(" ")
  }
  const prefix = options.prefix ? { "2": "0b", "8": "0o", "10": "", "16": "0x" }[base] : ""
  return sign + prefix + digits
}

export function convertInteger(input: string, base: NumberBase) {
  const text = input.trim()
  if (!text) return { kind: "empty" } as const
  if (text.length > 4096) return { kind: "tooLong" } as const

  const negative = text.startsWith("-")
  let digits = text.replace(/^[+-]/, "")
  const prefix = /^0([box])/i.exec(digits)
  const prefixes: Record<string, NumberBase> = { b: "2", o: "8", x: "16" }
  if (prefix) {
    if (prefixes[prefix[1].toLowerCase()] !== base) return { kind: "invalid" } as const
    digits = digits.slice(2)
  }
  const patterns = { "2": /^[01]+$/, "8": /^[0-7]+$/, "10": /^[0-9]+$/, "16": /^[0-9a-f]+$/i }
  if (!patterns[base].test(digits)) return { kind: "invalid" } as const

  const radix = BigInt(base)
  let value = BigInt(0)
  for (const digit of digits) value = value * radix + BigInt(parseInt(digit, 16))
  if (negative) value = -value
  return {
    kind: "valid",
    values: NUMBER_BASES.map((base) => ({
      base,
      value: value.toString(Number(base)).toUpperCase(),
    })),
  } as const
}
