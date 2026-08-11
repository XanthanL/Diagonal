"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Lang } from "@/lib/useLang";
import type { StageData } from "@/lib/types";
import { StageCard } from "./StageCard";
import { VacuumPanel } from "./VacuumPanel";
import { OverviewKpi } from "./OverviewKpi";

interface ControlDeckProps {
  stages: StageData[];
  current: number;
  playing: boolean;
  speed: 1 | 2 | 3;
  lang: Lang;
  onGoto: (i: number) => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onCycleSpeed: () => void;
  onOpenInfo: () => void;
  /** 返回全景（聚焦态常驻入口） */
  onOverview: () => void;
  /** 当前是否处于聚焦某环节（非全景） */
  focused: boolean;
  /** 引导式巡游开关 */
  tour: boolean;
  onToggleTour: () => void;
}

/** 播放控制（上一步 / 播放暂停 / 下一步 / 倍速） */
function Playback({
  playing,
  speed,
  onPrev,
  onTogglePlay,
  onNext,
  onCycleSpeed,
}: {
  playing: boolean;
  speed: 1 | 2 | 3;
  onPrev: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onCycleSpeed: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <CtrlBtn onClick={onPrev} label="上一环节">◀</CtrlBtn>
      <button
        onClick={onTogglePlay}
        aria-label={playing ? "暂停" : "播放"}
        className="w-10 h-10 rounded-full bg-diagonal-red text-white hover:bg-diagonal-redDark transition flex items-center justify-center text-sm shadow-[0_0_0_1px_rgba(179,58,42,0.2),0_8px_24px_rgba(179,58,42,0.18)]"
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <CtrlBtn onClick={onNext} label="下一环节">▶</CtrlBtn>
      <button
        onClick={onCycleSpeed}
        className="ml-0.5 px-2.5 h-9 rounded-full text-[11px] font-mono text-ink-700 hover:text-ink-900 border border-black/10 hover:border-diagonal-red/50 transition bg-white"
        title="切换倍速"
      >
        {speed}×
      </button>
    </div>
  );
}

function CtrlBtn({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-9 h-9 rounded-full text-ink-600 hover:text-ink-900 hover:bg-paper-200 transition flex items-center justify-center text-[11px]"
    >
      {children}
    </button>
  );
}

/** 环节步骤条（桌面显示名称，窄屏只显示编号） */
function Stepper({
  stages,
  current,
  lang,
  playing,
  onGoto,
}: {
  stages: StageData[];
  current: number;
  lang: Lang;
  playing: boolean;
  onGoto: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
      {stages.map((s, i) => {
        const isActive = i === current;
        return (
          <div key={s.id} className="flex items-center shrink-0">
            <button
              onClick={() => onGoto(i)}
              title={lang === "zh" ? s.name : s.nameEn}
              className={`group flex items-center gap-2 px-2 py-1.5 rounded-md transition border ${
                isActive
                  ? "bg-diagonal-red/10 border-diagonal-red/40"
                  : "border-transparent hover:bg-paper-200"
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-mono transition ${
                  isActive
                    ? "bg-diagonal-red text-white"
                    : "bg-paper-300 text-ink-500 group-hover:bg-diagonal-red/10"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`hidden lg:inline text-xs whitespace-nowrap ${
                  isActive ? "text-ink-900 font-medium" : "text-ink-600 group-hover:text-ink-900"
                }`}
              >
                {lang === "zh" ? s.name : s.nameEn}
              </span>
            </button>
            {i < stages.length - 1 && (
              <div className="relative w-7 h-px mx-0.5 shrink-0 overflow-visible">
                <div
                  className={`absolute inset-0 ${i < current ? "bg-diagonal-red/40" : "bg-black/15"}`}
                />
                {playing && i === current && (
                  <span className="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-diagonal-red shadow-[0_0_8px_rgba(179,58,42,0.55)] vs-flow-dot-anim" />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 引导式巡游字幕（顶部居中）：当前环节讲解词 + 进度小地图 + 进度条，自管 rAF 动画避免整树重渲染 */
function TourCaption({
  stage,
  stages,
  current,
  lang,
  playing,
  speed,
  onGoto,
}: {
  stage: StageData;
  stages: StageData[];
  current: number;
  lang: Lang;
  playing: boolean;
  speed: 1 | 2 | 3;
  onGoto: (i: number) => void;
}) {
  const zh = lang === "zh";
  const [p, setP] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = performance.now();
    setP(0);
    if (!playing) return;
    let raf = 0;
    const dur = 8000 / speed;
    const tick = () => {
      const el = performance.now() - startRef.current;
      setP(Math.min(1, el / dur));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage.index, playing, speed]);

  const narration = zh ? stage.tour ?? stage.tagline : stage.tourEn ?? stage.taglineEn;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-[min(92vw,580px)] pointer-events-none">
      <div className="bg-white/80 backdrop-blur-md border border-black/[0.06] shadow-sm rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2 text-[10px] text-ink-400 font-mono mb-1">
          <span className="text-diagonal-red">{zh ? "引导式巡游中" : "GUIDED TOUR"}</span>
          <span>
            {String(stage.index + 1).padStart(2, "0")} / 05
          </span>
        </div>
        <div className="font-serif text-base font-bold text-ink-900 leading-tight">
          {zh ? stage.name : stage.nameEn}
        </div>
        <div className="text-[12px] text-ink-600 mt-0.5 leading-relaxed">{narration}</div>
        {/* 进度小地图：五环节点，当前高亮，点击直达（巡游中也能随时跳转） */}
        <div className="mt-2 flex items-center gap-1.5">
          {stages.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onGoto(i)}
              title={lang === "zh" ? s.name : s.nameEn}
              aria-label={lang === "zh" ? s.name : s.nameEn}
              className={`h-1.5 rounded-full transition-all ${
                i === current
                  ? "w-5 bg-diagonal-red"
                  : "w-1.5 bg-black/20 hover:bg-black/40"
              }`}
            />
          ))}
        </div>
        <div className="mt-2 h-1 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full bg-diagonal-red rounded-full"
            style={{ width: `${p * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * 控制台：
 * - 桌面：左侧垂直居中的环节摘要卡 + 底部居中的「步骤条 + 播放」胶囊。
 * - 移动：底部抽屉，默认收起（露出一行：播放 + 当前环节 + 进度点），
 *   点按展开完整步骤与操作，绝不整屏遮挡 3D。
 */
export function ControlDeck(props: ControlDeckProps) {
  const {
    stages,
    current,
    playing,
    speed,
    lang,
    onGoto,
    onTogglePlay,
    onNext,
    onPrev,
    onCycleSpeed,
    onOpenInfo,
    onOverview,
    focused,
    tour,
    onToggleTour,
  } = props;
  const [expanded, setExpanded] = useState(false);
  const stage = stages[current];
  const zh = lang === "zh";

  return (
    <>
      {/* ===== 桌面端 ===== */}
      <div className="hidden md:block absolute inset-0 z-30 pointer-events-none">
        {/* 环节摘要卡：左缘垂直居中，避开顶栏与底部胶囊 */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[330px] max-w-[40vw] pointer-events-auto">
          <StageCard
            stage={stage}
            lang={lang}
            onOpenInfo={onOpenInfo}
          />
        </div>

        {/* 真空梯度 / 工艺真空度面板：常驻右侧，随播放实时爬升 */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[264px] max-w-[40vw] pointer-events-auto">
          <VacuumPanel lang={lang} current={current} />
        </div>

        {/* 全产线 KPI：全景态（非聚焦、非巡游）左下角展示整体指标（③-6） */}
        {!focused && !tour && (
          <div className="absolute left-4 bottom-4 w-[252px] max-w-[44vw] pointer-events-auto">
            <OverviewKpi lang={lang} />
          </div>
        )}

        {/* 底部中央：步骤条 + 播放 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="bg-white/80 backdrop-blur-md border border-black/[0.06] shadow-sm rounded-full pl-2 pr-1.5 py-1.5 flex items-center gap-2">
            <Stepper stages={stages} current={current} lang={lang} playing={playing} onGoto={onGoto} />
            {focused && (
              <button
                onClick={onOverview}
                className="px-2.5 h-9 rounded-full text-[11px] font-mono border border-black/10 bg-white text-ink-700 hover:border-diagonal-red/50 hover:text-diagonal-red transition"
                title={zh ? "返回全景" : "Back to overview"}
              >
                {zh ? "全景" : "Overview"}
              </button>
            )}
            <div className="w-px h-6 bg-black/15" />
            <button
              onClick={onToggleTour}
              className={`px-2.5 h-9 rounded-full text-[11px] font-mono border transition ${
                tour
                  ? "bg-diagonal-red text-white border-diagonal-red"
                  : "bg-white text-ink-700 border-black/10 hover:border-diagonal-red/50 hover:text-diagonal-red"
              }`}
              title={zh ? "引导式巡游" : "Guided tour"}
            >
              {tour ? (zh ? "退出" : "Exit") : zh ? "导览" : "Tour"}
            </button>
            <Playback
              playing={playing}
              speed={speed}
              onPrev={onPrev}
              onTogglePlay={onTogglePlay}
              onNext={onNext}
              onCycleSpeed={onCycleSpeed}
            />
          </div>
        </div>
      </div>

      {/* ===== 移动端：底部抽屉 ===== */}
      <div className="md:hidden absolute inset-x-0 bottom-0 z-30 pointer-events-none">
        <div
          className="pointer-events-auto bg-white/80 backdrop-blur-md border-t border-black/[0.06] shadow-sm rounded-t-2xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* 收起态（常显一行） */}
          <div className="flex items-center gap-3 px-3.5 py-2.5">
            <button
              onClick={onTogglePlay}
              aria-label={playing ? "暂停" : "播放"}
              className="w-10 h-10 shrink-0 rounded-full bg-diagonal-red text-white flex items-center justify-center text-sm shadow-[0_0_0_1px_rgba(179,58,42,0.2),0_8px_24px_rgba(179,58,42,0.18)]"
            >
              {playing ? "❚❚" : "▶"}
            </button>

            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex-1 min-w-0 text-left"
              aria-expanded={expanded}
            >
              <div className="label-eyebrow leading-none">
                STAGE {String(stage.index + 1).padStart(2, "0")} / 05
              </div>
              <div className="text-sm font-medium text-ink-900 truncate leading-tight">
                {lang === "zh" ? stage.name : stage.nameEn}
              </div>
            </button>

            {focused && (
              <button
                onClick={onOverview}
                aria-label={zh ? "返回全景" : "Overview"}
                className="shrink-0 w-8 h-8 rounded-md border border-black/10 text-[10px] font-mono text-ink-600 hover:text-diagonal-red hover:border-diagonal-red/40 flex items-center justify-center"
              >
                {zh ? "全景" : "ALL"}
              </button>
            )}

            {/* 迷你进度点（可直接跳转） */}
            <div className="flex items-center gap-1 shrink-0">
              {stages.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => onGoto(i)}
                  aria-label={lang === "zh" ? s.name : s.nameEn}
                  className={`w-1.5 h-1.5 rounded-full transition ${
                    i === current ? "bg-diagonal-red scale-125" : "bg-black/15"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setExpanded((e) => !e)}
              aria-label={expanded ? "收起" : "展开"}
              className="w-8 h-8 shrink-0 rounded-md text-ink-500 hover:text-ink-900 border border-black/10 flex items-center justify-center"
            >
              {expanded ? "⌄" : "⌃"}
            </button>
          </div>

          {/* 展开内容 */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1 space-y-3 max-h-[52vh] overflow-y-auto">
                  <p className="text-[12px] text-ink-600 leading-relaxed">
                    {lang === "zh" ? stage.tagline : stage.taglineEn}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-ink-500 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-paper-200 text-ink-700">{stage.input}</span>
                    <span className="text-diagonal-red">→</span>
                    <span className="px-1.5 py-0.5 rounded bg-paper-200 text-ink-700 border border-black/10">
                      {stage.output}
                    </span>
                  </div>

                  <Stepper stages={stages} current={current} lang={lang} playing={playing} onGoto={onGoto} />

                  <div className="pointer-events-auto">
                    <VacuumPanel lang={lang} current={current} />
                  </div>

                  {!focused && !tour && (
                    <div className="pointer-events-auto">
                      <OverviewKpi lang={lang} />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={onOpenInfo}
                      className="flex-1 py-2 rounded-md bg-paper-200 text-ink-700 border border-black/10 hover:bg-diagonal-red/10 hover:text-diagonal-red hover:border-diagonal-red/40 transition text-[11px] font-mono"
                    >
                      {lang === "zh" ? "原理 / 参数 →" : "Principle / Parameters →"}
                    </button>
                    {focused && (
                      <button
                        onClick={onOverview}
                        className="px-3 py-2 rounded-md border border-black/10 bg-paper-200 text-ink-700 text-[11px] font-mono transition hover:bg-diagonal-red/10 hover:text-diagonal-red hover:border-diagonal-red/40"
                      >
                        {zh ? "返回全景" : "Overview"}
                      </button>
                    )}
                    <button
                      onClick={onToggleTour}
                      className={`px-3 py-2 rounded-md border text-[11px] font-mono transition ${
                        tour
                          ? "bg-diagonal-red text-white border-diagonal-red"
                          : "bg-paper-200 text-ink-700 border border-black/10 hover:bg-diagonal-red/10 hover:text-diagonal-red hover:border-diagonal-red/40"
                      }`}
                    >
                      {tour ? (zh ? "结束巡游" : "End tour") : zh ? "开始巡游" : "Start tour"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <Playback
                      playing={playing}
                      speed={speed}
                      onPrev={onPrev}
                      onTogglePlay={onTogglePlay}
                      onNext={onNext}
                      onCycleSpeed={onCycleSpeed}
                    />
                    <div className="text-[9px] text-ink-400 font-mono">
                      数据为工业参考值 · 3D 为工艺示意
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 引导式巡游字幕（桌面 / 移动通用） */}
      {tour && (
        <TourCaption
          stage={stage}
          stages={stages}
          current={current}
          lang={lang}
          playing={playing}
          speed={speed}
          onGoto={onGoto}
        />
      )}
    </>
  );
}
