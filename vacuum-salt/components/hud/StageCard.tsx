"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Lang } from "@/lib/useLang";
import type { StageData } from "@/lib/types";

export function StageCard({
  stage,
  lang,
  focused,
  onOpenInfo,
  onToggleFocus,
}: {
  stage: StageData;
  lang: Lang;
  focused: boolean;
  onOpenInfo: () => void;
  onToggleFocus: () => void;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-20 left-4 z-20 w-[300px] max-w-[80vw] panel rounded-xl p-3.5 shadow-soft"
      >
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="label-eyebrow">STAGE {String(stage.index + 1).padStart(2, "0")} / 05</span>
          <span className="text-[10px] text-ink-400 font-mono">{stage.nameEn}</span>
        </div>
        <h2 className="text-base font-semibold text-ink-900">{lang === "zh" ? stage.name : stage.nameEn}</h2>
        <p className="text-[12px] text-ink-600 mt-1 leading-relaxed">{stage.tagline}</p>
        <div className="mt-2.5 flex items-center gap-2 text-[10px] text-ink-500 flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-paper-200 text-ink-700">{stage.input}</span>
          <span className="text-diagonal-red">→</span>
          <span className="px-1.5 py-0.5 rounded bg-paper-200 text-ink-700 border border-line-soft">{stage.output}</span>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={onToggleFocus}
            className={`flex-1 py-1.5 rounded-md transition text-[11px] font-mono border ${
              focused
                ? "bg-diagonal-red text-white border-diagonal-red"
                : "bg-white text-ink-700 border-line-med hover:border-diagonal-red/50"
            }`}
          >
            {focused ? "聚焦中 ✓" : "聚焦此环节"}
          </button>
          <button
            onClick={onOpenInfo}
            className="flex-1 py-1.5 rounded-md bg-paper-200 text-ink-700 border border-line-soft hover:bg-diagonal-red/10 hover:text-diagonal-red hover:border-diagonal-red/40 transition text-[11px] font-mono"
          >
            原理 / 参数 →
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
