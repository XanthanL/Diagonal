"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { metalColors } from "../Tag";
import { STAGE_X } from "./layout";

/** 环节 4：沸腾流化床干燥 + 振动筛 */
export function DryUnit() {
  const cx = STAGE_X.dry;
  const particleRefs = useRef<THREE.Mesh[]>([]);
  const airRefs = useRef<THREE.Mesh[]>([]);
  const screenRef = useRef<THREE.Group>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 28 }).map(() => ({
        x: (Math.random() - 0.5) * 2.2,
        z: (Math.random() - 0.5) * 1.1,
        baseY: Math.random() * 1.3,
        amp: 0.15 + Math.random() * 0.3,
        speed: 1 + Math.random() * 1.3,
        phase: Math.random() * Math.PI * 2,
        scale: 0.06 + Math.random() * 0.05,
      })),
    []
  );
  const airs = useMemo(
    () =>
      Array.from({ length: 10 }).map(() => ({
        x: (Math.random() - 0.5) * 2.2,
        z: (Math.random() - 0.5) * 1.1,
        speed: 0.6 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      })),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    particleRefs.current.forEach((m, i) => {
      if (!m) return;
      const p = particles[i];
      m.position.set(p.x, p.baseY + Math.sin(t * p.speed + p.phase) * p.amp, p.z);
      m.rotation.x = t * 0.5 * p.speed;
    });
    airRefs.current.forEach((m, i) => {
      if (!m) return;
      const a = airs[i];
      const u = (t * a.speed + a.phase) % 1;
      m.position.set(a.x, u * 2.6 - 0.4, a.z);
      m.scale.setScalar(0.05 * (1 - u * 0.5));
    });
    if (screenRef.current) {
      // 降频降幅，避免高频抖动显得粗糙
      screenRef.current.position.x = Math.sin(t * 7) * 0.018;
    }
  });

  const grades = [
    { label: "粗", z: -0.4 },
    { label: "中", z: 0 },
    { label: "细", z: 0.4 },
  ];

  return (
    <group>
      {/* 流化床 */}
      <group position={[cx, 0, 0]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[2.8, 2.0, 1.5]} />
          <meshStandardMaterial color={metalColors.alloy} metalness={0.45} roughness={0.35} transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {/* 分布板 */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[2.6, 0.06, 1.3]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} />
        </mesh>
        {/* 进风口 */}
        <mesh position={[0, -0.8, 0]}>
          <cylinderGeometry args={[0.34, 0.42, 0.8, 14]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} />
        </mesh>
        {/* 热风粒子 */}
        {airs.map((a, i) => (
          <mesh key={i} ref={(el) => { if (el) airRefs.current[i] = el; }}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color={metalColors.amber} emissive={metalColors.amber} emissiveIntensity={0.4} transparent opacity={0.45} />
          </mesh>
        ))}
        {/* 流化盐颗粒 */}
        {particles.map((p, i) => (
          <mesh key={i} ref={(el) => { if (el) particleRefs.current[i] = el; }} position={[p.x, p.baseY, p.z]} scale={p.scale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={metalColors.salt} roughness={0.2} emissive="#b8dcef" emissiveIntensity={0.12} />
          </mesh>
        ))}
      </group>

      {/* 振动筛（流化床右侧） */}
      <group ref={screenRef} position={[cx + 3.0, -0.3, 0]} rotation={[-0.18, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.0, 0.12, 1.6]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[1.8, 0.02, 1.4]} />
          <meshStandardMaterial color={metalColors.alloy} wireframe />
        </mesh>
        {grades.map((g, i) => (
          <group key={i} position={[0, -0.25, g.z]}>
            <mesh position={[1.1, -0.15, 0]}>
              <boxGeometry args={[0.4, 0.4, 0.4]} />
              <meshStandardMaterial color={metalColors.salt} roughness={0.3} emissive="#b8dcef" emissiveIntensity={0.1} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
