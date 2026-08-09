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
export const STAGE_X = {
  brine: -18,
  evaporate: -6,
  centrifuge: 4,
  dry: 12,
  pack: 21,
} as const;

// 各环节相机锚点
export const anchors: Record<string, Anchor> = {
  brine: { pos: [STAGE_X.brine, 0.5, 0], distance: 11, height: 3.5 },
  evaporate: { pos: [STAGE_X.evaporate, 0.5, 0], distance: 12, height: 4 },
  centrifuge: { pos: [STAGE_X.centrifuge, 0.5, 0], distance: 9, height: 3 },
  dry: { pos: [STAGE_X.dry, 0.5, 0], distance: 10, height: 3.2 },
  pack: { pos: [STAGE_X.pack, 0.5, 0], distance: 11, height: 3.5 },
};

// 全景相机位置（看到整条产线）
export const overviewCamera: [number, number, number] = [2, 9, 26];

// 地面平台范围
export const PLATFORM = {
  xMin: -24,
  xMax: 26,
  depth: 7,
  y: -2.6,
};
