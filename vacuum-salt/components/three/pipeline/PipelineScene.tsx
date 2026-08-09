"use client";

import { useThree } from "@react-three/fiber";
import type CameraControlsImpl from "camera-controls";
import { useEffect } from "react";
import * as THREE from "three";
import { SceneShell, CameraFocus } from "../SceneShell";
import { metalColors } from "../Tag";
import { BrineUnit } from "./BrineUnit";
import { EvaporateUnit } from "./EvaporateUnit";
import { CentrifugeUnit } from "./CentrifugeUnit";
import { DryUnit } from "./DryUnit";
import { PackUnit } from "./PackUnit";
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
}

/** 一体化产线：五环节设备相连 + 流向管路 + 相机飞行 */
export function PipelineScene({ cameraStageId, onSelectStage }: PipelineSceneProps) {
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
        <BrineUnit onSelect={() => onSelectStage("brine")} />
        <EvaporateUnit onSelect={() => onSelectStage("evaporate")} />
        <CentrifugeUnit onSelect={() => onSelectStage("centrifuge")} />
        <DryUnit onSelect={() => onSelectStage("dry")} />
        <PackUnit onSelect={() => onSelectStage("pack")} />

        {/* 连接管路：精卤 → 蒸发器 */}
        <FlowTube
          points={[
            [STAGE_X.brine + 6.0, -0.4, 0],
            [STAGE_X.brine + 7.5, 0.3, 0],
            [STAGE_X.evaporate + 1.5 * 2.6, 0.3, 0],
            [STAGE_X.evaporate + 1.5 * 2.6, -1.5, 0],
          ]}
          color={metalColors.brine}
          particleCount={7}
          speed={0.24}
        />

        {/* 二次蒸汽逐效回用（顶部弧线） */}
        <FlowTube
          points={[
            [STAGE_X.evaporate + 1.5 * 2.6, 2.4, 0],
            [STAGE_X.evaporate + 0.5 * 2.6, 3.0, 0],
            [STAGE_X.evaporate + 0.5 * 2.6, 2.4, 0],
            [STAGE_X.evaporate - 0.5 * 2.6, 3.0, 0],
            [STAGE_X.evaporate - 0.5 * 2.6, 2.4, 0],
            [STAGE_X.evaporate - 1.5 * 2.6, 3.0, 0],
          ]}
          color={metalColors.steam}
          radius={0.06}
          particleCount={6}
          speed={0.18}
          particleSize={0.1}
        />

        {/* 盐浆 → 离心机 */}
        <FlowTube
          points={[
            [STAGE_X.evaporate - 1.5 * 2.6, -0.5, 0],
            [STAGE_X.centrifuge - 1.2, -0.5, 0],
            [STAGE_X.centrifuge, 2.2, 0],
          ]}
          color={metalColors.salt}
          particleCount={6}
          speed={0.2}
        />

        {/* 湿盐 → 干燥床 */}
        <FlowTube
          points={[
            [STAGE_X.centrifuge, -0.6, 0],
            [STAGE_X.dry - 1.4, -0.6, 0],
            [STAGE_X.dry - 1.4, -0.1, 0],
          ]}
          color={metalColors.salt}
          particleCount={5}
          speed={0.22}
        />

        {/* 干盐 → 包装机 */}
        <FlowTube
          points={[
            [STAGE_X.dry + 3.0, -0.4, 0],
            [STAGE_X.pack - 0.6, -0.4, 0],
            [STAGE_X.pack - 0.6, 0.4, 0],
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
