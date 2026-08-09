"use client";

import { Html } from "@react-three/drei";
import type { ReactNode } from "react";

interface TagProps {
  position: [number, number, number];
  label: string;
  value?: string;
  color?: string;
  children?: ReactNode;
}

/** 3D 场景中的浅色参数浮标 */
export function Tag({ position, label, value, color = "#3b86ad", children }: TagProps) {
  return (
    <Html position={position} center distanceFactor={14} zIndexRange={[20, 0]}>
      <div
        className="panel rounded-md px-2.5 py-1.5 text-[11px] leading-tight whitespace-nowrap select-none shadow-soft"
        style={{ borderColor: `${color}40` }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: color, boxShadow: `0 0 0 3px ${color}22` }}
          />
          <span className="text-ink-600">{label}</span>
        </div>
        {value && (
          <div className="font-mono text-ink-900 mt-0.5 text-[13px]">{value}</div>
        )}
        {children}
      </div>
    </Html>
  );
}

/** 设备材质预设色（白底艺术风） */
export const metalColors = {
  // 设备金属
  alloy: "#c2cdda",
  alloyDark: "#9fb0c2",
  alloyLight: "#eef2f7",
  alloyMid: "#dde4ed",
  // 卤水液体
  brine: "#5ba3c9",
  brineLight: "#b8dcef",
  brineDeep: "#2c6a8a",
  // 黄卤
  amber: "#c0964a",
  amberLight: "#e8d4a8",
  // 盐晶
  salt: "#ffffff",
  saltEdge: "#eef2f7",
  // 强调
  steam: "#dbe4ee",
  ember: "#c0964a",
  ok: "#3b86ad",
} as const;
