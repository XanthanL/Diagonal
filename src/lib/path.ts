const basePath = process.env.NODE_ENV === 'production' ? '/Diagonal' : '';
export const siteUrl = 'https://xanthanl.github.io';

export const getAssetPath = (path: string) => {
  if (path.startsWith('http')) return path;
  return `${basePath}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const getAbsoluteUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  const assetPath = getAssetPath(path);
  return `${siteUrl}${assetPath}`;
};
