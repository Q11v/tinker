"use client"

import { useState } from "react"

import { useDict } from "@/i18n/context"

/** 单行密钥输入框，右端「显示 / 隐藏」切换明文 */
export function SecretInput({
  id,
  value,
  onChange,
  placeholder,
  defaultVisible = false,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  defaultVisible?: boolean
}) {
  const dict = useDict()
  const text = dict.jwtTool.signature
  const [visible, setVisible] = useState(defaultVisible)

  return (
    <div className="bg-surface-raised border-input focus-within:border-ring focus-within:ring-ring/50 flex h-[38px] items-center gap-2.5 rounded-[10px] border px-3 transition-colors focus-within:ring-3">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        // 这是 HMAC 密钥，不是登录密码，别让密码管理器弹出来
        data-1p-ignore
        data-lpignore="true"
        // 16px 起步，iOS Safari 聚焦小字号输入框会把整页放大且不缩回
        className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent font-mono text-base outline-none md:text-[12.5px]"
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-pressed={visible}
        aria-controls={id}
        className="text-muted-foreground hover:text-foreground shrink-0 text-xs transition-colors"
      >
        {visible ? text.hide : text.show}
      </button>
    </div>
  )
}
