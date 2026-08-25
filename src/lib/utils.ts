import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 代码类输入框（Textarea / Input）的字体与字号。
 *
 * 移动端必须保持 ≥16px：iOS Safari 聚焦到字号小于 16px 的 input/textarea 时
 * 会自动放大整个页面，而且退出输入后不会缩回去。shadcn 的基础样式本来写了
 * `text-base md:text-sm` 来避开这一点，但各工具用 text-[13px] 覆盖后就失效了。
 *
 * 所以这里保留移动端 16px，只在 md 以上降到 13px 换取密度。
 * 改动前请先在真机 iOS Safari 上验证。
 */
export const monoField = "font-mono text-base md:text-[13px]"
