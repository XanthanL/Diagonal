/**
 * 全站两套风格的开关。
 *
 * - herbarium —— **首次访问的默认**。Xanthan摄影作品那一辑的浅纸草木风：
 *                标本册纸 / 偏绿墨 / 山茶暗红，加一层虚焦花汁底光与纸纤维，
 *                标题走 Cormorant 衬线。
 * - archive   —— 站点原本的样子：暖白纸 / 墨字 / 暗朱；Atlas 与相册详情是黑底。
 *
 * 默认改成草木后，localStorage 的语义也随之反转：**只记住「显式选过 archive」**。
 * 没存过 / 存的是 herbarium / 数据损坏，一律草木；只有 === 'archive' 才回档案风。
 * 这样「以后默认草木」和「切回档案风要被记住」两件事不冲突，也不需要改键名做迁移。
 *
 * 与 shaderPrefs 同一套做法：localStorage 持久化 + 模块级订阅者，不引 Context ——
 * 主题的最终落地形态是 <html data-theme>，CSS 直接读，React 树不需要为它多一层 Provider。
 *
 * ⚠ 首帧不能等 React：服务端静态 HTML 直接带 data-theme="herbarium"，
 *   root layout 的 <head> 同步脚本只在用户显式选过 archive 时改写成 archive，
 *   两者都在 CSS 生效之前落地（脚本见 lib/introAssets.ts 的 INTRO_HEAD_SCRIPT）。
 */

export type SiteTheme = "archive" | "herbarium";

export const SITE_THEME_KEY = "diagonal:theme";

let cached: SiteTheme | null = null;
const listeners = new Set<(theme: SiteTheme) => void>();

function read(): SiteTheme {
  if (cached) return cached;
  let next: SiteTheme = "herbarium";
  try {
    if (window.localStorage.getItem(SITE_THEME_KEY) === "archive") next = "archive";
  } catch {
    // 隐私模式 / 坏数据：退回默认草木，绝不让主题拖垮页面
  }
  cached = next;
  return next;
}

/** 同步读一份快照（客户端）。 */
export function readSiteTheme(): SiteTheme {
  return read();
}

export function setSiteTheme(theme: SiteTheme): void {
  cached = theme;
  try {
    window.localStorage.setItem(SITE_THEME_KEY, theme);
  } catch {
    /* 存不下就算了，本次会话内仍然生效 */
  }
  document.documentElement.setAttribute("data-theme", theme);
  listeners.forEach((fn) => fn(theme));
}

/** 在两套之间切换，返回切换后的值。 */
export function toggleSiteTheme(): SiteTheme {
  const next: SiteTheme = read() === "herbarium" ? "archive" : "herbarium";
  setSiteTheme(next);
  return next;
}

/** 订阅变更，返回退订函数 */
export function subscribeSiteTheme(fn: (theme: SiteTheme) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
