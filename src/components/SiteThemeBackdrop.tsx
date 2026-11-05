"use client";

import { usePathname } from "next/navigation";
import { FLORA_LAYERS } from "@/components/FloraBackdrop";

/**
 * 草木主题下的全站背景：把 Xanthan摄影作品那一辑的「花汁洇在纸上」铺到所有页面。
 *
 * 两条边界是刻意划的：
 * 1. 挂在 root layout、position:fixed 只罩首屏，往下 mask 淡出到干净纸色 ——
 *    照片墙、表格、长文都不该被颜色染脏（这一条是从那一辑的调参里带过来的结论）。
 * 2. ATLAS-HZ 自己页面内有一份 FloraBackdrop，构图是按那一页的标题位置逐档量过的。
 *    这里整块不挂载，既不重复叠色，也保证用户最喜欢的那页像素级不变。
 *
 * 显隐完全交给 CSS 读 <html data-theme>：刷新时 inline script 同步写好属性，
 * 首帧就带着背景，不需要等 hydration；档案风下整块 display:none，三张底图一张都不下载。
 */
export function SiteThemeBackdrop() {
  const pathname = usePathname();
  if (pathname.includes("ATLAS-HZ")) return null;

  return (
    <div aria-hidden="true" className="site-flora-field">
      <div className="site-flora-plane">
        {FLORA_LAYERS.slice(0, 2).map((layer) => (
          <div
            key={layer.id}
            className={`flora-bloom ${layer.className}`}
            style={{ backgroundImage: `url(${layer.src})` }}
          />
        ))}
        <div className="site-flora-fade" />
        <div className="flora-grain site-flora-grain" />
      </div>
    </div>
  );
}
