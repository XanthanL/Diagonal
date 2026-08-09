"use client";

import type { Lang } from "@/lib/useLang";

interface NavBarProps {
  lang: Lang;
  onToggleLang: () => void;
  onOpenIntro: () => void;
  onOpenRefs: () => void;
  onOverview: () => void;
}

/**
 * 顶部细栏：只保留品牌与少量全局控制。
 * 步骤导航 / 播放控制 / 环节信息全部下放到 ControlDeck，
 * 让顶栏保持纤薄、不挤压 3D 视野。
 */
export function NavBar({
  lang,
  onToggleLang,
  onOpenIntro,
  onOpenRefs,
  onOverview,
}: NavBarProps) {
  return (
    <header className="absolute top-0 inset-x-0 z-30 pointer-events-none">
      {/* 主站同款纤细半透明模糊栏（对齐 diagonal GlobalNav 的 scrolled 态） */}
      <div className="pointer-events-auto bg-white/80 backdrop-blur-md border-b border-black/[0.06] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          {/* 品牌：DIAGONAL wordmark + 子项目标签（点击打开引言） */}
          <button
            onClick={onOpenIntro}
            className="flex items-baseline gap-2 group min-w-0"
            title="自贡井卤起源"
          >
            <span className="archive-text font-bold text-sm tracking-tighter text-ink-900 group-hover:text-diagonal-red transition-colors">
              DIAGONAL
            </span>
            <span className="archive-text text-[9px] text-ink-400 leading-none hidden sm:inline">
              / VACUUM SALT
            </span>
          </button>

          {/* 全局控制：主站同款 archive-text 无框导航项 */}
          <div className="flex items-center gap-5 shrink-0">
            <button
              onClick={onOverview}
              className="hidden sm:block archive-text text-[11px] text-ink-600 hover:text-ink-900 transition-opacity"
              title="回到全景"
            >
              {lang === "zh" ? "全景" : "OVERVIEW"}
            </button>
            <button
              onClick={onOpenRefs}
              className="hidden sm:block archive-text text-[11px] text-ink-600 hover:text-ink-900 transition-opacity"
            >
              {lang === "zh" ? "参考资料" : "REFERENCES"}
            </button>
            {/* 语言切换：主站同款药丸开关 */}
            <button
              onClick={onToggleLang}
              aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}
              className="group relative flex items-center gap-1.5 archive-text text-[11px] font-bold uppercase tracking-widest text-ink-700 hover:text-diagonal-red transition-colors"
            >
              <span className="relative flex h-3.5 w-7 items-center rounded-full border border-black/20 bg-black/5 px-0.5">
                <span
                  className="block h-2 w-2 rounded-full bg-diagonal-red transition-all"
                  style={{ marginLeft: lang === "en" ? "auto" : "0" }}
                />
              </span>
              <span className="min-w-[1.4rem] text-left">{lang === "zh" ? "EN" : "中"}</span>
            </button>
            <button
              onClick={onOpenIntro}
              className="archive-text text-[11px] text-ink-600 hover:text-ink-900 transition-opacity"
              title="自贡井卤起源"
              aria-label="关于"
            >
              ⓘ
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
