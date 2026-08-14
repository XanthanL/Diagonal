"use client";

import { useRef, useState, useEffect } from "react";
import { stages } from "@/lib/data";
import { useLang } from "@/lib/useLang";
import { usePlayback } from "@/lib/usePlayback";
import { SceneLoader } from "@/components/three/pipeline/SceneLoader";
import { NavBar } from "@/components/hud/NavBar";
import { ControlDeck } from "@/components/hud/ControlDeck";
import { InfoPanel, IntroPanel } from "@/components/hud/InfoPanel";
import { RefsPanel } from "@/components/hud/RefsPanel";
import { Coachmark } from "@/components/hud/Coachmark";

/** 客户端挂载后才渲染子节点，避免 useMediaQuery 等客户端状态导致 hydration mismatch */
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? children : null;
}

export default function Home() {
  const { lang, toggle } = useLang();
  const playback = usePlayback(stages.length);
  // 相机目标环节：点击/播放时飞过去对准，但绝不锁定——飞完用户可自由旋转
  const [cameraStageId, setCameraStageId] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [refsOpen, setRefsOpen] = useState(false);
  // 首入操作引导（仅首次访问，localStorage 标记）；在引言关闭后才出现（③-7）
  const [coachOpen, setCoachOpen] = useState(false);
  // 引导式自动巡游
  const [tour, setTour] = useState(false);
  const tourRef = useRef(false);
  const tourAdvances = useRef(0);

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

  // 引导式巡游：开启即开始自动播放，飞掠五个环节；走完一轮自动收尾
  const handleToggleTour = () => {
    const willTour = !tour;
    setTour(willTour);
    tourRef.current = willTour;
    if (willTour) {
      setCameraStageId(stages[playback.stageIndex].id);
      if (!playback.playing) playback.togglePlay();
      tourAdvances.current = 0;
    } else if (playback.playing) {
      playback.togglePlay();
    }
  };

  // 巡游走完一轮（访问全部环节）后自动停止；只在真实切换环节时计数，
  // 用 tourRef 屏蔽 tour/playing 变化引发的无效计数
  useEffect(() => {
    if (!tourRef.current) return;
    tourAdvances.current += 1;
    if (tourAdvances.current >= stages.length) {
      tourRef.current = false;
      setTour(false);
      if (playback.playing) playback.togglePlay();
    }
  }, [playback.stageIndex]);

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

  // 返回全景（清空相机目标，overview 自适应取景）
  const handleOverview = () => setCameraStageId(null);

  // 首次访问：引言关闭后弹出操作引导；localStorage 记录已读，仅首访出现
  useEffect(() => {
    try {
      if (!localStorage.getItem("vs_coach_done")) setCoachOpen(true);
    } catch {
      setCoachOpen(true);
    }
  }, []);
  const handleCoachClose = () => {
    setCoachOpen(false);
    try {
      localStorage.setItem("vs_coach_done", "1");
    } catch {
      /* 忽略隐私模式写入失败 */
    }
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
        <SceneLoader
          cameraStageId={activeCameraId}
          onSelectStage={handleSelectStage}
          lang={lang}
          paused={!playback.playing}
        />
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
        onOverview={handleOverview}
        focused={cameraStageId !== null}
        tour={tour}
        onToggleTour={handleToggleTour}
      />

      {/* 抽屉与弹层：全部延迟到客户端挂载后渲染。
          IntroPanel 默认 open=true，其 framer-motion motion.div 在 SSR 输出 animate 终态样式、
          而客户端首帧渲染 initial 初态样式，二者不一致会触发 hydration mismatch 并导致交互失效，
          故用 ClientOnly 包裹，既规避 mismatch 又保留入场动画（挂载后播放）。 */}
      <ClientOnly>
        <InfoPanel stage={stage} lang={lang} open={infoOpen} onClose={() => setInfoOpen(false)} />
        <IntroPanel lang={lang} open={introOpen} onClose={() => setIntroOpen(false)} />
        <RefsPanel open={refsOpen} lang={lang} onClose={() => setRefsOpen(false)} />
        <Coachmark lang={lang} open={coachOpen && !introOpen} onClose={handleCoachClose} />
      </ClientOnly>
    </main>
  );
}
