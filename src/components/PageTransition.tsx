"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

type TransitionPhase = "idle" | "intro" | "cover" | "reveal";

const COVER_MS = 460; // 斜切纸面自左侧掠入盖满：与 CSS 的 .pt-cover 时长严格对齐
const HOLD_MS = 140; // 盖满后的短促定格，让纸面上的字标有一拍可读
const REVEAL_MS = 600; // 同一方向继续右移揭开新页
const INTRO_HOLD_MS = 280; // 首屏定格：让字标先被读到一眼，再走标准揭幕
const LOAD_TIMEOUT_MS = 2600; // 路由迟迟不提交时的强制揭幕上限

// 独立部署的子项目：主站 App Router 里没有对应路由，必须走整页跳转。
// 单一登记表在 src/lib/subsites.json（sync-sites.js 同步共用同一份）——新增子站改配置即可，
// 不必再动本文件，从根上消除"漏登记 → router.push 落到 404"。
import subsites from "@/lib/subsites.json";
const STANDALONE_DIRS: string[] = subsites.sites.map((s) => `/${s.dir}`);

function isStandaloneSubproject(pathname: string) {
  return STANDALONE_DIRS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAssetLink(pathname: string) {
  return /\.(png|jpe?g|gif|webp|avif|svg|ico|pdf|mp4|webm|txt|json|xml|zip)$/i.test(pathname);
}

/**
 * 斜切纸面翻页转场（不依赖 View Transitions API，保证 Chrome/Safari/Firefox 手感一致）：
 * 1. 点击站内链接 → 一根斜切发丝线先行掠过屏幕，紧随其后的暖纸面板物理性地盖住旧页；
 * 2. 路由在纸面下完成切换，盖满后定格一拍，让纸面上的字标被读到；
 * 3. 承载层保持同一方向继续右移，纸面滑出视口揭开新页，新页同时上浮入场。
 * 全程只动 transform，方向连续、无回弹；纸面比页面深一档，读作「翻过一页纸」而非关灯。
 *
 * 独立子项目先播放盖幕动画，再整页跳转（phase 停在 cover）；
 * 从子项目返回时若命中 bfcache（pageshow.persisted），重放揭幕防止纸面卡屏。
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useI18n();
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
        // 独立子项目：纸面盖住后直接离开当前文档
        window.location.assign(href);
        return;
      }

      router.push(href);
      // 兜底：RSC 迟迟不提交路由也要能自己抬开，绝不永远被纸面盖住。
      // 给到 2.6s 而不是 1s——纸面上已有「加载中」指示，慢路由应当继续盖着读作加载，
      // 抬早了会把旧页面重新露出来、随后再硬换一次，比多等一会儿更糟
      if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
      fallbackTimer.current = window.setTimeout(() => {
        if (phaseRef.current === "cover") setPhase("reveal");
      }, LOAD_TIMEOUT_MS);
    }, COVER_MS);

    return () => window.clearTimeout(timer);
  }, [phase, router]);

  // 纸面完全盖住后，等 App Router 真正提交目标路由再揭幕；
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

  // 首次加载：SSR 首帧就已经是「纸面盖满」态，所以不必等 rAF 确认绘制，直接定时揭幕。
  // ⚠️ 这里刻意不用 requestAnimationFrame 驱动：rAF 在后台 / 被遮挡的标签页里会被浏览器
  // 完全暂停——从搜索结果或聊天工具里新开标签页进来时，那两个回调永不触发，
  // 纸面就一直盖着，只能手动刷新才进得来（真实故障）。setTimeout 在后台页只是
  // 被节流到 ≥1s，仍然会执行；CSS 侧另有一条 2.6s 兜底自动揭幕。
  useEffect(() => {
    if (phase !== "intro") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("idle");
      return;
    }
    const timer = window.setTimeout(() => setPhase("reveal"), INTRO_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // bfcache 修复：进入独立子项目是整页跳转，本组件冻结在 cover 相位；
  // 从子项目返回时浏览器可能从 bfcache 恢复本页（pageshow.persisted），
  // 纸面会永远盖住屏幕。此处直接重放揭幕动画露出页面。
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

      // 独立子项目与普通站内路由走同一张纸面：
      // 普通路由在纸面盖满后切换，再等路由提交后继续右移揭幕。
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
      {/* key 驱动 main 重挂载；data-nav 把相位交给 CSS，控制新页的入场时机 */}
      <main id="main-content" key={pathname} data-nav={phase}>
        {children}
      </main>

      {/* 斜切纸面：idle 时整块停在视口左侧外，不拦截任何交互 */}
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
        <div className="pt-carriage">
          <div className="pt-sheet">
            <span className="pt-mark">
              {lang === "zh" ? "对角线计划 · DIAGONAL" : "DIAGONAL · 对角线计划"}
            </span>
            {/* 加载指示：纯 CSS 滑动，hydration 还没跑完时它已经在转 */}
            <span className="pt-loading">
              <span className="pt-loading-track">
                <span className="pt-loading-bar animate-atlasProgress" />
              </span>
              <span className="pt-loading-label">{lang === "zh" ? "加载中" : "Loading"}</span>
            </span>
          </div>
          {/* 两条先行线：各跑在自己方向上的纸边之前，把对角母题变成转场的指针 */}
          <div className="pt-rule" />
          <div className="pt-rule pt-rule-lead" />
        </div>
      </div>
    </>
  );
}
