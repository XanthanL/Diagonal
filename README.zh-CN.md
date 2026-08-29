# 对角线计划 DIAGONAL

[English](README.md) · [中文](README.zh-CN.md)

**对角线计划**是一个从中国东北延伸至西南的长期艺术项目，以行为艺术档案、跨学科研究与在地创作为核心，在自贡、鹤岗、成都等城市展开实践。

官网：[www.diagonal-art.com](https://www.diagonal-art.com)

## 网站内容

- **首页** — 档案索引式入口：文献 / 地图集 / 实验三组文字索引行，移动端附吸底章节跳转条
- **文献 Documents** — 展览纪录、驻留报告、论坛实录、策展文本，中英双语
- **地图集 Atlas** — 以子集形式呈现的跨地域视觉叙事
- **艺术家 Artists** — 项目核心驻留艺术家档案
- **项目 Projects** — "生活的盐"等长期计划的概述
- **关于 About** — 团队、时间线与项目理念

## 内容后台

网站内置浏览器端编辑器（`/admin`），供非技术编辑直接在线发布文章，无需本地环境。发布后约 1–2 分钟自动上线。

登录方式：使用 GitHub Fine-grained Personal Access Token（仅需本仓库 Contents 读写权限），令牌仅存于本机浏览器 localStorage。

## 技术概要

| 层面 | 方案 |
|------|------|
| 框架 | Next.js 14 (App Router, 全静态导出) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 动画 | Framer Motion |
| 编辑器 | TipTap 2.x |
| 部署 | GitHub Pages + GitHub Actions CI/CD |
| 域名 | `www.diagonal-art.com` |

## 本地开发

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 生成静态站点到 out/
```

## 许可

分层授权，详见 [`LICENSE`](LICENSE)：

- **代码与构建工具**（`src/`、`scripts/`、`.github/`、配置，以及三个 3D 子站的程序化建模代码）采用 **MIT License**。
- **档案文本与图像不在 MIT 授权范围内**：`src/content/` 下的展览纪录、策展文章、`public/` 下的照片与图版，以及涉及具体个人的信息，均归各自权利人所有，重复使用前请取得许可。项目自撰文本另按 **CC BY-NC 4.0** 提供，特定条目另有声明者从其声明；照片多附第三方权利与署名限制。
- 项目名称与视觉标识不构成任何商标授权。

发布动作是直接提交到 `main` 并由 CI 构建上线，因此真正的安全边界在仓库层：分发令牌前请为该分支开启 branch protection，并为 Pages 环境配置部署审批。
