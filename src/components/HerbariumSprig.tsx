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

function excluded(pathname: string): boolean {
  if (pathname === "/" || pathname.startsWith("/admin")) return true;
  if (/^\/atlas\/[^/]+/.test(pathname)) return true; // 含 /atlas/[id]/[subId]
  if (pathname.includes("ATLAS-HZ")) return true;
  return false;
}

export function HerbariumSprig() {
  const pathname = usePathname() || "/";
  if (excluded(pathname)) return null;

  const h = hashPath(pathname);
  if (h % 4 === 0) return null; // 留四分之一的页面干干净净

  const variant = ((h >>> 3) % SPRIG_COUNT) + 1;
  // 左右角与上下错落各用一份独立哈希：同一个 h 的高位在短路径里分布不均，
  // 会让绝大多数页面都把压花压在左边。
  const side = hashPath(`${pathname}|side`) % 2 ? "right" : "left";
  const lift = hashPath(`${pathname}|lift`) % 3;

  return (
    <div className="herb-sprig" data-side={side} data-lift={lift} aria-hidden="true">
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
