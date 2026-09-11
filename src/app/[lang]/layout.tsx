import type { Metadata } from "next"
import { JetBrains_Mono, Space_Grotesk } from "next/font/google"
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

/*
  设计稿指定 Space Grotesk（标题与正文）+ JetBrains Mono（数字、摘要、键帽）。
  两者都只有拉丁字形，中文必须落到回退栈上 —— 中文字体不走 next/font：
  一份 Noto Sans SC 子集也有几百 KB，而系统里本来就有 PingFang / 微软雅黑。

  回退栈只能写成字面量：next/font 的参数要在编译期静态分析，展开数组或引用变量都会报
  "Unexpected spread"，所以这两串中文字体名是故意重复的。
*/
const sans = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: [
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    "Noto Sans SC",
    "system-ui",
    "sans-serif",
  ],
})

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: [
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    "Noto Sans SC",
    "ui-monospace",
    "monospace",
  ],
})

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
        {/*
          设计稿以深色为主、浅色是同结构的配色层，所以没有存过偏好的新访客直接进深色，
          而不是跟着系统走。enableSystem 保留着 —— 主题菜单里的「跟随系统」仍然可选，
          选过之后 next-themes 会把它记进 localStorage，defaultTheme 就不再介入。
        */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
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
