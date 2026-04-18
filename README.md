# Playxeld

Playxeld 是一个基于 React 和 Supabase 构建的个人博客与数字艺术展示平台。它旨在提供简洁的阅读体验，并集成了一套轻量级的匿名社交互动系统。

## 核心功能

*   **多维内容展示**：
    *   **文章系统**：支持中英文双语展示，通过 `post_slug` 进行路由跳转。
    *   **艺术画廊**：专门的艺术作品展示页面，支持按标签（Tag）分类浏览。
*   **互动系统**：
    *   **匿名评论**：无需注册，基于浏览器 `device_id` 识别所有权，支持嵌套回复。
    *   **点赞功能**：针对文章的轻量级互动。
    *   **通知系统**：通过 Supabase Edge Functions 集成 Resend API，在产生新评论或回复时向管理员发送邮件通知。
*   **动态环境体验**：
    *   **天气微标**：根据用户地理坐标实时获取并显示当地天气状态。
    *   **智能主题**：内置“日光主题”逻辑，可根据地理位置或时间自动切换视觉风格。
*   **SEO 与性能**：
    *   **静态化处理**：通过自定义 Node.js 脚本在构建阶段预渲染文章的 Meta 标签，确保社交媒体分享和搜索引擎抓取的准确性。
    *   **路由懒加载**：基于 React Suspense 实现页面级的代码分割。

## 技术栈

*   **前端**：React 18, TypeScript, Vite
*   **后端/数据库**：Supabase (PostgreSQL, Row Level Security)
*   **边缘计算**：Supabase Edge Functions (Deno runtime)
*   **样式**：原生 CSS (Vanilla CSS)
*   **第三方 API**：OpenWeatherMap (天气), Resend (邮件通知)

## 本地运行方法

1.  **克隆仓库**：
    ```bash
    git clone <repo-url>
    cd playxeld
    ```

2.  **安装依赖**：
    ```bash
    npm install
    ```

3.  **配置环境变量**：
    在根目录创建 `.env` 文件，填入你的 Supabase 配置（参考下文“环境变量说明”）。

4.  **启动开发服务器**：
    ```bash
    npm run dev
    ```

5.  **构建项目**：
    ```bash
    npm run build
    ```
    *注意：构建过程会自动执行 `scripts/generate-static-post-pages.mjs` 来生成静态 SEO 页面。*

## 环境变量说明

项目运行需要以下环境变量（Vite 需以 `VITE_` 开头）：

| 变量名 | 说明 |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase 项目的 API URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase 的匿名访问 Key (Anon Key) |
| `VITE_WEATHER_API_KEY` | (可选) OpenWeatherMap API Key |

## 数据管理

*   **文章与艺术品**：存储在 Supabase 的 `posts` 和 `artworks` 表中。文章通过 `is_published` 字段控制发布状态。
*   **评论与点赞**：存储在 `comments` 和 `post_likes` 表中。
*   **静态生成**：在执行 `npm run build` 时，系统会从 Supabase 提取所有已发布文章，并基于 `dist/index.html` 模板为每篇文章生成带有独立 SEO Meta 信息的 `index.html`。

## 部署方式

项目配置了 **GitHub Actions** 自动化流水线 (`.github/workflows/deploy.yml`)：
*   当代码推送到 `main` 分支时，工作流会自动执行安装、构建，并运行静态页面生成脚本。
*   最终生成的 `dist` 目录内容将部署至 GitHub Pages 或关联的自定义域名。

## 后续优化方向

1.  **安全加固**：目前基于 `device_id` 的所有权校验较为脆弱，计划引入服务端限流（Rate Limiting）以防止垃圾评论轰炸。
2.  **测试覆盖**：引入 Vitest 进行单元测试，尤其是针对评论嵌套逻辑和主题切换逻辑。
3.  **构建脚本重构**：将目前基于正则表达式的 SEO 注入脚本替换为更加健壮的 HTML 解析器实现（如 `jsdom`）。
4.  **性能优化**：优化 Supabase 查询索引，并针对艺术画廊页面引入图片懒加载与 CDN 预处理。
