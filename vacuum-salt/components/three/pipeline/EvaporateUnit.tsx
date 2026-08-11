"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { metalColors, Tag } from "../Tag";
import { FlowTube } from "./FlowTube";
import { STAGE_X } from "./layout";

/**
 * 环节 2：多效蒸发结晶（四效）
 *
 * ⚠ 坐标约定（与 BrineUnit 一致）：本文件内一律用「相对坐标」，
 * 最外层 <group position={[cx, 0, 0]}> 一次性平移到产线。绝不在内部再叠加 cx，
 * 否则整组模型会偏离产线。
 *
 * 工艺叙事（自左向右，压力 / 温度逐效降低）：
 *   Ⅰ效(高温高压, 通新鲜蒸汽) → Ⅱ效 → Ⅲ效 → Ⅳ效(高真空低温, 兼作结晶器)
 *   二次蒸汽逐效回用：上一效二次蒸汽 = 下一效加热室热源
 *   卤水顺流：Ⅰ→Ⅱ→Ⅲ→Ⅳ 逐效浓缩，末效(结晶器)排出盐浆
 *   Ⅳ效二次蒸汽 → 混合冷凝器 + 真空泵（维持末效真空）
 *
 * 颜色叙事：
 *   Ⅰ效(amber 热) → Ⅳ效(brine 冷) 温度梯度；加热室辉光随效递减。
 *
 * 真剖面：四效 + 冷凝器统一用世界空间裁剪面（保留 z<=0 半边）从相机侧干净剖开，
 * 内部列管 / 卤水 / 晶体完整可见；晶体、卤水、气泡不加裁剪，保持实体。
 */

// 温度 / 压力梯度（首效 ~130℃，末效 ~48℃；压力 0.18→0.012 MPa）
const EFFECTS = [
  { temp: 130, pressure: 0.18 },
  { temp: 105, pressure: 0.09 },
  { temp: 75, pressure: 0.04 },
  { temp: 48, pressure: 0.012 },
];

const SPACING = 3.0;
/** i=0 为Ⅰ效（最左 / 最高温），i=3 为Ⅳ效（最右 / 最高真空） */
export function localEffectX(i: number): number {
  return (-1.5 + i) * SPACING;
}
/** 世界坐标的效中心 x（供 PipelineScene / 跨环节管路使用） */
export function effectX(i: number): number {
  return STAGE_X.evaporate + localEffectX(i);
}

// 跨环节连接点（世界坐标，供 PipelineScene 接管道）
export const EVAP_BRINE_INLET: [number, number, number] = [effectX(0), -1.5, -0.5];
export const EVAP_SALT_OUTLET: [number, number, number] = [effectX(3), -1.25, 0.0];

// 裁剪面（世界空间，不随单元 x 平移改变 z）
const EVAP_CLIP = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0); // 四效：保留 z<=0
const COND_CLIP = new THREE.Plane(new THREE.Vector3(0, 0, -1), -1.4); // 冷凝器：保留 z<=-1.4

// 垂直布局基准（相对坐标）
const GROUND = -2.4;
const HEATER_R = 0.92;
const HEATER_H = 1.2;
const HEATER_CY = -1.55; // 加热室中心；跨度 -2.15 ~ -0.95
const CHAMBER_R = 1.04;
const CHAMBER_H = 2.2;
const CHAMBER_CY = 0.35; // 蒸发结晶室；跨度 -0.75 ~ 1.45
const TOP_CONE_H = 0.7;
const STEAM_TOP = 2.45; // 蒸汽出口顶
const LIQ_TOP = 0.85;
const LIQ_BOT = -0.55;
const DISCHARGE_Y = -1.3; // 排料锥尖（晶体汇集 / 盐浆出口）

// 加热室：周边列管 + 中央降液管（自然循环）
const TUBE_COUNT = 8;
const TUBE_R = 0.5;
const DOWN_R = 0.34;

// 逐效悬浮晶体数量（前效少、末效密集；末效兼结晶器）
const CRYSTAL_COUNTS = [3, 7, 11, 16];

/** 单效蒸发器（加热室 + 蒸发结晶室） */
function Evaporator({
  x,
  index,
  isFirst,
  isLast,
  focused,
  lang,
}: {
  x: number;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  focused: boolean;
  lang: "zh" | "en";
}) {
  const crystalRefs = useRef<THREE.Mesh[]>([]);
  const bubbleRefs = useRef<THREE.Mesh[]>([]);
  const glowRef = useRef<THREE.Mesh>(null);
  const steamRef = useRef<THREE.Mesh>(null);
  const boilRef = useRef<THREE.Mesh>(null);
  const surfaceRef = useRef<THREE.Mesh>(null);

  // 周边列管位置（环形均布）
  const tubePos = useMemo(
    () =>
      Array.from({ length: TUBE_COUNT }, (_, j) => {
        const a = (j / TUBE_COUNT) * Math.PI * 2;
        return [Math.cos(a) * TUBE_R, Math.sin(a) * TUBE_R] as [number, number];
      }),
    []
  );
  // 沸腾气泡：绑定到某根列管，沿管高上行（管内沸腾）
  const bubbles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        tube: i % TUBE_COUNT,
        speed: 0.5 + Math.random() * 0.5,
        phase: Math.random(),
      })),
    []
  );
  // 悬浮 NaCl 晶体（数量随效递增）
  const crystals = useMemo(
    () =>
      Array.from({ length: CRYSTAL_COUNTS[index - 1] }).map(() => ({
        r0: 0.18 + Math.random() * 0.5,
        a0: Math.random() * Math.PI * 2,
        speed: 0.16 + Math.random() * 0.2,
        phase: Math.random(),
        grow: 0.045 + Math.random() * 0.05,
        rot: Math.random() * 1.2,
      })),
    [index]
  );
  // 末效静态晶床（盐浆在此沉积）
  const bed = useMemo(
    () =>
      isLast
        ? Array.from({ length: 26 }).map(() => {
            const a = Math.random() * Math.PI * 2;
            const rr = Math.random() * 0.42;
            return {
              x: Math.cos(a) * rr,
              z: Math.sin(a) * rr,
              y: DISCHARGE_Y + 0.06 + Math.random() * 0.22,
              s: 0.07 + Math.random() * 0.06,
            };
          })
        : [],
    [isLast]
  );

  const temp = EFFECTS[index - 1].temp;
  const pressure = EFFECTS[index - 1].pressure;
  // 温度梯度色：Ⅰ效(热) → Ⅳ效(冷)
  const gradientColor = useMemo(
    () => new THREE.Color(metalColors.amber).lerp(new THREE.Color(metalColors.brine), (index - 1) / 3),
    [index]
  );
  // 加热室辉光强度随效递减（热 → 冷）
  const heatGlow = 0.55 - ((index - 1) / 3) * 0.42;
  // 沸腾剧烈度随效略减（高温效更剧烈）
  const boil = 1 - ((index - 1) / 3) * 0.55;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // 晶体：顶部成核 → 缓慢下沉、不断长大 → 沉入锥底（成核 / 长大 / 排出循环）
    crystalRefs.current.forEach((m, i) => {
      if (!m) return;
      const c = crystals[i];
      const u = (t * c.speed + c.phase) % 1;
      const y = 1.0 - u * (1.0 - DISCHARGE_Y);
      const r = c.r0 * (0.4 + (1 - u) * 0.9);
      m.position.set(Math.cos(c.a0 + t * 0.3) * r, y, Math.sin(c.a0 + t * 0.3) * r);
      m.rotation.set(t * c.rot, t * c.rot * 0.7, 0);
      m.scale.setScalar(c.grow * (0.5 + u * 1.4));
    });
    // 管内沸腾：气泡沿绑定列管上升
    bubbleRefs.current.forEach((m, i) => {
      if (!m) return;
      const b = bubbles[i];
      const y = HEATER_CY - HEATER_H / 2 + ((t * b.speed + b.phase) % 1) * HEATER_H;
      m.position.set(tubePos[b.tube][0], y, tubePos[b.tube][1]);
      m.scale.setScalar(0.05 + Math.sin((y + 0.75) * 3) * 0.02);
    });
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        heatGlow * (0.8 + Math.sin(t * 1.6 + index) * 0.2);
    }
    if (steamRef.current) {
      (steamRef.current.material as THREE.MeshStandardMaterial).opacity =
        0.16 + Math.sin(t * 1.4 + index) * 0.06;
    }
    if (boilRef.current) {
      (boilRef.current.material as THREE.MeshStandardMaterial).opacity =
        (0.06 + Math.sin(t * 2.2 + index) * 0.03) * boil;
    }
    // 沸腾液面：轻微起伏 + 脉动，直观表达“卤水在低温下翻腾沸腾”
    if (surfaceRef.current) {
      surfaceRef.current.position.y = LIQ_TOP - 0.15 + Math.sin(t * 3 + index) * 0.05;
      surfaceRef.current.scale.setScalar(1 + Math.sin(t * 4 + index) * 0.015);
    }
  });

  const heaterColor = isLast ? metalColors.brine : metalColors.alloy;
  const zh = lang === "zh";

  return (
    <group position={[x, 0, 0]}>
      {/* 支座裙座 */}
      <mesh position={[0, (GROUND + HEATER_CY - HEATER_H / 2) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.72, HEATER_CY - HEATER_H / 2 - GROUND, 20]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.45} roughness={0.55} />
      </mesh>
      <mesh position={[0, GROUND + 0.05, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 24]} />
        <meshStandardMaterial color={metalColors.alloyMid} roughness={0.9} />
      </mesh>

      {/* 加热室辉光（热强度随效递减） */}
      <mesh ref={glowRef} position={[0, HEATER_CY, 0]}>
        <cylinderGeometry args={[HEATER_R + 0.07, HEATER_R + 0.07, HEATER_H, 28]} />
        <meshStandardMaterial
          color={gradientColor}
          emissive={gradientColor}
          emissiveIntensity={heatGlow}
          transparent
          opacity={0.16}
          depthWrite={false}
        />
      </mesh>

      {/* 加热室（真剖面：全圆柱 + 裁剪面，可见列管） */}
      <mesh position={[0, HEATER_CY, 0]} castShadow>
        <cylinderGeometry args={[HEATER_R, HEATER_R, HEATER_H, 32]} />
        <meshStandardMaterial
          color={heaterColor}
          metalness={0.55}
          roughness={0.35}
          transparent
          opacity={0.42}
          side={THREE.DoubleSide}
          clippingPlanes={[EVAP_CLIP]}
        />
      </mesh>
      {/* 中央降液管（自然循环：管内沸腾 → 中心回流） */}
      <mesh position={[0, HEATER_CY, 0]}>
        <cylinderGeometry args={[DOWN_R, DOWN_R, HEATER_H - 0.05, 24]} />
        <meshStandardMaterial color={metalColors.alloyLight} metalness={0.5} roughness={0.4} transparent opacity={0.5} />
      </mesh>
      {/* 周边列管（沸腾发生在管内） */}
      {tubePos.map((p, i) => (
        <mesh key={i} position={[p[0], HEATER_CY, p[1]]}>
          <cylinderGeometry args={[0.07, 0.07, HEATER_H - 0.05, 10]} />
          <meshStandardMaterial color={metalColors.amber} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* 加热室顶 / 底封板 */}
      <mesh position={[0, HEATER_CY + HEATER_H / 2, 0]}>
        <cylinderGeometry args={[HEATER_R, HEATER_R, 0.08, 28]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* 新鲜蒸汽进口（仅Ⅰ效）：自左侧进入加热室 */}
      {isFirst && (
        <group>
          <mesh position={[-HEATER_R - 0.55, HEATER_CY, -0.4]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 1.1, 14]} />
            <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.35} />
          </mesh>
          {/* 蒸汽分配小室 */}
          <mesh position={[-HEATER_R - 0.1, HEATER_CY, -0.4]} castShadow>
            <boxGeometry args={[0.24, 0.5, 0.34]} />
            <meshStandardMaterial color={metalColors.alloy} metalness={0.55} roughness={0.4} />
          </mesh>
        </group>
      )}

      {/* 蒸发结晶室（真剖面） */}
      <mesh position={[0, CHAMBER_CY, 0]} castShadow>
        <cylinderGeometry args={[CHAMBER_R, CHAMBER_R, CHAMBER_H, 40]} />
        <meshStandardMaterial
          color={metalColors.alloyLight}
          metalness={0.4}
          roughness={0.25}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          clippingPlanes={[EVAP_CLIP]}
        />
      </mesh>
      {/* 沸腾微辉光（剧烈度随效递减） */}
      <mesh ref={boilRef} position={[0, (LIQ_TOP + LIQ_BOT) / 2, 0]}>
        <cylinderGeometry args={[CHAMBER_R - 0.12, CHAMBER_R - 0.12, LIQ_TOP - LIQ_BOT, 40]} />
        <meshStandardMaterial color={metalColors.brineLight} emissive={metalColors.brineLight} emissiveIntensity={0.5} transparent opacity={0.06} depthWrite={false} />
      </mesh>
      {/* 内部卤水（浓度随效递增：Ⅰ清 → Ⅳ偏盐白更稠） */}
      <mesh position={[0, (LIQ_TOP + LIQ_BOT) / 2, 0]}>
        <cylinderGeometry args={[CHAMBER_R - 0.05, CHAMBER_R - 0.05, LIQ_TOP - LIQ_BOT, 40]} />
        <meshStandardMaterial
          color={new THREE.Color(metalColors.brine).lerp(new THREE.Color(metalColors.salt), (index - 1) / 3)}
          transparent
          opacity={0.28 + ((index - 1) / 3) * 0.18}
          roughness={0.1}
        />
      </mesh>
      {/* 沸腾液面（轻微起伏，暗示卤水翻腾沸腾） */}
      <mesh ref={surfaceRef} position={[0, LIQ_TOP - 0.15, 0]}>
        <cylinderGeometry args={[CHAMBER_R - 0.08, CHAMBER_R - 0.08, 0.05, 40]} />
        <meshStandardMaterial
          color={metalColors.brineLight}
          emissive={metalColors.brineLight}
          emissiveIntensity={0.35}
          transparent
          opacity={0.5}
          roughness={0.15}
          depthWrite={false}
        />
      </mesh>
      {/* 温度梯度色环（Ⅰ效热 → Ⅳ效冷） */}
      <mesh position={[0, CHAMBER_CY + CHAMBER_H / 2 + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CHAMBER_R + 0.02, 0.05, 10, 48]} />
        <meshStandardMaterial color={gradientColor} emissive={gradientColor} emissiveIntensity={0.6} roughness={0.4} />
      </mesh>

      {/* 锥顶 + 蒸汽出口 */}
      <mesh position={[0, CHAMBER_CY + CHAMBER_H / 2 + TOP_CONE_H / 2, 0]}>
        <coneGeometry args={[CHAMBER_R, TOP_CONE_H, 40]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.5} roughness={0.35} side={THREE.DoubleSide} clippingPlanes={[EVAP_CLIP]} />
      </mesh>
      <mesh position={[0, STEAM_TOP, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.4, 18]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 二次蒸汽出口短管（顶部，由父级统一布管连向下一效加热室） */}
      <mesh position={[0, STEAM_TOP + 0.05, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.3, 14]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.55} roughness={0.4} />
      </mesh>

      {/* 底部排料锥（晶体汇集，真剖面） */}
      <mesh position={[0, (CHAMBER_CY - CHAMBER_H / 2 + DISCHARGE_Y) / 2, 0]}>
        <cylinderGeometry args={[CHAMBER_R - 0.05, 0.22, CHAMBER_CY - CHAMBER_H / 2 - DISCHARGE_Y, 36]} />
        <meshStandardMaterial
          color={metalColors.alloy}
          metalness={0.45}
          roughness={0.4}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          clippingPlanes={[EVAP_CLIP]}
        />
      </mesh>
      {/* 盐浆出口短管（末效连离心机；其余仅示意） */}
      <mesh position={[0, DISCHARGE_Y - 0.05, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.34, 14]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 末效静态晶床（盐浆沉积） */}
      {bed.map((b, i) => (
        <mesh key={`bed-${i}`} position={[b.x, b.y, b.z]} scale={b.s}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={metalColors.salt} roughness={0.25} emissive="#b8dcef" emissiveIntensity={0.15} />
        </mesh>
      ))}

      {/* 管内沸腾气泡 */}
      {bubbles.map((b, i) => (
        <mesh key={i} ref={(el) => { if (el) bubbleRefs.current[i] = el; }} position={[tubePos[b.tube][0], 0, tubePos[b.tube][1]]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={metalColors.brineLight} transparent opacity={0.5} roughness={0.3} />
        </mesh>
      ))}
      {/* NaCl 结晶（成核 → 长大 → 沉降） */}
      {crystals.map((c, i) => (
        <mesh key={i} ref={(el) => { if (el) crystalRefs.current[i] = el; }} position={[c.r0, 0, 0]} scale={c.grow}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={metalColors.salt} roughness={0.2} emissive="#b8dcef" emissiveIntensity={0.18} />
        </mesh>
      ))}
      {/* 蒸汽羽流 */}
      <mesh ref={steamRef} position={[0, STEAM_TOP + 0.6, 0]}>
        <coneGeometry args={[0.42, 1.1, 16, 1, true]} />
        <meshStandardMaterial color={metalColors.steam} transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* 聚焦时：逐效温度 / 压力读数（直观表达梯度） */}
      {focused && (
        <Tag
          position={[0, STEAM_TOP + 1.15, 0]}
          label={zh ? `${index}效` : `Effect ${index}`}
          value={`${temp}℃ · ${pressure} MPa`}
          color={`#${gradientColor.getHexString()}`}
        />
      )}
    </group>
  );
}

/** 混合冷凝器 + 真空泵（维持末效真空） */
function Condenser({ x, z }: { x: number; z: number }) {
  const COND_R = 0.7;
  const COND_H = 2.6;
  const COND_CY = 0.2;
  const sprayRef = useRef<THREE.Mesh>(null);
  const dropRefs = useRef<THREE.Mesh[]>([]);
  const drops = useMemo(
    () =>
      Array.from({ length: 12 }).map(() => ({
        x: (Math.random() - 0.5) * COND_R * 1.3,
        z: (Math.random() - 0.5) * COND_R * 1.3,
        phase: Math.random(),
        speed: 0.7 + Math.random() * 0.6,
      })),
    [COND_R]
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (sprayRef.current) {
      (sprayRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.3 + Math.sin(t * 1.8) * 0.12;
    }
    // 喷淋冷却水滴：自上而下循环下落，直观表达“冷凝换热”
    dropRefs.current.forEach((m, i) => {
      if (!m) return;
      const d = drops[i];
      const u = (t * d.speed + d.phase) % 1;
      m.position.set(d.x, COND_CY + COND_H / 2 - u * COND_H, d.z);
    });
  });
  return (
    <group position={[x, 0, z]}>
      {/* 支座 */}
      <mesh position={[0, (GROUND + COND_CY - COND_H / 2) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.58, COND_CY - COND_H / 2 - GROUND, 18]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.45} roughness={0.55} />
      </mesh>
      {/* 外壳（真剖面：全圆柱 + 裁剪面） */}
      <mesh position={[0, COND_CY, 0]} castShadow>
        <cylinderGeometry args={[COND_R, COND_R, COND_H, 28]} />
        <meshStandardMaterial
          color={metalColors.alloyLight}
          metalness={0.35}
          roughness={0.35}
          transparent
          opacity={0.38}
          side={THREE.DoubleSide}
          clippingPlanes={[COND_CLIP]}
        />
      </mesh>
      {/* 内部冷却喷淋管（水平） */}
      {[-0.7, -0.1, 0.5, 1.0].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, COND_R * 1.7, 10]} />
          <meshStandardMaterial color={metalColors.alloy} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      {/* 喷淋水幕（呼吸发光，暗示冷凝） */}
      <mesh ref={sprayRef} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[COND_R - 0.06, COND_R - 0.06, 0.3, 28]} />
        <meshStandardMaterial
          color={metalColors.brineLight}
          emissive={metalColors.brineLight}
          emissiveIntensity={0.3}
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>
      {/* 喷淋冷却水滴：自上而下循环下落，表达“冷凝换热” */}
      {drops.map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) dropRefs.current[i] = el; }}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshStandardMaterial color={metalColors.brineLight} transparent opacity={0.6} roughness={0.2} />
        </mesh>
      ))}
      {/* 顶部二次蒸汽进口 */}
      <mesh position={[0, COND_CY + COND_H / 2, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.35, 16]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* 底部真空泵 */}
      <mesh position={[0, COND_CY - COND_H / 2 - 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.95, 18]} />
        <meshStandardMaterial color={metalColors.alloy} metalness={0.55} roughness={0.4} />
      </mesh>
      {/* 抽气 / 排水短管 */}
      <mesh position={[0, COND_CY - COND_H / 2 - 0.35, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.5, 12]} />
        <meshStandardMaterial color={metalColors.alloyDark} metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

/**
 * 冷凝器真空表（3D 仪表盘）：半圆刻度 + 指针，
 * 指针指向末效真空度（≈88%），与 HUD 真空梯度面板呼应。
 */
function VacuumGauge({ x, y, z }: { x: number; y: number; z: number }) {
  const needleRef = useRef<THREE.Mesh>(null);
  const R = 0.5;
  // 半圆刻度：0%（左，min）→ 100%（右，max），自顶扫过
  const fraction = 0.88; // 末效真空度 ≈ 88%
  const angle = Math.PI * (1 - fraction); // fraction0→π(左), 1→0(右)

  useFrame((state) => {
    if (needleRef.current) {
      const wob = Math.sin(state.clock.elapsedTime * 1.4) * 0.03;
      needleRef.current.rotation.z = angle + wob;
    }
  });

  return (
    <group position={[x, y, z]}>
      {/* 表盘底 */}
      <mesh>
        <circleGeometry args={[R + 0.09, 36]} />
        <meshStandardMaterial color="#0c1622" opacity={0.82} transparent depthWrite={false} />
      </mesh>
      {/* 刻度弧（顶半圆，左 min → 右 max） */}
      <mesh>
        <torusGeometry args={[R, 0.035, 10, 48, Math.PI]} />
        <meshStandardMaterial color={metalColors.alloyLight} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* 真空区着色弧（左 0% → 当前 fraction） */}
      <mesh rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[R, 0.035, 10, 48, Math.PI * fraction]} />
        <meshStandardMaterial color={metalColors.brine} emissive={metalColors.brine} emissiveIntensity={0.5} />
      </mesh>
      {/* 指针 */}
      <mesh ref={needleRef} position={[0, 0, 0.04]}>
        <boxGeometry args={[R - 0.06, 0.035, 0.02]} />
        <meshStandardMaterial color={metalColors.salt} emissive={"#ef6f5b"} emissiveIntensity={0.6} />
      </mesh>
      {/* 轴心 */}
      <mesh position={[0, 0, 0.05]}>
        <circleGeometry args={[0.07, 16]} />
        <meshStandardMaterial color={metalColors.brineDeep} />
      </mesh>
    </group>
  );
}

/** 环节 2：四效蒸发结晶器组 + 冷凝器 + 逐效回用管路 */
export function EvaporateUnit({
  onSelect,
  focused = false,
  lang = "zh",
}: {
  onSelect?: () => void;
  focused?: boolean;
  lang?: "zh" | "en";
}) {
  const cx = STAGE_X.evaporate;
  const zh = lang === "zh";
  const condLocalX = localEffectX(3) + 1.9; // 冷凝器在 Ⅳ效右侧
  const condZ = -1.4; // 置于后排，避免与盐浆管路（z=0）冲突

  // 低压冷色晕染（呼吸式微脉动，暗示末效真空区）
  const tintRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (tintRef.current) {
      const m = tintRef.current.material as THREE.MeshStandardMaterial;
      m.opacity = 0.06 + (Math.sin(state.clock.elapsedTime * 1.2) * 0.5 + 0.5) * 0.05;
    }
  });

  // 连接四效支座的基座裙条（强化"一组设备"整体感）
  const skirtX0 = localEffectX(0) - 1.0;
  const skirtX1 = localEffectX(3) + 1.0;

  return (
    <group
      position={[cx, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      {/* 基座裙条（连四效支座） */}
      <mesh position={[(skirtX0 + skirtX1) / 2, GROUND + 0.03, 0]} castShadow>
        <boxGeometry args={[skirtX1 - skirtX0, 0.12, 1.5]} />
        <meshStandardMaterial color={metalColors.alloyMid} metalness={0.3} roughness={0.85} />
      </mesh>

      {/* 低压冷色晕染：覆盖 Ⅳ效 + 冷凝器，直观表达「末效高真空」区域 */}
      <mesh ref={tintRef} position={[(localEffectX(3) + condLocalX) / 2, 0.35, -0.95]}>
        <boxGeometry args={[condLocalX - localEffectX(3) + 1.9, 3.7, 0.5]} />
        <meshStandardMaterial
          color={metalColors.brineLight}
          emissive={metalColors.brineLight}
          emissiveIntensity={0.35}
          transparent
          opacity={0.07}
          depthWrite={false}
        />
      </mesh>

      {/* 四效蒸发器 */}
      {EFFECTS.map((_, i) => (
        <Evaporator
          key={i}
          x={localEffectX(i)}
          index={i + 1}
          isFirst={i === 0}
          isLast={i === 3}
          focused={focused}
          lang={lang}
        />
      ))}

      {/* 混合冷凝器 + 真空泵（末效之后） */}
      <Condenser x={condLocalX} z={condZ} />

      {/* —— 新鲜蒸汽：外部 → Ⅰ效加热室（仅Ⅰ效） —— */}
      <FlowTube
        points={[
          [localEffectX(0) - 2.4, HEATER_CY, -0.4],
          [localEffectX(0) - HEATER_R - 0.9, HEATER_CY, -0.4],
          [localEffectX(0) - HEATER_R - 0.1, HEATER_CY, -0.4],
        ]}
        color={metalColors.steam}
        radius={0.07}
        particleCount={5}
        particleSize={0.11}
        speed={0.22}
      />

      {/* —— 二次蒸汽逐效回用：上一效顶部 → 下一效加热室（按序脉动表达梯级利用） —— */}
      {[0, 1, 2].map((i) => (
        <FlowTube
          key={`steam-${i}`}
          points={[
            [localEffectX(i), STEAM_TOP, 0],
            [localEffectX(i) + SPACING * 0.5, STEAM_TOP + 0.6, 0],
            [localEffectX(i + 1), STEAM_TOP + 0.6, 0],
            [localEffectX(i + 1), HEATER_CY + HEATER_H / 2 - 0.1, -0.5],
          ]}
          color={metalColors.steam}
          radius={0.06}
          particleCount={6}
          particleSize={0.1}
          speed={0.18}
          phase={i / 3}
        />
      ))}

      {/* —— Ⅳ效二次蒸汽 → 冷凝器 —— */}
      <FlowTube
        points={[
          [localEffectX(3), STEAM_TOP, 0],
          [localEffectX(3) + 0.8, STEAM_TOP + 0.5, -0.7],
          [condLocalX, COND_CY_TOP(), -1.4],
          [condLocalX, 1.2, -1.4],
        ]}
        color={metalColors.steam}
        radius={0.06}
        particleCount={6}
        particleSize={0.1}
        speed={0.18}
      />

      {/* —— 卤水顺流（forward feed）：Ⅰ→Ⅱ→Ⅲ→Ⅳ 逐效浓缩（颜色随效变稠） —— */}
      {[0, 1, 2].map((i) => (
        <FlowTube
          key={`feed-${i}`}
          points={[
            [localEffectX(i) + CHAMBER_R * 0.82, -0.2, 0],
            [localEffectX(i) + SPACING * 0.5, -0.55, 0],
            [localEffectX(i + 1) - CHAMBER_R * 0.82, -0.2, 0],
          ]}
          color={new THREE.Color(metalColors.brine).lerp(new THREE.Color(metalColors.salt), (i + 1) / 3).getStyle()}
          radius={0.07}
          particleCount={6}
          particleSize={0.11}
          speed={0.2}
        />
      ))}

      {/* 聚焦时：关键部件极简浮标 */}
      {focused && (
        <>
          <Tag
            position={[localEffectX(0) - 2.4, HEATER_CY + 0.9, -0.4]}
            label={zh ? "新鲜蒸汽" : "Fresh steam"}
            value={zh ? "生蒸汽加热 → Ⅰ效" : "live steam → I"}
            color={metalColors.steam}
          />
          <Tag
            position={[condLocalX, 2.3, -1.4]}
            label={zh ? "混合冷凝器 · 真空泵" : "Condenser · vacuum pump"}
            value={zh ? "末效真空 ≈88%" : "last-effect vacuum ≈88%"}
            color={metalColors.brine}
          />
          <Tag
            position={[localEffectX(3), DISCHARGE_Y + 0.2, 0]}
            label={zh ? "结晶器" : "Crystallizer"}
            value={zh ? "产盐浆 → 离心" : "salt slurry → centrifuge"}
            color={metalColors.salt}
          />
          {/* 高真空区总览浮标（悬于四效组之上） */}
          <Tag
            position={[(localEffectX(0) + condLocalX) / 2, STEAM_TOP + 1.9, 0]}
            label={zh ? "高真空结晶区" : "HIGH-VACUUM ZONE"}
            value={zh ? "末效 0.012 MPa · 卤水低温沸腾结晶" : "last 0.012 MPa · low-temp boiling"}
            color={metalColors.brine}
          />
          {/* 冷凝器真空表（3D 仪表盘） */}
          <VacuumGauge x={condLocalX} y={2.5} z={-0.55} />
        </>
      )}
    </group>
  );
}

// 冷凝器外壳顶（局部 y），用于二次蒸汽入口高度
function COND_CY_TOP(): number {
  return 0.2 + 2.6 / 2;
}
