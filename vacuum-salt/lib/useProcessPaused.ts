"use client";

import { createContext, useContext } from "react";

/**
 * 产线动画暂停状态。
 * SceneShell 在 Canvas 内提供该 context；所有 3D 工艺动画（粒子、输送、
 * 机械臂、流化等）通过 useProcessPaused 读取。播放/暂停按钮只冻结产线动画，
 * 不影响相机拖拽、缩放与聚焦过渡。
 */
export const ProcessPausedContext = createContext(false);

export function useProcessPaused() {
  return useContext(ProcessPausedContext);
}
