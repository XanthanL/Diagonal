# Diagonal Project Tech Stack

本项目是一个基于 Next.js 构建的现代 Web 应用，主要用于展示艺术驻留计划的相关内容。

## 核心技术栈 (Core Tech Stack)

- **框架 (Framework):** [Next.js 14.2.3](https://nextjs.org/) (App Router)
- **语言 (Language):** [TypeScript](https://www.typescriptlang.org/)
- **样式 (Styling):** 
  - [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
  - [PostCSS](https://postcss.org/) & [Autoprefixer](https://github.com/postcss/autoprefixer)
- **动画 (Animation):** [Framer Motion](https://www.framer.com/motion/) - 强大的 React 动画库
- **图标 (Icons):** [Lucide React](https://lucide.dev/)
- **内容处理 (Content Handling):**
  - [react-markdown](https://github.com/remarkjs/react-markdown) - Markdown 渲染
  - [gray-matter](https://github.com/jonschlinkert/gray-matter) - 解析 Front-matter
  - [remark-gfm](https://github.com/remarkjs/remark-gfm) - 支持 GitHub 风格的 Markdown

## 工具与环境 (Tools & Environment)

- **代码编辑器 (Editor):** [Visual Studio Code](https://code.visualstudio.com/)
- **AI 助手 (AI Agent):** [Gemini CLI](https://github.com/google/gemini-cli) - 智能辅助开发与代码管理
- **包管理 (Package Manager):** npm (via `package-lock.json`)
- **代码规范 (Linting):** [ESLint](https://eslint.org/)
- **持续集成/部署 (CI/CD):** [GitHub Actions](https://github.com/features/actions) (见 `.github/workflows/deploy.yml`)

## 项目结构简述

- `src/app/`: Next.js App Router 路由与页面逻辑。
- `src/components/`: 可复用的 React 组件。
- `src/content/`: 项目内容文件（HTML/Markdown）。
- `public/`: 静态资源，包括大量的图片存档。
- `scripts/`: 项目辅助脚本。
