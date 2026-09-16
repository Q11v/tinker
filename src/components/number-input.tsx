"use client"

import * as React from "react"
import { useState } from "react"

import { Input } from "@/components/ui/input"

type NumberInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "min" | "max"
> & {
  value: number
  onValueChange: (value: number) => void
  min: number
  max: number
}

/**
 * 受控数字输入框。
 * 输入过程中保留原始文本（允许空串、超范围这类中间状态），只有值本身合法时才回传给上层，
 * 失焦时再夹到 [min, max]。否则清空重输会被立刻补回边界值，没法正常删改。
 */
export function NumberInput({
  value,
  onValueChange,
  min,
  max,
  onBlur,
  ...props
}: NumberInputProps) {
  const [draft, setDraft] = useState(() => String(value))
  const [lastValue, setLastValue] = useState(value)

  // 上层改了值（比如重置），且不是本次输入引起的，才同步回输入框
  if (value !== lastValue) {
    setLastValue(value)
    if (Number.parseInt(draft, 10) !== value) setDraft(String(value))
  }

  return (
    <Input
      inputMode="numeric"
      {...props}
      value={draft}
      onChange={(event) => {
        const next = event.target.value.replace(/\D/g, "")
        setDraft(next)
        const parsed = Number.parseInt(next, 10)
        if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
          setLastValue(parsed)
          onValueChange(parsed)
        }
      }}
      onBlur={(event) => {
        const parsed = Number.parseInt(draft, 10)
        const next = Number.isNaN(parsed) ? value : Math.min(max, Math.max(min, parsed))
        setDraft(String(next))
        setLastValue(next)
        if (next !== value) onValueChange(next)
        onBlur?.(event)
      }}
    />
  )
}
