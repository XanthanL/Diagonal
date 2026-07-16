"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { getLocalizedUrl } from "@/lib/path";
import { ArchiveCard } from "@/components/ArchiveCard";
import { Artist, getArtistArchiveItems } from "@/lib/artists";

interface ArtistDetailClientProps {
  artist: Artist;
}

export function ArtistDetailClient({ artist }: ArtistDetailClientProps) {
  const { lang } = useI18n();
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
            className="archive-text text-[10px] opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2 group w-fit"
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
            <span className="block text-2xl md:text-4xl opacity-40 italic font-medium mt-4">
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
            <div className="archive-text text-sm opacity-40">
              {lang === "zh" ? "暂无关联档案" : "NO RELATED RECORDS"}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
