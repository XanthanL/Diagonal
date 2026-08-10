"use client";

import { useThree } from "@react-three/fiber";
import type CameraControlsImpl from "camera-controls";
import { useEffect } from "react";
import * as THREE from "three";
import { SceneShell, CameraFocus } from "../SceneShell";
import { metalColors } from "../Tag";
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

  // 分环节编组：位置 + 语义染色
  const stageList = [
    { id: "brine", x: STAGE_X.brine, tint: metalColors.brine },
    { id: "evaporate", x: STAGE_X.evaporate, tint: metalColors.brine },
    { id: "centrifuge", x: STAGE_X.centrifuge, tint: metalColors.alloy },
    { id: "dry", x: STAGE_X.dry, tint: metalColors.amber },
    { id: "pack", x: STAGE_X.pack, tint: metalColors.alloy },
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

        {/* 地面平台（贯穿整条产线） */}
        <mesh position={[PIPELINE.centerX, PLATFORM.y, 0]} receiveShadow>
          <boxGeometry args={[PLATFORM.xMax - PLATFORM.xMin, 0.16, PLATFORM.depth]} />
          <meshStandardMaterial color="#eef2f7" metalness={0.2} roughness={0.85} />
        </mesh>

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

        {/* 五大环节设备（点击模块即飞向该环节） */}
        <BrineUnit
          onSelect={() => onSelectStage("brine")}
          focused={cameraStageId === "brine"}
          lang={lang}
        />
        <EvaporateUnit
          onSelect={() => onSelectStage("evaporate")}
          focused={cameraStageId === "evaporate"}
          lang={lang}
        />
        <CentrifugeUnit
          onSelect={() => onSelectStage("centrifuge")}
          focused={cameraStageId === "centrifuge"}
          lang={lang}
        />
        <DryUnit
          onSelect={() => onSelectStage("dry")}
          focused={cameraStageId === "dry"}
          lang={lang}
        />
        <PackUnit
          onSelect={() => onSelectStage("pack")}
          focused={cameraStageId === "pack"}
          lang={lang}
        />

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
          particleCount={8}
          speed={0.24}
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
        />
      </SceneShell>

      {/* 画布外提示（仅桌面显示，移动端由控制抽屉承担引导） */}
      <div className="hidden sm:block absolute top-16 right-3 panel rounded-md px-3 py-1.5 text-[10px] text-ink-600 max-w-[230px] shadow-soft pointer-events-none">
        {cameraStageId
          ? "已对准该环节 · 仍可拖拽自由旋转 / 缩放"
          : "全景视图 · 拖拽旋转 / 点击下方编号或设备对准环节"}
      </div>
    </div>
  );
}
