"use client";

import { usePathname } from "next/navigation";
import { getAssetPath } from "@/lib/path";

/**
 * 草木主题下的「压花」：翻到某些页面时，首屏背景一角偶尔压着一枝水彩藤蔓。
 * 挂在 SiteThemeBackdrop 的 .site-flora-field 内，与花光同层、永远在内容之下，
 * 且随首屏滚走一次（不是钉在视口上的常驻装饰）。
 *
 * 三条克制：
 * 1. 只在 herbarium 主题出现（CSS 读 <html data-theme>），档案风连图片都不下载。
 * 2. 不是每页都有 —— 由路由哈希决定约 3/4 的页面出现，5 枝轮换、左右角错落。
 *    用路径哈希而不是 Math.random()：SSR / hydration / 刷新必须得到同一枝，
 *    否则切页会闪一下不同的图。
 * 3. 首页已有用户手绘的题图、ATLAS-HZ 整页锁死、图集详情页的照片墙必须干净，
 *    这几类一律不挂。
 *
 * 素材是 public/images/vines/sprig-N.webp：原图整幅自带粉→米白渐变底，
 * 直接铺会留矩形硬边并和花光再叠一轮粉（上一轮刚撤掉 bloom-1）。
 * 生成脚本只把绿色藤蔓抠成真透明，纸底从叶缝里透出来，所以没有边界。
 */

const SPRIG_COUNT = 5;

function hashPath(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// FNV-1a 的低几位几乎只由输入字节的异或决定，对一批同前缀的 URL 不随机：
// 曾经直接 % 4 / % 2 / % 5，结果 3 号枝独占 8 页、1 号只有 2 页，
// 19 个出现页里 16 个全压在左边。过一遍 murmur3 finalizer 把高位雪崩到低位再取模。
function mix32(x: number): number {
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function excluded(pathname: string): boolean {
  if (pathname.startsWith("/admin")) return true;
  if (/^\/atlas\/[^/]+/.test(pathname)) return true; // 含 /atlas/[id]/[subId]
  if (pathname.includes("ATLAS-HZ")) return true;
  return false;
}

export function HerbariumSprig() {
  const pathname = usePathname() || "/";
  if (excluded(pathname)) return null;

  // 首页曾整页排除（怕和手绘题图抢），结果用户打开站点第一眼永远看不到藤蔓。
  // 改为照常挂一枝，但由 CSS 单独放到右下角（题图藤蔓从左下斜上到右上，
  // 右下是干净纸面），且首页不参与留白 —— 切到草木风就该立刻看见。
  const isHome = pathname === "/";
  const h = mix32(hashPath(pathname));
  if (!isHome && h % 4 === 0) return null; // 留四分之一的页面干干净净

  // 三项各用一份带盐的混合值，避免留白 / 枝号 / 左右互相相关。
  // 枝号走「高位分桶」而不是 % 5：对这批同前缀 URL，取模仍会让 4 号扎堆
  // （实测 9 次 vs 5 号 2 次）。_sprig_hash.cjs 离线枚举过真实路由集合，
  // 这组参数得到 5 枝 [4,6,4,5,5]、留白 7/31、左右 11/13。
  // 首页固定用 2 号（最饱满的密丛，可见像素 21%）。哈希轮到的 5 号是细长
  // 垂枝（仅 9.7%），放进首屏右下那个框里只剩一根线，等于没画。
  const variant = isHome
    ? 2
    : Math.floor(
        (mix32(hashPath(`${pathname}|variant`) ^ 0x9e3779b9) / 4294967296) * SPRIG_COUNT
      ) + 1;
  const side = isHome ? "right" : mix32(hashPath(`${pathname}|side`)) % 2 ? "right" : "left";
  const lift = mix32(hashPath(`${pathname}|lift`)) % 3;

  return (
    <div
      className="herb-sprig"
      data-variant={variant}
      data-side={side}
      data-lift={lift}
      data-home={isHome ? "1" : undefined}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getAssetPath(`/images/vines/sprig-${variant}.webp`)}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
