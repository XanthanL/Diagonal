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

/** 2-link 平面逆运动学：求夹爪尖端到达 (tx,ty) 时的两关节角 [θ1, θ2]。
 *  基座在 (bx,by)，上臂长 L1、前臂长 L2；θ2 取肘朝上构型，避免前臂扫到地面。 */
function solve2Link(
  tx: number,
  ty: number,
  bx: number,
  by: number,
  L1: number,
  L2: number
): [number, number] {
  const dx = tx - bx;
  const dy = ty - by;
  let D = Math.hypot(dx, dy);
  const Dmax = L1 + L2 - 1e-3;
  const Dmin = Math.abs(L1 - L2) + 1e-3;
  D = Math.min(Math.max(D, Dmin), Dmax);
  const cos2 = (D * D - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  const th2 = -Math.acos(Math.min(1, Math.max(-1, cos2))); // 肘朝上
  const th1 = Math.atan2(dy, dx) - Math.atan2(L2 * Math.sin(th2), L1 + L2 * Math.cos(th2));
  return [th1, th2];
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
    const bag = bagRef.current;
    if (bag) {
      const vis = cyc < 0.5;
      bag.visible = vis;
      if (vis) {
        const form = THREE.MathUtils.smoothstep(cyc, 0.0, 0.12); // 空袋成形
        const fill = THREE.MathUtils.smoothstep(cyc, 0.12, 0.4); // 充填胀大
        const drop = THREE.MathUtils.smoothstep(cyc, 0.4, 0.5); // 封口后落向皮带
        const settle = Math.sin(t * 9) * 0.015 * fill; // 充填时轻微沉降抖动
        // 落袋时略向右挪，衔接输出皮带起点（修复原断点）
        bag.position.set(drop * 0.1, 1.0 - drop * 1.15 + settle, 0);
        // scale 直接由本 group 控制（SaltBag 传 scale=1，避免双重缩放导致盐袋过小）
        bag.scale.setScalar(0.1 + form * 0.02 + fill * 0.14);
      }
    }
    const seal = sealRef.current;
    if (seal) {
      // 充填末段（0.42–0.5）：封口夹下压、随袋顶一同落到皮带，完成封口
      const s = THREE.MathUtils.smoothstep(cyc, 0.42, 0.5);
      seal.visible = s > 0.01 && cyc < 0.5;
      const bagY = 1.0 - THREE.MathUtils.smoothstep(cyc, 0.4, 0.5) * 1.15;
      seal.position.y = bagY + 0.22;
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
      {/* 空袋成形 → 充填胀大 → 封口落下的盐袋（scale 由外层 group 直接控制） */}
      <group ref={bagRef} visible={false}>
        <SaltBag scale={1} />
      </group>
    </group>
  );
}

// ---------- 3. 包装输出皮带（包装机 → 机械臂取袋点） ----------
function OutputBelt() {
  const bagRef = useRef<THREE.Group>(null);
  const beltRef = useRef<THREE.Mesh>(null);
  const X0 = X_BELT - 0.9; // 取袋点一侧（衔接包装机落袋点）
  const X1 = X_BELT + 0.9;
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
        <SaltBag scale={0.24} />
      </group>
    </group>
  );
}

// ---------- 4. 码垛机械臂（取袋 → 搬运 → 放垛，2-link IK 保证不穿模） ----------
function RobotArm() {
  const pivotRef = useRef<THREE.Group>(null);
  const foreRef = useRef<THREE.Group>(null);
  const carryRef = useRef<THREE.Group>(null);
  // 连杆：上臂 L1 + 前臂 L2；基座（立柱顶）在 (X_ROBOT, PIVOT_Y)
  const L1 = 1.2;
  const L2 = 1.1;
  const PIVOT_Y = 0.9;
  // 三个关键帧的世界目标点（相对 PackUnit 组）：取袋在皮带、放垛在仓储正面外侧、待机朝上
  const POSES = useMemo(() => {
    const home = solve2Link(X_ROBOT, PIVOT_Y + 0.9, X_ROBOT, PIVOT_Y, L1, L2); // 待机：朝上
    const pick = solve2Link(X_BELT + 0.4, -0.05, X_ROBOT, PIVOT_Y, L1, L2); // 取袋：输出皮带
    const place = solve2Link(X_WH - 0.45, 0.25, X_ROBOT, PIVOT_Y, L1, L2); // 放垛：仓储正面外侧（不进架体）
    return { home, pick, place };
  }, []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cyc = (t % CYCLE) / CYCLE;
    let a1 = POSES.home[0];
    let a2 = POSES.home[1];
    if (cyc < 0.72) {
      // 待机 → 下探取袋
      const k = THREE.MathUtils.smoothstep(cyc, 0.55, 0.72);
      a1 = POSES.home[0] + (POSES.pick[0] - POSES.home[0]) * k;
      a2 = POSES.home[1] + (POSES.pick[1] - POSES.home[1]) * k;
    } else if (cyc < 0.92) {
      // 取袋 → 搬运至仓储
      const k = THREE.MathUtils.smoothstep(cyc, 0.72, 0.92);
      a1 = POSES.pick[0] + (POSES.place[0] - POSES.pick[0]) * k;
      a2 = POSES.pick[1] + (POSES.place[1] - POSES.pick[1]) * k;
    } else {
      // 放垛 → 收回待机
      const k = THREE.MathUtils.smoothstep(cyc, 0.92, 1.0);
      a1 = POSES.place[0] + (POSES.home[0] - POSES.place[0]) * k;
      a2 = POSES.place[1] + (POSES.home[1] - POSES.place[1]) * k;
    }
    if (pivotRef.current) pivotRef.current.rotation.z = a1;
    if (foreRef.current) foreRef.current.rotation.z = a2;
    if (carryRef.current) carryRef.current.visible = cyc > 0.72 && cyc < 0.94; // 搬运段携带
  });
  return (
    <group position={[X_ROBOT, 0, 0]}>
      {/* 底座 */}
      <mesh position={[0, GROUND + 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.5, 0.34, 18]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* 立柱（落地在 GROUND，顶到 PIVOT_Y） */}
      <mesh position={[0, (GROUND + PIVOT_Y) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, PIVOT_Y - GROUND, 14]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 大臂（绕立柱顶旋转） */}
      <group ref={pivotRef} position={[0, PIVOT_Y, 0]}>
        <mesh position={[L1 / 2, 0, 0]} castShadow>
          <boxGeometry args={[L1, 0.22, 0.22]} />
          <meshStandardMaterial color={metalColors.alloyLight} metalness={0.5} roughness={0.35} />
        </mesh>
        {/* 小臂 */}
        <group ref={foreRef} position={[L1, 0, 0]}>
          <mesh position={[L2 / 2, 0, 0]} castShadow>
            <boxGeometry args={[L2, 0.18, 0.18]} />
            <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.4} />
          </mesh>
          {/* 夹爪 */}
          <mesh position={[L2, 0, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.26]} />
            <meshStandardMaterial color={metalColors.amber} metalness={0.6} roughness={0.4} />
          </mesh>
          {/* 携带的盐袋（随夹爪移动，放垛前消失） */}
          <group ref={carryRef} position={[L2, -0.35, 0]} visible={false}>
            <SaltBag scale={0.2} />
          </group>
        </group>
      </group>
    </group>
  );
}

// ---------- 5. 立体仓储（正面朝机械臂、逐槽累积，满托重置） ----------
function Warehouse() {
  const slotRefs = useRef<THREE.Mesh[]>([]);
  const N = 9;
  // 结构：窄 X、深 Z（列沿 Z 排），正面(-X 侧)朝向机械臂。
  // 填充自上而下、前排(z=0)优先，与机械臂放垛(正面外侧)一致。
  const cols = [0, 0.55, -0.55]; // Z 向列：前 / 后+ / 后-
  const levels = [0.25, -0.75, -1.75]; // Y 向层：顶 → 底
  const slots = useMemo<[number, number, number][]>(() => {
    const out: [number, number, number][] = [];
    levels.forEach((y) => cols.forEach((z) => out.push([0, y, z])));
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
      {/* 货架横梁（顶框 + 三层承重），窄 X、深 Z */}
      {[0.55, 0.05, -0.95, -1.95].map((row) => (
        <mesh key={row} position={[0, row, 0]}>
          <boxGeometry args={[0.7, 0.06, 1.7]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.5} />
        </mesh>
      ))}
      {/* 立柱：沿 Z 两侧（从托盘连通至顶框，不再悬空） */}
      {[-0.85, 0.85].map((z) => (
        <mesh key={z} position={[0, -0.7, z]}>
          <boxGeometry args={[0.08, 2.9, 0.08]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.5} />
        </mesh>
      ))}
      {/* 托盘底座（落地） */}
      <mesh position={[0, GROUND + 0.08, 0]} castShadow>
        <boxGeometry args={[0.7, 0.16, 1.7]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.6} />
      </mesh>
      {/* 逐槽累积的盐袋（机械臂码垛填入，前排 z=0 朝向机械臂） */}
      {slots.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) slotRefs.current[i] = el;
          }}
          position={p}
          visible={false}
          castShadow
        >
          <SaltBag scale={0.22} />
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
            position={[X_ROBOT, 1.7, 0]}
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
