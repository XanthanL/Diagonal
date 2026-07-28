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

// —— Cloudinary 自动优化 ——
// 通过在 /image/upload/ 后注入变换参数，自动协商格式(f_auto: WebP/AVIF)、质量(q_auto)
// 并按需限宽(w_,c_limit 只缩不放)。非 Cloudinary URL 原样返回；已优化的 URL 不重复注入（幂等）。
const CLOUDINARY_MARK = '/image/upload/';

const buildCloudinaryTransform = (width?: number): string => {
  const parts = ['f_auto', 'q_auto'];
  if (width) parts.push(`w_${width}`, 'c_limit');
  return parts.join(',');
};

export const getCloudinaryUrl = (url: string, width?: number): string => {
  if (!url.includes('res.cloudinary.com') || !url.includes(CLOUDINARY_MARK)) return url;
  const [prefix, rest] = url.split(CLOUDINARY_MARK);
  // 第一段已包含 f_auto 说明已优化，避免重复注入
  if (rest.split('/')[0].includes('f_auto')) return url;
  return `${prefix}${CLOUDINARY_MARK}${buildCloudinaryTransform(width)}/${rest}`;
};

// 生成响应式 srcSet（多宽度），用于画廊大图
const DEFAULT_SRCSET_WIDTHS = [480, 768, 1080, 1440];
export const getCloudinarySrcSet = (url: string, widths: number[] = DEFAULT_SRCSET_WIDTHS): string => {
  if (!url.includes('res.cloudinary.com') || !url.includes(CLOUDINARY_MARK)) return '';
  return widths.map((w) => `${getCloudinaryUrl(url, w)} ${w}w`).join(', ');
};

// —— 本地图片响应式变体 ——
// 构建期 scripts/optimize-images.js 为 public/images/archive/ 下的图片
// 生成 {name}.w480.webp / .w960.webp / .w1600.webp 变体。
// 这里按同样命名规则拼 srcSet；变体缺失时由 <img onError> 回退原图。
const LOCAL_VARIANT_WIDTHS = [480, 960, 1600];
const LOCAL_IMG_RE = /^\/images\/.+\.(jpe?g|png)$/i;

export const getLocalSrcSet = (src: string): string => {
  if (!LOCAL_IMG_RE.test(src)) return '';
  const base = src.replace(/\.(jpe?g|png)$/i, '');
  return LOCAL_VARIANT_WIDTHS
    // srcset 以逗号/空格分隔条目，URL 中的中文、逗号、空格必须百分号编码
    .map((w) => `${encodeURI(getAssetPath(`${base}.w${w}.webp`)).replace(/,/g, '%2C')} ${w}w`)
    .join(', ');
};

// 变体加载失败时回退原图（清空 srcset 后浏览器重新用 src 加载）
export const srcSetFallback = (e: { currentTarget: HTMLImageElement }) => {
  if (e.currentTarget.srcset) e.currentTarget.srcset = '';
};
