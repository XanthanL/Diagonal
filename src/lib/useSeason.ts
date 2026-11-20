/**
 * 客户端组件读取当前季节的入口。
 *
 * 用 useSyncExternalStore 而不是 useState+useEffect：
 * - SSR / hydration 阶段返回 "spring"（与 <html data-season="spring"> 的服务端首帧一致），
 *   不会产生 src 属性不匹配的 hydration 警告；
 * - hydration 完成后立刻切到 <head> 同步脚本已写好的 data-season，
 *   揭幕动画还盖着，用户看不到换图；
 * - 运行时 setSiteSeason() 会通知订阅，无需刷新整页。
 *
 * 只用于 <img src> 这类 CSS 变量驱动不了的落位点；
 * CSS background 直接读 --season-*，不经过这里。
 */
"use client";

import { useSyncExternalStore } from "react";
import { readSiteSeason, subscribeSiteSeason } from "./seasonPrefs";
import type { SiteSeason } from "./seasons";

const serverSeason: SiteSeason = "spring";

export function useSeason(): SiteSeason {
  return useSyncExternalStore(subscribeSiteSeason, readSiteSeason, () => serverSeason);
}
