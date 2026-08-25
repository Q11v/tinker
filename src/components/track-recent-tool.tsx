"use client"

import { useEffect } from "react"

import { recordRecentTool } from "@/lib/recent-tools"

/** 挂在 ToolShell 里，每进入一个工具页就记一次，新增工具无需额外接线 */
export function TrackRecentTool({ slug }: { slug: string }) {
  useEffect(() => {
    recordRecentTool(slug)
  }, [slug])

  return null
}
