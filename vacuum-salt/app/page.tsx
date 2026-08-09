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
  const [focused, setFocused] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [refsOpen, setRefsOpen] = useState(false);

  const stage = stages[playback.stageIndex];

  // 自动播放时进入聚焦；暂停后保留聚焦
  const handleTogglePlay = () => {
    if (!playback.playing) setFocused(true);
    playback.togglePlay();
  };

  // 点击导航：聚焦到该环节
  const handleGoto = (i: number) => {
    playback.goto(i);
    setFocused(true);
    setInfoOpen(false);
  };

  // 上一步 / 下一步：保持聚焦
  const handleNext = () => {
    playback.next();
    setFocused(true);
  };
  const handlePrev = () => {
    playback.prev();
    setFocused(true);
  };

  const cycleSpeed = () => {
    playback.setSpeed(playback.speed === 1 ? 2 : playback.speed === 2 ? 3 : 1);
  };

  // 自动播放推进时同步聚焦
  const stageId = focused ? stage.id : null;

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-paper-100">
      {/* 背景网格 */}
      <div
        className="absolute inset-0 bg-grid-faint opacity-50 pointer-events-none"
        style={{ backgroundSize: "48px 48px" }}
      />

      {/* 一体化 3D 产线 */}
      <div className="absolute inset-0">
        <SceneLoader focusStageId={stageId} />
      </div>

      {/* 顶部细栏 */}
      <NavBar
        lang={lang}
        focused={focused}
        onExitFocus={() => setFocused(false)}
        onToggleLang={toggle}
        onOpenIntro={() => setIntroOpen(true)}
        onOpenRefs={() => setRefsOpen(true)}
      />

      {/* 控制台（桌面浮层 / 移动底部抽屉） */}
      <ControlDeck
        stages={stages}
        current={playback.stageIndex}
        focused={focused}
        playing={playback.playing}
        speed={playback.speed}
        lang={lang}
        onGoto={handleGoto}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onCycleSpeed={cycleSpeed}
        onToggleFocus={() => setFocused((f) => !f)}
        onOpenInfo={() => setInfoOpen(true)}
      />

      {/* 抽屉与弹层 */}
      <InfoPanel stage={stage} lang={lang} open={infoOpen} onClose={() => setInfoOpen(false)} />
      <IntroPanel lang={lang} open={introOpen} onClose={() => setIntroOpen(false)} />
      <RefsPanel open={refsOpen} lang={lang} onClose={() => setRefsOpen(false)} />
    </main>
  );
}
