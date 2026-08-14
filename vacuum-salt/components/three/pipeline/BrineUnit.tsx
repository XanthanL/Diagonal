"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { metalColors, Tag } from "../Tag";
import { useProcessPaused } from "@/lib/useProcessPaused";
import { FlowTube } from "./FlowTube";
import { STAGE_X } from "./layout";

/**
 * 环节 1：井卤开采与净化
 *
 * ⚠ 坐标约定（必须遵守）：
 * 本文件内所有几何/曲线一律使用「相对坐标」，统一由最外层
 * <group position={[cx, 0, 0]}> 平移到产线位置。切勿在内部再叠加 cx，
 * 否则整组模型会偏离产线（历史 bug：汲卤管与卤水粒子被叠加两次 cx，
 * 跑到 x = 2cx 处，完全脱离平台）。
 *
 * 工艺叙事（自左向右）：
 *   注水溶采 / 深井汲卤 → 净化反应槽（石灰乳 + 纯碱） → 道尔澄清槽 → 砂滤器 → 精卤
 * 颜色叙事：
 *   黄褐（原卤浑浊）→ 灰白絮凝物 → 钙镁泥沉降 / 上清液 → 青蓝（精卤）
 */

// ---------- 基准与分区（相对坐标） ----------
const GROUND = -2.4; // 设备底面（略高于平台面 -2.52）
const SURFACE_Y = 2.0; // 地质剖面块顶面 = 地表标高

const X_WELL = -4.3; // 地质剖面 + 深井
const X_REACTOR = -1.0; // 净化反应槽
const X_CLARIFIER = 2.4; // 道尔澄清槽
const X_FILTER = 5.0; // 砂滤 / 叶滤器

// 工艺色（在 metalColors 基础上补充「浑浊 / 泥」两档，用于表达净化前后的差异）
const C = {
  raw: metalColors.amber, // 原卤（黄卤）
  turbid: "#c2a877", // 加药后浑浊卤水
  floc: "#f1ede3", // 絮凝物 / 药剂粉体
  mud: "#a68f68", // 钙镁泥
  clear: metalColors.brineLight, // 上清液
  pure: metalColors.brine, // 精卤
  water: "#cfe4f2", // 注入淡水
};

// ---------- 1A. 地质剖面 + 深井（注水溶采） ----------
const STRATA: { color: string; h: number; salt?: boolean }[] = [
  { color: "#d7d1c4", h: 0.5 }, // 覆盖层
  { color: "#e2d5b6", h: 0.9 }, // 砂岩
  { color: "#cac6be", h: 1.0 }, // 泥岩
  { color: "#dde4eb", h: 1.0 }, // 嘉陵江组灰岩
  { color: "#f2f7fb", h: 1.0, salt: true }, // 岩盐层
];
const BLOCK_W = 2.9;
const BLOCK_D = 1.15; // 剖面块只保留后半，剖切面落在 z = 0，正对相机

const Y_WELLHEAD = SURFACE_Y + 0.18; // 井口标高（粒子终点）
const Y_CAVERN = -1.78; // 溶腔标高（粒子起点）
const X_INJ = -0.6; // 注水井
const X_PROD = 0.6; // 采卤井

function WellSection() {
  const upRefs = useRef<THREE.Mesh[]>([]);
  const downRefs = useRef<THREE.Mesh[]>([]);
  const cavernRef = useRef<THREE.Mesh>(null);

  // 地层自上而下堆叠
  const layers = useMemo(() => {
    let top = SURFACE_Y;
    return STRATA.map((s) => {
      const y = top - s.h / 2;
      const bottom = top - s.h;
      top = bottom;
      return { ...s, y, bottom };
    });
  }, []);

  const grains = useMemo(
    () =>
      Array.from({ length: 10 }).map(() => ({
        x: (Math.random() - 0.5) * 2.4,
        y: -2.28 + Math.random() * 0.78,
        s: 0.05 + Math.random() * 0.05,
        r: Math.random() * Math.PI,
      })),
    []
  );

  const UP = 9;
  const DOWN = 6;
  const paused = useProcessPaused();

  useFrame((state) => {
    if (paused) return;
    const t = state.clock.elapsedTime;
    // 卤水上升（黄褐）：溶腔 → 井口
    upRefs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.15 + i / UP) % 1;
      m.position.y = Y_CAVERN + u * (Y_WELLHEAD - Y_CAVERN);
      const env = Math.sin(u * Math.PI);
      m.scale.setScalar(Math.max(0.001, 0.075 + env * 0.03));
      (m.material as THREE.MeshStandardMaterial).opacity = Math.min(1, env * 2.2);
    });
    // 淡水注入（浅蓝）：井口 → 溶腔
    downRefs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.13 + i / DOWN) % 1;
      m.position.y = Y_WELLHEAD - u * (Y_WELLHEAD - Y_CAVERN);
      const env = Math.sin(u * Math.PI);
      m.scale.setScalar(Math.max(0.001, 0.055 + env * 0.02));
      (m.material as THREE.MeshStandardMaterial).opacity = Math.min(1, env * 2.2);
    });
    // 溶腔缓慢“呼吸”，暗示岩盐持续溶蚀扩大
    if (cavernRef.current) {
      const k = 1 + Math.sin(t * 0.5) * 0.025;
      cavernRef.current.scale.set(0.95 * k, 0.34 * k, 0.32);
    }
  });

  return (
    <group position={[X_WELL, 0, 0]}>
      {/* 剖面块底座 */}
      <mesh position={[0, GROUND - 0.07, -BLOCK_D / 2]} receiveShadow>
        <boxGeometry args={[BLOCK_W + 0.18, 0.14, BLOCK_D + 0.18]} />
        <meshStandardMaterial color={metalColors.alloyMid} roughness={0.9} />
      </mesh>

      {/* 地层（剖切面朝相机：块体只占 z ∈ [-BLOCK_D, 0]） */}
      {layers.map((l, i) => (
        <group key={i}>
          <mesh position={[0, l.y, -BLOCK_D / 2]} castShadow receiveShadow>
            <boxGeometry args={[BLOCK_W, l.h, BLOCK_D]} />
            <meshStandardMaterial
              color={l.color}
              roughness={l.salt ? 0.35 : 0.95}
              metalness={0}
              emissive={l.salt ? metalColors.brineLight : "#000000"}
              emissiveIntensity={l.salt ? 0.22 : 0}
            />
          </mesh>
          {/* 层界线 */}
          <mesh position={[0, l.bottom, -BLOCK_D / 2]}>
            <boxGeometry args={[BLOCK_W + 0.02, 0.025, BLOCK_D + 0.02]} />
            <meshStandardMaterial color="#a9b3bd" roughness={0.8} transparent opacity={0.55} />
          </mesh>
          {/* 左侧深度刻度 */}
          <mesh position={[-BLOCK_W / 2 - 0.16, l.bottom, 0]}>
            <boxGeometry args={[0.26, 0.02, 0.02]} />
            <meshStandardMaterial color={metalColors.alloyDark} roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* 深度标尺立杆 */}
      <mesh position={[-BLOCK_W / 2 - 0.28, (SURFACE_Y + GROUND) / 2, 0]}>
        <boxGeometry args={[0.02, SURFACE_Y - GROUND, 0.02]} />
        <meshStandardMaterial color={metalColors.alloyDark} roughness={0.7} />
      </mesh>

      {/* 岩盐晶粒（嵌在剖切面上） */}
      {grains.map((g, i) => (
        <mesh key={i} position={[g.x, g.y, 0]} rotation={[g.r, g.r * 0.7, g.r * 0.3]} scale={g.s}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={metalColors.salt}
            roughness={0.2}
            emissive={metalColors.brineLight}
            emissiveIntensity={0.25}
          />
        </mesh>
      ))}

      {/* 水溶溶腔（岩盐层内的卤水空腔） */}
      <mesh ref={cavernRef} position={[0, Y_CAVERN - 0.06, 0]} scale={[0.95, 0.34, 0.32]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial
          color={C.raw}
          transparent
          opacity={0.5}
          roughness={0.15}
          emissive={C.raw}
          emissiveIntensity={0.18}
        />
      </mesh>

      {/* 井筒（半剖：后半壳，开口朝相机，可见内部流体） */}
      {[
        { x: X_INJ, r: 0.13 },
        { x: X_PROD, r: 0.17 },
      ].map((w, i) => (
        <mesh key={i} position={[w.x, (Y_WELLHEAD + Y_CAVERN) / 2, 0]}>
          <cylinderGeometry
            args={[w.r, w.r, Y_WELLHEAD - Y_CAVERN, 16, 1, true, Math.PI / 2, Math.PI]}
          />
          <meshStandardMaterial
            color={metalColors.alloyDark}
            metalness={0.6}
            roughness={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* 上升卤水粒子（黄褐） */}
      {Array.from({ length: UP }).map((_, i) => (
        <mesh key={i} position={[X_PROD, 0, -0.04]} ref={(el) => { if (el) upRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial
            color={C.raw}
            emissive={C.raw}
            emissiveIntensity={0.45}
            transparent
            roughness={0.3}
          />
        </mesh>
      ))}
      {/* 下行注水粒子（浅蓝） */}
      {Array.from({ length: DOWN }).map((_, i) => (
        <mesh key={i} position={[X_INJ, 0, -0.04]} ref={(el) => { if (el) downRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial
            color={C.water}
            emissive={C.water}
            emissiveIntensity={0.4}
            transparent
            roughness={0.25}
          />
        </mesh>
      ))}

      {/* 采卤井口装置（采卤树） */}
      <group position={[X_PROD, 0, 0]}>
        <mesh position={[0, SURFACE_Y + 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.3, 0.6, 18]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.65} roughness={0.35} />
        </mesh>
        <mesh position={[0, SURFACE_Y + 0.68, 0]}>
          <boxGeometry args={[0.46, 0.16, 0.46]} />
          <meshStandardMaterial color={metalColors.alloy} metalness={0.55} roughness={0.4} />
        </mesh>
        <mesh position={[0.3, SURFACE_Y + 0.52, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.52, 12]} />
          <meshStandardMaterial color={metalColors.alloy} metalness={0.55} roughness={0.4} />
        </mesh>
        <mesh position={[0, SURFACE_Y + 0.68, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.13, 0.028, 8, 20]} />
          <meshStandardMaterial color={metalColors.amber} metalness={0.5} roughness={0.45} />
        </mesh>
      </group>

      {/* 注水井口 */}
      <group position={[X_INJ, 0, 0]}>
        <mesh position={[0, SURFACE_Y + 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.21, 0.4, 16]} />
          <meshStandardMaterial color={metalColors.alloy} metalness={0.55} roughness={0.4} />
        </mesh>
        <mesh position={[-0.22, SURFACE_Y + 0.34, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.36, 12]} />
          <meshStandardMaterial color={metalColors.alloy} metalness={0.55} roughness={0.4} />
        </mesh>
      </group>

      {/* 注入淡水来水管 */}
      <FlowTube
        points={[
          [-2.0, SURFACE_Y + 0.95, 0],
          [-1.35, SURFACE_Y + 0.9, 0],
          [-0.85, SURFACE_Y + 0.6, 0],
          [X_INJ - 0.36, SURFACE_Y + 0.34, 0],
        ]}
        color={C.water}
        radius={0.055}
        particleCount={4}
        particleSize={0.075}
        speed={0.22}
      />
    </group>
  );
}

// ---------- 1B. 净化反应槽（石灰—纯碱法） ----------
const TANK_R = 1.15;
const LIQ_TOP = 0.62;
const LIQ_BOT = -1.02;

function Reactor() {
  const stirRef = useRef<THREE.Group>(null);
  const flocRefs = useRef<THREE.Mesh[]>([]);
  const doseRefs = useRef<THREE.Mesh[]>([]);

  const flocs = useMemo(
    () =>
      Array.from({ length: 18 }).map(() => ({
        r: 0.22 + Math.random() * 0.78,
        a: Math.random() * Math.PI * 2,
        speed: 0.16 + Math.random() * 0.14,
        phase: Math.random(),
        s: 0.05 + Math.random() * 0.05,
      })),
    []
  );
  const doses = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        side: i % 2 === 0 ? -1 : 1,
        phase: Math.random(),
        speed: 0.5 + Math.random() * 0.35,
      })),
    []
  );
  const paused = useProcessPaused();

  useFrame((state, delta) => {
    if (paused) return;
    const t = state.clock.elapsedTime;
    if (stirRef.current) stirRef.current.rotation.y += delta * 1.25;

    // 絮体：随桨叶旋转、逐渐长大并下沉
    flocRefs.current.forEach((m, i) => {
      if (!m) return;
      const f = flocs[i];
      const u = (t * f.speed + f.phase) % 1;
      const a = f.a + t * 1.05 * (1 - u * 0.45);
      const r = f.r * (1 - u * 0.3);
      m.position.set(Math.cos(a) * r, LIQ_TOP - u * (LIQ_TOP - LIQ_BOT), Math.sin(a) * r);
      m.rotation.set(a, a * 0.6, 0);
      m.scale.setScalar(f.s * (0.45 + u * 1.0));
      (m.material as THREE.MeshStandardMaterial).opacity = Math.min(1, Math.sin(u * Math.PI) * 2.4);
    });

    // 加药粉体：自漏斗落入液面
    doseRefs.current.forEach((m, i) => {
      if (!m) return;
      const d = doses[i];
      const u = (t * d.speed + d.phase) % 1;
      m.position.set(d.side * 0.78, 1.88 - u * (1.88 - LIQ_TOP), 0);
      m.scale.setScalar(0.05);
      (m.material as THREE.MeshStandardMaterial).opacity = 1 - u * 0.55;
    });
  });

  return (
    <group position={[X_REACTOR, 0, 0]}>
      {/* 支座裙座 */}
      <mesh position={[0, (GROUND + LIQ_BOT - 0.2) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.72, 0.82, LIQ_BOT - 0.2 - GROUND, 20]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.45} roughness={0.55} />
      </mesh>
      <mesh position={[0, GROUND + 0.05, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 0.1, 24]} />
        <meshStandardMaterial color={metalColors.alloyMid} roughness={0.9} />
      </mesh>

      {/* 槽体（半剖，开口朝相机） */}
      <mesh castShadow>
        <cylinderGeometry args={[TANK_R, TANK_R, 2.5, 36, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial
          color={metalColors.alloy}
          metalness={0.45}
          roughness={0.3}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* 槽底 */}
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[TANK_R, TANK_R * 0.92, 0.14, 36]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 顶部法兰环 */}
      <mesh position={[0, 1.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[TANK_R, 0.05, 10, 44]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 槽内浑浊卤水 */}
      <mesh position={[0, (LIQ_TOP + LIQ_BOT) / 2, 0]}>
        <cylinderGeometry args={[TANK_R - 0.06, TANK_R - 0.06, LIQ_TOP - LIQ_BOT, 36]} />
        <meshStandardMaterial color={C.turbid} transparent opacity={0.6} roughness={0.15} />
      </mesh>

      {/* 絮凝物（Mg(OH)₂ / CaCO₃） */}
      {flocs.map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) flocRefs.current[i] = el; }}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={C.floc} roughness={0.85} transparent opacity={0.9} />
        </mesh>
      ))}

      {/* 搅拌器（旋转） */}
      <group ref={stirRef}>
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 3.0, 10]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.65} roughness={0.3} />
        </mesh>
        {[-0.55, 0.1].map((y, li) => (
          <group key={li} position={[0, y, 0]}>
            <mesh>
              <cylinderGeometry args={[0.11, 0.11, 0.16, 12]} />
              <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} />
            </mesh>
            {[0, 1, 2].map((b) => (
              <mesh key={b} rotation={[0, (b / 3) * Math.PI * 2, 0.22]} position={[0, 0, 0]}>
                <boxGeometry args={[0.88, 0.03, 0.2]} />
                <meshStandardMaterial color={metalColors.alloy} metalness={0.55} roughness={0.35} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      {/* 减速机（不旋转） */}
      <mesh position={[0, 2.32, 0]} castShadow>
        <boxGeometry args={[0.46, 0.36, 0.46]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.45} />
      </mesh>
      <mesh position={[0, 2.05, 0]}>
        <cylinderGeometry args={[0.2, 0.26, 0.2, 16]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 电机支撑梁 */}
      <mesh position={[0, 1.94, 0]}>
        <boxGeometry args={[2.3, 0.08, 0.16]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.45} />
      </mesh>

      {/* 加药漏斗：左 = 石灰乳 Ca(OH)₂，右 = 纯碱 Na₂CO₃ */}
      {[
        { x: -0.78, color: "#efe7d6" },
        { x: 0.78, color: "#e4edf6" },
      ].map((h, i) => (
        <group key={i} position={[h.x, 0, 0]}>
          <mesh position={[0, 2.52, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.09, 0.5, 16]} />
            <meshStandardMaterial color={h.color} roughness={0.6} metalness={0.15} />
          </mesh>
          <mesh position={[0, 2.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.3, 0.035, 8, 24]} />
            <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.4} />
          </mesh>
          <mesh position={[0, 2.1, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.45, 10]} />
            <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} />
          </mesh>
        </group>
      ))}
      {/* 药剂粉体下落 */}
      {doses.map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) doseRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color={C.floc} roughness={0.9} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ---------- 1C. 道尔澄清槽 ----------
const CL_R = 1.5;
const CL_TOP = -0.08; // 池沿
const CL_WALL_BOT = -1.05; // 直筒段底
const CL_CONE_BOT = -1.98; // 锥斗底

function Clarifier() {
  const rakeRef = useRef<THREE.Group>(null);
  const mudRefs = useRef<THREE.Mesh[]>([]);
  const overflowRefs = useRef<THREE.Mesh[]>([]);

  const muds = useMemo(
    () =>
      Array.from({ length: 16 }).map(() => ({
        r: 0.42 + Math.random() * 0.92,
        a: Math.random() * Math.PI * 2,
        speed: 0.1 + Math.random() * 0.1,
        phase: Math.random(),
        s: 0.045 + Math.random() * 0.04,
      })),
    []
  );
  const paused = useProcessPaused();

  useFrame((state, delta) => {
    if (paused) return;
    const t = state.clock.elapsedTime;
    if (rakeRef.current) rakeRef.current.rotation.y += delta * 0.28;

    // 钙镁泥重力沉降：自进料筒外缘缓慢下沉至泥层
    mudRefs.current.forEach((m, i) => {
      if (!m) return;
      const d = muds[i];
      const u = (t * d.speed + d.phase) % 1;
      const a = d.a + t * 0.12;
      const r = d.r * (1 - u * 0.35);
      m.position.set(Math.cos(a) * r, CL_TOP - 0.18 - u * 1.05, Math.sin(a) * r);
      m.scale.setScalar(d.s * (0.6 + u * 0.7));
      (m.material as THREE.MeshStandardMaterial).opacity = Math.min(1, Math.sin(u * Math.PI) * 2.6);
    });

    // 上清液沿溢流堰环向流出
    overflowRefs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.12 + i / overflowRefs.current.length) % 1;
      const a = Math.PI * 0.55 + u * Math.PI * 0.9; // 由内向出水口方向环流
      m.position.set(Math.cos(a) * (CL_R - 0.09), CL_TOP - 0.06, Math.sin(a) * (CL_R - 0.09));
      m.scale.setScalar(0.06 * Math.sin(u * Math.PI) + 0.02);
      (m.material as THREE.MeshStandardMaterial).opacity = Math.sin(u * Math.PI);
    });
  });

  return (
    <group position={[X_CLARIFIER, 0, 0]}>
      {/* 支腿 */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}${sz}`}
            position={[sx * 1.05, (GROUND + CL_WALL_BOT) / 2, sz * 0.62]}
            castShadow
          >
            <boxGeometry args={[0.13, CL_WALL_BOT - GROUND, 0.13]} />
            <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.5} />
          </mesh>
        ))
      )}

      {/* 直筒池壁（半剖） */}
      <mesh position={[0, (CL_TOP + CL_WALL_BOT) / 2, 0]} castShadow>
        <cylinderGeometry
          args={[CL_R, CL_R, CL_TOP - CL_WALL_BOT, 44, 1, true, Math.PI / 2, Math.PI]}
        />
        <meshStandardMaterial
          color={metalColors.alloyLight}
          metalness={0.35}
          roughness={0.35}
          transparent
          opacity={0.36}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* 锥斗（半剖） */}
      <mesh position={[0, (CL_WALL_BOT + CL_CONE_BOT) / 2, 0]} castShadow>
        <cylinderGeometry
          args={[CL_R, 0.24, CL_WALL_BOT - CL_CONE_BOT, 44, 1, true, Math.PI / 2, Math.PI]}
        />
        <meshStandardMaterial
          color={metalColors.alloy}
          metalness={0.4}
          roughness={0.4}
          transparent
          opacity={0.42}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* 溢流堰 */}
      <mesh position={[0, CL_TOP, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CL_R, 0.06, 10, 48]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.4} />
      </mesh>

      {/* 上清液（明显比反应槽清澈） */}
      <mesh position={[0, (CL_TOP + CL_WALL_BOT) / 2 - 0.04, 0]}>
        <cylinderGeometry args={[CL_R - 0.05, CL_R - 0.05, CL_TOP - CL_WALL_BOT - 0.1, 44]} />
        <meshStandardMaterial color={C.clear} transparent opacity={0.34} roughness={0.1} />
      </mesh>
      {/* 锥斗内的钙镁泥层 */}
      <mesh position={[0, CL_CONE_BOT + 0.34, 0]}>
        <cylinderGeometry args={[1.02, 0.26, 0.68, 40]} />
        <meshStandardMaterial color={C.mud} roughness={0.85} transparent opacity={0.82} />
      </mesh>

      {/* 中心进料筒 */}
      <mesh position={[0, CL_TOP - 0.42, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.84, 20, 1, true]} />
        <meshStandardMaterial
          color={metalColors.alloyDark}
          metalness={0.5}
          roughness={0.4}
          side={THREE.DoubleSide}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* 沉降中的钙镁泥 */}
      {muds.map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) mudRefs.current[i] = el; }}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={C.mud} roughness={0.9} transparent opacity={0.9} />
        </mesh>
      ))}
      {/* 上清液环流 */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) overflowRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial
            color={C.clear}
            emissive={C.clear}
            emissiveIntensity={0.4}
            transparent
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* 中心传动桥架（静） */}
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[CL_R * 2 + 0.3, 0.1, 0.22]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <boxGeometry args={[0.34, 0.28, 0.34]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.45} />
      </mesh>

      {/* 刮泥耙（缓慢旋转） */}
      <group ref={rakeRef} position={[0, 0, 0]}>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1.5, 12]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.35} />
        </mesh>
        {[0, Math.PI / 2].map((rot, ai) => (
          <group key={ai} rotation={[0, rot, 0]}>
            <mesh position={[0, CL_WALL_BOT - 0.12, 0]} rotation={[0, 0, -0.16]}>
              <boxGeometry args={[2.5, 0.06, 0.07]} />
              <meshStandardMaterial color={metalColors.alloyDark} metalness={0.55} roughness={0.4} />
            </mesh>
            {[-1, 1].map((s) =>
              [0.45, 0.95].map((d) => (
                <mesh
                  key={`${s}${d}`}
                  position={[s * d, CL_WALL_BOT - 0.24 + d * 0.08, 0]}
                  rotation={[0, 0.5, 0]}
                >
                  <boxGeometry args={[0.2, 0.18, 0.04]} />
                  <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.45} />
                </mesh>
              ))
            )}
          </group>
        ))}
      </group>

      {/* 排泥口 */}
      <mesh position={[0, CL_CONE_BOT - 0.12, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.26, 14]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

// ---------- 1D. 砂滤 / 叶滤器 ----------
const F_R = 0.66;
const F_TOP = 0.78;
const F_BOT = -1.42;

function SandFilter() {
  const inRefs = useRef<THREE.Mesh[]>([]);
  const outRefs = useRef<THREE.Mesh[]>([]);
  const ringRef = useRef<THREE.Mesh>(null);

  const beds = [
    { color: "#e9e2d2", y: -0.22, h: 0.46, r: F_R - 0.07 }, // 细石英砂
    { color: "#d9cdb2", y: -0.7, h: 0.48, r: F_R - 0.07 }, // 粗石英砂
    { color: "#c3b79c", y: -1.12, h: 0.34, r: F_R - 0.07 }, // 承托砾石
  ];
  const paused = useProcessPaused();

  useFrame((state) => {
    if (paused) return;
    const t = state.clock.elapsedTime;
    // 上部浑浊卤水下渗（进入砂层即淡出）
    inRefs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.26 + i / inRefs.current.length) % 1;
      m.position.set(Math.sin(i * 2.1) * 0.3, 0.6 - u * 0.62, Math.cos(i * 1.7) * 0.22);
      m.scale.setScalar(0.06 * (1 - u * 0.5));
      (m.material as THREE.MeshStandardMaterial).opacity = 0.9 * (1 - u);
    });
    // 底部精卤汇出（清澈明亮）
    outRefs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.3 + i / outRefs.current.length) % 1;
      m.position.set(Math.sin(i * 1.3) * 0.16, -1.16 - u * 0.42, Math.cos(i * 2.3) * 0.14);
      m.scale.setScalar(0.055 * Math.sin(Math.min(1, u + 0.15) * Math.PI) + 0.012);
      (m.material as THREE.MeshStandardMaterial).opacity = Math.min(1, u * 2.4);
    });
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.45 + Math.sin(t * 1.6) * 0.18;
    }
  });

  return (
    <group position={[X_FILTER, 0, 0]}>
      {/* 支腿 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.44, (GROUND + F_BOT) / 2, 0]} castShadow>
          <boxGeometry args={[0.11, F_BOT - GROUND, 0.11]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* 罐体（半剖） */}
      <mesh position={[0, (F_TOP + F_BOT) / 2, 0]} castShadow>
        <cylinderGeometry args={[F_R, F_R, F_TOP - F_BOT, 28, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial
          color={metalColors.alloy}
          metalness={0.45}
          roughness={0.35}
          transparent
          opacity={0.42}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* 上封头 */}
      <mesh position={[0, F_TOP, 0]}>
        <sphereGeometry args={[F_R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.35} />
      </mesh>
      {/* 下封头 */}
      <mesh position={[0, F_BOT, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[F_R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.35} />
      </mesh>
      {/* 进水口 */}
      <mesh position={[0, F_TOP + 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.45, 12]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} />
      </mesh>

      {/* 上部待滤卤水 */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[F_R - 0.06, F_R - 0.06, 0.62, 28]} />
        <meshStandardMaterial color={C.clear} transparent opacity={0.4} roughness={0.12} />
      </mesh>
      {/* 滤料层 */}
      {beds.map((b, i) => (
        <mesh key={i} position={[0, b.y, 0]}>
          <cylinderGeometry args={[b.r, b.r, b.h, 28]} />
          <meshStandardMaterial color={b.color} roughness={0.95} metalness={0} />
        </mesh>
      ))}
      {/* 承托板 */}
      <mesh position={[0, -1.31, 0]}>
        <cylinderGeometry args={[F_R - 0.05, F_R - 0.05, 0.05, 28]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 下渗（浑浊）与滤后（精卤）粒子 */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`in${i}`} ref={(el) => { if (el) inRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color={C.turbid} transparent roughness={0.6} />
        </mesh>
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`out${i}`} ref={(el) => { if (el) outRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial
            color={C.pure}
            emissive={C.pure}
            emissiveIntensity={0.55}
            transparent
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* 精卤出口 + 合格指示环（呼吸发光，标记本环节产出） */}
      <mesh position={[0, F_BOT - 0.2, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.36, 14]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} />
      </mesh>
      <mesh ref={ringRef} position={[0, F_BOT - 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.035, 10, 28]} />
        <meshStandardMaterial
          color={C.pure}
          emissive={C.pure}
          emissiveIntensity={0.5}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}

// ---------- 环节装配 ----------
export function BrineUnit({
  onSelect,
  focused = false,
  lang = "zh",
}: {
  onSelect?: () => void;
  /** 相机已对准本环节时，显示极简说明浮标 */
  focused?: boolean;
  lang?: "zh" | "en";
}) {
  const cx = STAGE_X.brine;
  const zh = lang === "zh";

  return (
    <group
      position={[cx, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      <WellSection />
      <Reactor />
      <Clarifier />
      <SandFilter />

      {/* 原卤（黄卤）：井口 → 反应槽 */}
      <FlowTube
        points={[
          [X_WELL + X_PROD + 0.3, SURFACE_Y + 0.52, 0],
          [X_WELL + X_PROD + 1.0, SURFACE_Y + 0.62, 0],
          [X_REACTOR - 1.85, SURFACE_Y - 0.2, 0],
          [X_REACTOR - 1.35, 1.05, 0],
          [X_REACTOR - 0.5, 0.9, 0],
        ]}
        color={C.raw}
        particleCount={7}
        particleSize={0.13}
        speed={0.2}
      />

      {/* 反应后浑浊卤水：反应槽 → 澄清槽中心进料筒 */}
      <FlowTube
        points={[
          [X_REACTOR + 0.95, -0.9, 0],
          [X_REACTOR + 1.6, -0.55, 0],
          [X_REACTOR + 1.75, 0.55, 0],
          [X_CLARIFIER - 0.9, 0.95, 0],
          [X_CLARIFIER, 0.78, 0],
          [X_CLARIFIER, 0.2, 0],
        ]}
        color={C.turbid}
        particleCount={6}
        particleSize={0.12}
        speed={0.18}
      />

      {/* 上清液：澄清槽溢流 → 砂滤器 */}
      <FlowTube
        points={[
          [X_CLARIFIER + CL_R, CL_TOP - 0.02, 0],
          [X_CLARIFIER + CL_R + 0.55, 0.16, 0],
          [X_FILTER - 0.55, 1.05, 0],
          [X_FILTER, 1.28, 0],
          [X_FILTER, 0.86, 0],
        ]}
        color={C.clear}
        particleCount={6}
        particleSize={0.11}
        speed={0.22}
      />

      {/* 钙镁泥排出（可回收利用） */}
      <FlowTube
        points={[
          [X_CLARIFIER, CL_CONE_BOT - 0.3, 0],
          [X_CLARIFIER, GROUND + 0.08, 0],
          [X_CLARIFIER + 0.95, GROUND + 0.05, 0],
        ]}
        color={C.mud}
        radius={0.055}
        particleCount={4}
        particleSize={0.08}
        speed={0.16}
      />

      {/* 对准本环节时才出现的极简说明（避免全景时文字堆叠） */}
      {focused && (
        <>
          <Tag
            position={[X_WELL, SURFACE_Y + 1.55, 0]}
            label={zh ? "深井汲卤 · 注水溶采" : "Deep-well brine · solution mining"}
            value={zh ? "原卤 NaCl 280~310 g/L" : "Raw brine 280–310 g/L"}
            color={C.raw}
          />
          <Tag
            position={[X_REACTOR, 3.35, 0]}
            label={zh ? "石灰—纯碱法加药" : "Lime–soda ash dosing"}
            value="Ca(OH)₂ + Na₂CO₃"
            color={metalColors.ok}
          />
          <Tag
            position={[X_CLARIFIER, 1.35, 0]}
            label={zh ? "重力沉降 · 钙镁泥" : "Gravity settling · Ca/Mg mud"}
            value="Mg(OH)₂↓  CaCO₃↓"
            color={C.mud}
          />
          <Tag
            position={[X_FILTER, F_TOP + 1.75, 0]}
            label={zh ? "精卤出料" : "Purified brine out"}
            value={zh ? "Ca²⁺≤10 · Mg²⁺≤5 ppm" : "Ca²⁺≤10 · Mg²⁺≤5 ppm"}
            color={C.pure}
          />
        </>
      )}
    </group>
  );
}
