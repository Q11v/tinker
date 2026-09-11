/**
 * 「聚焦首页搜索框」这件事的跨页面通道。
 *
 * 搜索框只存在于首页，但 ⌘K 快捷键和顶栏的 ⌘K 胶囊在每个页面都要能用。
 * 所以除了事件之外还留了一个模块级的待处理标记：
 * - 已经在首页：ToolExplorer 正监听着，事件直接命中；
 * - 在工具页：先跳回首页，此时 ToolExplorer 还没挂载，事件没人接，
 *   标记留在模块里，等它挂载后自己取走。
 *
 * 客户端路由不会重新求值模块，标记因此能跨页面存活；整页刷新则会丢，
 * 那正是我们想要的 —— 用户手动刷新首页不该被莫名聚焦。
 */

const EVENT = "tinker:focus-search"

let pending = false

export function requestSearchFocus() {
  pending = true
  window.dispatchEvent(new Event(EVENT))
}

export function subscribeSearchFocus(handler: () => void): () => void {
  function listener() {
    pending = false
    handler()
  }

  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}

/** 取出并清掉待处理标记，供搜索框挂载时补上它错过的那一次请求 */
export function consumeSearchFocus(): boolean {
  const value = pending
  pending = false
  return value
}
