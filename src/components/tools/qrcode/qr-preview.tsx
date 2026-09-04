"use client"

import { Download } from "lucide-react"
import { useMemo } from "react"
import { toast } from "sonner"

import { SegmentedControl } from "@/components/segmented-control"
import { Panel } from "@/components/tool-panel"
import { Button } from "@/components/ui/button"
import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
import {
  byteLength,
  createQr,
  qrPathData,
  QR_ECC_LEVELS,
  QR_MAX_BYTES,
  qrSvg,
  type QrEcc,
  type QrMatrix,
} from "@/lib/qrcode"

/** 静区宽度（模块数），规范要求 4 —— 少了会有相机认不出来 */
const MARGIN = 4

/** 导出 PNG 时的目标边长，实际尺寸取整数倍模块，所以只是个下限 */
const PNG_TARGET_PX = 1024

/** 走一次 <a download> 再撤销 blob URL；不用常驻的 object URL 是因为导出只发生在点击那一下 */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function drawToCanvas(matrix: QrMatrix): HTMLCanvasElement | null {
  const size = matrix.count + MARGIN * 2
  const scale = Math.max(4, Math.ceil(PNG_TARGET_PX / size))

  const canvas = document.createElement("canvas")
  canvas.width = size * scale
  canvas.height = size * scale

  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  // 二维码必须是深色码点配浅色底，所以固定黑白，不跟随主题
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "#000000"
  for (let row = 0; row < matrix.count; row += 1) {
    for (let col = 0; col < matrix.count; col += 1) {
      if (matrix.modules[row][col]) {
        ctx.fillRect((MARGIN + col) * scale, (MARGIN + row) * scale, scale, scale)
      }
    }
  }

  return canvas
}

/**
 * 文本与 Wi-Fi 两个页签共用的预览面板：拿到最终要编码的字符串就够了，
 * 纠错等级也放在这里，两个页签切换时保持同一个选择。
 */
export function QrPreview({
  value,
  ecc,
  onEccChange,
  emptyState,
  filename,
}: {
  value: string
  ecc: QrEcc
  onEccChange: (ecc: QrEcc) => void
  /** 内容为空时的提示，两个页签措辞不一样 */
  emptyState: string
  /** 下载文件名（不含扩展名） */
  filename: string
}) {
  const dict = useDict()
  const text = dict.qrcodeTool

  const result = useMemo(() => createQr(value, ecc), [value, ecc])
  const matrix = result.ok ? result.matrix : null

  const eccOptions = QR_ECC_LEVELS.map((level) => ({ value: level, label: level }))

  async function downloadPng() {
    if (!matrix) return
    const canvas = drawToCanvas(matrix)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas ? canvas.toBlob(resolve, "image/png") : resolve(null)
    )
    if (!blob) {
      toast.error(text.downloadFailed)
      return
    }
    saveBlob(blob, `${filename}.png`)
  }

  function downloadSvg() {
    if (!matrix) return
    saveBlob(
      new Blob([qrSvg(matrix, { margin: MARGIN })], { type: "image/svg+xml" }),
      `${filename}.svg`
    )
  }

  const size = matrix ? matrix.count + MARGIN * 2 : 0

  return (
    <Panel
      accent="sky"
      title={text.previewTitle}
      hint={
        matrix
          ? format(text.info, { version: matrix.version, count: matrix.count })
          : text.previewHint
      }
      action={
        <div className="flex items-center gap-1">
          {/* 只有 L/M/Q/H 四个字母，读屏软件需要一个组标签才知道这排按钮是干嘛的 */}
          <div role="group" aria-label={text.eccLabel}>
            <SegmentedControl value={ecc} onChange={onEccChange} options={eccOptions} />
          </div>
          {matrix ? (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={downloadPng}>
                <Download className="size-3.5" />
                {text.downloadPng}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={downloadSvg}>
                <Download className="size-3.5" />
                {text.downloadSvg}
              </Button>
            </>
          ) : null}
        </div>
      }
      footer={text.eccHints[ecc]}
    >
      {matrix ? (
        <div className="flex justify-center">
          {/* 底色固定为白：深色主题下反色的二维码相机认不出来 */}
          <svg
            viewBox={`0 0 ${size} ${size}`}
            shapeRendering="crispEdges"
            role="img"
            aria-label={text.previewLabel}
            className="h-auto w-full max-w-72 rounded-lg border bg-white"
          >
            <path
              transform={`translate(${MARGIN} ${MARGIN})`}
              fill="#000000"
              d={qrPathData(matrix)}
            />
          </svg>
        </div>
      ) : !value ? (
        <p className="text-muted-foreground text-sm">{emptyState}</p>
      ) : (
        <p className="text-destructive text-sm">
          {format(dict.errors.qrcode.tooLong, {
            bytes: byteLength(value),
            ecc,
            max: QR_MAX_BYTES[ecc],
          })}
        </p>
      )}
    </Panel>
  )
}
