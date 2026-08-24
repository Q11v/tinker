import { ToolExplorer } from "@/components/tool-explorer"

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <section className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          开发者工具箱
        </h1>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          一系列轻量、纯前端的开发者小工具。
        </p>
      </section>

      <ToolExplorer />
    </div>
  )
}
