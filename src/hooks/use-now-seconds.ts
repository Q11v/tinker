"use client"

import { useEffect, useState } from "react"

/** 每秒刷新一次的 Unix 时间戳，用于让「还有多久过期」保持准确 */
export function useNowSeconds(): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  return now
}
