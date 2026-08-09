"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/**
 * 全局 sticky 导航：在所有页面顶部固定显示
 * - 左：DIA/GONAL wordmark（对角错位简化版）
 * - 中：Documents / Atlas / About
 * - 右：语言切换
 * - 在 archive/atlas 详情页自动隐藏（详情页有自己的导航）
 */
export function GlobalNav() {
  const pathname = usePathname();
  const { lang } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll(); // init
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 详情页有自己的导航，不显示全局导航；后台 /admin 亦不显示公开导航
  const isDetailPage =
    /^\/archive\/[^/]+$/.test(pathname) ||
    /^\/atlas\/[^/]+(\/[^/]+)?$/.test(pathname);

  if (isDetailPage || pathname.startsWith("/admin")) return null;

  const navItems = [
    { href: "/#archive", label: lang === "zh" ? "文献" : "Documents" },
    { href: "/atlas", label: lang === "zh" ? "地图集" : "Atlas" },
    { href: "/artists", label: lang === "zh" ? "艺术家" : "Artists" },
    { href: "/projects/the-salt-of-life", label: lang === "zh" ? "项目" : "Projects" },
    { href: "/#lab", label: lang === "zh" ? "实验" : "Lab" },
    { href: "/about", label: lang === "zh" ? "关于" : "About" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-[60] transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm text-[#1A1A1A]"
          : "mix-blend-difference text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Wordmark */}
        <Link href="/" className="archive-text font-bold text-sm tracking-tighter">
          DIAGONAL
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="archive-text text-[11px] opacity-60 hover:opacity-100 transition-opacity"
            >
              {item.label}
            </Link>
          ))}
          <div className="ml-4">
            <LanguageSwitcher />
          </div>
        </nav>

        {/* 移动端菜单按钮 */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden archive-text text-xs"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* 移动端展开菜单 + 背景遮罩 */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 top-[56px] z-[59] bg-black/40 backdrop-blur-sm animate-fadeIn"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <nav
        className={`md:hidden fixed top-[56px] left-0 w-full z-[60] bg-black text-white px-6 py-5 space-y-3 border-t border-white/10 transition-all duration-200 ease-out ${
          mobileOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0 pointer-events-none"
        }`}
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className="block archive-text text-xs opacity-70 hover:opacity-100"
          >
            {item.label}
          </Link>
        ))}
        <div className="pt-3 border-t border-white/10">
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
