"use client"

import { useState } from "react"

import { DecodePanel } from "@/components/tools/jwt/decode-panel"
import { SignPanel } from "@/components/tools/jwt/sign-panel"
import { VerifyPanel } from "@/components/tools/jwt/verify-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDict } from "@/i18n/context"
import { SAMPLE_SECRET } from "@/lib/jwt"

type TabKey = "decode" | "verify" | "sign"

export function JwtTool() {
  const dict = useDict()
  const [tab, setTab] = useState<TabKey>("decode")
  // Token 在「解码」「校验」之间共享，切页不用重新粘贴；密钥只有「校验」用得到，
  // 「签名」页自己管理独立的密钥状态
  const [token, setToken] = useState("")
  const [secret, setSecret] = useState(SAMPLE_SECRET)

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
      <TabsList className="w-full sm:w-auto sm:self-start">
        <TabsTrigger value="decode">{dict.jwtTool.tabs.decode}</TabsTrigger>
        <TabsTrigger value="verify">{dict.jwtTool.tabs.verify}</TabsTrigger>
        <TabsTrigger value="sign">{dict.jwtTool.tabs.sign}</TabsTrigger>
      </TabsList>

      {/* forceMount 保证三个面板的输入在切换标签时不丢失 */}
      <TabsContent value="decode" forceMount className="mt-4 data-[state=inactive]:hidden">
        <DecodePanel token={token} onTokenChange={setToken} onGoVerify={() => setTab("verify")} />
      </TabsContent>

      <TabsContent value="verify" forceMount className="mt-4 data-[state=inactive]:hidden">
        <VerifyPanel
          token={token}
          onTokenChange={setToken}
          secret={secret}
          onSecretChange={setSecret}
        />
      </TabsContent>

      <TabsContent value="sign" forceMount className="mt-4 data-[state=inactive]:hidden">
        <SignPanel
          onUseToken={(value) => {
            setToken(value)
            setTab("decode")
          }}
        />
      </TabsContent>
    </Tabs>
  )
}
