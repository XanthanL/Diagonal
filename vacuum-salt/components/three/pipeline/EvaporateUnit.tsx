"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { metalColors } from "../Tag";
import { STAGE_X } from "./layout";

const EFFECTS = [
  { temp: 130, pressure: 0.18 },
  { temp: 105, pressure: 0.09 },
  { temp: 75, pressure: 0.04 },
  { temp: 48, pressure: 0.012 },
];

/** 单效蒸发器（加热室 + 蒸发结晶室） */
function Evaporator({
  x,
  index,
  isLast,
}: {
  x: number;
  index: number;
  isLast: boolean;
}) {
  const crystalRefs = useRef<THREE.Mesh[]>([]);
  const bubbleRefs = useRef<THREE.Mesh[]>([]);
  const steamRef = useRef<THREE.Mesh>(null);

  const crystals = useMemo(
    () =>
      Array.from({ length: 10 }).map(() => ({
        pos: [(Math.random() - 0.5) * 1.0, -0.3 + Math.random() * 0.8, (Math.random() - 0.5) * 1.0] as [number, number, number],
        scale: 0.05 + Math.random() * 0.06,
        speed: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      })),
    []
  );
  const bubbles = useMemo(
    () =>
      Array.from({ length: 6 }).map(() => ({
        x: (Math.random() - 0.5) * 0.8,
        z: (Math.random() - 0.5) * 0.8,
        speed: 0.8 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      })),
    []
  );
  // 温度梯度色：Ⅰ效(热) → Ⅳ效(冷/高真空)，直观表达逐效降温，无需文字
  const gradientColor = useMemo(
    () => new THREE.Color(metalColors.amber).lerp(new THREE.Color(metalColors.brine), (index - 1) / 3),
    [index]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    crystalRefs.current.forEach((m, i) => {
      if (!m) return;
      const c = crystals[i];
      m.position.y = c.pos[1] + Math.sin(t * c.speed + c.phase) * 0.06;
      m.rotation.x = t * 0.3 * c.speed;
    });
    bubbleRefs.current.forEach((m, i) => {
      if (!m) return;
      const b = bubbles[i];
      const y = ((t * b.speed + b.phase) % 1.4) - 0.7;
      m.position.y = y;
      m.scale.setScalar(0.04 + Math.sin(y * 4) * 0.015);
    });
    if (steamRef.current) {
      (steamRef.current.material as THREE.MeshStandardMaterial).opacity = 0.15 + Math.sin(t * 1.5 + index) * 0.06;
    }
  });

  const heaterColor = isLast ? metalColors.brine : metalColors.alloy;

  return (
    <group position={[x, 0, 0]}>
      {/* 加热室（半剖） */}
      <mesh position={[0, -1.5, 0]} castShadow>
        <cylinderGeometry args={[1.0, 1.0, 1.4, 32, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={heaterColor} metalness={0.55} roughness={0.35} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* 列管（剖切可见） */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI;
        const r = 0.5;
        return (
          <mesh key={i} position={[Math.cos(angle) * r * 0.7, -1.5, Math.sin(angle) * r * 0.7]}>
            <cylinderGeometry args={[0.07, 0.07, 1.3, 10]} />
            <meshStandardMaterial color={metalColors.amber} metalness={0.7} roughness={0.3} />
          </mesh>
        );
      })}
      {/* 蒸发结晶室 */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[1.25, 1.25, 2.4, 40]} />
        <meshStandardMaterial color={metalColors.alloyLight} metalness={0.4} roughness={0.25} transparent opacity={0.85} />
      </mesh>
      {/* 温度梯度色环（Ⅰ效热 → Ⅳ效冷） */}
      <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.18, 0.045, 10, 48]} />
        <meshStandardMaterial color={gradientColor} emissive={gradientColor} emissiveIntensity={0.55} roughness={0.4} />
      </mesh>
      {/* 锥顶 */}
      <mesh position={[0, 1.65, 0]}>
        <coneGeometry args={[1.25, 0.8, 40]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.35} />
      </mesh>
      {/* 蒸汽出口 */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.4, 18]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} />
      </mesh>
      {/* 内部卤水 */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.22, 1.22, 1.7, 40]} />
        <meshStandardMaterial color={metalColors.brine} transparent opacity={0.3} roughness={0.1} />
      </mesh>
      {/* 气泡 */}
      {bubbles.map((b, i) => (
        <mesh key={i} ref={(el) => { if (el) bubbleRefs.current[i] = el; }} position={[b.x, 0, b.z]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={metalColors.brineLight} transparent opacity={0.5} />
        </mesh>
      ))}
      {/* NaCl 结晶 */}
      {crystals.map((c, i) => (
        <mesh key={i} ref={(el) => { if (el) crystalRefs.current[i] = el; }} position={c.pos} scale={c.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={metalColors.salt} roughness={0.2} emissive="#b8dcef" emissiveIntensity={0.15} />
        </mesh>
      ))}
      {/* 蒸汽羽流 */}
      <mesh ref={steamRef} position={[0, 2.7, 0]}>
        <coneGeometry args={[0.4, 1.0, 16, 1, true]} />
        <meshStandardMaterial color={metalColors.steam} transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** 环节 2：四效蒸发结晶器组 */
export function EvaporateUnit({ onSelect }: { onSelect?: () => void }) {
  const cx = STAGE_X.evaporate;
  const spacing = 2.6;
  // 四效从左到右：Ⅰ(高温) → Ⅳ(低温真空)
  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect?.(); }}>
      {EFFECTS.map((_, i) => (
        <Evaporator
          key={i}
          x={cx + (1.5 - i) * spacing}
          index={i + 1}
          isLast={i === 3}
        />
      ))}
      {/* 末效冷凝器 */}
      <group position={[cx - (1.5 + 1) * spacing - 1.4, 2.0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.6, 0.6, 1.4, 24]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}
