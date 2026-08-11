"use client";

import type { Lang } from "@/lib/useLang";
import { plantKpi } from "@/lib/data";

/**
 * 全产线 KPI 概览（③-6）：全景态（非聚焦、非巡游）展示整体指标，
 * 让用户在看完全部环节后，对整条产线的关键产出与能效一眼可得。
 * 数值均来自各环节工艺数据 / 行业资料，避免凭空编造。
 */
export function OverviewKpi({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  return (
    <div className="bg-white/80 backdrop-blur-md border border-black/[0.06] shadow-sm rounded-xl px-3.5 py-3">
      <div className="label-eyebrow mb-2">全产线 · PLANT KPI</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        {plantKpi.map((k) => (
          <div key={k.label}>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-lg font-semibold text-diagonal-red leading-none">
                {k.value}
              </span>
              {k.unit && <span className="text-[10px] text-ink-400">{k.unit}</span>}
            </div>
            <div className="text-[11px] text-ink-700 mt-0.5 leading-tight">
              {zh ? k.label : k.labelEn}
            </div>
            <div className="text-[9px] text-ink-400 leading-tight mt-0.5">
              {zh ? k.note : k.noteEn}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
