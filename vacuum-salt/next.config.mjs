/** @type {import('next').NextConfig} */

// GitHub Pages 项目站点部署在 https://<user>.github.io/<repo>/
// 本地开发时为空字符串；部署时通过环境变量 NEXT_PUBLIC_BASE_PATH 设置（如 /vacuum-salt）
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  // 静态导出，便于 GitHub Pages 部署
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  // R3F 等依赖可能引用 Node 模块，静态导出时关闭服务端文件追踪告警
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
