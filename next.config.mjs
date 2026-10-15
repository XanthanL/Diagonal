/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// 自定义域名 www.diagonal-art.com 根目录部署，无 basePath / assetPrefix。
// 生产为 output:'export' 的静态导出；静态子站（详见 src/lib/subsites.json）
// 由 scripts/sync-sites.js 同步进 public/，随导出一起产出，无需任何代理。
// （此前存在的 /vacuum-salt 开发代理已随该方向终止一并移除。）
const nextConfig = {
  images: { unoptimized: true },
  basePath: "",
  assetPrefix: "",
  ...(isProd ? { output: "export" } : {}),
};

export default nextConfig;
