"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { metalColors } from "../Tag";

/**
 * 连接管路 + 沿管流动的粒子（可视化物料流向）。
 * - 粒子颜色可沿路径从来料色渐变到产物色（③-2 物料贯穿叙事：卤水青蓝 → 盐白）。
 * - 末端脉冲环表达“物料到达该设备”（③-4 粒子落点脉冲）。
 * - reduced=true 时冻结粒子与脉冲，尊重系统“减弱动效”（③-4）。
 */
export function FlowTube({
  points,
  color = metalColors.brine,
  toColor,
  radius = 0.08,
  particleCount = 6,
  speed = 0.22,
  particleSize = 0.12,
  showTube = true,
  /** 粒子相位偏移（0~1），用于让多条管按序脉动、表达梯级/序列关系 */
  phase = 0,
  /** 末端脉冲环：表达物料到达该设备 */
  pulse = false,
  /** 减弱动效：冻结粒子与脉冲（系统偏好 reduce motion） */
  reduced = false,
}: {
  points: [number, number, number][];
  color?: string;
  toColor?: string;
  radius?: number;
  particleCount?: number;
  speed?: number;
  particleSize?: number;
  showTube?: boolean;
  phase?: number;
  pulse?: boolean;
  reduced?: boolean;
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    [points]
  );
  const refs = useRef<THREE.Mesh[]>([]);
  const fromColor = useMemo(() => new THREE.Color(color), [color]);
  const toColorObj = useMemo(() => (toColor ? new THREE.Color(toColor) : null), [toColor]);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const pulseRef = useRef<THREE.Mesh>(null);
  const endPoint = points[points.length - 1];

  useFrame((state) => {
    // 减弱动效：粒子均匀静态排布，冻结流动与脉冲
    if (reduced) {
      refs.current.forEach((m, i) => {
        if (!m) return;
        const u = i / particleCount;
        m.position.copy(curve.getPointAt(u));
        m.scale.setScalar(Math.max(0.001, particleSize * 0.8));
        (m.material as THREE.MeshStandardMaterial).opacity = 0.8;
      });
      return;
    }

    const t = state.clock.elapsedTime * speed + phase;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t + i / particleCount) % 1;
      const p = curve.getPointAt(u);
      m.position.copy(p);
      // 中段略大，首尾平滑淡入淡出（sin 包络），避免硬截断跳变
      const env = Math.sin(u * Math.PI);
      m.scale.setScalar(Math.max(0.001, particleSize * env));
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.opacity = env;
      // 沿路径颜色渐变：来料色 → 产物色，直观表达物料演变
      if (toColorObj) {
        tmpColor.copy(fromColor).lerp(toColorObj, u);
        mat.color.copy(tmpColor);
        mat.emissive.copy(tmpColor);
      }
    });

    // 末端脉冲环：随相位扩张淡出，表达“物料抵达”
    if (pulseRef.current) {
      const tp = (state.clock.elapsedTime * speed + phase) % 1;
      const s = 0.25 + tp * 1.1;
      pulseRef.current.scale.set(s, s, s);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - tp) * 0.45;
    }
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
      {pulse && !reduced && (
        <mesh ref={pulseRef} position={endPoint} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.24, 32]} />
          <meshBasicMaterial
            color={toColor ?? color}
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
