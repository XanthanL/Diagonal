import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black px-6">
      <div className="max-w-xl space-y-8">
        <div className="archive-text text-[10px] tracking-[0.3em] text-diagonal-red border-l-2 border-diagonal-red pl-4">
          ERROR / 404
        </div>
        <h1 className="font-serif text-6xl md:text-8xl font-black tracking-tighter leading-none">
          Not Found.
        </h1>
        <p className="opacity-60 italic leading-relaxed">
          你访问的页面不存在，或已被移动。请返回首页继续浏览对角线计划档案。
        </p>
        <div className="flex gap-4">
          <Link
            href="/"
            className="archive-text text-xs px-6 py-3 border border-black bg-black text-white hover:bg-white hover:text-black transition-all"
          >
            返回首页 →
          </Link>
          <Link
            href="/archive"
            className="archive-text text-xs px-6 py-3 border border-black/20 hover:border-black transition-all"
          >
            浏览档案
          </Link>
        </div>
      </div>
    </div>
  );
}
