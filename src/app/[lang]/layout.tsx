import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { notFound } from "next/navigation"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { isLocale, localeAlternates, LOCALE_HTML_LANG, LOCALES } from "@/i18n/config"
import { I18nProvider } from "@/i18n/context"
import { getDictionary } from "@/i18n/dictionaries"

import "../globals.css"

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] })
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] })

/**
 * 根 layout 放在 [lang] 里，这样 <html lang> 能按语言渲染成静态 HTML，
 * 而不是等客户端 JS 再去改 —— 对 SEO 和读屏软件都重要。
 */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)

  return {
    title: { default: dict.meta.title, template: dict.meta.titleTemplate },
    description: dict.meta.description,
    alternates: { languages: localeAlternates() },
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <html
      lang={LOCALE_HTML_LANG[lang]}
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>
            <I18nProvider locale={lang} dict={dict}>
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
              <Toaster position="top-center" />
            </I18nProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
