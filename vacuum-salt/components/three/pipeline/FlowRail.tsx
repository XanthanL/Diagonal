"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { metalColors } from "../Tag";
import { useProcessPaused } from "@/lib/useProcessPaused";
import { PLATFORM, PIPELINE } from "./layout";

/**
 * 贯穿整条产线的「流向轨」：平台中线上的一串流动刻度，
 * 由卤水青蓝渐变到盐白，统一朝右（流程方向）运动，
 * 直观表达物料从左到右的工艺流向。
 * 刻度使用单个 InstancedMesh：26 个锥体合并为 1 次 draw call。
 */
export function FlowRail({ count = 26, speed = 0.05 }: { count?: number; speed?: number }) {
  const paused = useProcessPaused();
  const x0 = PLATFORM.xMin + 1;
  const x1 = PLATFORM.xMax - 1;
  const span = x1 - x0;

  // 预生成渐变用颜色（起点青蓝 → 终点盐白）
  const cStart = useMemo(() => new THREE.Color(metalColors.brine), []);
  const cEnd = useMemo(() => new THREE.Color(metalColors.salt), []);
  const cTmp = useMemo(() => new THREE.Color(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const instanced = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.09, 0.34, 4);
    const mat = new THREE.MeshStandardMaterial({
      color: "#ffffff", // 实际颜色交给 instanceColor，避免与实例色二次相乘
      emissive: cStart,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.5,
      roughness: 0.4,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < count; i++) {
      dummy.position.set(x0 + (i / count) * span, PLATFORM.y + 0.09, 0);
      dummy.rotation.set(0, 0, -Math.PI / 2);
      dummy.scale.setScalar(0.25);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, cStart);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }, [count, span, x0, cStart, dummy]);

  useEffect(() => {
    return () => {
      instanced.geometry.dispose();
      (instanced.material as THREE.Material).dispose();
      instanced.dispose();
    };
  }, [instanced]);

  useFrame((state) => {
    if (paused) return; // 播放/暂停按钮同步冻结流向轨

    const t = state.clock.elapsedTime * speed;
    for (let i = 0; i < count; i++) {
      // u 从 0→1 循环；首尾用 scale 淡出，避免硬回绕跳变
      const u = (t + i / count) % 1;
      const env = Math.sin(u * Math.PI);
      dummy.position.set(x0 + u * span, PLATFORM.y + 0.09, 0);
      dummy.rotation.set(0, 0, -Math.PI / 2);
      dummy.scale.setScalar(0.25 + env * 0.75);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
      cTmp.copy(cStart).lerp(cEnd, u);
      instanced.setColorAt(i, cTmp);
    }
    instanced.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
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
      <primitive object={instanced} />
    </group>
  );
}
