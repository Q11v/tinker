# 开发笔记

零散的踩坑记录与配置说明，按主题追加。

## shadcn/ui 与 components.json

components.json 是 shadcn/ui CLI 的配置文件 —— 它本身不参与运行时，只在你执行 npx shadcn add <component> 时被读取，告诉 CLI 该把组件代码生成到哪里、按什么风格生成。
