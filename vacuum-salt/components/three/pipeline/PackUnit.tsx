"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { metalColors, Tag } from "../Tag";
import { STAGE_X } from "./layout";

/**
 * 环节 5：包装与仓储（输送 + 定量包装 + 码垛 + 立体仓储）
 *
 * ⚠ 坐标约定（与 Brine/Evaporate/Centrifuge/Dry 一致）：本文件内一律用「相对坐标」，
 * 最外层 <group position={[cx, 0, 0]}> 一次性平移到产线。绝不在内部再叠加 cx。
 *
 * 工艺叙事（自左向右，单一物料流时间线）：
 *   干盐 → 进料输送 → 定量包装机(充填落袋) → 包装输出皮带 → 码垛机械臂(取袋→搬运→放垛)
 *         → 立体仓储(逐槽累积，满托重置) 形成「生产→传送→码垛→入库」闭环。
 *
 * 颜色叙事：
 *   干盐（纯白发光）→ 盐袋（白 + 红色标签条）；机械臂（金属灰）；仓储（金属架）。
 */

const GROUND = -2.4;
// 真剖面：与环节 2（蒸发）一致（保留 z<=0 半边），从相机侧剖开包装机看充填封口
const PACK_CLIP = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
const X_CONV = -1.6; // 进料输送（左）
const X_PACKER = 0.0; // 定量包装机（中）
const X_BELT = 1.0; // 包装输出皮带
const X_ROBOT = 2.4; // 码垛机械臂
const X_WH = 4.2; // 立体仓储（右）
const CYCLE = 4.0; // 每袋节拍（秒）
const LABEL_RED = "#B33A2A"; // diagonal 品牌红，用于盐袋标签

/** 干盐进口（世界坐标）——供 PipelineScene 接「干盐 → 包装机」管道 */
export const PACK_INLET: [number, number, number] = [STAGE_X.pack - 0.6, 0.4, 0];

// 盐袋小方块（纯白发光 + 红色标签条，呼应成品干盐）
function SaltBag({ scale = 0.26 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh castShadow>
        <boxGeometry args={[1, 1.25, 0.85]} />
        <meshStandardMaterial
          color={metalColors.salt}
          roughness={0.55}
          emissive={metalColors.brineLight}
          emissiveIntensity={0.08}
        />
      </mesh>
      {/* 标签条（读起来像盐袋） */}
      <mesh position={[0, 0.12, 0.44]}>
        <boxGeometry args={[0.62, 0.42, 0.02]} />
        <meshStandardMaterial color={LABEL_RED} roughness={0.6} />
      </mesh>
    </group>
  );
}

// ---------- 1. 进料输送（盐袋被喂入包装机） ----------
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
      const x = X0 + u * (X1 - X0);
      m.position.set(x, -0.05, 0);
      m.visible = x < X_PACKER - 0.25; // 抵达包装机即被「喂入」
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
        <meshStandardMaterial
          color={metalColors.alloyMid}
          metalness={0.3}
          roughness={0.6}
          emissive={metalColors.brine}
          emissiveIntensity={0.08}
        />
      </mesh>
      {/* 托辊 */}
      {[-1.1, 0, 1.1].map((dx, i) => (
        <mesh key={i} position={[dx, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.7, 14]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} />
        </mesh>
      ))}
      {/* 盐袋（抵达包装机前可见） */}
      {bags.map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) bagRefs.current[i] = el; }}>
          <SaltBag />
        </mesh>
      ))}
    </group>
  );
}

// ---------- 2. 定量包装机（空袋成形 → 充填 → 封口 → 落袋） ----------
function Packer() {
  const bagRef = useRef<THREE.Group>(null);
  const sealRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cyc = (t % CYCLE) / CYCLE;
    if (bagRef.current) {
      const vis = cyc < 0.5;
      bagRef.current.visible = vis;
      if (vis) {
        const form = THREE.MathUtils.smoothstep(cyc, 0.0, 0.12); // 空袋成形
        const fill = THREE.MathUtils.smoothstep(cyc, 0.12, 0.4); // 充填胀大
        const drop = THREE.MathUtils.smoothstep(cyc, 0.4, 0.5); // 封口后落向皮带
        const settle = Math.sin(t * 9) * 0.015 * fill; // 充填时轻微沉降抖动
        bagRef.current.position.set(0, 1.0 - drop * 1.15 + settle, 0);
        bagRef.current.scale.setScalar(0.06 + form * 0.06 + fill * 0.16);
      }
    }
    if (sealRef.current) {
      // 充填末段（0.42–0.5）：封口夹下压、随袋顶一同落到皮带，完成封口
      const seal = THREE.MathUtils.smoothstep(cyc, 0.42, 0.5);
      sealRef.current.visible = seal > 0.01 && cyc < 0.5;
      const bagY = 1.0 - THREE.MathUtils.smoothstep(cyc, 0.4, 0.5) * 1.15;
      sealRef.current.position.y = bagY + 0.22;
    }
  });
  return (
    <group position={[X_PACKER, 0, 0]}>
      {/* 机壳（真剖面：剖开看充填封口） */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.1, 1.5, 0.9]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.45} roughness={0.4} clippingPlanes={[PACK_CLIP]} />
      </mesh>
      {/* 料斗（顶部，接收干盐） */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <coneGeometry args={[0.45, 0.6, 20, 1, true]} />
        <meshStandardMaterial color={metalColors.alloyLight} metalness={0.5} side={THREE.DoubleSide} roughness={0.4} clippingPlanes={[PACK_CLIP]} />
      </mesh>
      {/* 下料 spout */}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.5, 16]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* 封口夹（充填末段下压贴袋顶完成封口） */}
      <mesh ref={sealRef} position={[0, 1.32, 0]} visible={false}>
        <boxGeometry args={[0.5, 0.14, 0.4]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* 空袋成形 → 充填胀大 → 封口落下的盐袋 */}
      <group ref={bagRef} visible={false}>
        <SaltBag />
      </group>
    </group>
  );
}

// ---------- 3. 包装输出皮带（包装机 → 机械臂取袋点） ----------
function OutputBelt() {
  const bagRef = useRef<THREE.Group>(null);
  const beltRef = useRef<THREE.Mesh>(null);
  const X0 = X_BELT - 0.9;
  const X1 = X_BELT + 0.9; // 取袋点 ~1.9
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cyc = (t % CYCLE) / CYCLE;
    if (beltRef.current) {
      (beltRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.05 + Math.abs(Math.sin(t * 2.5)) * 0.06;
    }
    if (bagRef.current) {
      const vis = cyc >= 0.5 && cyc < 0.82;
      bagRef.current.visible = vis;
      if (vis) {
        const u = THREE.MathUtils.clamp((cyc - 0.5) / 0.3, 0, 1);
        bagRef.current.position.set(X0 + u * (X1 - X0), -0.05, 0);
      }
    }
  });
  return (
    <group position={[X_BELT, 0, 0]}>
      <mesh ref={beltRef} position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[1.8, 0.6, 0.04]} />
        <meshStandardMaterial
          color={metalColors.alloyMid}
          metalness={0.3}
          roughness={0.6}
          emissive={metalColors.brine}
          emissiveIntensity={0.08}
        />
      </mesh>
      {[-0.8, 0, 0.8].map((dx, i) => (
        <mesh key={i} position={[dx, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.6, 12]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} />
        </mesh>
      ))}
      {/* 被传送的盐袋（取袋点前可见） */}
      <group ref={bagRef} visible={false}>
        <SaltBag />
      </group>
    </group>
  );
}

// ---------- 4. 码垛机械臂（取袋 → 搬运 → 放垛） ----------
function RobotArm() {
  const pivotRef = useRef<THREE.Group>(null);
  const foreRef = useRef<THREE.Group>(null);
  const carryRef = useRef<THREE.Group>(null);
  const HOME: [number, number] = [-0.3, 0.6]; // 待机
  const PICK: [number, number] = [0.85, -0.5]; // 下探取袋（左）
  const PLACE: [number, number] = [-1.05, 0.8]; // 上举放垛（右）
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cyc = (t % CYCLE) / CYCLE;
    let pose = HOME;
    if (cyc < 0.78) {
      const k = THREE.MathUtils.smoothstep(cyc, 0.66, 0.78);
      pose = [HOME[0] + (PICK[0] - HOME[0]) * k, HOME[1] + (PICK[1] - HOME[1]) * k];
    } else if (cyc < 0.92) {
      const k = THREE.MathUtils.smoothstep(cyc, 0.78, 0.92);
      pose = [PICK[0] + (PLACE[0] - PICK[0]) * k, PICK[1] + (PLACE[1] - PICK[1]) * k];
    } else {
      const k = THREE.MathUtils.smoothstep(cyc, 0.92, 1.0);
      pose = [PLACE[0] + (HOME[0] - PLACE[0]) * k, PLACE[1] + (HOME[1] - PLACE[1]) * k];
    }
    if (pivotRef.current) pivotRef.current.rotation.z = pose[0];
    if (foreRef.current) foreRef.current.rotation.z = pose[1];
    if (carryRef.current) carryRef.current.visible = cyc > 0.72 && cyc < 0.94; // 搬运段携带
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
          <group ref={carryRef} position={[1.0, -0.7, 0]} visible={false}>
            <SaltBag />
          </group>
        </group>
      </group>
    </group>
  );
}

// ---------- 5. 立体仓储（逐槽累积，满托重置） ----------
function Warehouse() {
  const slotRefs = useRef<THREE.Mesh[]>([]);
  const N = 9;
  // 三层 × 三列；每袋袋高 0.30（scale 0.24），y 取「横梁顶面 + 0.15 + 0.02 余隙」→ 整齐坐在横梁上、零穿插
  const slots = useMemo<[number, number][]>(() => {
    const xs = [-0.42, 0, 0.42];
    const ys = [-1.75, -0.75, 0.25]; // 对应横梁顶面 -1.92 / -0.92 / 0.08
    const out: [number, number][] = [];
    ys.forEach((y) => xs.forEach((x) => out.push([x, y])));
    return out;
  }, []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cyc = Math.floor(t / CYCLE);
    const visible = (cyc % N) + 1; // 1..9：满托后重置（换托）
    slotRefs.current.forEach((m, i) => {
      if (m) m.visible = i < visible;
    });
  });
  return (
    <group position={[X_WH, 0, 0]}>
      {/* 货架横梁（三层承重 + 顶框） */}
      {[-1.95, -0.95, 0.05, 0.55].map((row) => (
        <mesh key={row} position={[0, row, 0]}>
          <boxGeometry args={[1.5, 0.06, 0.9]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.5} />
        </mesh>
      ))}
      {/* 立柱：从托盘(-2.24)连通至顶框(0.65)，不再悬空 */}
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} position={[x, -0.795, 0]}>
          <boxGeometry args={[0.08, 2.89, 0.9]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.5} />
        </mesh>
      ))}
      {/* 托盘底座（落地） */}
      <mesh position={[0, GROUND + 0.08, 0]} castShadow>
        <boxGeometry args={[1.5, 0.16, 1.1]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.6} />
      </mesh>
      {/* 逐槽累积的盐袋（机械臂码垛填入，整齐坐在横梁上） */}
      {slots.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) slotRefs.current[i] = el;
          }}
          position={[p[0], p[1], 0]}
          visible={false}
          castShadow
        >
          <SaltBag scale={0.24} />
        </mesh>
      ))}
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
            value={zh ? "称量充填 · 封口装袋" : "weigh · fill · seal"}
            color={metalColors.alloy}
          />
          <Tag
            position={[X_ROBOT, 0.9, 0]}
            label={zh ? "码垛机械臂" : "Palletizing robot"}
            value={zh ? "取袋 → 搬运 → 放垛" : "pick → carry → stack"}
            color={metalColors.amber}
          />
          <Tag
            position={[X_WH, 1.1, 0]}
            label={zh ? "立体仓储" : "Warehouse"}
            value={zh ? "逐托码垛累积" : "palletized storage"}
            color={metalColors.salt}
          />
        </>
      )}
    </group>
  );
}
