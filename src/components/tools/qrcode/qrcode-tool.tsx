"use client"

import { useState } from "react"

import { CopyButton } from "@/components/copy-button"
import { SegmentedControl } from "@/components/segmented-control"
import { Panel } from "@/components/tool-panel"
import { QrPreview } from "@/components/tools/qrcode/qr-preview"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
import {
  buildWifiPayload,
  byteLength,
  QR_MAX_BYTES,
  type QrEcc,
  type WifiEncryption,
} from "@/lib/qrcode"
import { cn, monoField } from "@/lib/utils"

type TabKey = "text" | "wifi"

export function QrcodeTool() {
  const dict = useDict()
  const text = dict.qrcodeTool

  const [tab, setTab] = useState<TabKey>("text")
  // 纠错等级两个页签共用，切来切去不会被重置
  const [ecc, setEcc] = useState<QrEcc>("M")

  const [content, setContent] = useState("")

  const [ssid, setSsid] = useState("")
  const [password, setPassword] = useState("")
  const [encryption, setEncryption] = useState<WifiEncryption>("WPA")
  const [hidden, setHidden] = useState(false)

  const wifiPayload = buildWifiPayload({ ssid, password, encryption, hidden })

  const encryptions = [
    { value: "WPA" as const, label: text.wifi.encryption.WPA },
    { value: "WEP" as const, label: text.wifi.encryption.WEP },
    { value: "nopass" as const, label: text.wifi.encryption.nopass },
  ]

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
      <TabsList className="w-full sm:w-auto sm:self-start">
        <TabsTrigger value="text">{text.tabs.text}</TabsTrigger>
        <TabsTrigger value="wifi">{text.tabs.wifi}</TabsTrigger>
      </TabsList>

      <TabsContent value="text" className="mt-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            accent="violet"
            title={text.inputTitle}
            hint={text.inputHint}
            footer={format(text.bytesFooter, {
              bytes: byteLength(content),
              max: QR_MAX_BYTES[ecc],
            })}
          >
            <Label htmlFor="qr-content" className="sr-only">
              {text.textLabel}
            </Label>
            <Textarea
              id="qr-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={text.textPlaceholder}
              spellCheck={false}
              autoComplete="off"
              className={cn(monoField, "max-h-64 min-h-40")}
            />
          </Panel>

          <QrPreview
            value={content}
            ecc={ecc}
            onEccChange={setEcc}
            emptyState={text.emptyState}
            filename="qrcode"
          />
        </div>
      </TabsContent>

      <TabsContent value="wifi" className="mt-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Panel
              accent="violet"
              title={text.wifi.settingsTitle}
              hint={text.wifi.settingsHint}
              footer={text.wifi.hiddenFooter}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-wifi-ssid">{text.wifi.ssidLabel}</Label>
                  <Input
                    id="qr-wifi-ssid"
                    value={ssid}
                    onChange={(event) => setSsid(event.target.value)}
                    placeholder={text.wifi.ssidPlaceholder}
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label id="qr-wifi-encryption-label">{text.wifi.encryptionLabel}</Label>
                  <div role="group" aria-labelledby="qr-wifi-encryption-label">
                    <SegmentedControl
                      value={encryption}
                      onChange={setEncryption}
                      options={encryptions}
                    />
                  </div>
                </div>

                {encryption !== "nopass" ? (
                  <div className="space-y-2">
                    <Label htmlFor="qr-wifi-password">{text.wifi.passwordLabel}</Label>
                    <Input
                      id="qr-wifi-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={text.wifi.passwordPlaceholder}
                      spellCheck={false}
                      autoComplete="off"
                      className={monoField}
                    />
                  </div>
                ) : null}

                <div className="flex items-center justify-between border-t pt-4">
                  <Label htmlFor="qr-wifi-hidden" className="font-normal">
                    {text.wifi.hidden}
                  </Label>
                  <Switch id="qr-wifi-hidden" checked={hidden} onCheckedChange={setHidden} />
                </div>
              </div>
            </Panel>

            {wifiPayload ? (
              <Panel
                accent="rose"
                title={text.wifi.payloadTitle}
                hint={text.wifi.payloadHint}
                action={<CopyButton value={wifiPayload} size="icon" />}
              >
                <p className="font-mono text-[13px] break-all">{wifiPayload}</p>
              </Panel>
            ) : null}
          </div>

          <QrPreview
            value={wifiPayload}
            ecc={ecc}
            onEccChange={setEcc}
            emptyState={text.wifi.needSsid}
            filename="wifi-qrcode"
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}
