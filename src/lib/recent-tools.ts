/**
 * 「最近使用」的本地存储。站点是纯静态导出，没有后端，记录只存在当前浏览器里。
 *
 * 对外暴露 subscribe / getSnapshot 这组接口，是为了让组件用 useSyncExternalStore
 * 订阅：服务端快照恒为空数组，可以天然避开 localStorage 带来的 hydration 不一致。
 */

const STORAGE_KEY = "tinker:recent-tools"

/** 最多记住几个，同时也是首页展示的上限 */
export const MAX_RECENT = 5

/** 服务端快照必须是稳定引用，否则 useSyncExternalStore 会判定为无限更新 */
const EMPTY: readonly string[] = []

type Listener = () => void

const listeners = new Set<Listener>()
let snapshot: readonly string[] = EMPTY
let loaded = false

function read(): readonly string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return EMPTY
    const slugs = parsed.filter((item): item is string => typeof item === "string")
    return slugs.length ? slugs.slice(0, MAX_RECENT) : EMPTY
  } catch {
    // 隐私模式、配额用尽或数据被手改坏，都按「没有记录」处理
    return EMPTY
  }
}

function isSame(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((slug, index) => slug === b[index])
}

function publish(next: readonly string[]) {
  if (isSame(next, snapshot)) return
  snapshot = next
  for (const listener of listeners) listener()
}

function handleStorage(event: StorageEvent) {
  // key 为 null 表示整个 storage 被清空
  if (event.key !== null && event.key !== STORAGE_KEY) return
  loaded = true
  publish(read())
}

export function subscribeRecentTools(listener: Listener): () => void {
  listeners.add(listener)
  // 多标签页之间保持同步
  if (listeners.size === 1) window.addEventListener("storage", handleStorage)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener("storage", handleStorage)
  }
}

export function getRecentToolsSnapshot(): readonly string[] {
  if (!loaded) {
    loaded = true
    snapshot = read()
  }
  return snapshot
}

export function getRecentToolsServerSnapshot(): readonly string[] {
  return EMPTY
}

function persist(next: readonly string[]) {
  try {
    if (next.length === 0) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 写不进去就只更新内存快照，本次会话内仍然可用
  }
  loaded = true
  publish(next)
}

/** 记录一次访问，已存在则提到最前 */
export function recordRecentTool(slug: string) {
  const current = getRecentToolsSnapshot()
  if (current[0] === slug) return
  persist([slug, ...current.filter((item) => item !== slug)].slice(0, MAX_RECENT))
}

export function clearRecentTools() {
  persist(EMPTY)
}
