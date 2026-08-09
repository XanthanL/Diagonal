"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const PipelineScene = dynamic(
  () => import("./PipelineScene").then((m) => m.PipelineScene),
  { ssr: false }
);

/** 加载占位 */
function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-brine-200 border-t-brine-500 animate-spin" />
        <div className="label-eyebrow">LOADING PIPELINE…</div>
      </div>
    </div>
  );
}

export function SceneLoader({ focusStageId }: { focusStageId: string | null }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PipelineScene focusStageId={focusStageId} />
    </Suspense>
  );
}
