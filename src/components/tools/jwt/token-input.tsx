"use client"

import { useRef, useState } from "react"

import { TokenPreview } from "@/components/tools/jwt/token-preview"
import { Textarea } from "@/components/ui/textarea"
import { useDict } from "@/i18n/context"
import { cn } from "@/lib/utils"

interface TokenInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}

/**
 * 失焦且是合法的三段式 token 时，用彩色分段预览盖住文本框，
 * 避免原文和着色预览同时展示、重复占用空间；点击预览可重新进入编辑。
 */
export function TokenInput({ id, value, onChange, placeholder, className }: TokenInputProps) {
  const dict = useDict()
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const showPreview = !focused && value.trim().split(".").length === 3

  return (
    <div className="relative">
      <Textarea
        id={id}
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className={cn(
          "font-mono text-[13px]",
          className,
          // visibility:hidden 元素无法被 focus()，所以这里只能用透明度 + 禁用点击来隐藏，
          // 否则点击预览层调用 ref.current?.focus() 会静默失败，切不回编辑态
          showPreview && "pointer-events-none opacity-0"
        )}
      />
      {showPreview ? (
        <button
          type="button"
          onClick={() => ref.current?.focus()}
          aria-label={dict.jwtTool.preview.editLabel}
          className="absolute inset-0 block w-full text-left"
        >
          <TokenPreview token={value} className="h-full" />
        </button>
      ) : null}
    </div>
  )
}
