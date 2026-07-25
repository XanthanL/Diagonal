"use client";

import { usePathname } from "next/navigation";

// 站点页脚：后台 /admin 下不显示，保持后台界面纯净
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="relative overflow-hidden border-t border-black/10 px-6 py-16 md:py-24">
      {/* 对角线装饰 */}
      <div className="absolute top-0 right-0 w-32 h-full pointer-events-none opacity-[0.04]">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black to-transparent transform rotate-45 origin-top-right" />
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        {/* 左侧：品牌 */}
        <div className="space-y-3">
          <div className="font-serif font-black text-2xl tracking-tighter leading-none opacity-80">
            <span>DIA</span>
            <span className="ml-1">GONAL</span>
          </div>
          <p className="archive-text text-[9px] opacity-40 max-w-xs leading-relaxed">
            从东北到西南的长期艺术项目
          </p>
        </div>

        {/* 右侧：版权信息 */}
        <div className="archive-text text-[9px] opacity-30 text-right space-y-1">
          <div>© 2024–2026 DIAGONAL PROJECT</div>
          <div>ZIGONG / HEGANG / CHENGDU</div>
        </div>
      </div>
    </footer>
  );
}
