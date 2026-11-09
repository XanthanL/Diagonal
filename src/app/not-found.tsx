import Link from "next/link";

/* Server 组件拿不到客户端语言状态，用 <html lang> + .i18n-zh/.i18n-en 双份文本。 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden site-surface">
      {/* 对角线装饰背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
          <div className="absolute inset-0 diagonal-line opacity-[0.03]" />
        </div>
        {/* 巨型 404 背景字 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif font-black text-[20rem] md:text-[30rem] leading-none opacity-[0.03] select-none">
          4
        </div>
      </div>

      <div className="relative z-10 max-w-xl space-y-8 text-center md:text-left">
        <div className="archive-text text-[10px] tracking-[0.3em] text-diagonal-red border-l-2 border-diagonal-red pl-4 w-fit">
          ERROR / 404 / PAGE_NOT_FOUND
        </div>

        <h1 className="font-serif font-black tracking-tighter leading-none">
          <span className="block text-6xl md:text-8xl">Not</span>
          <span className="block text-6xl md:text-8xl -mt-1" style={{ transform: "translateX(0.2em)" }}>Found.</span>
        </h1>

        <p className="opacity-60 italic leading-relaxed font-serif text-lg max-w-md">
          <span className="i18n-zh">你访问的页面不存在，或已被移动。<br />请返回首页继续浏览对角线计划档案。</span>
          <span className="i18n-en">The page you requested does not exist or has been moved.<br />Return to the home page to continue browsing the Diagonal archive.</span>
        </p>

        <div className="flex gap-4 justify-center md:justify-start">
          <Link
            href="/"
            className="press archive-text text-xs px-6 py-3 border border-black bg-black text-white hover:bg-white hover:text-black"
          >
            <span className="i18n-zh">返回首页 →</span>
            <span className="i18n-en">BACK TO HOME →</span>
          </Link>
          <Link
            href="/archive"
            className="press archive-text text-xs px-6 py-3 border border-black/20 hover:border-black"
          >
            <span className="i18n-zh">浏览档案</span>
            <span className="i18n-en">BROWSE ARCHIVE</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
