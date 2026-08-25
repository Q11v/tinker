"use client"

import { useEffect } from "react"

import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config"

/**
 * 站点页面都在 /{lang}/ 下。没带语言前缀的地址（根路径 /、改版前的老链接
 * /tools/jwt）会落到这里，静态导出没有服务端做 302，只能在客户端补前缀。
 *
 * 注意必须先判断路径是否已经带了语言前缀：/zh/不存在 也会走到这个页面，
 * 无条件补前缀就会变成 /zh/zh/... 无限跳转。
 */
function pickLocale(): string {
  for (const tag of navigator.languages ?? []) {
    const lower = tag.toLowerCase()
    const hit = LOCALES.find((locale) => lower === locale || lower.startsWith(`${locale}-`))
    if (hit) return hit
  }
  return DEFAULT_LOCALE
}

export default function NotFound() {
  useEffect(() => {
    const { pathname, search, hash } = window.location
    const first = pathname.split("/").filter(Boolean)[0]

    // 已经带语言前缀的是真 404，停在这一页
    if (first !== undefined && (LOCALES as readonly string[]).includes(first)) return

    const rest = pathname === "/" ? "" : pathname
    window.location.replace(`/${pickLocale()}${rest}${search}${hash}`)
  }, [])

  // 这一页在语言前缀之外，拿不到字典，只放语言无关的内容。
  // 需要跳转时浏览器会立刻离开，用户几乎看不到这里。
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "60vh", gap: "0.75rem" }}>
      <strong style={{ fontSize: "2rem" }}>404</strong>
      <a href={`/${DEFAULT_LOCALE}`}>Tinker</a>
    </div>
  )
}
