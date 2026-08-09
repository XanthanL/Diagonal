"use client";

import { Html } from "@react-three/drei";
import { metalColors } from "../Tag";
import { PLATFORM, STAGE_FRONT_Z } from "./layout";

interface StageMarkerProps {
  x: number;
  index: number;
  /** 当前是否处于对准态（用于高亮编号） */
  active?: boolean;
  /** 地面编组底垫的染色（按环节语义着色） */
  tint?: string;
  /** 点击该环节（底垫 / 编号）时回调 */
  onSelect?: () => void;
}

/**
 * 分环节地面基座：一片极淡的染色底垫把该环节的设备「圈」成一组，
 * 并在平台前沿放一枚小号编号徽标（贴近地面、朝相机一侧，绝不遮挡设备）。
 * 文字全部走 HUD，这里只保留最小化的方位编号；底垫可点击以对准该环节。
 */
export function StageMarker({ x, index, active = false, tint = metalColors.alloy, onSelect }: StageMarkerProps) {
  const num = String(index + 1).padStart(2, "0");
  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect?.(); }}>
      {/* 地面编组底垫（薄圆柱，略高于平台避免 z-fight） */}
      <mesh position={[x, PLATFORM.y + 0.03, 0]}>
        <cylinderGeometry args={[3.1, 3.1, 0.03, 40]} />
        <meshStandardMaterial
          color={tint}
          transparent
          opacity={active ? 0.2 : 0.1}
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* 编号徽标：贴地、朝相机前沿 */}
      <Html
        position={[x, PLATFORM.y + 0.12, STAGE_FRONT_Z]}
        center
        distanceFactor={16}
        zIndexRange={[10, 0]}
        // 小徽标不拦截指针，避免挡住 3D 交互（底垫承接点击）
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-full font-mono text-[11px] select-none transition-colors ${
            active
              ? "bg-diagonal-red text-white shadow-[0_0_0_3px_rgba(179,58,42,0.18)]"
              : "bg-white/85 text-ink-600 border border-black/15"
          }`}
        >
          {num}
        </div>
      </Html>
    </group>
  );
}
