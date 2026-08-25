"use client"

import { useState } from "react"

import { PasswordPanel } from "@/components/tools/generator/password-panel"
import { UuidPanel } from "@/components/tools/generator/uuid-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDict } from "@/i18n/context"

type TabKey = "uuid" | "password"

export function GeneratorTool() {
  const dict = useDict()
  const [tab, setTab] = useState<TabKey>("uuid")

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
      <TabsList className="w-full sm:w-auto sm:self-start">
        <TabsTrigger value="uuid">{dict.generatorTool.tabs.uuid}</TabsTrigger>
        <TabsTrigger value="password">{dict.generatorTool.tabs.password}</TabsTrigger>
      </TabsList>

      <TabsContent value="uuid" className="mt-4">
        <UuidPanel />
      </TabsContent>

      <TabsContent value="password" className="mt-4">
        <PasswordPanel />
      </TabsContent>
    </Tabs>
  )
}
