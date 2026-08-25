# 开发笔记

零散的踩坑记录与配置说明，按主题追加。

## shadcn/ui 与 components.json

components.json 是 shadcn/ui CLI 的配置文件 —— 它本身不参与运行时，只在你执行 npx shadcn add <component> 时被读取，告诉 CLI 该把组件代码生成到哪里、按什么风格生成。

## cn()

`twMerge(clsx(...))`。clsx 负责条件拼接，twMerge 负责让后写的 Tailwind 类真正覆盖前面的
——因为 Tailwind 的优先级取决于生成的 CSS 顺序，`"p-4 p-2"` 直接拼接其实是 p-4 赢。

组件里固定写 `cn(内置样式, className)`，顺序不能反，外部才能覆盖内部。
