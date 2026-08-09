"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { metalColors, Tag } from "../Tag";
import { FlowTube } from "./FlowTube";
import { STAGE_X } from "./layout";

/**
 * 环节 3：离心脱水（水力旋流器 + 推料/刮刀离心机）
 *
 * ⚠ 坐标约定（与 BrineUnit / EvaporateUnit 一致）：本文件内一律用「相对坐标」，
 * 最外层 <group position={[cx, 0, 0]}> 一次性平移到产线。绝不在内部再叠加 cx，
 * 否则整组模型会偏离产线。
 *
 * 工艺叙事（自左向右）：
 *   盐浆 → 水力旋流器（预增浓）→ 转鼓（离心力固液分离）→ 湿盐排出 / 母液回流
 * 分离原理：
 *   转鼓高速旋转 → 固体（盐）被甩向筛网壁形成滤饼 → 滤液（母液）穿过滤网排出
 *   → 刮刀/推料机构卸出湿盐；母液汇集底盘回流至系统提纯。
 *
 * 颜色叙事：
 *   盐浆（盐白微蓝）→ 湿盐（纯白，发光指示）→ 母液（青蓝，回流）
 */

// 垂直布局基准（相对坐标，与环节 1/2 一致）
const GROUND = -2.4;

// 分设备 x 偏移（相对坐标）
const X_HYDRO = -2.7; // 水力旋流器（左）
const X_BOWL = 0; // 转鼓（中）

/** 盐浆进口（世界坐标）——供 PipelineScene 接「盐浆 → 离心机」管道 */
export const CENTRIFUGE_INLET: [number, number, number] = [STAGE_X.centrifuge + X_HYDRO, 2.3, 0];
/** 湿盐出口（世界坐标）——供 PipelineScene 接「湿盐 → 干燥床」管道 */
export const CENTRIFUGE_WET_OUTLET: [number, number, number] = [STAGE_X.centrifuge + X_BOWL, -0.6, 0];

// 半剖（剖切面朝相机 +z），与环节 1/2 一致
const CUT: [number, number] = [Math.PI / 2, Math.PI];

// ---------- 1. 水力旋流器（预增浓） ----------
const H_BODY_TOP = 1.2;
const H_BODY_BOT = -0.3;
const H_R = 0.5;
const H_CONE_BOT = -0.9;

function Hydrocyclone() {
  const swirlRefs = useRef<THREE.Mesh[]>([]);
  const swirls = useMemo(
    () =>
      Array.from({ length: 14 }).map(() => ({
        a0: Math.random() * Math.PI * 2,
        phase: Math.random(),
        speed: 0.5 + Math.random() * 0.3,
        turns: 2 + Math.random() * 1.5,
      })),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // 旋流：盐浆自切向进入，沿壁螺旋下沉至底流（增浓）
    swirlRefs.current.forEach((m, i) => {
      if (!m) return;
      const s = swirls[i];
      const u = (t * s.speed + s.phase) % 1;
      const y = H_BODY_TOP - u * (H_BODY_TOP - H_CONE_BOT);
      const r = H_R * (0.85 - u * 0.62); // 半径收拢，模拟旋流收口
      const a = s.a0 + u * s.turns * Math.PI * 2;
      m.position.set(X_HYDRO + Math.cos(a) * r, y, Math.sin(a) * r);
      m.scale.setScalar(0.06 * (1 - u * 0.3));
      (m.material as THREE.MeshStandardMaterial).opacity = 0.85 * (1 - u * 0.45);
    });
  });

  return (
    <group position={[X_HYDRO, 0, 0]}>
      {/* 支腿 */}
      {[
        [-0.3, -0.3],
        [0.3, -0.3],
        [-0.3, 0.3],
        [0.3, 0.3],
      ].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, (H_CONE_BOT + GROUND) / 2, dz]} castShadow>
          <boxGeometry args={[0.1, H_CONE_BOT - GROUND, 0.1]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* 柱体（半剖） */}
      <mesh position={[0, (H_BODY_TOP + H_BODY_BOT) / 2, 0]} castShadow>
        <cylinderGeometry args={[H_R, H_R, H_BODY_TOP - H_BODY_BOT, 28, 1, true, CUT[0], CUT[1]]} />
        <meshStandardMaterial
          color={metalColors.alloy}
          metalness={0.5}
          roughness={0.35}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* 锥体（半剖，底流收口） */}
      <mesh position={[0, (H_BODY_BOT + H_CONE_BOT) / 2, 0]} castShadow>
        <cylinderGeometry args={[H_R, 0.14, H_BODY_BOT - H_CONE_BOT, 28, 1, true, CUT[0], CUT[1]]} />
        <meshStandardMaterial
          color={metalColors.alloyLight}
          metalness={0.45}
          roughness={0.4}
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 顶部进料管（盐浆进口） */}
      <mesh position={[0, H_BODY_TOP + 0.55, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 1.1, 16]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* 切向进料短管 */}
      <mesh position={[0.45, H_BODY_TOP - 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 12]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.55} roughness={0.4} />
      </mesh>
      {/* 溢流短管（顶部另一侧，澄清液返回） */}
      <mesh position={[-0.5, H_BODY_TOP - 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.7, 12]} />
        <meshStandardMaterial color={metalColors.alloyLight} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 底流喷嘴（增浓盐浆出口） */}
      <mesh position={[0, H_CONE_BOT - 0.05, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.3, 14]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 旋流颗粒 */}
      {swirls.map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) swirlRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial
            color={metalColors.salt}
            roughness={0.2}
            transparent
            emissive={metalColors.brineLight}
            emissiveIntensity={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------- 2. 转鼓离心机 ----------
const B_SKIRT_TOP = 1.4; // 篮体顶
const B_BOT = -0.3; // 篮体底
const B_R = 0.9;
const B_SCREEN_R = 0.82; // 筛网（滤网）半径
const B_DISCH_BOT = -0.6; // 排料锥底（湿盐出口）
const PAN_TOP = -0.92; // 母液底盘上沿
const PAN_BOT = -1.2; // 母液底盘底
const PAN_R = 1.15;

function CentrifugeBowl({ focused, lang }: { focused: boolean; lang: "zh" | "en" }) {
  const drumRef = useRef<THREE.Group>(null);
  const scraperRef = useRef<THREE.Group>(null);
  const cakeRefs = useRef<THREE.Mesh[]>([]);
  const liqRefs = useRef<THREE.Mesh[]>([]);
  const dischargeRefs = useRef<THREE.Mesh[]>([]);
  const zh = lang === "zh";

  const cakes = useMemo(
    () =>
      Array.from({ length: 18 }).map(() => ({
        a0: Math.random() * Math.PI * 2,
        phase: Math.random(),
        speed: 0.12 + Math.random() * 0.08,
        grow: 0.05 + Math.random() * 0.04,
      })),
    []
  );
  const liqs = useMemo(
    () =>
      Array.from({ length: 14 }).map(() => ({
        a0: Math.random() * Math.PI * 2,
        phase: Math.random(),
        speed: 0.7 + Math.random() * 0.5,
      })),
    []
  );
  const disch = useMemo(
    () => Array.from({ length: 6 }).map(() => ({ phase: Math.random(), speed: 0.8 + Math.random() * 0.4 })),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (drumRef.current) drumRef.current.rotation.y += delta * 2.0;
    const bowlAngle = drumRef.current?.rotation.y ?? 0;
    // 刮刀慢于转鼓旋转，暗示持续刮料卸料
    if (scraperRef.current) scraperRef.current.rotation.y += delta * 0.5;

    // 盐饼：挂在筛网壁上，随转鼓缓慢下沉
    cakeRefs.current.forEach((m, i) => {
      if (!m) return;
      const c = cakes[i];
      const u = (t * c.speed + c.phase) % 1;
      const y = 1.1 - u * 1.35; // 1.1 → -0.25
      const a = c.a0 + bowlAngle * 0.6;
      m.position.set(Math.cos(a) * B_SCREEN_R, y, Math.sin(a) * B_SCREEN_R);
      m.rotation.set(a, a * 0.6, 0);
      m.scale.setScalar(c.grow * (0.7 + u * 0.6));
    });

    // 母液：穿过滤网向外、向下排出，落入底盘
    liqRefs.current.forEach((m, i) => {
      if (!m) return;
      const l = liqs[i];
      const u = (t * l.speed + l.phase) % 1;
      const r = B_SCREEN_R + u * 0.26; // 0.82 → 1.08，落入母液盘内
      const y = 0.5 - u * 1.5; // 0.5 → -1.0
      const a = l.a0 + bowlAngle * 0.4;
      m.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      m.scale.setScalar(0.07 * (1 - u * 0.4));
      (m.material as THREE.MeshStandardMaterial).opacity = 0.6 * (1 - u * 0.7);
    });

    // 湿盐：底部排料口卸出（白色发光）
    dischargeRefs.current.forEach((m, i) => {
      if (!m) return;
      const d = disch[i];
      const u = (t * d.speed + d.phase) % 1;
      m.position.set(0, -0.3 - u * 0.3, 0); // -0.3 → -0.6
      m.scale.setScalar(0.06 * Math.sin(u * Math.PI) + 0.02);
      (m.material as THREE.MeshStandardMaterial).opacity = Math.sin(u * Math.PI);
    });
  });

  return (
    <group position={[X_BOWL, 0, 0]}>
      {/* 支腿（支撑底盘） */}
      {[
        [-0.5, -0.5],
        [0.5, -0.5],
        [-0.5, 0.5],
        [0.5, 0.5],
      ].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, (PAN_BOT + GROUND) / 2, dz]} castShadow>
          <boxGeometry args={[0.12, PAN_BOT - GROUND, 0.12]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* 旋转部分（转鼓 + 篮体 + 筛网 + 颗粒） */}
      <group ref={drumRef}>
        {/* 篮体外壳（半剖） */}
        <mesh position={[0, (B_SKIRT_TOP + B_BOT) / 2, 0]} castShadow>
          <cylinderGeometry args={[B_R, B_R, B_SKIRT_TOP - B_BOT, 36, 1, true, CUT[0], CUT[1]]} />
          <meshStandardMaterial
            color={metalColors.alloy}
            metalness={0.5}
            roughness={0.3}
            transparent
            opacity={0.32}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* 筛网（滤网，线框表达孔隙） */}
        <mesh position={[0, (B_SKIRT_TOP + B_BOT) / 2, 0]}>
          <cylinderGeometry args={[B_SCREEN_R, B_SCREEN_R, B_SKIRT_TOP - B_BOT, 24, 1, true, CUT[0], CUT[1]]} />
          <meshStandardMaterial
            color={metalColors.alloyDark}
            metalness={0.6}
            roughness={0.4}
            wireframe
            transparent
            opacity={0.28}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* 顶部法兰环 */}
        <mesh position={[0, B_SKIRT_TOP, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[B_R, 0.05, 10, 40]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.4} />
        </mesh>
        {/* 进料管 + 布料锥 */}
        <mesh position={[0, B_SKIRT_TOP + 0.35, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.7, 16]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, B_SKIRT_TOP, 0]}>
          <coneGeometry args={[0.34, 0.4, 20, 1, true, CUT[0], CUT[1]]} />
          <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        {/* 排料锥（湿盐出口） */}
        <mesh position={[0, (B_BOT + B_DISCH_BOT) / 2, 0]}>
          <cylinderGeometry args={[B_R, 0.16, B_BOT - B_DISCH_BOT, 36, 1, true, CUT[0], CUT[1]]} />
          <meshStandardMaterial
            color={metalColors.alloy}
            metalness={0.45}
            roughness={0.4}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 盐饼（挂壁） */}
        {cakes.map((_, i) => (
          <mesh key={i} ref={(el) => { if (el) cakeRefs.current[i] = el; }}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={metalColors.salt}
              roughness={0.2}
              emissive={metalColors.brineLight}
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}
        {/* 母液（穿滤网） */}
        {liqs.map((_, i) => (
          <mesh key={i} ref={(el) => { if (el) liqRefs.current[i] = el; }}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color={metalColors.brine} transparent roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* 中心主轴（静止机壳，慢速旋转的视觉核心） */}
      <mesh position={[0, (B_DISCH_BOT + B_SKIRT_TOP + 0.3) / 2, 0]}>
        <cylinderGeometry args={[0.16, 0.16, B_SKIRT_TOP + 0.3 - B_DISCH_BOT, 16]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* 刮刀/推料机构（慢转，持续卸料） */}
      <group ref={scraperRef} position={[0, 0, 0]}>
        <mesh position={[B_R * 0.4, -0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[B_R * 0.9, 0.12, 0.1]} />
          <meshStandardMaterial color={metalColors.alloy} metalness={0.55} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.5, 12]} />
          <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.35} />
        </mesh>
      </group>

      {/* 母液底盘（收集滤液） */}
      <mesh position={[0, (PAN_TOP + PAN_BOT) / 2, 0]} castShadow>
        <cylinderGeometry args={[PAN_R, PAN_R, PAN_TOP - PAN_BOT, 36, 1, true, CUT[0], CUT[1]]} />
        <meshStandardMaterial
          color={metalColors.alloyMid}
          metalness={0.4}
          roughness={0.6}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, PAN_BOT, 0]}>
        <cylinderGeometry args={[PAN_R, PAN_R, 0.06, 36]} />
        <meshStandardMaterial color={metalColors.alloyMid} metalness={0.4} roughness={0.7} />
      </mesh>

      {/* 湿盐卸出颗粒 */}
      {disch.map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) dischargeRefs.current[i] = el; }}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={metalColors.salt}
            roughness={0.2}
            transparent
            emissive={metalColors.brineLight}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* 对准本环节时：工艺标签 */}
      {focused && (
        <Tag
          position={[0, B_SKIRT_TOP + 1.0, 0]}
          label={zh ? "离心分离" : "Centrifugal separation"}
          value={zh ? "固液分离 · 含水率 3~5%" : "solid–liquid · moisture 3–5%"}
          color={metalColors.salt}
        />
      )}
    </group>
  );
}

// ---------- 环节装配 ----------
export function CentrifugeUnit({
  onSelect,
  focused = false,
  lang = "zh",
}: {
  onSelect?: () => void;
  /** 相机已对准本环节时，显示极简说明浮标 */
  focused?: boolean;
  lang?: "zh" | "en";
}) {
  const cx = STAGE_X.centrifuge;
  const zh = lang === "zh";

  return (
    <group
      position={[cx, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      <Hydrocyclone />
      <CentrifugeBowl focused={focused} lang={lang} />

      {/* 旋流器底流（增浓盐浆）→ 转鼓进料（走后排 z=-0.6，避免遮挡剖视） */}
      <FlowTube
        points={[
          [X_HYDRO, H_CONE_BOT - 0.1, 0],
          [X_HYDRO, -1.1, -0.6],
          [X_BOWL, 0.2, -0.6],
          [X_BOWL, B_SKIRT_TOP + 0.1, 0],
        ]}
        color={metalColors.salt}
        radius={0.07}
        particleCount={5}
        particleSize={0.1}
        speed={0.2}
      />

      {/* 母液回流：底盘 → 左侧 → 回系统提纯 */}
      <FlowTube
        points={[
          [X_BOWL - PAN_R + 0.1, PAN_TOP - 0.05, 0],
          [X_BOWL - PAN_R - 0.5, PAN_TOP - 0.1, 0],
          [X_BOWL - PAN_R - 0.5, -1.5, 0],
        ]}
        color={metalColors.brine}
        radius={0.06}
        particleCount={4}
        particleSize={0.08}
        speed={0.16}
      />

      {/* 对准本环节时才出现的极简说明（避免全景时文字堆叠） */}
      {focused && (
        <>
          <Tag
            position={[X_HYDRO, H_BODY_TOP + 1.1, 0]}
            label={zh ? "水力旋流器" : "Hydrocyclone"}
            value={zh ? "预增浓盐浆" : "pre-thickens slurry"}
            color={metalColors.amber}
          />
          <Tag
            position={[X_BOWL - PAN_R - 0.5, -1.95, 0]}
            label={zh ? "母液回流" : "Mother liquor return"}
            value={zh ? "提纯 · 回系统" : "refined · to system"}
            color={metalColors.brine}
          />
        </>
      )}
    </group>
  );
}
