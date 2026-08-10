"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Lang } from "@/lib/useLang";
import type { StageData } from "@/lib/types";

/**
 * 当前环节摘要卡（桌面端用，由 ControlDeck 负责定位）。
 * 仅做内容呈现，不自管绝对定位，便于放进不同的布局槽位。
 */
export function StageCard({
  stage,
  lang,
  onOpenInfo,
}: {
  stage: StageData;
  lang: Lang;
  onOpenInfo: () => void;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.28 }}
        className="bg-white/80 backdrop-blur-md border border-black/[0.06] shadow-sm rounded-xl p-4 w-full"
      >
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="archive-text text-[9px] text-diagonal-red">
            STAGE {String(stage.index + 1).padStart(2, "0")} / 05
          </span>
          <span className="text-[10px] text-ink-400 font-mono">{stage.nameEn}</span>
        </div>
        <h2 className="font-serif text-xl font-bold text-ink-900 leading-tight">
          {lang === "zh" ? stage.name : stage.nameEn}
        </h2>
        <p className="text-[12px] text-ink-600 mt-1 leading-relaxed">
          {lang === "zh" ? stage.tagline : stage.taglineEn}
        </p>
        <div className="mt-2.5 flex items-center gap-2 text-[10px] text-ink-500 flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-paper-200 text-ink-700">
            {lang === "zh" ? stage.input : stage.inputEn}
          </span>
          <span className="text-diagonal-red">→</span>
          <span className="px-1.5 py-0.5 rounded bg-paper-200 text-ink-700 border border-black/10">
            {lang === "zh" ? stage.output : stage.outputEn}
          </span>
        </div>
        <div className="mt-3">
          <button
            onClick={onOpenInfo}
            className="w-full py-1.5 rounded-md bg-paper-200 text-ink-700 border border-black/10 hover:bg-diagonal-red/10 hover:text-diagonal-red hover:border-diagonal-red/40 transition text-[11px] font-mono"
          >
            {lang === "zh" ? "原理 / 参数 →" : "Principle / Parameters →"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
