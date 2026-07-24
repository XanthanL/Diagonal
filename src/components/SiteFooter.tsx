"use client";

import { usePathname } from "next/navigation";

// 站点页脚：后台 /admin 下不显示，保持后台界面纯净
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="p-12 border-t border-black/10 flex justify-between items-end archive-text text-xs opacity-50">
      <div>© 2026 DIAGONAL PROJECT</div>
    </footer>
  );
}
