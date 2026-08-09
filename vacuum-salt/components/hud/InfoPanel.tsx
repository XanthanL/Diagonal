"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Lang } from "@/lib/useLang";
import type { StageData } from "@/lib/types";
import { zigongGeology } from "@/lib/data";
import { useIsDesktop } from "@/lib/useMediaQuery";

interface InfoPanelProps {
  stage: StageData;
  lang: Lang;
  open: boolean;
  onClose: () => void;
}

/**
 * 环节详情（原理 / 参数 / 部件 / 反应式）。
 * 桌面：右侧滑入抽屉；移动：底部上滑抽屉（max-h 受限，不整屏遮挡）。
 */
export function InfoPanel({ stage, lang, open, onClose }: InfoPanelProps) {
  const isDesktop = useIsDesktop();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 移动端背景遮罩（点击关闭） */}
          {!isDesktop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-ink-900/30"
              onClick={onClose}
            />
          )}
          <motion.div
            key={isDesktop ? "desktop" : "mobile"}
            initial={isDesktop ? { x: 420, opacity: 0 } : { y: "100%" }}
            animate={isDesktop ? { x: 0, opacity: 1 } : { y: 0 }}
            exit={isDesktop ? { x: 420, opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className={
              isDesktop
                ? "absolute top-0 right-0 h-full w-[400px] max-w-[92vw] panel z-30 overflow-y-auto shadow-lift border-l border-line-soft"
                : "absolute inset-x-0 bottom-0 max-h-[82vh] panel-solid z-40 overflow-y-auto shadow-lift rounded-t-2xl border-t border-line-soft"
            }
            style={!isDesktop ? { paddingBottom: "env(safe-area-inset-bottom)" } : undefined}
          >
            {/* 移动端拖拽指示条 */}
            {!isDesktop && (
              <div className="pt-2 pb-1 flex justify-center">
                <div className="w-10 h-1 rounded-full bg-line-med" />
              </div>
            )}

            <div className="sticky top-0 panel border-b border-line-soft px-4 py-3 flex items-center justify-between bg-white/90 z-10">
              <div className="accent-line pl-3">
                <div className="label-eyebrow">
                  STAGE {String(stage.index + 1).padStart(2, "0")} / 05
                </div>
                <h2 className="text-lg font-serif font-bold text-ink-900">
                  {lang === "zh" ? stage.name : stage.nameEn}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-md border border-line-soft text-ink-500 hover:text-ink-900 hover:border-diagonal-red/50 transition"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-4 space-y-5">
              {/* 物料流向 */}
              <div className="space-y-1.5">
                <div className="label-eyebrow">物料 · MATERIAL FLOW</div>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="px-2 py-1 rounded bg-paper-200 text-ink-700">{stage.input}</span>
                  <span className="text-diagonal-red">→</span>
                  <span className="px-2 py-1 rounded bg-paper-200 text-ink-700 border border-line-soft">
                    {stage.output}
                  </span>
                </div>
              </div>

              {/* 科学原理 */}
              <div className="space-y-2">
                <div className="label-eyebrow">科学原理 · PRINCIPLE</div>
                <div className="space-y-2">
                  {stage.principle.map((p, i) => (
                    <p key={i} className="text-[13px] leading-relaxed text-ink-700">
                      {p}
                    </p>
                  ))}
                </div>
              </div>

              {/* 化学反应式 */}
              {stage.reactions && stage.reactions.length > 0 && (
                <div className="space-y-2">
                  <div className="label-eyebrow">化学反应 · REACTIONS</div>
                  {stage.reactions.map((r) => (
                    <div key={r.id} className="rounded-md bg-paper-100 border border-line-soft p-3">
                      <div className="text-xs text-amber-500 mb-1">{r.title}</div>
                      <div className="font-mono text-[13px] text-ink-900 break-all">{r.equation}</div>
                      <div className="text-[11px] text-ink-500 mt-1.5 leading-relaxed">{r.note}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* 关键参数 */}
              <div className="space-y-2">
                <div className="label-eyebrow">关键参数 · KEY PARAMS</div>
                <div className="rounded-md border border-line-soft overflow-hidden">
                  <table className="w-full text-xs">
                    <tbody>
                      {stage.params.map((p, i) => (
                        <tr key={i} className={i % 2 ? "bg-paper-100" : "bg-white"}>
                          <td className="px-3 py-2 text-ink-600">
                            {lang === "zh" ? p.name : p.nameEn}
                            {p.indicative && (
                              <span className="ml-1 text-[9px] text-amber-500 align-top">参考</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-ink-900 whitespace-nowrap">
                            {p.value}
                            {p.unit && <span className="text-ink-400 ml-1">{p.unit}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 设备部件 */}
              <div className="space-y-2">
                <div className="label-eyebrow">设备部件 · COMPONENTS</div>
                <div className="space-y-2">
                  {stage.parts.map((part) => (
                    <div key={part.id} className="rounded-md bg-paper-100 border border-line-soft p-2.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[13px] font-medium text-ink-900">{part.name}</span>
                        <span className="text-[10px] text-ink-400 font-mono">{part.nameEn}</span>
                      </div>
                      <p className="text-[11px] text-ink-600 mt-1 leading-relaxed">{part.desc}</p>
                      {part.material && (
                        <div className="text-[10px] text-ink-400 mt-1 font-mono">材质：{part.material}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-ink-400 leading-relaxed pt-2 border-t border-line-soft">
                数值均为工业参考值，实际随矿床、设备、产品标准而异；详见「参考资料与来源」。
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** 自贡井卤地质起源引言（居中弹层，移动端限高滚动） */
export function IntroPanel({ lang, open, onClose }: { lang: Lang; open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4 bg-ink-900/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="panel-solid rounded-t-2xl sm:rounded-2xl max-w-2xl w-full p-6 md:p-8 max-h-[86vh] overflow-y-auto shadow-lift"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="accent-line pl-3">
                <div className="label-eyebrow">自贡 · ZIGONG</div>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-ink-900">
                  {zigongGeology.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-md border border-line-soft text-ink-500 hover:text-ink-900 hover:border-diagonal-red/50 transition shrink-0"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {zigongGeology.paragraphs.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-ink-700">
                  {p}
                </p>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-line-soft">
              <div className="label-eyebrow mb-2">来源参考 · REFS</div>
              <ul className="space-y-1">
                {zigongGeology.refs.map((r, i) => (
                  <li key={i} className="text-[11px] text-ink-500 flex gap-2">
                    <span className="text-diagonal-red">·</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 rounded-md bg-diagonal-red text-white hover:bg-diagonal-redDark transition text-sm font-medium shadow-[0_0_0_1px_rgba(179,58,42,0.2),0_8px_24px_rgba(179,58,42,0.18)]"
            >
              {lang === "zh" ? "开始探索工艺流程 →" : "Start exploring →"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
