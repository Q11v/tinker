import { notFound } from "next/navigation"

import { ToolExplorer } from "@/components/tool-explorer"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n/dictionaries"

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  const dict = await getDictionary(lang)

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="bg-gradient-brand animate-blob pointer-events-none absolute -top-40 -left-32 -z-10 size-96 rounded-full opacity-20 blur-3xl"
      />
      <div
        aria-hidden
        className="bg-gradient-brand animate-blob pointer-events-none absolute -top-24 -right-24 -z-10 size-80 rounded-full opacity-15 blur-3xl [animation-delay:4s]"
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <section className="mb-10 max-w-2xl">
          <h1 className="text-gradient-brand text-3xl font-semibold tracking-tight sm:text-4xl">
            {dict.home.title}
          </h1>
          <p className="text-muted-foreground mt-3 leading-relaxed">{dict.home.subtitle}</p>
        </section>

        <ToolExplorer />
      </div>
    </div>
  )
}
