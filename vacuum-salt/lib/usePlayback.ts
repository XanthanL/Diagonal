"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PlayState = {
  playing: boolean;
  speed: 0 | 1 | 2 | 3;
  stageIndex: number;
  stageCount: number;
};

/**
 * 全局播放进度控制。
 * 自动播放时按 speed 倍率推进聚焦环节。
 */
export function usePlayback(stageCount: number) {
  const [stageIndex, setStageIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const next = useCallback(() => {
    setStageIndex((i) => (i + 1) % stageCount);
  }, [stageCount]);

  const prev = useCallback(() => {
    setStageIndex((i) => (i - 1 + stageCount) % stageCount);
  }, [stageCount]);

  const goto = useCallback((i: number) => {
    setStageIndex(((i % stageCount) + stageCount) % stageCount);
  }, [stageCount]);

  const togglePlay = useCallback(() => setPlaying((p) => !p), []);
  const setPlayingState = useCallback((v: boolean) => setPlaying(v), []);

  useEffect(() => {
    clear();
    if (!playing) return;
    const baseMs = 8000;
    const ms = baseMs / speed;
    timer.current = setTimeout(() => next(), ms);
    return clear;
  }, [playing, speed, stageIndex, next]);

  return {
    stageIndex,
    playing,
    speed,
    setSpeed,
    setStageIndex: goto,
    next,
    prev,
    goto,
    togglePlay,
    setPlaying: setPlayingState,
  };
}
