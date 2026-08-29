"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/**
 * 全局 sticky 导航：在所有页面顶部固定显示
 * - 左：DIAGONAL wordmark；中/右：栏目 + 语言切换（桌面）
 * - 移动端：右侧抽屉。z 序为 遮罩 70 < 抽屉 75 < 顶栏 80，
 *   全部高于页面里的吸底跳转条（z-60）——此前顶栏与吸底条同为 60，
 *   遮罩压不住吸底条，抽屉打开时两者会叠在一起。
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

  // 抽屉展开期间锁住页面滚动，并支持 Esc 关闭
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  // 路由变化（含浏览器前进/后退）后收起抽屉
  useEffect(() => setMobileOpen(false), [pathname]);

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

  // 首页锚点（/#archive、/#lab）不参与高亮——它们在首页上同时成立，标出来只会误导
  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    const [path] = href.split("#");
    return path !== "/" && (pathname === path || pathname.startsWith(`${path}/`));
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-[80] transition-[background-color,box-shadow,color] duration-300 ease-out-strong ${
          mobileOpen
            ? // 抽屉展开时顶栏与抽屉同色，读作同一张纸
              "bg-background text-foreground"
            : scrolled
              ? "bg-[#FAFAF8]/90 backdrop-blur-md shadow-sm text-foreground"
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

          {/* 移动端：语言切换常驻顶栏、不藏进抽屉，汉堡键在其右侧 */}
          <div className="md:hidden flex items-center gap-5">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="press archive-text text-xs"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      {/* 遮罩：常驻挂载才能反向淡出；点击关闭 */}
      <div
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
        className={`md:hidden fixed inset-0 z-[70] bg-[#1A1A1A]/25 backdrop-blur-[2px] transition-opacity duration-200 ease-out-strong ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* 移动端抽屉：窄幅挂轴，自上而下铺开、原路回卷 */}
      <nav
        id="mobile-nav-drawer"
        data-open={mobileOpen}
        aria-label={lang === "zh" ? "站内导航" : "Site navigation"}
        className="nav-drawer md:hidden fixed top-0 right-0 z-[75] flex max-h-full w-[64vw] max-w-[17rem] flex-col overflow-y-auto bg-background pt-20"
      >
        <span className="nav-drawer-edge" aria-hidden="true" />
        <ul>
          {navItems.map((item, i) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  style={{ "--i": i } as CSSProperties}
                  className="nav-drawer-item flex items-baseline gap-4 border-b border-black/5 px-6 py-4"
                >
                  <span
                    className={`archive-text text-[9px] ${active ? "text-diagonal-red" : "opacity-40"}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-serif text-lg leading-none text-foreground">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div
          className="nav-drawer-item space-y-1 px-6 pt-10 pb-[max(1.5rem,env(safe-area-inset-bottom))] archive-text text-[9px] opacity-35"
          style={{ "--i": navItems.length } as CSSProperties}
        >
          <div>ZIGONG / HEGANG / CHENGDU</div>
          <div>EST. 2024 — ONGOING</div>
        </div>
      </nav>
    </>
  );
}
