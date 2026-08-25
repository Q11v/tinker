"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDict } from "@/i18n/context"
import { ALGORITHM_GROUPS } from "@/lib/jwt"

export function AlgorithmSelect({
  id,
  value,
  onChange,
  label,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  label?: string
}) {
  const dict = useDict()

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label ?? dict.jwtTool.key.algorithmLabel}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ALGORITHM_GROUPS.map((group) => (
            <SelectGroup key={group.key}>
              <SelectLabel>{dict.jwtTool.algorithmGroups[group.key]}</SelectLabel>
              {group.items.map((alg) => (
                <SelectItem key={alg} value={alg}>
                  {alg}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
