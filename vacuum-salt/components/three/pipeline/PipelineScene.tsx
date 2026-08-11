"use client";

import { useThree, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type CameraControlsImpl from "camera-controls";
import { useEffect, useState, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { SceneShell, CameraFocus } from "../SceneShell";
import { metalColors, Tag } from "../Tag";
import { stages } from "@/lib/data";
import { BrineUnit, BRINE_OUTLET } from "./BrineUnit";
import { EvaporateUnit, EVAP_BRINE_INLET, EVAP_SALT_OUTLET } from "./EvaporateUnit";
import { CentrifugeUnit, CENTRIFUGE_INLET, CENTRIFUGE_WET_OUTLET } from "./CentrifugeUnit";
import { DryUnit, DRY_INLET, DRY_OUTLET } from "./DryUnit";
import { PackUnit, PACK_INLET } from "./PackUnit";
import { FlowTube } from "./FlowTube";
import { FlowRail } from "./FlowRail";
import { StageMarker } from "./StageMarker";
import { STAGE_X, PLATFORM, PIPELINE, anchors, overviewCamera, type Anchor } from "./layout";

/**
 * 全景自适应取景：按视口宽高比动态计算相机距离，
 * 保证在桌面宽屏与手机竖屏下都能「看全」整条产线。
 */
function OverviewFit() {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useEffect(() => {
    if (!controls) return;
    const aspect = size.width / size.height;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const halfW = PIPELINE.halfWidth * 1.12; // 留边距
    let dist = halfW / (Math.tan(vfov / 2) * aspect);
    dist = THREE.MathUtils.clamp(dist, 18, 60);
    controls.setLookAt(PIPELINE.centerX, 8.5, dist, PIPELINE.centerX, PIPELINE.centerY, 0, true);
  }, [controls, camera, size]);

  return null;
}

interface PipelineSceneProps {
  /** 相机目标环节 id（点击/播放后飞过去对准，但不锁定）；为 null 时显示全景 */
  cameraStageId: string | null;
  /** 点击 3D 中的模块 / 板块时回调 */
  onSelectStage: (id: string) => void;
  /** 界面语言（3D 内浮标文案跟随） */
  lang?: "zh" | "en";
  /** 场景首次渲染完成后回调（用于收起加载覆盖层） */
  onReady?: () => void;
}

/**
 * 首帧就绪信号：Canvas 树挂载、渲染循环启动后，等两帧确认首帧已提交，
 * 再通知外层收起加载覆盖层。放在 Canvas 内才能反映 WebGL 真实就绪时刻。
 */
function SceneReadySignal({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => onReady());
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [onReady]);
  return null;
}

/** 一体化产线：五环节设备相连 + 流向管路 + 相机飞行 */
export function PipelineScene({
  cameraStageId,
  onSelectStage,
  lang = "zh",
  onReady,
}: PipelineSceneProps) {
  const anchor: Anchor = cameraStageId
    ? anchors[cameraStageId]
    : { pos: [0, 0.5, 0], distance: 0, height: 0 };
  const isOverview = !cameraStageId;
  // 系统“减弱动效”偏好：冻结 3D 粒子与脉冲（③-4）
  const reduced = useReducedMotion() ?? false;

  // 分环节编组：位置 + 语义染色
  const stageList = [
    { id: "brine", x: STAGE_X.brine, tint: metalColors.brine, labelY: 3.2 },
    { id: "evaporate", x: STAGE_X.evaporate, tint: metalColors.brine, labelY: 5.2 },
    { id: "centrifuge", x: STAGE_X.centrifuge, tint: metalColors.alloy, labelY: 4.2 },
    { id: "dry", x: STAGE_X.dry, tint: metalColors.amber, labelY: 3.2 },
    { id: "pack", x: STAGE_X.pack, tint: metalColors.alloy, labelY: 3.6 },
  ];

  return (
    <div className="relative w-full h-full">
      <SceneShell cameraPosition={overviewCamera} ambient={0.9} enableControls>
        {/* 相机：全景自适应 / 聚焦飞行 */}
        {isOverview ? (
          <OverviewFit />
        ) : (
          <CameraFocus
            target={anchor.pos}
            distance={anchor.distance}
            height={anchor.height}
          />
        )}

        {/* 首帧就绪信号（Canvas 内） */}
        {onReady && <SceneReadySignal onReady={onReady} />}

        {/* 场景雾：全景态轻雾给纵深；聚焦态浓雾压暗远处环节，焦点即所得（③-1 氛围 / ②-1） */}
        <fog attach="fog" args={isOverview ? ["#eef1f5", 26, 82] : ["#eef1f5", 18, 52]} />

        {/* 地面环境光晕：径向渐变贴图，给产线“落地”的空间感（③-1 场景氛围） */}
        <FloorGlow />

        {/* 聚焦态地面光环：常驻于对准环节，强化“已选中”；切全景时淡出回正 */}
        <FocusHalo x={cameraStageId ? STAGE_X[cameraStageId as keyof typeof STAGE_X] : null} />

        {/* 地面平台（贯穿整条产线） */}
        <mesh position={[PIPELINE.centerX, PLATFORM.y, 0]} receiveShadow>
          <boxGeometry args={[PLATFORM.xMax - PLATFORM.xMin, 0.16, PLATFORM.depth]} />
          <meshStandardMaterial color="#eef2f7" metalness={0.2} roughness={0.85} />
        </mesh>

        {/* 统一米制标尺：平台前缘的尺度参照（③-5） */}
        <ScaleRuler />

        {/* 流向轨：流程方向叙事（青蓝 → 盐白） */}
        <FlowRail />

        {/* 分环节地面编号基座 */}
        {stageList.map((s, i) => (
          <StageMarker
            key={s.id}
            x={s.x}
            index={i}
            tint={s.tint}
            active={cameraStageId === s.id}
            onSelect={() => onSelectStage(s.id)}
          />
        ))}

        {/* 五大环节设备（hover 预览 + 点击模块即飞向该环节） */}
        <HoverStage id="brine" x={STAGE_X.brine} labelY={3.2} focused={cameraStageId === "brine"} lang={lang} onSelect={() => onSelectStage("brine")}>
          <BrineUnit onSelect={() => onSelectStage("brine")} focused={cameraStageId === "brine"} lang={lang} />
        </HoverStage>
        <HoverStage id="evaporate" x={STAGE_X.evaporate} labelY={5.2} focused={cameraStageId === "evaporate"} lang={lang} onSelect={() => onSelectStage("evaporate")}>
          <EvaporateUnit onSelect={() => onSelectStage("evaporate")} focused={cameraStageId === "evaporate"} lang={lang} />
        </HoverStage>
        <HoverStage id="centrifuge" x={STAGE_X.centrifuge} labelY={4.2} focused={cameraStageId === "centrifuge"} lang={lang} onSelect={() => onSelectStage("centrifuge")}>
          <CentrifugeUnit onSelect={() => onSelectStage("centrifuge")} focused={cameraStageId === "centrifuge"} lang={lang} />
        </HoverStage>
        <HoverStage id="dry" x={STAGE_X.dry} labelY={3.2} focused={cameraStageId === "dry"} lang={lang} onSelect={() => onSelectStage("dry")}>
          <DryUnit onSelect={() => onSelectStage("dry")} focused={cameraStageId === "dry"} lang={lang} />
        </HoverStage>
        <HoverStage id="pack" x={STAGE_X.pack} labelY={3.6} focused={cameraStageId === "pack"} lang={lang} onSelect={() => onSelectStage("pack")}>
          <PackUnit onSelect={() => onSelectStage("pack")} focused={cameraStageId === "pack"} lang={lang} />
        </HoverStage>

        {/* 连接管路：精卤 → Ⅰ效加热室（贴剖切面浅绕，全景下可见且直观接入） */}
        <FlowTube
          points={[
            BRINE_OUTLET,
            [BRINE_OUTLET[0] + 1.7, -1.7, -0.22],
            [BRINE_OUTLET[0] + 3.1, -1.62, -0.45],
            [EVAP_BRINE_INLET[0] - 0.35, -1.52, -0.5],
            EVAP_BRINE_INLET,
          ]}
          color={metalColors.brine}
          toColor={metalColors.salt}
          particleCount={8}
          speed={0.24}
          pulse
          reduced={reduced}
        />

        {/* 盐浆 → 离心机（从Ⅳ效排料口引出，接入旋流器进料口） */}
        <FlowTube
          points={[
            EVAP_SALT_OUTLET,
            [EVAP_SALT_OUTLET[0] + 0.8, -0.9, 0],
            [STAGE_X.centrifuge - 3.5, 0.6, 0],
            [STAGE_X.centrifuge - 2.9, 1.6, 0],
            CENTRIFUGE_INLET,
          ]}
          color={metalColors.salt}
          particleCount={6}
          speed={0.2}
          pulse
          reduced={reduced}
        />

        {/* 湿盐 → 干燥床（接入流化床左下进料口） */}
        <FlowTube
          points={[
            CENTRIFUGE_WET_OUTLET,
            [STAGE_X.dry - 2.4, -0.6, 0],
            DRY_INLET,
          ]}
          color={metalColors.salt}
          particleCount={5}
          speed={0.22}
          pulse
          reduced={reduced}
        />

        {/* 干盐 → 包装机（流化床出料 → 包装机进料口） */}
        <FlowTube
          points={[
            DRY_OUTLET,
            [STAGE_X.pack - 1.4, -0.4, 0],
            PACK_INLET,
          ]}
          color={metalColors.salt}
          particleCount={5}
          speed={0.22}
          pulse
          reduced={reduced}
        />
      </SceneShell>

      {/* 画布外提示（仅桌面显示，移动端由控制抽屉承担引导） */}
      <div className="hidden sm:block absolute top-16 right-3 bg-white/80 backdrop-blur-md border border-black/[0.06] shadow-sm rounded-md px-3 py-1.5 text-[10px] text-ink-600 max-w-[230px] pointer-events-none">
        {cameraStageId
          ? "已对准该环节 · 仍可拖拽自由旋转 / 缩放"
          : "全景视图 · 拖拽旋转 / 点击下方编号或设备对准环节"}
      </div>
    </div>
  );
}

/**
 * 环节设备 hover 预览层：悬停时整体轻微抬升 + 光标变 pointer + 名称浮标，
 * 提示「该设备可点击聚焦」，提升 3D 可发现性。点击即飞向对应环节。
 */
function HoverStage({
  id,
  x,
  labelY,
  focused,
  lang,
  onSelect,
  children,
}: {
  id: string;
  x: number;
  labelY: number;
  focused: boolean;
  lang: "zh" | "en";
  onSelect: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const stage = stages.find((s) => s.id === id);

  useFrame(() => {
    if (!ref.current) return;
    const target = hovered && !focused ? 0.16 : 0;
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, target, 9, 0.016);
  });

  return (
    <group
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {children}
      {hovered && !focused && stage && (
        <Tag
          position={[x, labelY, 0]}
          label={lang === "zh" ? stage.name : stage.nameEn}
          value={lang === "zh" ? "点击查看原理" : "click for detail"}
          color="#B33A2A"
        />
      )}
    </group>
  );
}

/**
 * 聚焦态地面光环：常驻于当前对准的环节，用品牌红描边强调“已选中”，
 * 让点选后的模型本体与未聚焦区立刻区分开（②-1 聚焦态描边/压暗）。
 * 切回全景时阻尼淡出（scale→0），作为“回正微动效”（②-3 持续选中态+过渡）。
 */
function FocusHalo({ x }: { x: number | null }) {
  const ref = useRef<THREE.Group>(null);
  const lastX = useRef(PIPELINE.centerX);
  useFrame(() => {
    if (!ref.current) return;
    const targetX = x ?? lastX.current;
    if (x != null) lastX.current = x;
    ref.current.position.x = THREE.MathUtils.damp(ref.current.position.x, targetX, 9, 0.016);
    const targetS = x != null ? 1 : 0;
    const s = THREE.MathUtils.damp(ref.current.scale.x, targetS, 8, 0.016);
    ref.current.scale.setScalar(Math.max(0.0001, s));
  });
  return (
    <group ref={ref} position={[PIPELINE.centerX, PLATFORM.y + 0.12, 0]} scale={0.0001}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.0, 2.55, 64]} />
        <meshBasicMaterial color="#B33A2A" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 2.0, 64]} />
        <meshBasicMaterial color="#B33A2A" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * 地面环境光晕：在平台与地面之间铺一层径向渐变贴图，
 * 让整条产线“落地”有空间纵深感（③-1 场景氛围）。
 * 贴图在客户端 effect 中生成，避免 SSR 访问 document。
 */
function FloorGlow() {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,0.5)");
    g.addColorStop(0.55, "rgba(228,236,245,0.22)");
    g.addColorStop(1, "rgba(228,236,245,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    setTex(t);
    return () => t.dispose();
  }, []);
  if (!tex) return null;
  return (
    <mesh position={[PIPELINE.centerX, PLATFORM.y + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[PLATFORM.xMax - PLATFORM.xMin + 8, PLATFORM.depth + 8]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0.9} />
    </mesh>
  );
}

/**
 * 统一米制标尺：平台前缘的尺度参照条（③-5）。
 * 8 场景单位 ≈ 8 m（示意），带刻度与“m”标注，给工业装置一个尺度感。
 */
function ScaleRuler() {
  const len = 8;
  const x0 = PLATFORM.xMin + 2.5;
  const z = PLATFORM.depth / 2 + 0.35;
  const y = PLATFORM.y + 0.06;
  const ticks = Array.from({ length: len + 1 }, (_, i) => x0 + i);
  return (
    <group>
      <mesh position={[(x0 * 2 + len) / 2, y, z]}>
        <boxGeometry args={[len, 0.035, 0.035]} />
        <meshStandardMaterial color={metalColors.alloyMid} metalness={0.3} roughness={0.7} />
      </mesh>
      {ticks.map((tx, i) => (
        <mesh key={i} position={[tx, y, z]}>
          <boxGeometry args={[0.035, i % 2 === 0 ? 0.2 : 0.12, 0.035]} />
          <meshStandardMaterial color={metalColors.alloyMid} metalness={0.3} roughness={0.7} />
        </mesh>
      ))}
      <Html position={[x0 + len + 0.7, y + 0.12, z]} center distanceFactor={16} zIndexRange={[15, 0]}>
        <div className="pointer-events-none select-none text-[10px] font-mono text-ink-400 whitespace-nowrap">8 m</div>
      </Html>
    </group>
  );
}
