"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { metalColors } from "../Tag";
import { STAGE_X } from "./layout";

/** 环节 1：井卤开采与净化（深井 + 净化反应槽 + 过滤器） */
export function BrineUnit() {
  const cx = STAGE_X.brine;
  const wellRefs = useRef<THREE.Mesh[]>([]);
  const precipRefs = useRef<THREE.Mesh[]>([]);

  // 卤水上升粒子（黄褐 → 井口）
  const wellCurve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 16; i++) {
      const y = -1.5 - (i / 16) * 6.5;
      pts.push(new THREE.Vector3(cx + 0.02 * Math.sin(i * 0.5), y, 0));
    }
    return new THREE.CatmullRomCurve3(pts);
  }, [cx]);

  // 沉淀颗粒
  const precip = useMemo(
    () =>
      Array.from({ length: 14 }).map(() => ({
        x: (Math.random() - 0.5) * 1.3,
        z: (Math.random() - 0.5) * 1.3,
        y: -0.4 + Math.random() * 0.4,
        speed: 0.2 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      })),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    wellRefs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.22 + i / 8) % 1;
      m.position.copy(wellCurve.getPointAt(u));
    });
    precipRefs.current.forEach((m, i) => {
      if (!m) return;
      const p = precip[i];
      m.position.set(p.x, p.y - ((t * p.speed + p.phase) % 1.0), p.z);
    });
  });

  return (
    <group>
      {/* 深井区 */}
      <group position={[cx, 0, 0]}>
        {/* 地表板 */}
        <mesh position={[0, -1.5, 0]} receiveShadow>
          <boxGeometry args={[3.2, 0.3, 3.2]} />
          <meshStandardMaterial color={metalColors.alloyMid} roughness={0.85} />
        </mesh>
        {/* 井口装置 */}
        <mesh position={[0, -1.1, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.48, 0.8, 18]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.4} />
        </mesh>

        {/* 地层剖面（薄板，从地表向下到岩盐层） */}
        <group>
          <mesh position={[1.0, -4, 0]}>
            <boxGeometry args={[0.06, 5, 2.0]} />
            <meshStandardMaterial color={metalColors.alloyLight} roughness={0.95} side={THREE.DoubleSide} />
          </mesh>
          {/* 岩盐层高亮 */}
          <mesh position={[1.03, -7.2, 0]}>
            <boxGeometry args={[0.08, 1.2, 2.0]} />
            <meshStandardMaterial color={metalColors.salt} emissive="#b8dcef" emissiveIntensity={0.3} roughness={0.3} />
          </mesh>
        </group>

        {/* 汲卤管 */}
        <mesh>
          <tubeGeometry args={[wellCurve, 32, 0.07, 8, false]} />
          <meshStandardMaterial color={metalColors.amber} metalness={0.6} roughness={0.4} />
        </mesh>

        {/* 卤水上升粒子（黄褐，象征黄卤） */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} ref={(el) => { if (el) wellRefs.current[i] = el; }}>
            <sphereGeometry args={[0.08, 10, 8]} />
            <meshStandardMaterial color={metalColors.amber} emissive={metalColors.amber} emissiveIntensity={0.4} />
          </mesh>
        ))}
      </group>

      {/* 净化反应槽（井口右侧） */}
      <group position={[cx + 3.2, 0, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[1.0, 1.0, 2.2, 32, 1, false, 0, Math.PI]} />
          <meshStandardMaterial
            color={metalColors.alloy}
            metalness={0.45}
            roughness={0.35}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* 卤水液面（青蓝，已开始净化） */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.95, 0.95, 1.5, 32]} />
          <meshStandardMaterial color={metalColors.brineLight} transparent opacity={0.45} roughness={0.1} />
        </mesh>
        {/* 沉淀颗粒（钙镁泥下沉） */}
        {precip.map((p, i) => (
          <mesh
            key={i}
            ref={(el) => { if (el) precipRefs.current[i] = el; }}
            position={[p.x, p.y, p.z]}
            scale={0.05 + Math.random() * 0.04}
          >
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color={metalColors.amberLight} roughness={0.8} />
          </mesh>
        ))}
        {/* 搅拌轴 */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.6, 8]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} />
        </mesh>
      </group>

      {/* 过滤器（产出精卤） */}
      <group position={[cx + 6.0, -0.4, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.7, 0.7, 1.6, 24]} />
          <meshStandardMaterial color={metalColors.alloy} metalness={0.45} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}
