"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { metalColors } from "../Tag";
import { useProcessPaused } from "@/lib/useProcessPaused";

/**
 * 连接管路 + 沿管流动的粒子（可视化物料流向）。
 * - 粒子颜色可沿路径从来料色渐变到产物色（③-2 物料贯穿叙事：卤水青蓝 → 盐白）。
 * - 末端脉冲环表达“物料到达该设备”（③-4 粒子落点脉冲）。
 * - 粒子使用单个 InstancedMesh：把 N 个球体从 N 次 draw call 压缩到 1 次。
 * - paused=true 时冻结在当前帧；reduced=true 时静态均匀排布并停止脉冲。
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
  const paused = useProcessPaused();
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    [points]
  );
  const fromColor = useMemo(() => new THREE.Color(color), [color]);
  const toColorObj = useMemo(() => (toColor ? new THREE.Color(toColor) : null), [toColor]);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 粒子 InstancedMesh：矩阵动态更新，实例色支持沿路径渐变。
  const instanced = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 10, 8);
    const mat = new THREE.MeshStandardMaterial({
      color: "#ffffff", // 实际颜色交给 instanceColor，避免与实例色二次相乘
      emissive: toColorObj ?? fromColor,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, particleCount);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < particleCount; i++) {
      dummy.position.set(0, 0, 0);
      dummy.scale.setScalar(0.001);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, fromColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }, [particleCount, fromColor, toColorObj, dummy]);

  useEffect(() => {
    return () => {
      instanced.geometry.dispose();
      (instanced.material as THREE.Material).dispose();
      instanced.dispose();
    };
  }, [instanced]);

  const pulseRef = useRef<THREE.Mesh>(null);
  const endPoint = points[points.length - 1];

  useFrame((state) => {
    // 产线暂停：粒子与脉冲停在当前帧，恢复播放后从原相位继续
    if (paused) return;

    const mat = instanced.material as THREE.MeshStandardMaterial;

    // 减弱动效：粒子均匀静态排布，冻结流动与脉冲
    if (reduced) {
      mat.opacity = 0.8;
      for (let i = 0; i < particleCount; i++) {
        const u = i / particleCount;
        const p = curve.getPointAt(u);
        dummy.position.copy(p);
        dummy.scale.setScalar(particleSize * 0.8);
        dummy.updateMatrix();
        instanced.setMatrixAt(i, dummy.matrix);
        instanced.setColorAt(i, fromColor);
      }
      instanced.instanceMatrix.needsUpdate = true;
      if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
      return;
    }

    const t = state.clock.elapsedTime * speed + phase;
    for (let i = 0; i < particleCount; i++) {
      const u = (t + i / particleCount) % 1;
      const p = curve.getPointAt(u);
      dummy.position.copy(p);
      // 中段略大，首尾缩小淡出（用 scale 模拟原 sin 透明度包络）
      const env = Math.sin(u * Math.PI);
      dummy.scale.setScalar(Math.max(0.001, particleSize * env));
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
      if (toColorObj) {
        tmpColor.copy(fromColor).lerp(toColorObj, u);
        instanced.setColorAt(i, tmpColor);
      } else {
        instanced.setColorAt(i, fromColor);
      }
    }
    instanced.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;

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
      <primitive object={instanced} />
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
