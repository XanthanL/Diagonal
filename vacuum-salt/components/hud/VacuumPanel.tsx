"use client";

import type { Lang } from "@/lib/useLang";
import { stages } from "@/lib/data";

/**
 * 真空梯度面板（常驻右侧，随播放实时）。
 * 顶部「当前工艺真空度」随环节推进平滑爬升（开采常压 → 蒸发建立高真空并维持），
 * 下方竖直流体柱表达「压力 / 温度逐效降低、末效高真空」的梯度，
 * 呼应 3D 场景中的低压冷色晕染与冷凝器真空表。
 */

// 四效 + 冷凝器（绝对压力 MPa）
const NODES = [
  { id: "I", zh: "Ⅰ效", en: "Effect I", temp: 130, p: 0.18, color: "#e8d4a8" },
  { id: "II", zh: "Ⅱ效", en: "Effect II", temp: 105, p: 0.09, color: "#cfe3f0" },
  { id: "III", zh: "Ⅲ效", en: "Effect III", temp: 75, p: 0.04, color: "#a9d2e8" },
  { id: "IV", zh: "Ⅳ效", en: "Effect IV", temp: 48, p: 0.012, color: "#5ba3c9" },
  { id: "C", zh: "混合冷凝器", en: "Condenser", temp: null, p: 0.012, color: "#b33a2a", vacuumPct: 88 },
] as const;

// 各环节在「工艺真空度」上的代表值（% 真空）：开采常压，蒸发建立高真空并维持
const VAC_BY_STAGE = [0, 88, 88, 88, 88];

export function VacuumPanel({ lang, current = 0 }: { lang: Lang; current?: number }) {
  const zh = lang === "zh";
  const last = NODES.length - 1;
  const stageId = stages[current]?.id;
  const preEvap = stageId === "brine";
  const pct = VAC_BY_STAGE[current] ?? 0;

  return (
    <div className="bg-white/80 backdrop-blur-md border border-black/[0.06] shadow-sm rounded-xl p-3 w-[264px]">
      <div className="flex items-baseline justify-between mb-2.5">
        <span className="archive-text text-[9px] text-diagonal-red">
          {zh ? (preEvap ? "常压 · 蒸发前" : "真空梯度") : preEvap ? "ATM · PRE-EVAP" : "VACUUM GRADIENT"}
        </span>
        <span className="text-[9px] text-ink-400 font-mono">MPa(abs)</span>
      </div>

      {/* 当前工艺真空度：随播放实时爬升 */}
      <div className="mb-2.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-mono font-medium text-diagonal-red">≈{pct}%</span>
          <span className="text-[10px] text-ink-400">{zh ? "真空度" : "VACUUM"}</span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full bg-diagonal-red rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 梯度柱 + 节点（蒸发前灰显） */}
      <div className="transition-opacity duration-500" style={{ opacity: preEvap ? 0.5 : 1 }}>
        <div className="flex gap-3">
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

          <div className="flex-1 flex flex-col justify-between text-[11px] py-0.5">
            {NODES.map((n, i) => {
              const isVacuum = i >= last - 1; // Ⅳ效 + 冷凝器
              const pFrac = Math.min(1, n.p / 0.18);
              const tFrac = n.temp != null ? Math.min(1, (n.temp - 40) / (130 - 40)) : 0;
              return (
                <div key={n.id} className="flex items-center justify-between gap-2 leading-none">
                  <span className={isVacuum ? "text-diagonal-red font-medium" : "text-ink-700"}>
                    {zh ? n.zh : n.en}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-mono text-ink-900 leading-none">{n.p.toFixed(3)}</span>
                      <span className="text-ink-400 font-mono text-[10px] leading-none">
                        {n.temp != null ? `${n.temp}℃` : `≈${n.vacuumPct}%`}
                      </span>
                    </div>
                    {/* 微型 bar：压力 / 温度相对量级，量级一目了然 */}
                    <div className="flex flex-col gap-0.5 w-14">
                      <div className="h-1 rounded-full bg-black/10 overflow-hidden">
                        <div
                          className="h-full bg-diagonal-red/70 rounded-full"
                          style={{ width: `${pFrac * 100}%` }}
                        />
                      </div>
                      {n.temp != null && (
                        <div className="h-1 rounded-full bg-black/10 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${tFrac * 100}%`, background: n.color }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 高真空区高亮（蒸发后显示） */}
      {!preEvap && (
        <div className="mt-2.5 rounded-md bg-diagonal-red/10 border border-diagonal-red/30 px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-[10px] text-diagonal-red font-medium">
            {zh ? "高真空区" : "HIGH-VACUUM ZONE"}
          </span>
          <span className="text-[10px] text-diagonal-red font-mono">
            {zh ? "末效≈88%真空" : "last ≈88% vacuum"}
          </span>
        </div>
      )}

      <p className="mt-2 text-[10px] text-ink-400 leading-snug">
        {zh
          ? "真空泵抽走末效空气，沸点骤降，卤水低温沸腾结晶。"
          : "The vacuum pump extracts air from the last effect, dropping the boiling point so brine crystallizes at low temperature."}
      </p>
    </div>
  );
}
