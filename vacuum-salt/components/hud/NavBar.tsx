"use client";

import { motion } from "framer-motion";
import type { Lang } from "@/lib/useLang";
import type { StageData } from "@/lib/types";

interface NavBarProps {
  stages: StageData[];
  current: number;
  focused: boolean;
  lang: Lang;
  playing: boolean;
  speed: 1 | 2 | 3;
  onGoto: (i: number) => void;
  onExitFocus: () => void;
  onNext: () => void;
  onPrev: () => void;
  onTogglePlay: () => void;
  onCycleSpeed: () => void;
  onToggleLang: () => void;
  onOpenIntro: () => void;
  onOpenRefs: () => void;
}

export function NavBar(props: NavBarProps) {
  const {
    stages,
    current,
    focused,
    lang,
    playing,
    speed,
    onGoto,
    onExitFocus,
    onNext,
    onPrev,
    onTogglePlay,
    onCycleSpeed,
    onToggleLang,
    onOpenIntro,
    onOpenRefs,
  } = props;

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
      <div className="panel border-b border-line-soft pointer-events-auto">
        <div className="flex items-center justify-between px-4 py-2.5">
          {/* 标题 */}
          <button
            onClick={onOpenIntro}
            className="flex items-center gap-2.5 group"
            title="自贡井卤起源"
          >
            <div className="relative w-9 h-9 shrink-0 overflow-hidden rounded-lg border border-diagonal-red/40 bg-diagonal-warmGray">
              {/* 对角线母题：呼应主站视觉签名 */}
              <span
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, transparent 46%, rgba(179,58,42,0.55) 49%, rgba(179,58,42,0.9) 50%, rgba(179,58,42,0.55) 51%, transparent 54%)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-diagonal-red font-bold text-lg">
                盐
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="label-eyebrow">ZIGONG · VACUUM SALT</div>
              <div className="text-sm text-ink-900 font-medium tracking-wide">
                真空制盐工艺 3D 解构
              </div>
            </div>
          </button>

          {/* 控制按钮组 */}
          <div className="flex items-center gap-1.5">
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
              className="hidden md:block px-2.5 py-1.5 rounded-md text-[11px] text-ink-600 hover:text-ink-900 transition font-mono"
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
            >
              ⓘ
            </button>
          </div>
        </div>

        {/* 流程步骤条 */}
        <div className="px-3 pb-2.5">
          <div className="flex items-center gap-1 overflow-x-auto">
            {stages.map((s, i) => {
              const isActive = i === current && focused;
              const isCurrent = i === current;
              return (
                <div key={s.id} className="flex items-center shrink-0">
                  <button
                    onClick={() => onGoto(i)}
                    className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-md transition border ${
                      isActive
                        ? "bg-diagonal-red/10 border-diagonal-red/40 shadow-[0_0_0_1px_rgba(179,58,42,0.18),0_8px_24px_rgba(179,58,42,0.12)]"
                        : isCurrent
                        ? "bg-diagonal-red/5 border-diagonal-red/20"
                        : "border-transparent hover:bg-paper-200"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-mono transition ${
                        isActive
                          ? "bg-diagonal-red text-white"
                          : isCurrent
                          ? "bg-diagonal-red/15 text-diagonal-red"
                          : "bg-paper-300 text-ink-500 group-hover:bg-diagonal-red/10"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`text-xs whitespace-nowrap ${
                        isActive
                          ? "text-ink-900 font-medium"
                          : "text-ink-600 group-hover:text-ink-900"
                      }`}
                    >
                      {lang === "zh" ? s.name : s.nameEn}
                    </span>
                  </button>
                  {i < stages.length - 1 && (
                    <div className="w-3 h-px bg-line-med mx-0.5 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 播放控制 */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
      >
        <div className="panel rounded-full px-2 py-1.5 flex items-center gap-1 shadow-lift">
          <CtrlBtn onClick={onPrev} label="上一步">◀</CtrlBtn>
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-diagonal-red text-white hover:bg-diagonal-redDark transition flex items-center justify-center text-sm shadow-[0_0_0_1px_rgba(179,58,42,0.2),0_8px_24px_rgba(179,58,42,0.18)]"
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <CtrlBtn onClick={onNext} label="下一步">▶</CtrlBtn>
          <div className="w-px h-6 bg-line-med mx-1" />
          <button
            onClick={onCycleSpeed}
            className="px-2.5 h-9 rounded-full text-[11px] font-mono text-ink-700 hover:text-ink-900 border border-line-soft hover:border-diagonal-red/50 transition bg-white"
            title="切换倍速"
          >
            {speed}×
          </button>
        </div>
      </motion.div>
    </header>
  );
}

function CtrlBtn({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-9 h-9 rounded-full text-ink-600 hover:text-ink-900 hover:bg-paper-200 transition flex items-center justify-center text-[11px]"
    >
      {children}
    </button>
  );
}
