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
