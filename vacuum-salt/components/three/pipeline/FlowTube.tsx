"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { metalColors } from "../Tag";

/**
 * 连接管路 + 沿管流动的粒子（可视化物料流向）。
 * 管路本身为浅色金属，粒子用卤水色/盐白色。
 */
export function FlowTube({
  points,
  color = metalColors.brine,
  radius = 0.08,
  particleCount = 6,
  speed = 0.22,
  particleSize = 0.12,
  showTube = true,
}: {
  points: [number, number, number][];
  color?: string;
  radius?: number;
  particleCount?: number;
  speed?: number;
  particleSize?: number;
  showTube?: boolean;
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    [points]
  );
  const refs = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t + i / particleCount) % 1;
      const p = curve.getPointAt(u);
      m.position.copy(p);
      // 中段略大，首尾平滑淡入淡出（sin 包络），避免硬截断跳变
      const env = Math.sin(u * Math.PI);
      m.scale.setScalar(Math.max(0.001, particleSize * env));
      (m.material as THREE.MeshStandardMaterial).opacity = env;
    });
  });

  return (
    <group>
      {showTube && (
        <mesh castShadow>
          <tubeGeometry args={[curve, 80, radius, 12, false]} />
          <meshStandardMaterial
            color={metalColors.alloy}
            metalness={0.5}
            roughness={0.4}
            transparent
            opacity={0.92}
          />
        </mesh>
      )}
      {Array.from({ length: particleCount }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
        >
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.3} transparent />
        </mesh>
      ))}
    </group>
  );
}
