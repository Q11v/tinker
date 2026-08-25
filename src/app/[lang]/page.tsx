import { ToolExplorer } from "@/components/tool-explorer"

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="bg-gradient-brand animate-blob pointer-events-none absolute -top-40 -left-32 -z-10 size-96 rounded-full opacity-20 blur-3xl"
      />
      <div
        aria-hidden
        className="bg-gradient-brand animate-blob pointer-events-none absolute -top-24 -right-24 -z-10 size-80 rounded-full opacity-15 blur-3xl [animation-delay:4s]"
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <section className="mb-10 max-w-2xl">
          <h1 className="text-gradient-brand text-3xl font-semibold tracking-tight sm:text-4xl">
            开发者工具箱
          </h1>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            一系列轻量、纯前端的开发者小工具。
          </p>
        </section>

        <ToolExplorer />
      </div>
    </div>
  )
}
