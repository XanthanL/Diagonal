/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // 只有在生产环境（GitHub Pages）部署时才使用二级目录
  basePath: isProd ? '/Diagonal' : '',
  assetPrefix: isProd ? '/Diagonal' : '',
};

export default nextConfig;
