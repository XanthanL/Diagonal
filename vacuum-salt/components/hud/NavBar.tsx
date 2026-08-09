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
      <div className="panel border-b border-black/10 pointer-events-auto">
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          {/* 品牌 / 标题（点击打开引言） */}
          <button
            onClick={onOpenIntro}
            className="flex items-center gap-2.5 group min-w-0"
            title="自贡井卤起源"
          >
            {/* 对角斜线品牌徽标：呼应主站 DIA/GONAL 核心母题 */}
            <div className="relative w-8 h-8 shrink-0 overflow-hidden rounded-md border border-black/10 bg-white">
              <span
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none diagonal-line"
                style={{ opacity: 0.5 }}
              />
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 w-[2px] h-5 -ml-px -mt-2.5 rotate-45"
                style={{ background: "linear-gradient(180deg, #B33A2A, #8E2D20)" }}
              />
            </div>
            <div className="min-w-0 text-left">
              <div className="archive-text text-[9px] text-ink-500 leading-none">
                ZIGONG · VACUUM SALT
              </div>
              <div className="text-[13px] text-ink-900 font-medium tracking-wide truncate leading-tight mt-0.5">
                真空制盐工艺 3D 解构
              </div>
            </div>
          </button>

          {/* 全局控制 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOverview}
              className="hidden sm:block px-2.5 py-1.5 rounded-md text-[11px] text-ink-600 hover:text-ink-900 border border-black/10 hover:border-diagonal-red/50 transition font-mono"
              title="回到全景"
            >
              全景
            </button>
            <button
              onClick={onOpenRefs}
              className="hidden sm:block px-2.5 py-1.5 rounded-md text-[11px] text-ink-600 hover:text-ink-900 transition font-mono"
            >
              参考资料
            </button>
            <button
              onClick={onToggleLang}
              className="px-2.5 py-1.5 rounded-md text-[11px] text-ink-600 hover:text-ink-900 border border-black/10 hover:border-diagonal-red/50 transition font-mono"
            >
              {lang === "zh" ? "EN" : "中"}
            </button>
            <button
              onClick={onOpenIntro}
              className="w-8 h-8 rounded-md text-ink-500 hover:text-ink-900 border border-black/10 hover:border-diagonal-red/50 transition flex items-center justify-center"
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
