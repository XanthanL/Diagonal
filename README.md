# 对角线计划 Diagonal

对角线计划（Diagonal）官网：一个从东北到西南、以行为艺术档案与跨学科研究为核心的长期艺术项目的双语内容展示站。基于 Next.js 静态导出构建，部署在 GitHub Pages，自定义域名 [www.diagonal-art.com](https://www.diagonal-art.com)。

仓库内含一个**内置内容后台**（`/admin`），供非技术编辑在浏览器里直接撰写、发布文章，无需本地环境或命令行。

## 核心技术栈

- **框架**：[Next.js 14.2.3](https://nextjs.org/)（App Router，`output: 'export'` 全静态导出）
- **语言**：[TypeScript](https://www.typescriptlang.org/)
- **样式**：[Tailwind CSS](https://tailwindcss.com/) + PostCSS + Autoprefixer
- **动画**：[Framer Motion](https://www.framer.com/motion/)
- **富文本编辑器**（后台）：[Tiptap](https://tiptap.dev/)（StarterKit + Image + Link）
- **GitHub 提交**（后台）：[@octokit/rest](https://github.com/octokit/rest.js)（浏览器直连 GitHub API）
- **字体**：`next/font` 加载 Inter / JetBrains Mono / Newsreader（构建期从 Google Fonts 拉取）
- **图片优化**：Cloudinary 变换参数（`f_auto,q_auto,w_,c_limit`）+ 响应式 `srcSet`

## 部署

- **CI/CD**：GitHub Actions（见 `.github/workflows/deploy.yml`）。推送到 `main` → `npm run build` 生成 `out/` → 发布到 GitHub Pages。
- **域名**：`CNAME` 指向 `www.diagonal-art.com`。

## 内容模型

文章由「结构化元数据 + HTML 正文」两部分组成：

- `src/lib/data.ts`：历史文章以 `legacyArchiveData` 原样保留；构建期静态导入 overlay JSON 合并——**相同 id 覆盖、新 id 追加、按时间倒序**，`draft: true` 的条目不上线。
- `src/content/archive/_store/index.json`：后台写入的 overlay 元数据。
- `src/content/archive/{id}.html`（及可选 `{id}.en.html`）：文章正文。
- `public/images/archive/{id}/*`：封面与正文配图。

## 内容后台 `/admin`

后台是主站的一部分（同一次构建、同一域名），随 GitHub Pages 部署到 `www.diagonal-art.com/admin`，纯客户端运行。

**工作原理**

```
编辑浏览器(/admin) → Octokit 直连 GitHub API 一次提交多文件 → main 分支
                                        → GitHub Actions 重建 → Pages 上线
```

一次「发布」会向仓库写入：overlay JSON、`{id}.html`（可选 `{id}.en.html`）、以及封面/正文图片，随后自动触发重建，约 1–2 分钟线上生效。

**登录与凭证（重要）**

静态站没有服务器可藏密钥，因此后台采用「**运行时持有令牌**」的方式：

1. 在 GitHub → Settings → Developer settings → **Fine-grained personal access tokens** 新建令牌：Repository access 只勾本仓库（`Diagonal`），Permissions → **Contents: Read and write**。
2. 打开 `www.diagonal-art.com/admin`，把令牌（`github_pat_...`）粘贴进登录门。
3. 令牌只保存在**该设备浏览器的 localStorage**，不写入代码、不上传、不进构建产物。

> 目标仓库坐标（`XanthanL/Diagonal@main`）硬编码在 `src/lib/admin/constants.ts`。更换仓库需改此处。
> 建议给编辑的令牌设置较短有效期、且仅授予本仓库 Contents 读写。

**编辑要怎么用（日常发文，无需任何技术知识）**

1. 打开后台网址，粘贴令牌进入。
2. 点「+ 新建文章」，填上半部分表单：中文标题（必填）、发布时间（点「现在」自动填，决定排序）、类型/项目/子系列/地区、地点（可用预设快速填充）、封面图。
3. 下半部分写正文：像写公众号一样打字，用工具栏做小标题(H2/H3)、加粗、引文、列表，点「图片」直接插图；需要英文版就切到「英文正文」再写一遍（仅当英文标题+英文正文都填写时才生成英文页）。
4. 右侧「实时预览」所见即所得。确认后点「发布」；没写完可点「存草稿」（草稿只在后台可见，不上线）。
5. 在列表里点任意文章可再次编辑；改历史文章不会影响其它内容。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 生成静态站点到 out/
```

> 注：`npm run build` 在无法访问 Google Fonts 的网络环境下会因 `next/font` 拉取字体失败；GitHub Actions 环境正常。类型检查可用 `npx tsc --noEmit`。

## 项目结构

- `src/app/`：App Router 路由与页面（含 `src/app/admin/` 内容后台）。
- `src/components/`：可复用组件（含 `src/components/admin/` 后台组件）。
- `src/lib/`：数据与工具（`data.ts`、`path.ts`、`i18n.tsx` 等；`src/lib/admin/` 为后台的浏览器版 GitHub 客户端、会话与 HTML 模板）。
- `src/content/archive/`：文章正文 HTML 与 `_store/index.json` overlay。
- `public/`：静态资源，含 `public/images/archive/` 文章图片存档。
- `.github/workflows/deploy.yml`：GitHub Pages 部署流水线。
