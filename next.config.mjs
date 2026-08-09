/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const common = {
  images: { unoptimized: true },
  // 使用自定义域名 www.diagonal-art.com 根目录部署，无需 basePath
  basePath: "",
  assetPrefix: "",
};

// 生产静态导出：output: 'export'，不使用代理。
// 本地开发（next dev）：把 /vacuum-salt/* 反向代理到独立运行的真空制盐 dev 服务
// （默认 http://localhost:3001，需带 basePath=/vacuum-salt 启动），
// 这样在 diagonal 开发服务器里点开子页不会 404。
const nextConfig = isProd
  ? { ...common, output: "export" }
  : {
      ...common,
      async rewrites() {
        return [
          {
            source: "/vacuum-salt/:path*",
            destination: "http://localhost:3001/vacuum-salt/:path*",
          },
        ];
      },
    };

export default nextConfig;
