const basePath = process.env.NODE_ENV === 'production' ? '/Diagonal' : '';

export const getAssetPath = (path: string) => {
  if (path.startsWith('http')) return path;
  return `${basePath}${path.startsWith('/') ? '' : '/'}${path}`;
};
