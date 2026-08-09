"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { metalColors } from "../Tag";
import { STAGE_X } from "./layout";

/** 环节 3：推料离心机 */
export function CentrifugeUnit({ onSelect }: { onSelect?: () => void }) {
  const cx = STAGE_X.centrifuge;
  const drumRef = useRef<THREE.Group>(null);
  const motherRefs = useRef<THREE.Mesh[]>([]);

  const salts = useMemo(
    () =>
      Array.from({ length: 16 }).map(() => ({
        r: 0.35 + Math.random() * 0.45,
        angle: Math.random() * Math.PI * 2,
        y: (Math.random() - 0.5) * 1.0,
        scale: 0.06 + Math.random() * 0.05,
      })),
    []
  );

  useFrame((state, delta) => {
    // 降速匀速旋转，更沉稳；母液粒子带淡出让循环无跳变
    if (drumRef.current) drumRef.current.rotation.y += delta * 2.2;
    const t = state.clock.elapsedTime;
    motherRefs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.6 + i * 0.13) % 1;
      const r = 0.85 + u * 1.4;
      const angle = (i / 10) * Math.PI * 2 + (drumRef.current?.rotation.y ?? 0);
      m.position.set(Math.cos(angle) * r, 0.3, Math.sin(angle) * r);
      m.scale.setScalar(0.07 * (1 - u));
      (m.material as THREE.MeshStandardMaterial).opacity = 0.5 * (1 - u);
    });
  });

  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect?.(); }}>
      <group position={[cx, 0, 0]}>
        {/* 进料管 */}
        <mesh position={[0, 2.2, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 1.2, 14]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} />
        </mesh>

        {/* 转鼓组 */}
        <group ref={drumRef} position={[0, 0.3, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.9, 0.9, 1.6, 36, 1, true, 0, Math.PI]} />
            <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.3} side={THREE.DoubleSide} transparent opacity={0.5} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.82, 0.82, 1.4, 28, 1, true]} />
            <meshStandardMaterial color={metalColors.alloyDark} wireframe transparent opacity={0.4} />
          </mesh>
          <mesh position={[0, -0.8, 0]}>
            <cylinderGeometry args={[0.9, 0.64, 0.26, 36]} />
            <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} />
          </mesh>
          {/* 盐颗粒 */}
          {salts.map((s, i) => (
            <mesh key={i} position={[Math.cos(s.angle) * s.r, s.y, Math.sin(s.angle) * s.r]} scale={s.scale}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={metalColors.salt} roughness={0.2} emissive="#b8dcef" emissiveIntensity={0.12} />
            </mesh>
          ))}
        </group>

        {/* 母液甩出 */}
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} ref={(el) => { if (el) motherRefs.current[i] = el; }}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color={metalColors.brine} transparent opacity={0.5} />
          </mesh>
        ))}

        {/* 母液收集槽 */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[1.9, 1.9, 0.4, 36, 1, true]} />
          <meshStandardMaterial color={metalColors.alloy} metalness={0.45} roughness={0.5} side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  );
}
