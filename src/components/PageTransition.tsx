"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type TransitionPhase = "idle" | "intro" | "cover" | "reveal";

const COVER_MS = 760; // 五列幕布错峰升起盖满屏幕：480ms 动画 + 4×70ms 错峰
const HOLD_MS = 180; // 盖满后的定格停顿，让 DIAGONAL 字标可读
const REVEAL_MS = 860; // 幕布反向错峰升出视口：560ms 动画 + 4×70ms 错峰

// 独立部署的子项目：主站 App Router 里没有对应路由，必须走整页跳转。
// 生产静态导出中它们位于 out/vacuum-salt 与 out/salt-plant-3d。
function isStandaloneSubproject(pathname: string) {
  return (
    pathname === "/vacuum-salt" ||
    pathname.startsWith("/vacuum-salt/") ||
    pathname === "/salt-plant-3d" ||
    pathname.startsWith("/salt-plant-3d/")
  );
}

function isAssetLink(pathname: string) {
  return /\.(png|jpe?g|gif|webp|avif|svg|ico|pdf|mp4|webm|txt|json|xml|zip)$/i.test(pathname);
}

/**
 * 斜切五列幕布页面过渡（参考 framer-motion stagger / Osmo 式列幕布，
 * 不依赖 View Transitions API，保证 Chrome/Safari/Firefox 手感一致）：
 * 1. 点击站内链接 → 5 根整体斜切的竖条左→右错峰升起，红色前缘扫过屏幕盖住旧页；
 *    随后白色光束对角线自左下向右上匀速生长，铭文与两线同步长出；
 * 2. 路由在幕布后完成切换；
 * 3. 竖条右→左错峰升出视口（波浪式），露出新页——进出方向连续。
 *
 * 独立子项目先播放盖幕动画，再整页跳转（phase 停在 cover）；
 * 从子项目返回时若命中 bfcache（pageshow.persisted），重放揭幕防止幕布卡屏。
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<TransitionPhase>("intro");
  const phaseRef = useRef<TransitionPhase>("idle");
  phaseRef.current = phase;
  const pendingHref = useRef<string | null>(null);
  const pendingExternal = useRef(false);
  const pendingRoute = useRef<string | null>(null);
  const fallbackTimer = useRef<number | null>(null);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    if (phase !== "cover") return;
    if (!pendingHref.current) return;

    const timer = window.setTimeout(() => {
      // 盖幕期间可能又点了新链接：以触发时刻的 pendingHref 为准
      const href = pendingHref.current;
      if (!href) return;

      if (pendingExternal.current) {
        // 独立子项目：幕布盖住后直接离开当前文档
        window.location.assign(href);
        return;
      }

      router.push(href);
      // 若 RSC 加载超过 1s 仍未提交路由，强制淡出，避免永远被幕布盖住
      if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
      fallbackTimer.current = window.setTimeout(() => {
        if (phaseRef.current === "cover") setPhase("reveal");
      }, 1000);
    }, COVER_MS);

    return () => window.clearTimeout(timer);
  }, [phase, router]);

  // 幕布完全盖住后，等 App Router 真正提交目标路由再揭幕；
  // 揭幕前刻意停顿 HOLD_MS，让 DIAGONAL 字标有一个可读的定格时刻
  useEffect(() => {
    if (phase !== "cover" || pendingExternal.current) return;
    const currentRoute = `${pathname}${typeof window !== "undefined" ? window.location.search : ""}`;
    if (pendingRoute.current && currentRoute === pendingRoute.current) {
      if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
      fallbackTimer.current = window.setTimeout(() => {
        if (phaseRef.current === "cover") setPhase("reveal");
      }, HOLD_MS);
    }
  }, [phase, pathname]);

  useEffect(() => {
    if (phase !== "reveal") return;
    const timer = window.setTimeout(() => {
      setPhase("idle");
      pendingHref.current = null;
      pendingExternal.current = false;
      pendingRoute.current = null;
    }, REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // 首次加载：首帧被幕布完整覆盖（pt-intro 无过渡），下一帧播放标准揭幕，
  // 让「打开网站的第一眼」与站内换场共享同一套动画语言
  useEffect(() => {
    if (phase !== "intro") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setPhase(reduced ? "idle" : "reveal");
      })
    );
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // bfcache 修复：进入独立子项目是整页跳转，本组件冻结在 cover 相位；
  // 从子项目返回时浏览器可能从 bfcache 恢复本页（pageshow.persisted），
  // 幕布会永远盖住屏幕。此处直接重放揭幕动画露出页面。
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted || phaseRef.current === "idle") return;
      if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
      setPhase("reveal");
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      const url = new URL(href, window.location.origin);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const subproject = isStandaloneSubproject(url.pathname);

      if (reduced) {
        if (subproject) window.location.assign(href);
        else router.push(href);
        return;
      }

      // 独立子项目与普通站内路由都走同一条黑白幕布：
      // 普通路由在幕布完全盖住后切换，再等路由提交后淡出幕布。
      pendingHref.current = href;
      pendingExternal.current = subproject;
      pendingRoute.current = subproject ? null : `${url.pathname}${url.search}`;
      setPhase("cover");
    },
    [router]
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // 交给浏览器原生的行为：新窗口 / 下载 / 修饰键 / 已 preventDefault / 后台页面
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      if (pathnameRef.current.startsWith("/admin")) return; // 后台不接前台转场

      const anchor = (event.target as Element | null)?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const rawHref = anchor.getAttribute("href") ?? anchor.href;
      if (!rawHref || rawHref.startsWith("#")) return;

      const url = new URL(rawHref, window.location.origin);
      if (url.origin !== window.location.origin) return; // 外站不劫持
      if (isAssetLink(url.pathname)) return;

      // 同页 hash 导航（首页版块定位）保持浏览器默认行为
      if (url.pathname === window.location.pathname && url.hash) return;

      event.preventDefault();
      event.stopPropagation();
      navigate(url.href);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate]);

  return (
    <>
      {/* key 驱动 main 重挂载：每次路由切换都会重播 #main-content 的 pageEnter 入场动画 */}
      <main id="main-content" key={pathname}>
        {children}
      </main>

      {/* 斜切五列幕布：idle 时全部停在视口外，不拦截任何交互 */}
      <div
        aria-hidden="true"
        className={`page-transition-overlay ${
          phase === "cover"
            ? "pt-cover"
            : phase === "reveal"
              ? "pt-reveal"
              : phase === "intro"
                ? "pt-intro"
                : ""
        }`}
      >
        <div className="page-transition-cols">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="page-transition-col" style={{ "--col": i } as CSSProperties} />
          ))}
        </div>
        <div className="page-transition-slash" />
        {/* 两线之间的 DIAGONAL 铭文带：文字沿对角线排列，本身成为对角线的一部分 */}
        <div className="page-transition-wordmark">
          <div className="page-transition-wordmark-text">
            {Array.from({ length: 24 }, () => "DIAGONAL").join(" · ")}
          </div>
        </div>
        <div className="page-transition-slash-echo" />
        <div className="page-transition-brand">
          <span className="page-transition-brand-line archive-text text-white/90">DIAGONAL</span>
          <span className="page-transition-brand-sub">对角线计划</span>
        </div>
      </div>
    </>
  );
}
