const basePath = '';
export const siteUrl = 'https://www.diagonal-art.com';

export const getAssetPath = (path: string) => {
  if (path.startsWith('http')) return path;
  return `${basePath}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const getAbsoluteUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  const assetPath = getAssetPath(path);
  return `${siteUrl}${assetPath}`;
};

// 生成 localized URL（语言切换由客户端 i18n Context + localStorage 处理，URL 路径保持一致）
export const getLocalizedUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  if (!path.startsWith('/')) return `/${path}`;
  return path;
};
