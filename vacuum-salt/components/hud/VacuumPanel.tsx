"use client";

import type { Lang } from "@/lib/useLang";

/**
 * 真空梯度面板（环节 2「多效蒸发结晶」聚焦时显示）。
 * 以竖直流体柱表达「压力 / 温度逐效降低、末效高真空」的梯度，
 * 底部高亮「高真空区」呼应 3D 场景中的低压冷色晕染与冷凝器真空表。
 */

// 四效 + 冷凝器（绝对压力 MPa）
const NODES = [
  { id: "I", zh: "Ⅰ效", en: "Effect I", temp: 130, p: 0.18, color: "#e8d4a8" },
  { id: "II", zh: "Ⅱ效", en: "Effect II", temp: 105, p: 0.09, color: "#cfe3f0" },
  { id: "III", zh: "Ⅲ效", en: "Effect III", temp: 75, p: 0.04, color: "#a9d2e8" },
  { id: "IV", zh: "Ⅳ效", en: "Effect IV", temp: 48, p: 0.012, color: "#5ba3c9" },
  { id: "C", zh: "混合冷凝器", en: "Condenser", temp: null, p: 0.012, color: "#b33a2a", vacuumPct: 88 },
] as const;

export function VacuumPanel({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  const last = NODES.length - 1;

  return (
    <div className="bg-white/80 backdrop-blur-md border border-black/[0.06] shadow-sm rounded-xl p-3 w-[264px]">
      <div className="flex items-baseline justify-between mb-2.5">
        <span className="archive-text text-[9px] text-diagonal-red">
          {zh ? "真空梯度" : "VACUUM GRADIENT"}
        </span>
        <span className="text-[9px] text-ink-400 font-mono">MPa(abs)</span>
      </div>

      <div className="flex gap-3">
        {/* 梯度柱 + 节点 */}
        <div className="relative shrink-0" style={{ width: 16, height: 168 }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(to bottom, #c0964a 0%, #e8d4a8 22%, #b8dcef 62%, #5ba3c9 100%)",
            }}
          />
          {NODES.map((n, i) => (
            <span
              key={n.id}
              className="absolute left-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"
              style={{
                top: `${(i / last) * 100}%`,
                transform: "translate(-50%, -50%)",
                background: n.color,
                boxShadow: i === last ? `0 0 0 3px ${n.color}33` : undefined,
              }}
            />
          ))}
        </div>

        {/* 节点标签 */}
        <div className="flex-1 flex flex-col justify-between text-[11px] py-0.5">
          {NODES.map((n, i) => {
            const isVacuum = i >= last - 1; // Ⅳ效 + 冷凝器
            return (
              <div key={n.id} className="flex items-center justify-between gap-2 leading-none">
                <span className={isVacuum ? "text-diagonal-red font-medium" : "text-ink-700"}>
                  {zh ? n.zh : n.en}
                </span>
                <span className="font-mono text-ink-900">{n.p.toFixed(3)}</span>
                <span className="text-ink-400 font-mono text-[10px] w-9 text-right">
                  {n.temp != null ? `${n.temp}℃` : `≈${n.vacuumPct}%`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 高真空区高亮 */}
      <div className="mt-2.5 rounded-md bg-diagonal-red/10 border border-diagonal-red/30 px-2.5 py-1.5 flex items-center justify-between">
        <span className="text-[10px] text-diagonal-red font-medium">
          {zh ? "高真空区" : "HIGH-VACUUM ZONE"}
        </span>
        <span className="text-[10px] text-diagonal-red font-mono">
          {zh ? "末效≈88%真空" : "last ≈88% vacuum"}
        </span>
      </div>

      <p className="mt-2 text-[10px] text-ink-400 leading-snug">
        {zh
          ? "真空泵抽走末效空气，沸点骤降，卤水低温沸腾结晶。"
          : "The vacuum pump extracts air from the last effect, dropping the boiling point so brine crystallizes at low temperature."}
      </p>
    </div>
  );
}
