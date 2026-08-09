"use client";

import { useState } from "react";
import { stages } from "@/lib/data";
import { useLang } from "@/lib/useLang";
import { usePlayback } from "@/lib/usePlayback";
import { SceneLoader } from "@/components/three/pipeline/SceneLoader";
import { NavBar } from "@/components/hud/NavBar";
import { ControlDeck } from "@/components/hud/ControlDeck";
import { InfoPanel, IntroPanel } from "@/components/hud/InfoPanel";
import { RefsPanel } from "@/components/hud/RefsPanel";

export default function Home() {
  const { lang, toggle } = useLang();
  const playback = usePlayback(stages.length);
  // 相机目标环节：点击/播放时飞过去对准，但绝不锁定——飞完用户可自由旋转
  const [cameraStageId, setCameraStageId] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [refsOpen, setRefsOpen] = useState(false);

  const stage = stages[playback.stageIndex];

  // 飞到指定环节：同步进度并设定相机目标
  const flyTo = (i: number) => {
    playback.goto(i);
    setCameraStageId(stages[i].id);
  };

  // 自动播放时相机跟随当前环节（非锁定，可随时手动旋转）
  const activeCameraId = playback.playing ? stages[playback.stageIndex].id : cameraStageId;

  const handleTogglePlay = () => {
    if (!playback.playing) setCameraStageId(stages[playback.stageIndex].id);
    playback.togglePlay();
  };

  const handleGoto = (i: number) => flyTo(i);

  const handleNext = () => {
    const ni = (playback.stageIndex + 1) % stages.length;
    flyTo(ni);
  };
  const handlePrev = () => {
    const pi = (playback.stageIndex - 1 + stages.length) % stages.length;
    flyTo(pi);
  };

  // 点击 3D 中的模块 / 板块：移动相机对准，不锁定
  const handleSelectStage = (id: string) => {
    const i = stages.findIndex((s) => s.id === id);
    if (i >= 0) flyTo(i);
  };

  const cycleSpeed = () => {
    playback.setSpeed(playback.speed === 1 ? 2 : playback.speed === 2 ? 3 : 1);
  };

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-paper-100">
      {/* 背景网格 */}
      <div
        className="absolute inset-0 bg-grid-faint opacity-50 pointer-events-none"
        style={{ backgroundSize: "48px 48px" }}
      />

      {/* 一体化 3D 产线 */}
      <div className="absolute inset-0">
        <SceneLoader cameraStageId={activeCameraId} onSelectStage={handleSelectStage} />
      </div>

      {/* 顶部细栏 */}
      <NavBar
        lang={lang}
        onToggleLang={toggle}
        onOpenIntro={() => setIntroOpen(true)}
        onOpenRefs={() => setRefsOpen(true)}
        onOverview={() => setCameraStageId(null)}
      />

      {/* 控制台（桌面浮层 / 移动底部抽屉） */}
      <ControlDeck
        stages={stages}
        current={playback.stageIndex}
        playing={playback.playing}
        speed={playback.speed}
        lang={lang}
        onGoto={handleGoto}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onCycleSpeed={cycleSpeed}
        onOpenInfo={() => setInfoOpen(true)}
      />

      {/* 抽屉与弹层 */}
      <InfoPanel stage={stage} lang={lang} open={infoOpen} onClose={() => setInfoOpen(false)} />
      <IntroPanel lang={lang} open={introOpen} onClose={() => setIntroOpen(false)} />
      <RefsPanel open={refsOpen} lang={lang} onClose={() => setRefsOpen(false)} />
    </main>
  );
}
