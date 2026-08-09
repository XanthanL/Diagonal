"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { metalColors } from "../Tag";
import { STAGE_X } from "./layout";

/** 环节 5：包装机 + 码垛机械臂 + 货架 */
export function PackUnit({ onSelect }: { onSelect?: () => void }) {
  const cx = STAGE_X.pack;
  const arm1 = useRef<THREE.Group>(null);
  const arm2 = useRef<THREE.Group>(null);
  const beltRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (arm1.current) arm1.current.rotation.z = Math.sin(t * 0.7) * 0.45 - 0.25;
    if (arm2.current) arm2.current.rotation.z = Math.sin(t * 0.7 + 1) * 0.5 + 0.5;
    if (beltRef.current) {
      (beltRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.05 + Math.abs(Math.sin(t * 3)) * 0.08;
    }
  });

  // 货架盐袋
  const shelves = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      shelves.push(
        <mesh key={`${row}-${col}`} position={[col * 0.85 - 0.85, row * 0.85 + 0.2, 0]} castShadow>
          <boxGeometry args={[0.6, 0.45, 0.45]} />
          <meshStandardMaterial color={metalColors.salt} roughness={0.5} emissive="#b8dcef" emissiveIntensity={0.06} />
        </mesh>
      );
    }
  }

  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect?.(); }}>
      {/* 包装机 */}
      <group position={[cx, 0, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[1.0, 1.2, 0.9]} />
          <meshStandardMaterial color={metalColors.alloy} metalness={0.45} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.26, 16]} />
          <meshStandardMaterial color={metalColors.amber} metalness={0.6} />
        </mesh>
        {/* 传送带 */}
        <mesh ref={beltRef} position={[1.2, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <boxGeometry args={[2.0, 0.5, 0.04]} />
          <meshStandardMaterial color={metalColors.alloyMid} metalness={0.3} roughness={0.6} emissive={metalColors.brine} emissiveIntensity={0.08} />
        </mesh>
        {/* 出料盐袋 */}
        <mesh position={[1.2, 0.1, 0]} castShadow>
          <boxGeometry args={[0.3, 0.4, 0.26]} />
          <meshStandardMaterial color={metalColors.salt} roughness={0.5} emissive="#b8dcef" emissiveIntensity={0.08} />
        </mesh>
      </group>

      {/* 码垛机械臂 */}
      <group position={[cx + 3.2, -1.4, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.42, 0.5, 0.34, 18]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.9, 14]} />
          <meshStandardMaterial color={metalColors.alloy} metalness={0.5} />
        </mesh>
        <group ref={arm1} position={[0, 1.0, 0]}>
          <mesh position={[0.8, 0.25, 0]} castShadow>
            <boxGeometry args={[1.6, 0.22, 0.22]} />
            <meshStandardMaterial color={metalColors.alloyLight} metalness={0.5} roughness={0.35} />
          </mesh>
          <group ref={arm2} position={[1.6, 0.25, 0]}>
            <mesh position={[0.5, -0.15, 0]} castShadow>
              <boxGeometry args={[1.0, 0.18, 0.18]} />
              <meshStandardMaterial color={metalColors.alloy} metalness={0.5} />
            </mesh>
            <mesh position={[1.0, -0.4, 0]}>
              <boxGeometry args={[0.1, 0.4, 0.26]} />
              <meshStandardMaterial color={metalColors.amber} metalness={0.6} />
            </mesh>
          </group>
        </group>
      </group>

      {/* 货架 */}
      <group position={[cx + 6.0, 0, 0]}>
        {[0, 1, 2].map((row) => (
          <mesh key={row} position={[0, row * 0.85, 0]}>
            <boxGeometry args={[3.2, 0.06, 1.0]} />
            <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.5} />
          </mesh>
        ))}
        {[-1.4, 1.4].map((x) => (
          <mesh key={x} position={[x, 0.85, 0]}>
            <boxGeometry args={[0.08, 2.4, 1.0]} />
            <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} />
          </mesh>
        ))}
        {shelves}
      </group>
    </group>
  );
}
