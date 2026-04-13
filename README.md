# Playxeld Blog

一个基于 `Vite + React + TypeScript + Supabase` 的个人博客前端。

## 技术栈

- `Vite`
- `React`
- `TypeScript`
- `React Router`
- `Supabase`
- `react-markdown`

## 本地开发

先安装依赖：

```bash
npm install
```

在项目根目录创建 `.env.local`：

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

启动开发环境：

```bash
npm run dev
```

## 可用脚本

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## 数据要求

前端默认读取 Supabase 中的 `posts` 表，当前代码依赖这些字段：

- `id`
- `slug`
- `title`
- `excerpt`
- `content`
- `published_at`
- `is_published`
- `tag`

## 部署

项目当前通过 GitHub Actions 部署到 GitHub Pages。生产构建时需要在仓库 Secrets 中配置：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
