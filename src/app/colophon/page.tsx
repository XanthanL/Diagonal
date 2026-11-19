"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { getLocalizedUrl } from "@/lib/path";

// ── 两处接口：只放图形，截图自身即标识 ────────────────────────────────
const portals = [
  {
    id: "01",
    img: "/images/colophon/observatory.webp",
    alt: "Xanthan 观测站项目星系首页截图：深色星空中的发光行星",
    host: "xanthanl.github.io",
    url: "https://xanthanl.github.io/",
  },
  {
    id: "02",
    img: "/images/colophon/game-lab.webp",
    alt: "GAME LAB 首页截图：浅蓝色实验场的项目卡片",
    host: "xanthanl.github.io/game-lab",
    url: "https://xanthanl.github.io/game-lab/",
  },
];

export default function ColophonPage() {
  const { lang } = useI18n();
  const zh = lang === "zh";

  return (
    <div className="relative overflow-hidden min-h-screen site-surface-white">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="diagonal-line opacity-5" />
      </div>

      <section className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 pt-24 md:pt-28 pb-24 md:pb-32">
        {/* 顶部：返回 + 极小眉标，全是图形与编号，无介绍文字 */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <Link
            href={getLocalizedUrl("/")}
            aria-label={zh ? "返回首页" : "Back home"}
            className="group archive-text text-base opacity-55 hover:opacity-100 transition-opacity duration-200 -ml-1 w-8 h-8 flex items-center justify-center"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          </Link>
          <span className="archive-text text-[10px] tracking-[0.28em] opacity-45">
            COLOPHON <span className="opacity-50 px-1">/</span> 02
          </span>
        </div>

        {/* 两块图形接口 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {portals.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${p.host} — open in new tab`}
              className="group block"
            >
              <div className="relative aspect-[16/10] overflow-hidden border border-black/10 bg-black shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                <img
                  src={p.img}
                  alt={p.alt}
                  width={1280}
                  height={800}
                  className="w-full h-full object-cover transition-transform duration-300 ease-out-strong group-hover:scale-[1.03]"
                />
                {/* 底部淡入遮罩，仅为让角标可读 */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
                {/* 角标：编号 + 域名 + 外链箭头，唯一的文字，压到最小 */}
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:p-5">
                  <div className="archive-text text-[10px] md:text-[11px] tracking-[0.12em] text-white/90 leading-tight">
                    <span className="opacity-60 mr-2">{p.id}</span>
                    <span className="opacity-90">{p.host}</span>
                  </div>
                  <span className="archive-text text-sm text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 opacity-80 transition-[transform,opacity] duration-200 ease-out-strong">
                    ↗
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
