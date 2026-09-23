"use client"

import { useCallback, useState } from "react"

import { SegmentedControl } from "@/components/segmented-control"
import { DecodePanel } from "@/components/tools/jwt/decode-panel"
import { SignPanel } from "@/components/tools/jwt/sign-panel"
import { useDict } from "@/i18n/context"
import { SAMPLE_SECRET, SAMPLE_TOKEN } from "@/lib/jwt"

type Mode = "decode" | "sign"

export function JwtTool() {
  const dict = useDict()
  const [mode, setMode] = useState<Mode>("decode")
  // 解码页的 Token 与校验密钥放在这一层：签发页「在解码模式打开」要把两样一起带过去
  const [token, setToken] = useState("")
  const [secret, setSecret] = useState("")
  const [base64Secret, setBase64Secret] = useState(false)

  const openInDecode = useCallback((nextToken: string, nextSecret: string) => {
    setToken(nextToken)
    setSecret(nextSecret)
    setBase64Secret(false)
    setMode("decode")
  }, [])

  const modeSwitch = (
    <SegmentedControl
      size="md"
      label={dict.jwtTool.modeLabel}
      value={mode}
      onChange={setMode}
      options={[
        { value: "decode" as const, label: dict.jwtTool.modes.decode },
        { value: "sign" as const, label: dict.jwtTool.modes.sign },
      ]}
    />
  )

  // 两个面板都常驻，只是藏起不用的那个，切换模式时各自的输入不会丢
  return (
    <>
      <div hidden={mode !== "decode"}>
        <DecodePanel
          modeSwitch={modeSwitch}
          active={mode === "decode"}
          token={token}
          onTokenChange={setToken}
          // 示例 Token 顺手带上配套密钥，一点就能看到「签名有效」的完整结论
          onSample={() => openInDecode(SAMPLE_TOKEN, SAMPLE_SECRET)}
          secret={secret}
          onSecretChange={setSecret}
          base64Secret={base64Secret}
          onBase64SecretChange={setBase64Secret}
        />
      </div>
      <div hidden={mode !== "sign"}>
        <SignPanel modeSwitch={modeSwitch} onOpenInDecode={openInDecode} />
      </div>
    </>
  )
}
