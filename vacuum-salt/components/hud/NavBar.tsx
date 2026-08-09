"use client";

import type { Lang } from "@/lib/useLang";

interface NavBarProps {
  lang: Lang;
  focused: boolean;
  onExitFocus: () => void;
  onToggleLang: () => void;
  onOpenIntro: () => void;
  onOpenRefs: () => void;
}

/**
 * 顶部细栏：只保留品牌与少量全局控制。
 * 步骤导航 / 播放控制 / 环节信息全部下放到 ControlDeck，
 * 让顶栏保持纤薄、不挤压 3D 视野。
 */
export function NavBar({
  lang,
  focused,
  onExitFocus,
  onToggleLang,
  onOpenIntro,
  onOpenRefs,
}: NavBarProps) {
  return (
    <header className="absolute top-0 inset-x-0 z-30 pointer-events-none">
      <div className="panel border-b border-line-soft pointer-events-auto">
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          {/* 品牌 / 标题（点击打开引言） */}
          <button
            onClick={onOpenIntro}
            className="flex items-center gap-2.5 group min-w-0"
            title="自贡井卤起源"
          >
            <div className="relative w-8 h-8 shrink-0 overflow-hidden rounded-lg border border-diagonal-red/40 bg-diagonal-warmGray">
              <span
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, transparent 46%, rgba(179,58,42,0.55) 49%, rgba(179,58,42,0.9) 50%, rgba(179,58,42,0.55) 51%, transparent 54%)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-diagonal-red font-bold text-base">
                盐
              </div>
            </div>
            <div className="min-w-0 text-left">
              <div className="label-eyebrow leading-none">ZIGONG · VACUUM SALT</div>
              <div className="text-[13px] text-ink-900 font-medium tracking-wide truncate leading-tight">
                真空制盐工艺 3D 解构
              </div>
            </div>
          </button>

          {/* 全局控制 */}
          <div className="flex items-center gap-1.5 shrink-0">
            {focused && (
              <button
                onClick={onExitFocus}
                className="px-2.5 py-1.5 rounded-md text-[11px] text-ink-700 hover:text-diagonal-red border border-line-med bg-white hover:border-diagonal-red/50 transition font-mono"
                title="返回全景"
              >
                ← 全景
              </button>
            )}
            <button
              onClick={onOpenRefs}
              className="hidden sm:block px-2.5 py-1.5 rounded-md text-[11px] text-ink-600 hover:text-ink-900 transition font-mono"
            >
              参考资料
            </button>
            <button
              onClick={onToggleLang}
              className="px-2.5 py-1.5 rounded-md text-[11px] text-ink-600 hover:text-ink-900 border border-line-soft hover:border-diagonal-red/50 transition font-mono"
            >
              {lang === "zh" ? "EN" : "中"}
            </button>
            <button
              onClick={onOpenIntro}
              className="w-8 h-8 rounded-md text-ink-500 hover:text-ink-900 border border-line-soft hover:border-diagonal-red/50 transition flex items-center justify-center"
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
