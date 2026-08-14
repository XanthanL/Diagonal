/**
 * 一体化产线布局：五个环节从左到右排列在一条线上，
 * 设备按 x 坐标分布，管路相连。
 *
 * x 轴向右为流程方向；y 为高度；z 为纵深。
 */

import { STAGE_X, PLATFORM, PIPELINE } from "@/lib/pipelinePorts";

// 从中心端口表再导出，保持既有 `from "./layout"` 引用不破坏
export { STAGE_X, PLATFORM, PIPELINE };

export interface Anchor {
  /** 锚点中心（设备群中心） */
  pos: [number, number, number];
  /** 相机聚焦距离（桌面宽屏基准） */
  distance: number;
  /** 相机高度偏移 */
  height: number;
  /** 环节设备包围盒半宽：用于按视口宽高比修正聚焦距离，避免竖屏裁切 */
  halfWidth: number;
}

// 各环节相机锚点
export const anchors: Record<string, Anchor> = {
  // 环节 1 含地质剖面（高 4.4）与四台设备，取景需更远、视点略高
  brine: { pos: [STAGE_X.brine, 0.3, 0], distance: 14, height: 3.8, halfWidth: 6.2 },
  // 环节 2 含四效 + 冷凝器，横向较宽，取景略远（distance 15 保证四效+冷凝器全入镜）
  evaporate: { pos: [STAGE_X.evaporate + 0.5, 0.5, 0], distance: 15, height: 4.2, halfWidth: 7.6 },
  centrifuge: { pos: [STAGE_X.centrifuge - 1.4, 0.3, 0], distance: 11, height: 3.2, halfWidth: 3.0 },
  dry: { pos: [STAGE_X.dry + 1.0, 0.6, 0], distance: 12.5, height: 3.4, halfWidth: 3.8 },
  pack: { pos: [STAGE_X.pack + 1.4, 0.4, 0], distance: 13, height: 3.6, halfWidth: 4.3 },
};

// 全景相机位置（看到整条产线）
export const overviewCamera: [number, number, number] = [2, 9, 26];

/** 地面编号基座朝向相机一侧的 z 偏移（放在平台前沿，避免遮挡设备） */
export const STAGE_FRONT_Z = 3.1;
