"use client";

import { SceneShell, CameraFocus } from "../SceneShell";
import { metalColors } from "../Tag";
import { BrineUnit } from "./BrineUnit";
import { EvaporateUnit } from "./EvaporateUnit";
import { CentrifugeUnit } from "./CentrifugeUnit";
import { DryUnit } from "./DryUnit";
import { PackUnit } from "./PackUnit";
import { FlowTube } from "./FlowTube";
import { STAGE_X, PLATFORM, anchors, overviewCamera, type Anchor } from "./layout";

interface PipelineSceneProps {
  /** 当前聚焦的环节 id；为 null 时显示全景 */
  focusStageId: string | null;
}

/** 一体化产线：五环节设备相连 + 流向管路 + 相机聚焦 */
export function PipelineScene({ focusStageId }: PipelineSceneProps) {
  // 计算相机锚点
  const anchor: Anchor = focusStageId ? anchors[focusStageId] : {
    pos: [0, 0.5, 0],
    distance: 0,
    height: 0,
  };
  // 全景时用固定相机位置
  const isOverview = !focusStageId;

  return (
    <div className="relative w-full h-full">
      <SceneShell
        cameraPosition={overviewCamera}
        ambient={0.9}
        enableControls={!focusStageId}
      >
        {/* 相机聚焦（仅聚焦时启用） */}
        {!isOverview && (
          <CameraFocus
            target={anchor.pos}
            distance={anchor.distance}
            height={anchor.height}
          />
        )}

        {/* 地面平台（贯穿整条产线） */}
        <mesh position={[(PLATFORM.xMin + PLATFORM.xMax) / 2, PLATFORM.y, 0]} receiveShadow>
          <boxGeometry args={[PLATFORM.xMax - PLATFORM.xMin, 0.16, PLATFORM.depth]} />
          <meshStandardMaterial color="#eef2f7" metalness={0.2} roughness={0.85} />
        </mesh>
        {/* 平台中线（流程方向提示） */}
        <mesh position={[(PLATFORM.xMin + PLATFORM.xMax) / 2, PLATFORM.y + 0.085, 0]}>
          <boxGeometry args={[PLATFORM.xMax - PLATFORM.xMin - 1, 0.012, 0.08]} />
          <meshStandardMaterial color={metalColors.brine} emissive={metalColors.brine} emissiveIntensity={0.2} transparent opacity={0.5} />
        </mesh>

        {/* 五大环节设备 */}
        <BrineUnit />
        <EvaporateUnit />
        <CentrifugeUnit />
        <DryUnit />
        <PackUnit />

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

      {/* 画布外提示 */}
      <div className="absolute bottom-3 right-3 panel rounded-md px-3 py-1.5 text-[10px] text-ink-600 max-w-[240px] shadow-soft">
        {focusStageId ? "聚焦视图 · 点击导航切换环节" : "全景视图 · 拖拽旋转 / 点击导航聚焦环节"}
      </div>
    </div>
  );
}
