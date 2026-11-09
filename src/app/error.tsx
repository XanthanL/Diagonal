"use client";

import { useEffect } from "react";
import Link from "next/link";

/* 错误页是 client 组件但没有语言 Context 依赖：用 <html lang> + .i18n-zh/.i18n-en
   双份文本切换，SSR 与语言切换即时生效，也不会在水合前闪一帧中文。 */
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
    <div className="min-h-screen flex items-center justify-center site-surface-white px-6">
      <div className="max-w-xl space-y-8">
        <div className="archive-text text-[10px] tracking-[0.3em] text-diagonal-red border-l-2 border-diagonal-red pl-4">
          ERROR / 500
        </div>
        <h1 className="font-serif text-6xl font-black tracking-tighter leading-none">
          Something went wrong.
        </h1>
        <p className="opacity-60 italic leading-relaxed">
          <span className="i18n-zh">页面渲染时发生错误。请尝试重新加载，或返回首页继续浏览。</span>
          <span className="i18n-en">Something went wrong while rendering this page. Please reload, or return to the home page.</span>
        </p>
        {error.digest && (
          <div className="archive-text text-[10px] opacity-40">
            Digest: {error.digest}
          </div>
        )}
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="press archive-text text-xs px-6 py-3 border border-black bg-black text-white hover:bg-white hover:text-black"
          >
            <span className="i18n-zh">重新加载</span>
            <span className="i18n-en">RELOAD</span>
          </button>
          <Link
            href="/"
            className="press archive-text text-xs px-6 py-3 border border-black/20 hover:border-black"
          >
            <span className="i18n-zh">返回首页 →</span>
            <span className="i18n-en">BACK TO HOME →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
