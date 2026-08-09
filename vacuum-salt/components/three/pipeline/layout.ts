/**
 * 一体化产线布局：五个环节从左到右排列在一条线上，
 * 设备按 x 坐标分布，管路相连。
 *
 * x 轴向右为流程方向；y 为高度；z 为纵深。
 */

export interface Anchor {
  /** 锚点中心（设备群中心） */
  pos: [number, number, number];
  /** 相机聚焦距离 */
  distance: number;
  /** 相机高度偏移 */
  height: number;
}

// 环节中心 x 坐标（从左到右）
// 注意：环节 1（井卤开采与净化）设备组较宽（约 11.5 单位），
// 需与环节 2 的末效冷凝器留出间距，故 brine 左移至 -20。
export const STAGE_X = {
  brine: -20,
  evaporate: -6,
  centrifuge: 4,
  dry: 12,
  pack: 21,
} as const;

// 各环节相机锚点
export const anchors: Record<string, Anchor> = {
  // 环节 1 含地质剖面（高 4.4）与四台设备，取景需更远、视点略高
  brine: { pos: [STAGE_X.brine, 0.3, 0], distance: 14, height: 3.8 },
  // 环节 2 含四效 + 冷凝器，横向较宽，取景略远（distance 15 保证四效+冷凝器全入镜）
  evaporate: { pos: [STAGE_X.evaporate + 0.5, 0.5, 0], distance: 15, height: 4.2 },
  centrifuge: { pos: [STAGE_X.centrifuge - 1.4, 0.3, 0], distance: 11, height: 3.2 },
  dry: { pos: [STAGE_X.dry + 1.0, 0.6, 0], distance: 11, height: 3.0 },
  pack: { pos: [STAGE_X.pack + 1.4, 0.4, 0], distance: 12, height: 3.2 },
};

// 全景相机位置（看到整条产线）
export const overviewCamera: [number, number, number] = [2, 9, 26];

// 地面平台范围
export const PLATFORM = {
  xMin: -27,
  xMax: 26,
  depth: 7,
  y: -2.6,
};

/** 产线整体几何度量（用于自适应取景） */
export const PIPELINE = {
  centerX: (PLATFORM.xMin + PLATFORM.xMax) / 2,
  centerY: 0.4,
  halfWidth: (PLATFORM.xMax - PLATFORM.xMin) / 2,
};

/** 地面编号基座朝向相机一侧的 z 偏移（放在平台前沿，避免遮挡设备） */
export const STAGE_FRONT_Z = 3.1;
