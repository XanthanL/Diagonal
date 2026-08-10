"use client";

import { AnimatePresence, motion } from "framer-motion";
import { references } from "@/lib/data";
import type { Lang } from "@/lib/useLang";

export function RefsPanel({
  open,
  lang,
  onClose,
}: {
  open: boolean;
  lang: Lang;
  onClose: () => void;
}) {
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
            initial={{ scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/80 backdrop-blur-md border border-black/[0.06] shadow-sm rounded-t-2xl sm:rounded-2xl max-w-2xl w-full p-6 max-h-[86vh] overflow-y-auto"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="accent-line pl-3">
                <div className="label-eyebrow">REFERENCES</div>
                <h2 className="text-lg font-semibold text-ink-900">参考资料与来源</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-md border border-black/10 text-ink-500 hover:text-ink-900 hover:border-diagonal-red/50 transition"
              >
                ✕
              </button>
            </div>

            <p className="text-[12px] text-ink-600 leading-relaxed mb-4">
              本站工艺参数与原理取自以下公开行业资料、标准与文献。所有数值均为工业参考值，实际随矿床、设备、产品标准而异。
            </p>

            <ol className="space-y-2">
              {references.map((r, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-md bg-paper-100 border border-black/10 p-2.5"
                >
                  <span className="text-diagonal-red font-mono text-xs shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] text-ink-800 leading-snug">
                      {lang === "zh" ? r.title : r.titleEn}
                    </div>
                    {r.note && (
                      <div className="text-[11px] text-ink-400 mt-0.5">
                        {lang === "zh" ? r.note : r.noteEn}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-4 text-[10px] text-ink-400">
              {lang === "zh"
                ? "提示：3D 模型为工艺示意，非真实设备比例。"
                : "Note: 3D models are schematic, not to scale."}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
