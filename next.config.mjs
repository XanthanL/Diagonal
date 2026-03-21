/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 静态导出
  images: {
    unoptimized: true, // GitHub Pages 不支持 Next.js 的图片优化
  },
  basePath: '/Diagonal', // 关键：匹配您的 GitHub 仓库名
  assetPrefix: '/Diagonal', // 关键：确保资源路径正确
};

export default nextConfig;
