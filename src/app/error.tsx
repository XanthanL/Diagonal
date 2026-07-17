"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 错误上报钩子（如接入 Sentry 等）
    console.error("DIAGONAL ErrorBoundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black px-6">
      <div className="max-w-xl space-y-8">
        <div className="archive-text text-[10px] tracking-[0.3em] text-diagonal-red border-l-2 border-diagonal-red pl-4">
          ERROR / 500
        </div>
        <h1 className="font-serif text-6xl font-black tracking-tighter leading-none">
          Something went wrong.
        </h1>
        <p className="opacity-60 italic leading-relaxed">
          页面渲染时发生错误。请尝试重新加载，或返回首页继续浏览。
        </p>
        {error.digest && (
          <div className="archive-text text-[10px] opacity-40">
            Digest: {error.digest}
          </div>
        )}
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="archive-text text-xs px-6 py-3 border border-black bg-black text-white hover:bg-white hover:text-black transition-all"
          >
            重新加载
          </button>
          <Link
            href="/"
            className="archive-text text-xs px-6 py-3 border border-black/20 hover:border-black transition-all"
          >
            返回首页 →
          </Link>
        </div>
      </div>
    </div>
  );
}
