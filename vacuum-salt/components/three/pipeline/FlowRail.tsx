"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { metalColors } from "../Tag";
import { PLATFORM, PIPELINE } from "./layout";

/**
 * 贯穿整条产线的「流向轨」：平台中线上的一串流动刻度，
 * 由卤水青蓝渐变到盐白，统一朝右（流程方向）运动，
 * 直观表达物料从左到右的工艺流向。
 */
export function FlowRail({ count = 26, speed = 0.05 }: { count?: number; speed?: number }) {
  const refs = useRef<THREE.Mesh[]>([]);
  const x0 = PLATFORM.xMin + 1;
  const x1 = PLATFORM.xMax - 1;
  const span = x1 - x0;

  // 预生成渐变用颜色（起点青蓝 → 终点盐白）
  const cStart = useMemo(() => new THREE.Color(metalColors.brine), []);
  const cEnd = useMemo(() => new THREE.Color(metalColors.salt), []);
  const cTmp = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    refs.current.forEach((m, i) => {
      if (!m) return;
      // u 从 0→1 循环；首尾平滑淡入淡出，避免硬回绕跳变
      const u = (t + i / count) % 1;
      const x = x0 + u * span;
      m.position.x = x;
      // 端点淡化（sin 包络），中段最实
      const env = Math.sin(u * Math.PI);
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.12 + env * 0.6;
      // 颜色随位置由青蓝过渡到盐白
      cTmp.copy(cStart).lerp(cEnd, u);
      mat.color.copy(cTmp);
      mat.emissive.copy(cTmp);
    });
  });

  return (
    <group>
      {/* 中线底槽（极淡，作为流向基准） */}
      <mesh position={[PIPELINE.centerX, PLATFORM.y + 0.075, 0]}>
        <boxGeometry args={[span, 0.02, 0.1]} />
        <meshStandardMaterial
          color={metalColors.brine}
          transparent
          opacity={0.16}
          roughness={0.6}
        />
      </mesh>
      {/* 流动刻度 */}
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
          position={[x0 + (i / count) * span, PLATFORM.y + 0.09, 0]}
          rotation={[0, 0, -Math.PI / 2]}
        >
          {/* 细长三角刻度，指向流程方向（右） */}
          <coneGeometry args={[0.09, 0.34, 4]} />
          <meshStandardMaterial
            color={metalColors.brine}
            emissive={metalColors.brine}
            emissiveIntensity={0.6}
            transparent
            opacity={0.5}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}
