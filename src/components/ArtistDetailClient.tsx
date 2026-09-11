"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { getLocalizedUrl } from "@/lib/path";
import { ArchiveCard } from "@/components/ArchiveCard";
import { Artist, getArtistArchiveItems } from "@/lib/artists";
import { ArtistProfile, ArtistWork, getArtistProfile } from "@/lib/artistProfile";

interface ArtistDetailClientProps {
  artist: Artist;
}

type Lang = "zh" | "en";

export function ArtistDetailClient({ artist }: ArtistDetailClientProps) {
  const { lang } = useI18n();
  const profile = getArtistProfile(artist.slug);

  // 登记了作品集档案的艺术家走「艺术家介绍」，其余沿用原档案条目索引
  if (profile) {
    return <ArtistProfileView artist={artist} profile={profile} lang={lang} />;
  }
  return <ArchiveIndexView artist={artist} lang={lang} />;
}

/* ============================================================
   作品集视图：艺术家介绍 + 作品画廊（含灯箱）
   ============================================================ */
function ArtistProfileView({
  artist,
  profile,
  lang,
}: {
  artist: Artist;
  profile: ArtistProfile;
  lang: Lang;
}) {
  const zh = lang === "zh";
  const [openWork, setOpenWork] = useState<number | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  const totalImages = profile.works.reduce((n, w) => n + w.images.length, 0) + 2;
  const active: ArtistWork | null =
    openWork === null ? null : profile.works[openWork];

  useEffect(() => {
    if (openWork === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenWork(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openWork]);

  const step = (delta: number) => {
    if (!active) return;
    setImgIdx((i) => (i + delta + active.images.length) % active.images.length);
  };

  const pick = (workIndex: number) => {
    setOpenWork(workIndex);
    setImgIdx(0);
  };

  return (
    <div className="relative overflow-hidden pt-32 min-h-screen bg-background text-foreground">
      {/* 全站对角母题 */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="diagonal-line opacity-5" />
      </div>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* —— 头部 —— */}
        <header className="mb-20 space-y-6">
          <Link
            href={getLocalizedUrl("/artists")}
            className="archive-text text-[10px] opacity-65 hover:opacity-100 transition-opacity flex items-center gap-2 group w-fit"
          >
            <span className="group-hover:-translate-x-2 transition-transform">←</span>
            {zh ? "返回艺术家索引" : "BACK_TO_ARTISTS"}
          </Link>

          <div className="archive-text text-xs text-diagonal-red font-bold tracking-[0.3em] border-l-2 border-diagonal-red pl-4">
            {zh ? artist.roleEn : artist.role} // {profile.works.length}{" "}
            {zh ? "件作品" : "WORKS"} — {totalImages} {zh ? "张图像" : "IMAGES"}
          </div>

          <h1 className="font-serif font-black tracking-tighter leading-none">
            <span className="block text-6xl md:text-8xl">
              {zh ? artist.name : artist.nameEn}
            </span>
            <span className="block text-2xl md:text-4xl opacity-50 italic font-medium mt-4">
              {zh ? artist.nameEn : artist.name}
            </span>
          </h1>
        </header>

        {/* —— 肖像 + 艺术家自述：肖像紧随姓名之下，作为直接介绍 —— */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12 lg:gap-16 mb-24 items-start">
          {/* 肖像先行：紧接姓名区块，作为第一眼的直接介绍 */}
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.portrait}
              alt={zh ? artist.name : artist.nameEn}
              loading="eager"
              className="w-full h-auto border border-black/10 bg-black/5"
            />
            <p className="archive-text text-[9px] opacity-50">
              {zh ? "肖像" : "PORTRAIT"}
            </p>
          </div>

          <div className="space-y-6">
            <p className="archive-text text-[10px] opacity-60">
              {zh ? "艺术家自述" : "STATEMENT"}
            </p>
            <p className="prose-zh text-lg opacity-90 whitespace-pre-line">
              {zh ? profile.bio : profile.bioEn}
            </p>
            <p className="archive-text text-[11px] opacity-60 leading-relaxed whitespace-pre-line border-t border-black/10 pt-6">
              {zh ? profile.education : profile.educationEn}
            </p>
          </div>
        </div>

        {/* —— 作品画廊 —— */}
        <div className="flex items-baseline justify-between border-b border-black/15 pb-4 mb-16">
          <h2 className="font-serif text-3xl font-bold tracking-tight">
            {zh ? "精选作品" : "SELECTED WORKS"}
          </h2>
          <span className="archive-text text-[10px] opacity-50">
            {profile.works.length} {zh ? "件" : "ITEMS"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
          {profile.works.map((w, index) => (
            <motion.button
              key={w.slug}
              type="button"
              onClick={() => pick(index)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
              className={`text-left press-card ${index % 2 !== 0 ? "lg:mt-24" : ""}`}
            >
              <div className="relative overflow-hidden bg-black/5 border border-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.thumb}
                  alt={zh ? w.title : w.titleEn}
                  loading="lazy"
                  className="w-full h-56 object-cover"
                />
                <span className="absolute top-2 left-2 archive-text text-[9px] font-bold bg-foreground text-background px-2 py-1 -rotate-[35deg] origin-top-left">
                  {w.year}
                </span>
                {w.images.length > 1 && (
                  <span className="absolute bottom-2 right-2 archive-text text-[9px] bg-black/70 text-white px-2 py-1">
                    {w.images.length}
                  </span>
                )}
              </div>
              <p className="archive-text text-[9px] text-diagonal-red mt-4">
                {zh ? w.category : w.categoryEn}
              </p>
              <h3 className="font-serif text-lg leading-snug mt-1">
                {zh ? w.title : w.titleEn}
              </h3>
              <p className="text-xs opacity-60 mt-1">
                {zh ? w.medium : w.mediumEn}
              </p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* —— 灯箱：展示该作品全部图像 —— */}
      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={zh ? active.title : active.titleEn}
          className="fixed inset-0 z-[95] bg-[#FAFAF8]/95 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setOpenWork(null)}
        >
          <div
            className="max-w-6xl w-full max-h-[88vh] grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 大图 */}
            <div className="flex flex-col gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.images[imgIdx]}
                alt={`${zh ? active.title : active.titleEn} — ${imgIdx + 1}`}
                className="w-full max-h-[70vh] object-contain bg-black/5 border border-black/10"
              />
              <div className="flex items-center justify-between">
                <span className="archive-text text-[10px] opacity-60">
                  {String(imgIdx + 1).padStart(2, "0")} /{" "}
                  {String(active.images.length).padStart(2, "0")}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    className="press archive-text text-[10px] border border-black/15 px-3 py-2 hover:border-diagonal-red hover:text-diagonal-red transition-colors"
                  >
                    ‹ {zh ? "上一张" : "PREV"}
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    className="press archive-text text-[10px] border border-black/15 px-3 py-2 hover:border-diagonal-red hover:text-diagonal-red transition-colors"
                  >
                    {zh ? "下一张" : "NEXT"} ›
                  </button>
                </div>
              </div>
            </div>

            {/* 信息与缩略图 */}
            <aside className="overflow-y-auto max-h-[88vh]">
              <p className="archive-text text-[10px] text-diagonal-red font-bold">
                {active.year} · {zh ? active.category : active.categoryEn}
              </p>
              <h3 className="font-serif text-2xl font-bold mt-2 leading-tight">
                {zh ? active.title : active.titleEn}
              </h3>
              <p className="text-xs opacity-60 mt-2">
                {zh ? active.medium : active.mediumEn}
              </p>
              <p className="prose-zh text-sm opacity-85 mt-6 leading-relaxed">
                {zh ? active.description : active.descriptionEn}
              </p>

              <div className="grid grid-cols-4 gap-2 mt-8">
                {active.images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setImgIdx(i)}
                    aria-label={`${zh ? "第 " : "Image "}${i + 1}`}
                    className={`border ${
                      i === imgIdx ? "border-diagonal-red" : "border-black/10"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      className="w-full h-16 object-cover"
                    />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setOpenWork(null)}
                className="press archive-text text-[10px] mt-8 w-full border border-black/15 py-3 hover:border-diagonal-red hover:text-diagonal-red transition-colors"
              >
                {zh ? "关闭" : "CLOSE"}
              </button>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   原有视图：按艺术家过滤的档案条目索引
   ============================================================ */
function ArchiveIndexView({ artist, lang }: { artist: Artist; lang: Lang }) {
  const items = getArtistArchiveItems(artist);

  return (
    <div className="relative overflow-hidden pt-32 min-h-screen bg-white text-black">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="diagonal-line opacity-5" />
      </div>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <header className="mb-24 space-y-6">
          <Link
            href={getLocalizedUrl("/artists")}
            className="archive-text text-[10px] opacity-65 hover:opacity-100 transition-opacity flex items-center gap-2 group w-fit"
          >
            <span className="group-hover:-translate-x-2 transition-transform">←</span>
            {lang === "zh" ? "返回艺术家索引" : "BACK_TO_ARTISTS"}
          </Link>

          <div className="archive-text text-xs text-diagonal-red font-bold tracking-[0.3em] border-l-2 border-diagonal-red pl-4">
            {lang === "zh" ? artist.roleEn : artist.role} // {items.length}{" "}
            {lang === "zh" ? "条档案" : "RECORDS"}
          </div>

          <h1 className="font-serif font-black tracking-tighter leading-none">
            <span className="block text-6xl md:text-8xl">
              {lang === "zh" ? artist.name : artist.nameEn}
            </span>
            <span className="block text-2xl md:text-4xl opacity-50 italic font-medium mt-4">
              {lang === "zh" ? artist.nameEn : artist.name}
            </span>
          </h1>

          <div className="archive-text text-sm opacity-60">
            {lang === "zh" ? artist.roleEn : artist.role}
          </div>
        </header>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className={index % 2 !== 0 ? "lg:mt-24" : ""}
              >
                <ArchiveCard item={item} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center">
            <div className="archive-text text-sm opacity-65">
              {lang === "zh" ? "暂无关联档案" : "NO RELATED RECORDS"}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
