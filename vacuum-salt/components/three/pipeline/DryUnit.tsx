"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { metalColors, Tag } from "../Tag";
import { useProcessPaused } from "@/lib/useProcessPaused";
import { FlowTube } from "./FlowTube";
import { STAGE_X } from "./layout";
import { PIPELINE_PORTS } from "@/lib/pipelinePorts";

/**
 * 环节 4：干燥与筛分（沸腾流化床 + 振动筛 + 旋风除尘器）
 *
 * ⚠ 坐标约定（与 Brine/Evaporate/Centrifuge 一致）：本文件内一律用「相对坐标」，
 * 最外层 <group position={[cx, 0, 0]}> 一次性平移到产线。绝不在内部再叠加 cx。
 *
 * 工艺叙事（自左向右）：
 *   湿盐 → 沸腾流化床（热风流态化干燥，水分以蒸汽逸出）→ 振动筛（粒度分级）→ 成品干盐
 *   鼓风机 + 加热器 提供洁净热风；旋风除尘器 回收尾气夹带的细盐。
 *
 * 颜色叙事：
 *   湿盐（盐白微蓝）→ 干盐（纯白，发光指示）；热风（琥珀）；蒸汽（浅灰上升）；细盐回收（青蓝）。
 */

const GROUND = -2.4;
// 容器完整渲染，不做剖切。
const X_BED = 0; // 沸腾流化床（中）
const X_FAN = -1.2; // 鼓风机 + 加热器（左下）
const X_SCREEN = 2.7; // 振动筛（右）
const X_CYCLONE = 0.3; // 旋风除尘器（顶部）

/** 湿盐进口（世界坐标，来自中心端口表） */
const DRY_INLET: [number, number, number] = PIPELINE_PORTS.dry.inlet.pos;
/** 湿盐进口（局部坐标；进料短管直接对齐中心端口表） */
const DRY_INLET_LOCAL: [number, number, number] = [
  DRY_INLET[0] - STAGE_X.dry,
  DRY_INLET[1],
  DRY_INLET[2],
];
/** 干盐出口（世界坐标，来自中心端口表；本文件内另有 DRY_OUTLET_LOCAL 供局部坐标使用） */
const DRY_OUTLET: [number, number, number] = PIPELINE_PORTS.dry.outlet.pos;

// 流化床几何
const BED_W = 2.8;
const BED_H = 2.0;
const BED_D = 1.6;
const BED_CY = 0.4;
const BED_TOP = BED_CY + BED_H / 2; // 1.4
const BED_BOT = BED_CY - BED_H / 2; // -0.6
const DIST_Y = -0.4; // 气体分布板高度

// ---------- 1. 鼓风机 + 加热器 ----------
function FanHeater() {
  const fanRef = useRef<THREE.Group>(null);
  const paused = useProcessPaused();
  useFrame((_, delta) => {
    if (paused) return;
    if (fanRef.current) fanRef.current.rotation.z += delta * 6;
  });
  return (
    <group position={[X_FAN, 0, 0]}>
      {/* 支腿 */}
      {[
        [-0.3, -0.3],
        [0.3, -0.3],
      ].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, (GROUND + -1.45) / 2, dz]} castShadow>
          <boxGeometry args={[0.1, -1.45 - GROUND, 0.1]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* 加热器外壳（琥珀发光，暗示加热） */}
      <mesh position={[0, -1.4, 0]} castShadow>
        <boxGeometry args={[0.8, 0.7, 0.7]} />
        <meshStandardMaterial
          color={metalColors.amber}
          metalness={0.4}
          roughness={0.5}
          emissive={metalColors.amber}
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* 风机蜗壳 */}
      <mesh position={[0, -0.75, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.5, 24]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 叶轮 */}
      <group ref={fanRef} position={[0, -0.75, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0, 0]} rotation={[0, 0, (i * Math.PI * 2) / 5]} castShadow>
            <boxGeometry args={[0.36, 0.1, 0.18]} />
            <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.35} />
          </mesh>
        ))}
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.5, 12]} />
          <meshStandardMaterial color={metalColors.alloyMid} metalness={0.6} />
        </mesh>
      </group>
      {/* 热风上升短管（接入分布板下方） */}
      <mesh position={[0.5, -0.1, 0]} rotation={[0, 0, -Math.PI / 2.4]}>
        <cylinderGeometry args={[0.18, 0.18, 1.1, 14]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.4} />
      </mesh>
    </group>
  );
}

// ---------- 2. 沸腾流化床 ----------
function FluidBed({ lang }: { lang: "zh" | "en" }) {
  const saltRefs = useRef<THREE.Mesh[]>([]);
  const airRefs = useRef<THREE.Mesh[]>([]);
  const steamRefs = useRef<THREE.Mesh[]>([]);
  const zh = lang === "zh";

  const salts = useMemo(
    () =>
      Array.from({ length: 26 }).map(() => ({
        x: (Math.random() - 0.5) * (BED_W - 0.4),
        z: (Math.random() - 0.5) * (BED_D - 0.4),
        baseY: DIST_Y + 0.12 + Math.random() * (BED_H - 0.8),
        amp: 0.12 + Math.random() * 0.22,
        speed: 1.2 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
      })),
    []
  );
  const airs = useMemo(
    () =>
      Array.from({ length: 12 }).map(() => ({
        x: (Math.random() - 0.5) * (BED_W - 0.6),
        z: (Math.random() - 0.5) * (BED_D - 0.6),
        speed: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      })),
    []
  );
  const steams = useMemo(
    () =>
      Array.from({ length: 10 }).map(() => ({
        x: (Math.random() - 0.5) * (BED_W - 0.8),
        z: (Math.random() - 0.5) * (BED_D - 0.8),
        speed: 0.4 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      })),
    []
  );
  const paused = useProcessPaused();

  useFrame((state) => {
    if (paused) return;
    const t = state.clock.elapsedTime;
    saltRefs.current.forEach((m, i) => {
      if (!m) return;
      const p = salts[i];
      const y = p.baseY + Math.sin(t * p.speed + p.phase) * p.amp;
      const jitter = Math.sin(t * p.speed * 1.7 + p.phase) * 0.04; // 流化态横向抖动
      m.position.set(p.x + jitter, y, p.z);
      m.rotation.x = t * 0.6 * p.speed;
      m.rotation.y = t * 0.4 * p.speed;
    });
    airRefs.current.forEach((m, i) => {
      if (!m) return;
      const a = airs[i];
      const u = (t * a.speed + a.phase) % 1;
      m.position.set(a.x, DIST_Y - 0.7 + u * (BED_TOP - DIST_Y + 0.7), a.z);
      m.scale.setScalar(0.05 * (1 - u * 0.5));
    });
    steamRefs.current.forEach((m, i) => {
      if (!m) return;
      const s = steams[i];
      const u = (t * s.speed + s.phase) % 1;
      m.position.set(s.x, BED_TOP + u * 1.1, s.z); // 水分以蒸汽逸出
      m.scale.setScalar(0.07 * (0.4 + u));
      (m.material as THREE.MeshStandardMaterial).opacity = 0.38 * (1 - u);
    });
  });

  return (
    <group position={[X_BED, 0, 0]}>
      {/* 支腿 */}
      {[
        [-BED_W / 2 + 0.2, -BED_D / 2 + 0.2],
        [BED_W / 2 - 0.2, -BED_D / 2 + 0.2],
        [-BED_W / 2 + 0.2, BED_D / 2 - 0.2],
        [BED_W / 2 - 0.2, BED_D / 2 - 0.2],
      ].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, (BED_BOT + GROUND) / 2, dz]} castShadow>
          <boxGeometry args={[0.12, BED_BOT - GROUND, 0.12]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* 外罩（半透，便于看到内部流化） */}
      <mesh position={[0, BED_CY, 0]} castShadow>
        <boxGeometry args={[BED_W, BED_H, BED_D]} />
        <meshStandardMaterial
          color={metalColors.alloy}
          metalness={0.45}
          roughness={0.35}
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          depthWrite={false}
                 />
      </mesh>
      {/* 气体分布板 */}
      <mesh position={[0, DIST_Y, 0]}>
        <boxGeometry args={[BED_W - 0.2, 0.06, BED_D - 0.2]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.5} />
      </mesh>
      {/* 热风室（分布板下方 amber 发光，直观表达加热区：底部热 → 顶部凉） */}
      <mesh position={[0, DIST_Y - 0.38, 0]}>
        <boxGeometry args={[BED_W - 0.2, 0.5, BED_D - 0.2]} />
        <meshStandardMaterial
          color={metalColors.amber}
          emissive={metalColors.amber}
          emissiveIntensity={0.4}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>
      {/* 湿盐进料口（左下壁，接外部管道，位于分布板上方；坐标来自中心端口表） */}
      <mesh position={DRY_INLET_LOCAL}>
        <cylinderGeometry args={[0.16, 0.16, 0.6, 14]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.35} />
      </mesh>

      {/* 流化盐颗粒 */}
      {salts.map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) saltRefs.current[i] = el; }} scale={0.06}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={metalColors.salt}
            roughness={0.25}
            emissive={metalColors.brineLight}
            emissiveIntensity={0.12}
          />
        </mesh>
      ))}
      {/* 热风（琥珀，自下而上穿过分布板） */}
      {airs.map((_, i) => (
        <mesh key={i} scale={0.001} ref={(el) => { if (el) airRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial
            color={metalColors.amber}
            emissive={metalColors.amber}
            emissiveIntensity={0.45}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
      {/* 蒸汽（水分逸出，浅灰上升） */}
      {steams.map((_, i) => (
        <mesh key={i} scale={0.001} ref={(el) => { if (el) steamRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color={metalColors.steam} transparent opacity={0.35} />
        </mesh>
      ))}

      {false && zh}
    </group>
  );
}

// ---------- 3. 振动筛（多层分级：粗/中/细） ----------
const SCREEN_W = 2.4;
const SCREEN_D = 1.3;
const SCREEN_SY = -0.1; // 筛体组 y（相对单元原点）
const DECK_Y = [0.0, -0.26, -0.52]; // 上(粗)/中(中)/下(细) 三层筛面
const FEED_X = -SCREEN_W / 2;
const DISCH_X = SCREEN_W / 2;

// 细盐分级出料点（DryUnit 局部坐标；世界 x = STAGE_X.dry + 3.9）
const SCREEN_FINE_OUT: [number, number, number] = [
  X_SCREEN + DISCH_X,
  SCREEN_SY + DECK_Y[2],
  0,
];
// 干盐出口（DryUnit 局部坐标）。注意：本文件所有几何都在
// <group position={[STAGE_X.dry, 0, 0]}> 内部，绝不能再叠 STAGE_X.dry，
// 否则会出现「出口管跑到 x=27、与跨环节管道断开」的历史 bug。
const DRY_OUTLET_LOCAL: [number, number, number] = [
  DRY_OUTLET[0] - STAGE_X.dry,
  DRY_OUTLET[1],
  DRY_OUTLET[2],
];

function VibratingScreen() {
  const screenRef = useRef<THREE.Group>(null);
  const grainRefs = useRef<THREE.Mesh[]>([]);
  const GRADE = DECK_Y.length;
  const grains = useMemo(
    () =>
      Array.from({ length: 27 }).map((_, i) => {
        const grade = i % GRADE; // 0粗 1中 2细
        return {
          grade,
          z: (Math.random() - 0.5) * (SCREEN_D - 0.3),
          phase: Math.random(),
          speed: 0.16 + Math.random() * 0.08,
          bob: 0.02 + Math.random() * 0.025,
          bobSp: 7 + Math.random() * 4,
          spin: 0.6 + Math.random() * 0.9,
        };
      }),
    [GRADE]
  );
  const paused = useProcessPaused();
  useFrame((state) => {
    if (paused) return;
    const t = state.clock.elapsedTime;
    // 整体低频振动（驱动颗粒输送）
    if (screenRef.current) {
      screenRef.current.position.x = X_SCREEN + Math.sin(t * 11) * 0.04;
    }
    grains.forEach((g, i) => {
      const m = grainRefs.current[i];
      if (!m) return;
      const p = (t * g.speed + g.phase) % 1; // 0..1 沿筛面输送
      const x = FEED_X + p * SCREEN_W;
      // 入料端先落到对应筛层：前 18% 由顶层沉降到所属层（表达"过筛分级"）
      let y = DECK_Y[g.grade];
      if (p < 0.18) y = THREE.MathUtils.lerp(DECK_Y[0], DECK_Y[g.grade], p / 0.18);
      y += Math.sin(t * g.bobSp + g.phase) * g.bob; // 振动上下抖
      m.position.set(x, y, g.z);
      m.rotation.y = t * g.spin;
      m.rotation.x = Math.sin(t * g.bobSp) * 0.4;
    });
  });
  return (
    <group ref={screenRef} position={[X_SCREEN, SCREEN_SY, 0]}>
      {/* 支撑侧框 */}
      {[-SCREEN_W / 2, SCREEN_W / 2].map((dx, i) => (
        <mesh
          key={i}
          position={[dx, (SCREEN_SY + DECK_Y[0] + GROUND) / 2 - 0.1, 0]}
          castShadow
        >
          <boxGeometry args={[0.1, DECK_Y[0] - GROUND + 0.5, SCREEN_D + 0.3]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* 三层筛面：半透板 + 网格(筛网观感) */}
      {DECK_Y.map((dy, d) => (
        <group key={d} position={[0, dy, 0]}>
          <mesh castShadow>
            <boxGeometry args={[SCREEN_W, 0.05, SCREEN_D]} />
            <meshStandardMaterial
              color={metalColors.alloy}
              metalness={0.4}
              roughness={0.5}
              transparent
              opacity={0.26}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <gridHelper
            args={[SCREEN_W, 16, metalColors.alloyLight, metalColors.alloyMid]}
            position={[0, 0.035, 0]}
          />
        </group>
      ))}
      {/* 入料溜槽（接流化床来料） */}
      <mesh position={[FEED_X - 0.1, DECK_Y[0] + 0.32, 0]} rotation={[0, 0, -0.5]} castShadow>
        <boxGeometry args={[0.5, 0.18, SCREEN_D - 0.3]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.4} />
      </mesh>
      {/* 颗粒（按粒度分三层输送） */}
      {grains.map((g, i) => (
        <mesh key={i} ref={(el) => { if (el) grainRefs.current[i] = el; }} scale={0.05}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={metalColors.salt}
            roughness={0.3}
            emissive={metalColors.brineLight}
            emissiveIntensity={0.12}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------- 4. 旋风除尘器（回收尾气细盐） ----------
function Cyclone({ lang }: { lang: "zh" | "en" }) {
  const swirlRefs = useRef<THREE.Mesh[]>([]);
  const zh = lang === "zh";
  const cyTop = 2.6;
  const cyCylBot = 1.7;
  const cyConeBot = 1.3;
  const R = 0.42;
  const swirls = useMemo(
    () =>
      Array.from({ length: 12 }).map(() => ({
        a0: Math.random() * Math.PI * 2,
        phase: Math.random(),
        speed: 0.6 + Math.random() * 0.4,
        turns: 2.5 + Math.random() * 1.5,
      })),
    []
  );
  const paused = useProcessPaused();
  useFrame((state) => {
    if (paused) return;
    const t = state.clock.elapsedTime;
    swirlRefs.current.forEach((m, i) => {
      if (!m) return;
      const s = swirls[i];
      const u = (t * s.speed + s.phase) % 1;
      const y = cyTop - 0.2 - u * (cyTop - 0.2 - cyConeBot + 0.2);
      const r = R * (0.7 - u * 0.5);
      const a = s.a0 + u * s.turns * Math.PI * 2;
      m.position.set(X_CYCLONE + Math.cos(a) * r, y, Math.sin(a) * r);
      m.scale.setScalar(0.06 * (1 - u * 0.3));
      (m.material as THREE.MeshStandardMaterial).opacity = 0.7 * (1 - u * 0.4);
    });
  });
  return (
    <group>
      {/* 支管架 */}
      <mesh position={[X_CYCLONE, (cyConeBot + GROUND) / 2, 0]} castShadow>
        <boxGeometry args={[0.1, cyConeBot - GROUND, 0.1]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* 圆柱段 */}
      <mesh position={[X_CYCLONE, (cyTop + cyCylBot) / 2, 0]} castShadow>
        <cylinderGeometry args={[R, R, cyTop - cyCylBot, 26, 1, true]} />
        <meshStandardMaterial
          color={metalColors.alloy}
          metalness={0.5}
          roughness={0.35}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* 锥段 */}
      <mesh position={[X_CYCLONE, (cyCylBot + cyConeBot) / 2, 0]} castShadow>
        <cylinderGeometry args={[R, 0.12, cyCylBot - cyConeBot, 26, 1, true]} />
        <meshStandardMaterial
          color={metalColors.alloyLight}
          metalness={0.45}
          roughness={0.4}
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* 进气口（接尾气导管） */}
      <mesh position={[X_CYCLONE, cyTop - 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.6, 12]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.55} roughness={0.4} />
      </mesh>
      {/* 排尘口（回收细盐，接回收管） */}
      <mesh position={[X_CYCLONE, cyConeBot - 0.1, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 14]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* 旋流细盐颗粒 */}
      {swirls.map((_, i) => (
        <mesh key={i} scale={0.001} ref={(el) => { if (el) swirlRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial
            color={metalColors.brine}
            transparent
            roughness={0.3}
            emissive={metalColors.brineLight}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
      {false && zh}
    </group>
  );
}

// ---------- 环节装配 ----------
export function DryUnit({
  onSelect,
  focused = false,
  lang = "zh",
}: {
  onSelect?: () => void;
  /** 相机已对准本环节时，显示极简说明浮标 */
  focused?: boolean;
  lang?: "zh" | "en";
}) {
  const cx = STAGE_X.dry;
  const zh = lang === "zh";

  return (
    <group
      position={[cx, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      <FanHeater />
      <FluidBed lang={lang} />
      <VibratingScreen />
      <Cyclone lang={lang} />

      {/* 流化床 → 振动筛（湿盐干燥后输送至筛分） */}
      <FlowTube
        points={[
          [X_BED + BED_W / 2, 0.1, 0],
          [X_SCREEN - SCREEN_W / 2, 0.1, 0],
        ]}
        color={metalColors.salt}
        radius={0.08}
        particleCount={5}
        particleSize={0.1}
        speed={0.22}
      />

      {/* 尾气导管：流化床顶 → 旋风除尘器 */}
      <FlowTube
        points={[
          [X_BED + 0.2, BED_TOP, 0],
          [X_BED + 0.2, 2.4, 0],
          [X_CYCLONE, 2.4, 0],
          [X_CYCLONE, 2.5, 0],
        ]}
        color={metalColors.steam}
        radius={0.07}
        particleCount={4}
        particleSize={0.09}
        speed={0.16}
      />

      {/* 旋风回收细盐 → 落回筛分出料侧 */}
      <FlowTube
        points={[
          [X_CYCLONE, 1.15, 0],
          [X_CYCLONE + 0.4, 0.2, 0],
          [X_SCREEN + 0.6, -0.2, 0],
        ]}
        color={metalColors.brine}
        radius={0.05}
        particleCount={3}
        particleSize={0.07}
        speed={0.16}
      />

      {/* 粗/中 分级出料收集（筛体右端下方） */}
      {[0, 1].map((d) => (
        <group
          key={d}
          position={[
            X_SCREEN + DISCH_X + 0.5,
            SCREEN_SY + DECK_Y[d] - 0.35,
            d === 0 ? -0.42 : 0.42,
          ]}
        >
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.5} />
          </mesh>
          {[
            [-0.1, -0.1],
            [0.1, -0.1],
            [0, 0.05],
          ].map((p, k) => (
            <mesh key={k} position={[p[0], 0.32, p[1]]} scale={0.12} castShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                color={metalColors.salt}
                roughness={0.3}
                emissive={metalColors.brineLight}
                emissiveIntensity={0.1}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* 细盐（合格品）→ 干盐出口（去包装）：筛分右端 → 环节出口，全部使用局部坐标 */}
      <FlowTube
        points={[
          SCREEN_FINE_OUT,
          [DRY_OUTLET_LOCAL[0], DRY_OUTLET_LOCAL[1] - 0.2, 0],
          DRY_OUTLET_LOCAL,
        ]}
        color={metalColors.salt}
        radius={0.07}
        particleCount={5}
        particleSize={0.09}
        speed={0.2}
      />

      {/* 对准本环节时才出现的极简说明（避免全景时文字堆叠） */}
      {focused && (
        <>
          <Tag
            position={[X_FAN, -0.1, 0]}
            label={zh ? "鼓风机 + 加热器" : "Blower & heater"}
            value={zh ? "洁净热风" : "clean hot air"}
            color={metalColors.amber}
          />
          <Tag
            position={[X_BED, BED_TOP + 0.9, 0]}
            label={zh ? "沸腾流化床" : "Fluidized bed"}
            value={zh ? "流态化干燥 · 进风 140℃ · 含水率<0.3%" : "fluidized · inlet 140℃ · moisture <0.3%"}
            color={metalColors.salt}
          />
          <Tag
            position={[X_SCREEN, 0.9, 0]}
            label={zh ? "振动筛" : "Vibrating screen"}
            value={zh ? "粗/中/细分级" : "coarse/medium/fine"}
            color={metalColors.alloy}
          />
          <Tag
            position={[X_CYCLONE, 3.1, 0]}
            label={zh ? "旋风除尘器" : "Cyclone"}
            value={zh ? "回收尾气细盐" : "recovers fine salt"}
            color={metalColors.brine}
          />
        </>
      )}
    </group>
  );
}
