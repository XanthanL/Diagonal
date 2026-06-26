/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // 使用自定义域名 www.diagonal-art.com 根目录部署，无需 basePath
  basePath: '',
  assetPrefix: '',
};

export default nextConfig;
