/**
 * 季节偏好（与 themePrefs 同构：localStorage + 模块级订阅，不引 Context）。
 *
 * 季节是主题之下的正交维度：只有在 herbarium（草木）主题里才有意义，archive 里
 * 切换不产生视觉变化但状态照样记住，切回草木时仍在用户选的季节。
 *
 * 默认 spring，且 localStorage 语义与主题一致 —— 只有存了明确的非 spring 值才生效；
 * 没存 / 存 spring / 坏数据一律春。这样「默认春」和「选过的季节要被记住」不冲突。
 *
 * URL 参数 ?season=summer|autumn|winter|spring 用于无 UI 阶段预览，优先级高于
 * localStorage（仅本次请求，不写回存储），图到位接上切换入口后可保留作深链。
 *
 * 首帧由 <head> 同步脚本（introAssets.ts）写 data-season，不等 React；这里只管
 * 客户端订阅与切换。
 */

import { parseSeason, type SiteSeason } from "./seasons";

export const SITE_SEASON_KEY = "diagonal:season";

let cached: SiteSeason | null = null;
const listeners = new Set<(season: SiteSeason) => void>();

function read(): SiteSeason {
  if (cached) return cached;
  let next: SiteSeason = "spring";
  try {
    // URL 参数优先（预览用，不持久化）
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("season");
      if (q) {
        next = parseSeason(q);
        cached = next;
        return next;
      }
    }
    const stored = window.localStorage.getItem(SITE_SEASON_KEY);
    next = parseSeason(stored);
  } catch {
    // 隐私模式 / 坏数据：退回默认春
  }
  cached = next;
  return next;
}

/** 同步读一份快照（客户端）。 */
export function readSiteSeason(): SiteSeason {
  return read();
}

export function setSiteSeason(season: SiteSeason): void {
  cached = season;
  try {
    window.localStorage.setItem(SITE_SEASON_KEY, season);
  } catch {
    /* 存不下就算了，本次会话内仍然生效 */
  }
  document.documentElement.setAttribute("data-season", season);
  listeners.forEach((fn) => fn(season));
}

/** 订阅变更，返回退订函数 */
export function subscribeSiteSeason(fn: (season: SiteSeason) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
