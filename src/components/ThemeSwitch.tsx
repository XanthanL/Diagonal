"use client";

import { useI18n } from "@/lib/i18n";
import { toggleSiteTheme } from "@/lib/themePrefs";

/**
 * 风格切换按钮（单按钮，点击在「档案 / 草木」之间来回）。
 *
 * 刻意不持有 React state：当前是哪一套由 CSS 依据 <html data-theme> 显隐两枚标签决定，
 * 所以刷新时按钮文字和页面配色是同一帧到位的，不会有「配色已变、按钮还写着旧名」的
 * hydration 抖动；aria-label 静态描述两档，屏幕阅读器也能读懂。
 *
 * 小色样跟着主题变量走：底是 --background、点是 --diagonal-red，
 * 于是两种风格下它都是那一套配色的缩略，不用维护两张图。
 */
export function ThemeSwitch({ className = "" }: { className?: string }) {
  const { lang } = useI18n();

  return (
    <button
      type="button"
      onClick={() => toggleSiteTheme()}
      aria-label={
        lang === "zh" ? "切换站点风格：档案 / 草木" : "Switch site style: Archive / Botanical"
      }
      title={
        lang === "zh"
          ? "点击切换站点风格（档案风 / 草木风）"
          : "Click to switch between Archive and Botanical styles"
      }
      className={`press archive-text theme-switch flex items-center gap-1.5 text-[10px] tracking-[0.14em] opacity-80 hover:opacity-100 ${className}`}
    >
      <span className="theme-swatch" aria-hidden="true" />
      <span className="theme-switch-label" data-label="archive">
        {lang === "zh" ? "档案" : "ARCHIVE"}
      </span>
      <span className="theme-switch-label" data-label="herbarium">
        {lang === "zh" ? "草木" : "BOTANICAL"}
      </span>
    </button>
  );
}
