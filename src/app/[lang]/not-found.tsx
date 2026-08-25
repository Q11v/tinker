"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/context"

export default function LocaleNotFound() {
  const { dict, href } = useI18n()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-24 sm:px-6">
      <strong className="text-gradient-brand text-4xl font-semibold">404</strong>
      <p className="text-muted-foreground text-sm">{dict.notFound.message}</p>
      <Button asChild variant="outline" size="sm">
        <Link href={href()}>{dict.notFound.backHome}</Link>
      </Button>
    </div>
  )
}
