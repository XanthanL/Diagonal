"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type TransitionPhase = "idle" | "cover" | "reveal";

const COVER_MS = 240; // 旧页被幕布盖住
const REVEAL_MS = 560; // 新页从幕布后揭开

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
 * SWUP 风格的两段式页面过渡：
 * 1. 点击站内链接 → 红色幕布自下而上盖住旧页；
 * 2. 路由在幕布后完成切换；
 * 3. 幕布继续向上揭开，露出新页。
 *
 * 支持 View Transitions API 的浏览器改走原生快照交叉淡入（更省资源，
 * 且天然保留旧页快照）；独立子项目先播放盖幕动画，再整页跳转。
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<TransitionPhase>("idle");
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
    const href = pendingHref.current;
    if (!href) return;

    const timer = window.setTimeout(() => {
      if (pendingExternal.current) {
        // 独立子项目：幕布盖住后直接离开当前文档
        window.location.assign(href);
        return;
      }

      router.push(href);
      // 若 RSC 加载超过 1s 仍未提交路由，强制揭幕，避免永远被幕布盖住
      if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
      fallbackTimer.current = window.setTimeout(() => {
        if (phaseRef.current === "cover") setPhase("reveal");
      }, 1000);
    }, COVER_MS);

    return () => window.clearTimeout(timer);
  }, [phase, router]);

  // 幕布完全盖住后，等 App Router 真正提交目标路由再揭幕
  useEffect(() => {
    if (phase !== "cover" || pendingExternal.current) return;
    const currentRoute = `${pathname}${typeof window !== "undefined" ? window.location.search : ""}`;
    if (pendingRoute.current && currentRoute === pendingRoute.current) {
      if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
      setPhase("reveal");
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

      // 子项目是独立文档，View Transitions 无法跨文档快照；只用盖幕过渡
      if (
        !subproject &&
        typeof document !== "undefined" &&
        typeof (document as Document & { startViewTransition?: unknown }).startViewTransition === "function"
      ) {
        (document as Document & { startViewTransition: (cb: () => void) => unknown }).startViewTransition(
          () => {
            router.push(href);
          }
        );
        return;
      }

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

      {/* 两段式红色幕布：idle 时停在下方视口外，不拦截任何交互 */}
      <div
        aria-hidden="true"
        className={`page-transition-overlay ${
          phase === "cover" ? "pt-cover" : phase === "reveal" ? "pt-reveal" : ""
        }`}
      >
        <div className="page-transition-overlay-inner">
          <span className="archive-text text-white/80">DIAGONAL</span>
          <div className="page-transition-overlay-slash" />
        </div>
      </div>
    </>
  );
}
