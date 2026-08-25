"use client"

import { createContext, useContext, useMemo } from "react"

import { localePath, type Locale } from "@/i18n/config"
import type { Dictionary } from "@/i18n/dictionaries"

interface I18nValue {
  locale: Locale
  dict: Dictionary
  /** 把站内路径补上语言前缀：href("/tools/jwt") -> "/zh/tools/jwt" */
  href: (path?: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale
  dict: Dictionary
  children: React.ReactNode
}) {
  const value = useMemo<I18nValue>(
    () => ({ locale, dict, href: (path = "") => localePath(locale, path) }),
    [locale, dict]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error("useI18n 必须在 I18nProvider 内部使用")
  return value
}

/** 只要字典时的简写 */
export function useDict(): Dictionary {
  return useI18n().dict
}
