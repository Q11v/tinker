function GithubMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  )
}

export function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t">
      <div
        aria-hidden
        className="bg-gradient-brand absolute inset-x-0 -top-px h-px opacity-70"
      />
      <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>tinker · 一系列轻量、纯前端的开发者小工具，无需登录、即开即用。</p>
        <a
          href="https://github.com/Q11v/tinker"
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <GithubMark className="size-3.5" />
          GitHub
        </a>
      </div>
    </footer>
  )
}
