"use client"

import { Check, Copy } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  value: string
  label?: string
  size?: "sm" | "icon"
  className?: string
}

export function CopyButton({ value, label, size = "sm", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  async function copy() {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("复制失败，请手动选中内容复制")
    }
  }

  const Icon = copied ? Check : Copy

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={copy}
      disabled={!value}
      aria-label={label ?? "复制"}
      className={cn("text-muted-foreground", className)}
    >
      <Icon className={cn("size-3.5", copied && "text-emerald-600 dark:text-emerald-400")} />
      {size === "sm" ? (copied ? "已复制" : (label ?? "复制")) : null}
    </Button>
  )
}
