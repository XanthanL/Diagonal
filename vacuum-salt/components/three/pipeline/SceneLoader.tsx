"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";

const PipelineScene = dynamic(
  () => import("./PipelineScene").then((m) => m.PipelineScene),
  { ssr: false }
);

/**
 * 建模加载覆盖层：覆盖整个画布，直到 3D 首帧渲染完成（onReady）后淡出。
 * 场景为自绘几何体、无外部 GLTF/纹理，故用 indeterminate 品牌红条纹表达「正在构建」，
 * 避免网络慢的用户在 WebGL 初始化 / 首帧编译期间误以为网页不完整。
 */
function LoadingOverlay({ visible, lang }: { visible: boolean; lang: "zh" | "en" }) {
  const zh = lang === "zh";
  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-paper-100 transition-opacity duration-700 ease-out ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="flex flex-col items-center gap-5">
        {/* 品牌红旋转环 */}
        <div className="h-9 w-9 rounded-full border-2 border-brine-200 border-t-diagonal-red animate-spin" />
        {/* 进度条（indeterminate 条纹） */}
        <div className="vs-loading-track h-1 w-52 rounded-full bg-brine-100">
          <div className="vs-loading-bar" />
        </div>
        {/* 文案 */}
        <div className="label-eyebrow text-center leading-relaxed">
          {zh ? "正在构建 3D 产线模型" : "BUILDING 3D PIPELINE"}
          <br />
          {zh ? "真空制盐 · 多效蒸发结晶" : "VACUUM SALT PROCESS"}
        </div>
        <div className="label-eyebrow opacity-40">
          {zh ? "DIAGONAL · 对角线计划" : "DIAGONAL · A DIAGONAL PROJECT"}
        </div>
      </div>
    </div>
  );
}

export function SceneLoader({
  cameraStageId,
  onSelectStage,
  lang = "zh",
  paused = false,
}: {
  cameraStageId: string | null;
  onSelectStage: (id: string) => void;
  lang?: "zh" | "en";
  paused?: boolean;
}) {
  const [ready, setReady] = useState(false);

  // 兜底：若场景因故迟迟不触发 onReady（如 WebGL 异常），最多 8s 后强制收起覆盖层，
  // 避免永远遮挡页面（用户仍可交互 + 看到已渲染的内容）。
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full h-full">
      <LoadingOverlay visible={!ready} lang={lang} />
      <Suspense fallback={null}>
        <PipelineScene
          cameraStageId={cameraStageId}
          onSelectStage={onSelectStage}
          lang={lang}
          paused={paused}
          onReady={() => setReady(true)}
        />
      </Suspense>
    </div>
  );
}
