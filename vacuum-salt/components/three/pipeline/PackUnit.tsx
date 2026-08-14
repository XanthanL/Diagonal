"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { metalColors, Tag } from "../Tag";
import { useProcessPaused } from "@/lib/useProcessPaused";
import { FlowTube } from "./FlowTube";
import { STAGE_X } from "./layout";

/**
 * 环节 5：包装与仓储（输送 + 定量包装 + 码垛 + 立体仓储）
 *
 * ⚠ 坐标约定（与 Brine/Evaporate/Centrifuge/Dry 一致）：本文件内一律用「相对坐标」，
 * 最外层 <group position={[cx, 0, 0]}> 一次性平移到产线。绝不在内部再叠加 cx。
 * 子组件内部的运动坐标同样只用「自身组的局部坐标」——历史 bug：
 * 皮带袋坐标又加了一遍 X_CONV/X_BELT，导致袋悬在皮带外并穿过机械臂。
 *
 * 工艺叙事（自左向右，单一物料流时间线）：
 *   干盐 → 进料皮带（散盐颗粒流）→ 提升管 → 料斗 → 定量包装机（充填落袋）
 *         → 包装输出皮带 → 码垛机械臂（取袋 → 提升转向 → 放垛）
 *         → 立体仓储（逐槽累积，满托重置）形成「生产→传送→码垛→入库」闭环。
 *
 * 节拍：整环节共用 CYCLE 时钟，全部交接按相位对齐——
 *   落袋(0.5) → 皮带运输(0.5–0.72) → 取袋(0.72) → 放垛(0.92)。
 *   每个物料交接点只有一处负责「出现/消失」，杜绝瞬移与相位错位。
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
// 盐袋统一比例：包装机成形、输出皮带、机械臂携带、仓储入槽共用同一尺寸，
// 消除「包装机 0.26 → 皮带 0.24」交接瞬间的缩放跳变。
const BAG_SCALE = 0.24;

/** 节拍相位（0..1，整环节共享同一 CYCLE 时钟） */
const PH = {
  pickGo: 0.55, // 机械臂开始下探取袋
  pick: 0.72, // 取袋：皮带袋消失、夹爪携带
  lift: 0.8, // 提起并转向仓储方向
  pre: 0.86, // 降到货架正面外侧（目标槽位正前方，不扫过货架层板）
  place: 0.92, // 水平推进目标槽位（放袋入槽）
} as const;

// 立体仓储槽位（仓储组局部坐标）：2 层 × 3 列（z），自下而上码放
const WH_LEVELS = [-0.5, 0.3];
const WH_COLS = [0, 0.55, -0.55];
const WH_SLOTS: [number, number, number][] = [];
WH_LEVELS.forEach((y) => WH_COLS.forEach((z) => WH_SLOTS.push([0, y, z])));
const WH_SLOT_N = WH_SLOTS.length; // 6：满托换托

/** 当前节拍信息（机械臂与货架共享，保证放垛/入槽严格同步） */
function beat(t: number) {
  const cycle = Math.floor(t / CYCLE);
  const cyc = (t % CYCLE) / CYCLE;
  const filled = cycle + (cyc >= PH.place ? 1 : 0); // 已入槽袋总数（0 起）
  const visible = filled === 0 ? 0 : ((filled - 1) % WH_SLOT_N) + 1; // 满托后重置为 1
  return { cycle, cyc, filled, visible, placeSlot: WH_SLOTS[cycle % WH_SLOT_N] };
}

// 盐袋小方块（纯白发光 + 红色标签条，呼应成品干盐）
function SaltBag({ scale = BAG_SCALE }: { scale?: number }) {
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
 *  基座在 (bx,by)，上臂长 L1、前臂长 L2；θ2 取肘朝上构型，避免前臂扫到地面。
 *  机械臂在「回转组」（绕 Y 轴）内求解：以回转组原点为基座、沿 +x 出臂。 */
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

/** 角度最短路径差（弧度，结果在 -π..π） */
function angleDiff(a: number, b: number): number {
  return ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}

/** 角度最短路径插值 */
function lerpAngle(a: number, b: number, t: number): number {
  return a + angleDiff(a, b) * t;
}

// ---------- 1. 进料输送（散盐颗粒流 → 提升管） ----------
function Conveyor() {
  const grainRefs = useRef<THREE.Mesh[]>([]);
  const beltRef = useRef<THREE.Mesh>(null);
  // 干盐颗粒流：连续铺满皮带，左端从接料漏斗落入、右端淡出进入提升管
  const grains = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        phase: i / 16,
        speed: 0.14 + (i % 3) * 0.012, // 微微错速，避免整齐划一
        z: (Math.random() - 0.5) * 0.34,
        bob: 0.01 + Math.random() * 0.012,
        bobSp: 5 + Math.random() * 4,
        spin: 1.2 + Math.random() * 1.2,
      })),
    []
  );
  const paused = useProcessPaused();
  useFrame((state) => {
    if (paused) return;
    const t = state.clock.elapsedTime;
    if (beltRef.current) {
      (beltRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.05 + Math.abs(Math.sin(t * 2.5)) * 0.06;
    }
    grainRefs.current.forEach((m, i) => {
      if (!m) return;
      const g = grains[i];
      const u = (t * g.speed + g.phase) % 1;
      // 纯局部坐标：皮带全长（组已平移到 X_CONV）
      const x = -1.05 + u * 2.1;
      m.position.set(x, -0.075 + Math.sin(t * g.bobSp + g.phase) * g.bob, g.z);
      m.rotation.y = t * g.spin;
      // 首尾淡出：左端落入、右端送入提升管，无硬截断
      const env = Math.min(1, u / 0.08, (1 - u) / 0.08);
      (m.material as THREE.MeshStandardMaterial).opacity = Math.max(0, env);
    });
  });
  return (
    <group position={[X_CONV, 0, 0]}>
      {/* 支腿 */}
      {[-0.9, 0.9].map((dx, i) => (
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
      {[-1.05, 0, 1.05].map((dx, i) => (
        <mesh key={i} position={[dx, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.7, 14]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} />
        </mesh>
      ))}
      {/* 接料漏斗（干盐来料管在此落上皮带左端） */}
      <mesh position={[-0.9, 0.2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.3, 0.5, 16, 1, true]} />
        <meshStandardMaterial
          color={metalColors.alloyLight}
          metalness={0.5}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* 干盐颗粒 */}
      {grains.map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) grainRefs.current[i] = el; }} scale={0.055}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={metalColors.salt}
            roughness={0.25}
            emissive={metalColors.brineLight}
            emissiveIntensity={0.2}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------- 2. 定量包装机（空袋成形 → 充填 → 封口 → 落袋） ----------
function Packer() {
  const bagRef = useRef<THREE.Group>(null);
  const sealRef = useRef<THREE.Mesh>(null);
  const fillRefs = useRef<THREE.Mesh[]>([]);
  const paused = useProcessPaused();
  useFrame((state) => {
    if (paused) return;
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
        const bagScale = 0.1 + form * 0.02 + fill * (BAG_SCALE - 0.12);
        // 袋顶始终贴在下料 spout 下方（spout 底约 0.89），充填时袋体向下长大，
        // 避免盐袋从成形阶段就吞进下料口；封口后再整体落到输出皮带左端。
        const restY = 0.86 - bagScale * (1.25 / 2); // SaltBag 高 1.25，中心在几何中心
        bag.position.set(
          drop * 0.1,
          THREE.MathUtils.lerp(restY, 0.02, drop) + settle,
          0
        );
        // scale 直接由本 group 控制（SaltBag 传 scale=1，避免双重缩放导致盐袋过小）
        bag.scale.setScalar(bagScale);
      }
    }
    // 充填盐流：料斗尖 → 袋内（仅充填相位可见，与袋充填同步，表达「定量灌装」）
    fillRefs.current.forEach((m, i) => {
      if (!m) return;
      const vis = cyc >= 0.1 && cyc < 0.42;
      m.visible = vis;
      if (vis) {
        const u = (t * 2.4 + i / fillRefs.current.length) % 1;
        m.position.set(
          Math.sin((t + i) * 13) * 0.1,
          1.02 - u * 0.24,
          Math.cos((t + i) * 17) * 0.06
        );
        m.scale.setScalar(0.05 * Math.sin(u * Math.PI) + 0.02);
      }
    });
    const seal = sealRef.current;
    if (seal) {
      // 充填末段（0.42–0.5）：封口夹下压、随袋顶一同落到皮带，完成封口。
      // 封口夹与盐袋共用同一落袋曲线，且袋顶贴住夹口下沿，不再与下料 spout 重叠。
      const s = THREE.MathUtils.smoothstep(cyc, 0.42, 0.5);
      seal.visible = s > 0.01 && cyc < 0.5;
      const sealDrop = THREE.MathUtils.smoothstep(cyc, 0.4, 0.5);
      const bagTop = BAG_SCALE * 0.625;
      const bagY = THREE.MathUtils.lerp(0.86 - bagTop, 0.02, sealDrop);
      seal.position.y = bagY + bagTop + 0.07;
    }
  });
  return (
    <group position={[X_PACKER, 0, 0]}>
      {/* 机架支腿：原模型机壳悬空，补足四角支撑 */}
      {[
        [-0.4, -0.3],
        [0.4, -0.3],
        [-0.4, 0.3],
        [0.4, 0.3],
      ].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, (GROUND + -0.3) / 2, dz]} castShadow>
          <boxGeometry args={[0.12, -0.3 - GROUND, 0.12]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.45} />
        </mesh>
      ))}
      {/* 机架底座（四脚落地并连接成框） */}
      <mesh position={[0, GROUND + 0.07, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.25, 0.14, 1.0]} />
        <meshStandardMaterial color={metalColors.alloyMid} metalness={0.4} roughness={0.6} />
      </mesh>

      {/* 机壳（真剖面：剖开看充填封口） */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.1, 1.5, 0.9]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.45} roughness={0.4} clippingPlanes={[PACK_CLIP]} />
      </mesh>
      {/* 料斗（顶部：正漏斗——宽口朝上接提升管，锥尖向下喂入袋口） */}
      <mesh position={[0, 1.4, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.45, 0.6, 20, 1, true]} />
        <meshStandardMaterial color={metalColors.alloyLight} metalness={0.5} side={THREE.DoubleSide} roughness={0.4} clippingPlanes={[PACK_CLIP]} />
      </mesh>
      {/* 下料 spout（料斗锥尖 → 袋口） */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.22, 12]} />
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
      {/* 充填盐流（灌装颗粒） */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) fillRefs.current[i] = el; }} visible={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={metalColors.salt}
            roughness={0.25}
            emissive={metalColors.brineLight}
            emissiveIntensity={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------- 3. 包装输出皮带（包装机 → 机械臂取袋点） ----------
function OutputBelt() {
  const bagRef = useRef<THREE.Group>(null);
  const beltRef = useRef<THREE.Mesh>(null);
  const paused = useProcessPaused();
  // 纯局部坐标：组已平移到 X_BELT；袋从皮带左端（包装机落袋点）运到取袋点
  const X0 = -0.9;
  const X_PICK = 0.4; // 取袋点（机械臂夹爪在此闭合）
  useFrame((state) => {
    if (paused) return;
    const t = state.clock.elapsedTime;
    const cyc = (t % CYCLE) / CYCLE;
    if (beltRef.current) {
      (beltRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.05 + Math.abs(Math.sin(t * 2.5)) * 0.06;
    }
    if (bagRef.current) {
      // 落袋后运输到取袋点；取袋瞬间消失（由机械臂 carry 携带，见 RobotArm）
      const vis = cyc >= 0.5 && cyc < PH.pick;
      bagRef.current.visible = vis;
      if (vis) {
        const u = THREE.MathUtils.clamp((cyc - 0.5) / (PH.pick - 0.5), 0, 1);
        bagRef.current.position.set(X0 + u * (X_PICK - X0), 0.02, 0);
      }
    }
  });
  return (
    <group position={[X_BELT, 0, 0]}>
      {/* 支腿：原输出皮带悬空，补足四角支撑 */}
      {[
        [-0.8, -0.22],
        [0.8, -0.22],
        [-0.8, 0.22],
        [0.8, 0.22],
      ].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, (GROUND + -0.15) / 2, dz]} castShadow>
          <boxGeometry args={[0.1, -0.15 - GROUND, 0.1]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.45} />
        </mesh>
      ))}
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
        <SaltBag scale={BAG_SCALE} />
      </group>
    </group>
  );
}

// ---------- 4. 码垛机械臂（取袋 → 提升转向 → 放垛；2-link IK + 基座回转，逐槽定位） ----------
function RobotArm() {
  const swingRef = useRef<THREE.Group>(null); // 绕 Y 轴回转（基座）
  const pivotRef = useRef<THREE.Group>(null); // 大臂
  const foreRef = useRef<THREE.Group>(null); // 小臂
  const carryRef = useRef<THREE.Group>(null); // 携带的盐袋
  const phiRef = useRef(0); // 上一帧回转角（待机相位平滑转向）
  // 连杆：上臂 L1 + 前臂 L2；基座（立柱顶）在 (X_ROBOT, PIVOT_Y)
  const L1 = 1.2;
  const L2 = 1.1;
  const PIVOT_Y = 0.9;
  const BAG_DROP = 0.35; // 袋中心在夹爪尖端下方
  const paused = useProcessPaused();

  useFrame((state, delta) => {
    if (paused) return;
    const { cyc, placeSlot } = beat(state.clock.elapsedTime);
    const [sx, sy, sz] = placeSlot; // 仓储局部槽位 → PackUnit 相对坐标需加 X_WH
    const tx = X_WH + sx;
    // —— 2-link 平面 IK（回转组局部：基座原点、沿 +x 出臂，ty 为相对基座高度） ——
    const pickD = Math.hypot(X_BELT + 0.4 - X_ROBOT, 0); // 取袋：皮带取袋点
    const pickTy = 0.02 + BAG_DROP - PIVOT_Y; // 袋贴皮带面
    const placeD = Math.hypot(tx - X_ROBOT, sz); // 放垛：目标槽位
    const placeTy = sy + BAG_DROP - PIVOT_Y;
    // 预就位：货架正面外侧（x = X_WH - 0.5），与目标槽位同高同列；
    // 先在此降到位，再水平推进槽位，避免直线下探扫穿货架层板
    const preD = Math.hypot(X_WH - 0.5 - X_ROBOT, sz);
    const preTy = placeTy;
    const home = solve2Link(0.12, 0.9, 0, 0, L1, L2); // 待机：近竖直向上
    const pick = solve2Link(pickD, pickTy, 0, 0, L1, L2);
    const lift = solve2Link(0.12, 1.5, 0, 0, L1, L2); // 提起避障（越过皮带/机身）
    const pre = solve2Link(preD, preTy, 0, 0, L1, L2);
    const place = solve2Link(placeD, placeTy, 0, 0, L1, L2);
    // 基座回转角：取袋朝皮带侧（-x），放垛朝目标槽位方向
    const phiPick = Math.atan2(0, X_BELT + 0.4 - X_ROBOT); // π
    const phiPlace = Math.atan2(sz, tx - X_ROBOT);

    let a1 = home[0];
    let a2 = home[1];
    let phi = phiPlace;
    if (cyc < PH.pickGo) {
      // 待机：缓缓转向本周期目标槽位方向，避免周期切换时回转角跳变
      phi = phiRef.current + angleDiff(phiRef.current, phiPlace) * Math.min(1, delta * 3);
    } else if (cyc < PH.pick) {
      const k = THREE.MathUtils.smoothstep(cyc, PH.pickGo, PH.pick);
      a1 = THREE.MathUtils.lerp(home[0], pick[0], k);
      a2 = THREE.MathUtils.lerp(home[1], pick[1], k);
      phi = lerpAngle(phiRef.current, phiPick, k);
    } else if (cyc < PH.lift) {
      // 取袋后先提起再回转（袋升离皮带，回转半径小、不扫到设备）
      const k = THREE.MathUtils.smoothstep(cyc, PH.pick, PH.lift);
      a1 = THREE.MathUtils.lerp(pick[0], lift[0], k);
      a2 = THREE.MathUtils.lerp(pick[1], lift[1], k);
      phi = lerpAngle(phiPick, phiPlace, k);
    } else if (cyc < PH.pre) {
      // 在货架正面外侧垂直降至目标高度
      const k = THREE.MathUtils.smoothstep(cyc, PH.lift, PH.pre);
      a1 = THREE.MathUtils.lerp(lift[0], pre[0], k);
      a2 = THREE.MathUtils.lerp(lift[1], pre[1], k);
      phi = phiPlace;
    } else if (cyc < PH.place) {
      // 水平推进槽位
      const k = THREE.MathUtils.smoothstep(cyc, PH.pre, PH.place);
      a1 = THREE.MathUtils.lerp(pre[0], place[0], k);
      a2 = THREE.MathUtils.lerp(pre[1], place[1], k);
      phi = phiPlace;
    } else {
      // 放垛后收回待机
      const k = THREE.MathUtils.smoothstep(cyc, PH.place, 1.0);
      a1 = THREE.MathUtils.lerp(place[0], home[0], k);
      a2 = THREE.MathUtils.lerp(place[1], home[1], k);
      phi = phiPlace;
    }
    phiRef.current = phi;
    if (swingRef.current) swingRef.current.rotation.y = phi;
    if (pivotRef.current) pivotRef.current.rotation.z = a1;
    if (foreRef.current) foreRef.current.rotation.z = a2;
    // 取袋 → 放垛前携带；放垛瞬间交给货架槽位（见 Warehouse 同步入槽）
    if (carryRef.current) carryRef.current.visible = cyc > PH.pick && cyc < PH.place;
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
      {/* 回转组（绕立柱顶 Y 轴，对准取袋/放垛方位） */}
      <group ref={swingRef} position={[0, PIVOT_Y, 0]}>
        {/* 大臂（绕立柱顶旋转） */}
        <group ref={pivotRef}>
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
            {/* 携带的盐袋（随夹爪移动，放垛瞬间消失并同步入槽） */}
            <group ref={carryRef} position={[L2, -BAG_DROP, 0]} visible={false}>
              <SaltBag scale={BAG_SCALE} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

// ---------- 5. 立体仓储（正面朝机械臂、逐槽累积，满托重置） ----------
function Warehouse() {
  const slotRefs = useRef<THREE.Mesh[]>([]);
  const paused = useProcessPaused();
  // 结构：窄 X、深 Z（列沿 Z 排），正面(-X 侧)朝向机械臂。
  // 填充自下而上、前排(z=0)优先，与机械臂放垛（逐槽精确定位）一致。
  useFrame((state) => {
    if (paused) return;
    const { visible } = beat(state.clock.elapsedTime);
    slotRefs.current.forEach((m, i) => {
      if (m) m.visible = i < visible;
    });
  });
  return (
    <group position={[X_WH, 0, 0]}>
      {/* 顶框：沿 Z 两侧的短横梁（正面敞开，机械臂水平推进槽位时不碰梁） */}
      {[-0.85, 0.85].map((z) => (
        <mesh key={z} position={[0, 0.55, z]}>
          <boxGeometry args={[0.7, 0.06, 0.08]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.5} />
        </mesh>
      ))}
      {/* 两层承重板（对应两层槽位，整宽支撑） */}
      {[0.13, -0.67].map((row) => (
        <mesh key={row} position={[0, row, 0]}>
          <boxGeometry args={[0.7, 0.06, 1.7]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.5} />
        </mesh>
      ))}
      {/* 立柱：沿 Z 两侧（从托盘连通至顶框，不悬空） */}
      {[-0.85, 0.85].map((z) => (
        <mesh key={z} position={[0, -0.83, z]}>
          <boxGeometry args={[0.08, 2.82, 0.08]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.5} />
        </mesh>
      ))}
      {/* 托盘底座（落地） */}
      <mesh position={[0, GROUND + 0.08, 0]} castShadow>
        <boxGeometry args={[0.7, 0.16, 1.7]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.6} />
      </mesh>
      {/* 逐槽累积的盐袋（机械臂放垛填入，前排 z=0 朝向机械臂；满托后整托重置） */}
      {WH_SLOTS.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) slotRefs.current[i] = el;
          }}
          position={p}
          visible={false}
          castShadow
        >
          <SaltBag scale={BAG_SCALE} />
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

      {/* 干盐提升管：进料皮带右端 → 料斗宽口（连续颗粒流，料斗起缓冲作用） */}
      <FlowTube
        points={[
          [X_CONV + 1.05, -0.05, 0.05],
          [X_CONV + 1.2, 0.85, 0.14],
          [X_PACKER - 0.12, 1.68, 0.04],
        ]}
        color={metalColors.salt}
        radius={0.06}
        particleCount={7}
        particleSize={0.1}
        speed={0.16}
      />

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
