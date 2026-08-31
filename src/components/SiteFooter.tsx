"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLocalizedUrl } from "@/lib/path";

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
          <p className="archive-text text-[9px] opacity-50 max-w-xs leading-relaxed">
            从东北到西南的长期艺术项目
          </p>
        </div>

        {/* 右侧：版权信息与制作说明入口 */}
        <div className="archive-text text-[9px] text-right space-y-1">
          <div className="opacity-40">© 2024–2026 DIAGONAL PROJECT</div>
          <div className="opacity-40">ZIGONG / HEGANG / CHENGDU</div>
          <div className="opacity-65 pt-2">
            <Link
              href={getLocalizedUrl("/colophon")}
              className="hover:opacity-100 hover:text-diagonal-red transition-[opacity,color] duration-200 ease-out-strong"
            >
              COLOPHON · SITE BY XANTHANL
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
