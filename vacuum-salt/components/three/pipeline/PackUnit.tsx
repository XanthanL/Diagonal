"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactElement } from "react";
import * as THREE from "three";
import { metalColors, Tag } from "../Tag";
import { STAGE_X } from "./layout";

/**
 * 环节 5：包装与仓储（输送 + 定量包装 + 码垛 + 立体仓储）
 *
 * ⚠ 坐标约定（与 Brine/Evaporate/Centrifuge/Dry 一致）：本文件内一律用「相对坐标」，
 * 最外层 <group position={[cx, 0, 0]}> 一次性平移到产线。绝不在内部再叠加 cx。
 *
 * 工艺叙事（自左向右）：
 *   干盐 → 输送系统 → 定量包装机（称量装袋）→ 码垛机械臂（搬运码垛）→ 立体仓储
 *
 * 颜色叙事：
 *   干盐（纯白发光）→ 盐袋（白）→ 机械臂（金属灰）；仓储分区（食用盐/工业盐）。
 */

const GROUND = -2.4;
const X_CONV = -1.6; // 输送系统（左）
const X_PACKER = 0.0; // 定量包装机（中）
const X_BELT = 1.0; // 包装输出皮带
const X_ROBOT = 2.4; // 码垛机械臂
const X_PALLET = 3.6; // 托盘（码垛落点）
const X_WH = 4.2; // 立体仓储（右，靠近平台右边界）

/** 干盐进口（世界坐标）——供 PipelineScene 接「干盐 → 包装机」管道 */
export const PACK_INLET: [number, number, number] = [STAGE_X.pack - 0.6, 0.4, 0];

// 盐袋小方块（纯白发光，呼应成品干盐）
function SaltBag({ scale = 0.26 }: { scale?: number }) {
  return (
    <mesh castShadow scale={scale}>
      <boxGeometry args={[1, 1.25, 0.85]} />
      <meshStandardMaterial
        color={metalColors.salt}
        roughness={0.55}
        emissive={metalColors.brineLight}
        emissiveIntensity={0.08}
      />
    </mesh>
  );
}

// ---------- 1. 输送系统 ----------
function Conveyor() {
  const bagRefs = useRef<THREE.Mesh[]>([]);
  const beltRef = useRef<THREE.Mesh>(null);
  const X0 = X_CONV - 1.1;
  const X1 = X_CONV + 1.1;
  const bags = useMemo(
    () => Array.from({ length: 3 }).map((_, i) => ({ phase: i / 3, speed: 0.22 })),
    []
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (beltRef.current) {
      (beltRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.05 + Math.abs(Math.sin(t * 2.5)) * 0.06;
    }
    bagRefs.current.forEach((m, i) => {
      if (!m) return;
      const b = bags[i];
      const u = (t * b.speed + b.phase) % 1;
      m.position.set(X0 + u * (X1 - X0), -0.05, 0);
    });
  });
  return (
    <group position={[X_CONV, 0, 0]}>
      {/* 支腿 */}
      {[-1.0, 1.0].map((dx, i) => (
        <mesh key={i} position={[dx, (GROUND - 0.15) / 2, 0]} castShadow>
          <boxGeometry args={[0.1, -0.15 - GROUND, 0.1]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* 皮带 */}
      <mesh ref={beltRef} position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[2.4, 0.7, 0.04]} />
        <meshStandardMaterial color={metalColors.alloyMid} metalness={0.3} roughness={0.6} emissive={metalColors.brine} emissiveIntensity={0.08} />
      </mesh>
      {/* 托辊 */}
      {[-1.1, 0, 1.1].map((dx, i) => (
        <mesh key={i} position={[dx, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.7, 14]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} />
        </mesh>
      ))}
      {/* 盐袋 */}
      {bags.map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) bagRefs.current[i] = el; }}>
          <SaltBag />
        </mesh>
      ))}
    </group>
  );
}

// ---------- 2. 定量包装机 ----------
function Packer() {
  const bagRef = useRef<THREE.Mesh>(null);
  const dropRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // 每 ~2.4s 落下一袋：从 spout 落下到皮带
    const cyc = (t % 2.4) / 2.4;
    if (bagRef.current) {
      const y = 1.0 - cyc * 1.0; // 1.0 → 0.0
      bagRef.current.position.set(0, y, 0);
      bagRef.current.scale.setScalar(0.26 * (0.6 + (1 - cyc) * 0.4));
      (bagRef.current.material as THREE.MeshStandardMaterial).opacity = cyc < 0.92 ? 1 : 0;
    }
    if (dropRef.current) dropRef.current.visible = cyc < 0.92;
  });
  return (
    <group position={[X_PACKER, 0, 0]}>
      {/* 机壳 */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.1, 1.5, 0.9]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.45} roughness={0.4} />
      </mesh>
      {/* 料斗（顶部，接收干盐） */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <coneGeometry args={[0.45, 0.6, 20, 1, true]} />
        <meshStandardMaterial color={metalColors.alloyLight} metalness={0.5} side={THREE.DoubleSide} roughness={0.4} />
      </mesh>
      {/* 下料 spout */}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.5, 16]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* 落下的盐袋 */}
      <group ref={dropRef}>
        <mesh ref={bagRef}>
          <SaltBag />
        </mesh>
      </group>
    </group>
  );
}

// ---------- 3. 码垛机械臂 ----------
function RobotArm() {
  const pivotRef = useRef<THREE.Group>(null);
  const foreRef = useRef<THREE.Group>(null);
  const carryRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cyc = (t % 3.2) / 3.2; // 取袋 → 搬运 → 放置
    if (pivotRef.current) pivotRef.current.rotation.z = -0.35 + Math.sin(cyc * Math.PI) * 0.85;
    if (foreRef.current) foreRef.current.rotation.z = 0.5 - Math.sin(cyc * Math.PI) * 0.7;
    // 搬运段（cyc 0.25~0.75）显示携带的盐袋
    if (carryRef.current) {
      const carrying = cyc > 0.22 && cyc < 0.78;
      carryRef.current.visible = carrying;
      carryRef.current.scale.setScalar(0.26);
    }
  });
  return (
    <group position={[X_ROBOT, 0, 0]}>
      {/* 底座 */}
      <mesh position={[0, GROUND + 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.5, 0.34, 18]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* 立柱 */}
      <mesh position={[0, -1.05, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 1.3, 14]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 大臂（绕立柱顶旋转） */}
      <group ref={pivotRef} position={[0, -0.4, 0]}>
        <mesh position={[0.7, 0.12, 0]} castShadow>
          <boxGeometry args={[1.4, 0.22, 0.22]} />
          <meshStandardMaterial color={metalColors.alloyLight} metalness={0.5} roughness={0.35} />
        </mesh>
        {/* 小臂 */}
        <group ref={foreRef} position={[1.4, 0.12, 0]}>
          <mesh position={[0.5, -0.1, 0]} castShadow>
            <boxGeometry args={[1.0, 0.18, 0.18]} />
            <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.4} />
          </mesh>
          {/* 夹爪 */}
          <mesh position={[1.0, -0.3, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.26]} />
            <meshStandardMaterial color={metalColors.amber} metalness={0.6} roughness={0.4} />
          </mesh>
          {/* 携带的盐袋（随夹爪移动） */}
          <mesh ref={carryRef} position={[1.0, -0.7, 0]}>
            <SaltBag />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ---------- 3.5 包装输出皮带（包装机 → 机械臂取袋点） ----------
function OutputBelt() {
  const bagRefs = useRef<THREE.Mesh[]>([]);
  const beltRef = useRef<THREE.Mesh>(null);
  const X0 = X_BELT - 0.9;
  const X1 = X_BELT + 0.9;
  const bags = useMemo(
    () => Array.from({ length: 2 }).map((_, i) => ({ phase: i / 2, speed: 0.2 })),
    []
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (beltRef.current) {
      (beltRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.05 + Math.abs(Math.sin(t * 2.5)) * 0.06;
    }
    bagRefs.current.forEach((m, i) => {
      if (!m) return;
      const b = bags[i];
      const u = (t * b.speed + b.phase) % 1;
      m.position.set(X0 + u * (X1 - X0), -0.05, 0);
    });
  });
  return (
    <group position={[X_BELT, 0, 0]}>
      <mesh ref={beltRef} position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[1.8, 0.6, 0.04]} />
        <meshStandardMaterial color={metalColors.alloyMid} metalness={0.3} roughness={0.6} emissive={metalColors.brine} emissiveIntensity={0.08} />
      </mesh>
      {[-0.8, 0, 0.8].map((dx, i) => (
        <mesh key={i} position={[dx, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.6, 12]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} />
        </mesh>
      ))}
      {bags.map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) bagRefs.current[i] = el; }}>
          <SaltBag />
        </mesh>
      ))}
    </group>
  );
}

// ---------- 4. 立体仓储 ----------
function Warehouse() {
  const rows = 3;
  const cols = 3;
  const stack: ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      stack.push(
        <mesh key={`${r}-${c}`} position={[c * 0.42 - 0.42, r * 0.42 + 0.21, 0]} castShadow>
          <SaltBag scale={0.22} />
        </mesh>
      );
    }
  }
  return (
    <group position={[X_WH, 0, 0]}>
      {/* 货架横梁 */}
      {[0, 1, 2].map((row) => (
        <mesh key={row} position={[0, row * 0.5 + 0.1, 0]}>
          <boxGeometry args={[1.5, 0.06, 0.9]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.5} />
        </mesh>
      ))}
      {/* 立柱 */}
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} position={[x, 0.75, 0]}>
          <boxGeometry args={[0.08, 1.6, 0.9]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.5} />
        </mesh>
      ))}
      {stack}
    </group>
  );
}

// ---------- 环节装配 ----------
export function PackUnit({
  onSelect,
  focused = false,
  lang = "zh",
}: {
  onSelect?: () => void;
  /** 相机已对准本环节时，显示极简说明浮标 */
  focused?: boolean;
  lang?: "zh" | "en";
}) {
  const cx = STAGE_X.pack;
  const zh = lang === "zh";

  return (
    <group
      position={[cx, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      {/* 托盘（码垛落点，承载堆叠盐袋） */}
      <mesh position={[X_PALLET, GROUND + 0.08, 0]} castShadow>
        <boxGeometry args={[1.5, 0.16, 1.3]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.6} />
      </mesh>
      {/* 托盘上已码放的盐袋（整齐堆叠） */}
      {[
        [-0.4, GROUND + 0.35, -0.3],
        [0.4, GROUND + 0.35, -0.3],
        [-0.4, GROUND + 0.35, 0.3],
        [0.4, GROUND + 0.35, 0.3],
        [0, GROUND + 0.75, 0],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <SaltBag scale={0.28} />
        </mesh>
      ))}

      <Conveyor />
      <Packer />
      <OutputBelt />
      <RobotArm />
      <Warehouse />

      {/* 对准本环节时才出现的极简说明（避免全景时文字堆叠） */}
      {focused && (
        <>
          <Tag
            position={[X_PACKER, 1.9, 0]}
            label={zh ? "定量包装机" : "Packaging machine"}
            value={zh ? "称量装袋" : "weigh & bag"}
            color={metalColors.alloy}
          />
          <Tag
            position={[X_ROBOT, 0.9, 0]}
            label={zh ? "码垛机械臂" : "Palletizing robot"}
            value={zh ? "搬运码垛" : "pick & stack"}
            color={metalColors.amber}
          />
          <Tag
            position={[X_WH, 1.9, 0]}
            label={zh ? "立体仓储" : "Warehouse"}
            value={zh ? "分区防结块" : "zoned storage"}
            color={metalColors.salt}
          />
        </>
      )}
    </group>
  );
}
