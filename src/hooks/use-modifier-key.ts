"use client"

import { useSyncExternalStore } from "react"

/*
  修饰键要按平台显示，但服务端渲染不知道用户在用什么系统。
  走 useSyncExternalStore：服务端与 hydration 阶段都用 ⌘，之后 React 再用客户端快照重渲一次，
  这样既不会 hydration 不一致，也不用在 effect 里 setState。
  平台不会变，所以 subscribe 是个空订阅。
*/
const noopSubscribe = () => () => {}

function getModifier(): string {
  return navigator.platform.toLowerCase().startsWith("mac") ? "⌘" : "Ctrl "
}

function getServerModifier(): string {
  return "⌘"
}

/** 当前平台的主修饰键：Mac 上是「⌘」，其余是「Ctrl 」（带尾随空格，直接拼按键名） */
export function useModifierKey(): string {
  return useSyncExternalStore(noopSubscribe, getModifier, getServerModifier)
}
