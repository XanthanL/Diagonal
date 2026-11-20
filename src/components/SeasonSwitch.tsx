"use client";

import { useI18n } from "@/lib/i18n";
import { setSiteSeason } from "@/lib/seasonPrefs";
import { SEASON_IDS, SEASONS, type SiteSeason } from "@/lib/seasons";
import { useSeason } from "@/lib/useSeason";

/**
 * 四季切换：四个小字并排，点哪个就切到哪季。
 *
 * 与 ThemeSwitch 同一套克制语言（archive-text / 10px / 字距），不另起控件风格。
 *
 * 视觉上的「当前季」刻意不读 React state，而是由 CSS 直接匹配 html[data-season]
 * 点亮 —— <head> 同步脚本在 CSS 生效前就写好了 data-season，所以刷新时按钮高亮
 * 与页面配色/题图是同一帧到位的，没有「页面已经是冬、按钮还亮着春」的抖动。
 * React 这边只订阅一份用于 aria-pressed（读屏器需要，且不影响视觉）。
 *
 * 季节是 herbarium 之下的正交维度：archive 主题和 .theme-locked 页由 CSS 隐藏
 * 整个控件（见 seasons.css），不在这里做条件渲染 —— 服务端首帧不知道偏好，
 * 条件渲染反而会在 hydration 时闪一下。
 */
export function SeasonSwitch({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  const current = useSeason();

  const short: Record<SiteSeason, string> = {
    spring: "SPR",
    summer: "SUM",
    autumn: "AUT",
    winter: "WIN",
  };

  return (
    <div
      role="group"
      aria-label={lang === "zh" ? "季节" : "Season"}
      className={`season-switch archive-text flex items-center gap-3 ${className}`}
    >
      {SEASON_IDS.map((id) => {
        const name = SEASONS[id];
        const label = lang === "zh" ? name.zh : short[id];
        const hint =
          lang === "zh"
            ? `切换到${name.zh}季主题`
            : `Switch to ${name.en} theme`;
        return (
          <button
            key={id}
            type="button"
            data-season={id}
            aria-pressed={current === id}
            aria-label={hint}
            title={hint}
            onClick={() => setSiteSeason(id)}
            className="season-switch-item press tracking-[0.14em] leading-none"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
