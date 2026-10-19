/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// 自定义域名 www.diagonal-art.com 根目录部署，无 basePath / assetPrefix。
// 生产为 output:'export' 的静态导出；静态子站（详见 src/lib/subsites.json）
// 由 scripts/sync-sites.js 同步进 public/，随导出一起产出，无需任何代理。
// vacuum-salt 例外：它是独立 Next app，靠 merge-vacuum.js 并入 out/vacuum-salt，
// 本地 dev 没跑那套构建，所以这里把 /vacuum-salt 代理到它自己的 dev server（3001）。
const nextConfig = {
  images: { unoptimized: true },
  basePath: "",
  assetPrefix: "",
  // 只在 dev 生效：生产是静态导出，rewrites 不起作用，产物由 merge 步骤提供。
  ...(isProd
    ? {}
    : {
        async rewrites() {
          return [
            { source: "/vacuum-salt", destination: "http://127.0.0.1:3001/vacuum-salt" },
            { source: "/vacuum-salt/:path*", destination: "http://127.0.0.1:3001/vacuum-salt/:path*" },
          ];
        },
      }),
  ...(isProd ? { output: "export" } : {}),
};

export default nextConfig;
