"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Lang } from "@/lib/useLang";

interface CoachStep {
  icon: string;
  title: string;
  titleEn: string;
  body: string;
  bodyEn: string;
}

const STEPS: CoachStep[] = [
  {
    icon: "↻",
    title: "旋转视角",
    titleEn: "Rotate",
    body: "拖拽画面可自由旋转整条产线，滚轮（双指）缩放，从任意角度观察设备。",
    bodyEn: "Drag to rotate the whole line; scroll / pinch to zoom in from any angle.",
  },
  {
    icon: "◎",
    title: "聚焦环节",
    titleEn: "Focus a stage",
    body: "点击任意设备模型，或点击下方编号，相机便会飞向该环节并展开详情。",
    bodyEn: "Click any device model, or a step number below, to fly the camera to that stage.",
  },
  {
    icon: "▶",
    title: "自动巡览",
    titleEn: "Auto tour",
    body: "点底部「▶」播放，相机依次飞掠五个环节；点「导览」还能听逐环节讲解。",
    bodyEn: "Press ▶ to auto-fly through all five stages; press “Tour” for narrated guidance.",
  },
  {
    icon: "ⓘ",
    title: "看原理",
    titleEn: "Read the science",
    body: "点「原理 / 参数」展开该环节的工艺原理、关键参数与设备部件细节。",
    bodyEn: "Open “Principle / Parameters” for the stage’s science, specs and components.",
  },
];

/**
 * 首入操作引导（③-7）：仅首次访问出现（由 localStorage 标记），
 * 4 步教学操作（旋转 / 聚焦 / 巡览 / 原理），可随时跳过。
 */
export function Coachmark({
  lang,
  open,
  onClose,
}: {
  lang: Lang;
  open: boolean;
  onClose: () => void;
}) {
  const zh = lang === "zh";
  const [step, setStep] = useState(0);
  const last = STEPS.length - 1;
  const s = STEPS[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4 bg-ink-900/25 backdrop-blur-[2px]"
          onClick={onClose}
        >
          <motion.div
            key={step}
            initial={{ scale: 0.96, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/85 backdrop-blur-md border border-black/[0.06] shadow-sm rounded-t-2xl sm:rounded-2xl max-w-sm w-full p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-11 h-11 rounded-full bg-diagonal-red/10 text-diagonal-red flex items-center justify-center text-xl">
                {s.icon}
              </div>
              <div className="min-w-0">
                <div className="label-eyebrow text-diagonal-red mb-1">
                  {zh ? "操作引导" : "QUICK GUIDE"} · {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                </div>
                <h3 className="text-base font-serif font-bold text-ink-900 leading-tight">
                  {zh ? s.title : s.titleEn}
                </h3>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed text-ink-700 mt-3">
              {zh ? s.body : s.bodyEn}
            </p>

            {/* 步骤点 */}
            <div className="flex items-center gap-1.5 mt-4">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-5 bg-diagonal-red" : "w-1.5 bg-black/20"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-md text-[12px] font-mono text-ink-500 hover:text-ink-900 transition"
              >
                {zh ? "跳过" : "Skip"}
              </button>
              <button
                onClick={() => (step < last ? setStep(step + 1) : onClose())}
                className="flex-1 py-2 rounded-md bg-diagonal-red text-white hover:bg-diagonal-redDark transition text-sm font-medium shadow-[0_0_0_1px_rgba(179,58,42,0.2),0_8px_24px_rgba(179,58,42,0.18)]"
              >
                {step < last ? (zh ? "下一步 →" : "Next →") : zh ? "开始探索 →" : "Start →"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
