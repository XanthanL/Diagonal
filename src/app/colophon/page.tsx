"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { getLocalizedUrl } from "@/lib/path";

// 制作者的其他作品索引（全部为已部署上线的独立项目）
const works = [
  {
    id: "01",
    name: "Xanthan 观测站",
    nameEn: "Xanthan Observatory",
    type: "个人主页",
    typeEn: "HOMEPAGE",
    zh: "3D 太阳系风格的项目导航站，每一颗行星都是一个已上线的真实项目。",
    en: "A 3D solar-system-style project constellation — every planet is a live, deployed project.",
    url: "https://xanthanl.github.io/",
  },
  {
    id: "02",
    name: "弦诵 XianSong",
    nameEn: "XianSong",
    type: "开源应用",
    typeEn: "OPEN SOURCE",
    zh: "离线优先的 Android 电子书阅读器，支持 EPUB / PDF / TXT 与神经网络离线朗读。",
    en: "An offline-first Android e-book reader for EPUB / PDF / TXT, with on-device neural text-to-speech.",
    url: "https://github.com/XanthanL/XianSong",
  },
  {
    id: "03",
    name: "图印工坊 PicMark Studio",
    nameEn: "PicMark Studio",
    type: "工具",
    typeEn: "TOOL",
    zh: "纯前端的批量个性化图片生成工具——上传底图、导入名单，一键生成打包下载。",
    en: "A pure-frontend batch image personalization tool — upload a base image, import a name list, generate and download in one click.",
    url: "https://picmark-studio.vercel.app/",
  },
  {
    id: "04",
    name: "ASCII LAB 文字工坊",
    nameEn: "ASCII LAB",
    type: "工具",
    typeEn: "TOOL",
    zh: "在浏览器里把图像与文字转换为 ASCII 字符画的实验工坊。",
    en: "A browser lab that turns images and text into ASCII art.",
    url: "https://ascii-art-two-theta.vercel.app/",
  },
  {
    id: "05",
    name: "强渡火星 Forcing Mars",
    nameEn: "Forcing Mars",
    type: "游戏",
    typeEn: "GAME",
    zh: "一场向火星地下不断下潜的探索游戏：从赤色荒原钻向地核深处。",
    en: "A descent game into the Martian underground — drilling from the red wasteland toward the core.",
    url: "https://xanthanl.github.io/forcing-mars/",
  },
  {
    id: "06",
    name: "Electric Mirage",
    nameEn: "Electric Mirage",
    type: "音乐",
    typeEn: "MUSIC",
    zh: "个人音乐专辑的线上试听页。",
    en: "An online listening page for a personal music album.",
    url: "https://xanthanl.github.io/XanthanLMusic/",
  },
  {
    id: "07",
    name: "树言·旅记",
    nameEn: "Shuyan Travel",
    type: "网站",
    typeEn: "WEBSITE",
    zh: "一份私人旅行记录的网页化呈现。",
    en: "A personal travel journal rendered as a website.",
    url: "https://xanthanl.github.io/shuyan-travel/",
  },
  {
    id: "08",
    name: "ARH 意识形态测试",
    nameEn: "ARH Ideology Test",
    type: "实验",
    typeEn: "EXPERIMENT",
    zh: "一个交互式的意识形态倾向测试实验。",
    en: "An interactive ideology-leaning test experiment.",
    url: "https://xanthanl.github.io/ARH/",
  },
];

// 本站制作说明（艺术出版物式的 Colophon 文本）
const colophonZh = [
  "本网站由 XanthanL 设计与开发，是对角线计划的线上文献库与数字档案。",
  "网站基于 Next.js 构建并静态导出，托管于 GitHub Pages；正文图片在构建期生成多档 WebP 变体以适配不同屏幕；中英双语内容通过自建的编辑后台撰写与发布。",
  "以下是制作者的其他作品——它们与对角线计划无关，但同样出自这双手。",
];

const colophonEn = [
  "This website is designed and developed by XanthanL, serving as the online archive of the Diagonal project.",
  "Built with Next.js and statically exported, hosted on GitHub Pages. Images are converted into multi-size WebP variants at build time, and the bilingual content is written and published through a self-built editorial backend.",
  "Below are other works by the maker — unrelated to Diagonal, yet from the same pair of hands.",
];

export default function ColophonPage() {
  const { lang } = useI18n();
  const intro = lang === "zh" ? colophonZh : colophonEn;

  return (
    <div className="relative overflow-hidden pt-32 min-h-screen bg-white text-black">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="diagonal-line opacity-5" />
      </div>

      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        {/* 顶部返回 */}
        <Link
          href={getLocalizedUrl("/")}
          className="archive-text text-[10px] opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2 group w-fit mb-24"
        >
          <span className="group-hover:-translate-x-2 transition-transform">←</span>
          {lang === "zh" ? "返回首页" : "BACK_HOME"}
        </Link>

        {/* 标题区 */}
        <header className="mb-24 space-y-6">
          <div className="archive-text text-xs text-diagonal-red font-bold tracking-[0.3em] border-l-2 border-diagonal-red pl-4">
            {lang === "zh" ? "制作说明" : "COLOPHON"}
          </div>

          <h1 className="font-serif font-black tracking-tighter leading-none">
            <span className="block text-6xl md:text-9xl">
              {lang === "zh" ? "制作说明" : "Colophon"}
            </span>
            <span className="block text-2xl md:text-4xl opacity-40 italic font-medium mt-4">
              {lang === "zh" ? "Colophon" : "制作说明"}
            </span>
          </h1>
        </header>

        {/* 制作说明正文 */}
        <div className="mb-24 max-w-3xl space-y-6 text-lg leading-relaxed font-serif">
          {intro.map((para, i) => (
            <p key={i} className={i === 0 ? "text-xl font-medium" : "opacity-80"}>
              {para}
            </p>
          ))}
        </div>

        {/* 制作者其他作品索引 */}
        <div className="mb-32">
          <h2 className="archive-text text-sm font-bold tracking-[0.2em] opacity-70 mb-4 border-t border-black/10 pt-8">
            {lang === "zh" ? "制作者的其他作品" : "OTHER WORKS BY THE MAKER"}
          </h2>
          <p className="archive-text text-[10px] opacity-40 mb-12 tracking-wider">
            XANTHANL — {works.length} PROJECTS
          </p>

          <div className="space-y-0">
            {works.map((work) => (
              <a
                key={work.id}
                href={work.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-8 border-b border-black/5 py-6 hover:bg-black/[0.02] transition-colors"
              >
                <span className="archive-text text-xs opacity-40 w-8 shrink-0 tracking-wider">
                  {work.id}
                </span>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-lg font-serif font-bold leading-snug group-hover:text-diagonal-red transition-colors">
                      {lang === "zh" ? work.name : work.nameEn}
                    </span>
                    <span className="archive-text text-[9px] opacity-40 tracking-[0.2em] border border-black/15 px-1.5 py-0.5">
                      {lang === "zh" ? work.type : work.typeEn}
                    </span>
                  </div>
                  <p className="text-sm opacity-60 font-serif leading-relaxed max-w-2xl">
                    {lang === "zh" ? work.zh : work.en}
                  </p>
                </div>
                <span className="archive-text text-[10px] opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* 底部落款 */}
        <div className="archive-text text-[9px] opacity-30 tracking-[0.2em] border-t border-black/10 pt-8 pb-12">
          {lang === "zh"
            ? "网站设计与开发 — XANTHANL / 对角线计划"
            : "SITE DESIGN & DEVELOPMENT — XANTHANL / DIAGONAL PROJECT"}
        </div>
      </section>
    </div>
  );
}
