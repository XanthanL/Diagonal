"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { getLocalizedUrl } from "@/lib/path";
import { artistsData } from "@/lib/artists";

export function ArtistsIndexClient() {
  const { lang } = useI18n();

  // 按英文姓名首字母分组
  const grouped = artistsData.reduce((acc, artist) => {
    const letter = artist.nameEn[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(artist);
    return acc;
  }, {} as Record<string, typeof artistsData>);

  const letters = Object.keys(grouped).sort();

  return (
    <div className="relative overflow-hidden pt-32 min-h-screen bg-white text-black">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="diagonal-line opacity-5" />
      </div>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <header className="mb-24 space-y-6">
          <Link
            href={getLocalizedUrl("/")}
            className="archive-text text-[10px] opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2 group w-fit"
          >
            <span className="group-hover:-translate-x-2 transition-transform">←</span>
            {lang === "zh" ? "返回首页" : "BACK_HOME"}
          </Link>

          <div className="archive-text text-xs text-diagonal-red font-bold tracking-[0.3em] border-l-2 border-diagonal-red pl-4">
            {lang === "zh" ? "艺术家索引" : "ARTISTS_INDEX"} // {artistsData.length}{" "}
            {lang === "zh" ? "位" : "ARTISTS"}
          </div>

          <h1 className="font-serif font-black tracking-tighter leading-none">
            <span className="block text-6xl md:text-8xl">
              {lang === "zh" ? "艺术家" : "Artists"}
            </span>
            <span className="block text-2xl md:text-4xl opacity-40 italic font-medium mt-4">
              {lang === "en" ? "艺术家" : "Artists"}
            </span>
          </h1>

          <p className="max-w-xl text-lg opacity-60 leading-relaxed italic">
            {lang === "zh"
              ? "名单按英文首字母排序。"
              : "The list is arranged in alphabetical order."}
          </p>
        </header>

        {/* A-Z 字母索引导航 */}
        <nav className="mb-16 flex flex-wrap gap-3">
          {letters.map((letter) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="archive-text text-sm font-bold w-8 h-8 flex items-center justify-center border border-black/20 hover:border-black hover:bg-black hover:text-white transition-all"
            >
              {letter}
            </a>
          ))}
        </nav>

        {/* 艺术家列表 */}
        <div className="space-y-32">
          {letters.map((letter) => (
            <div key={letter} id={`letter-${letter}`} className="space-y-12">
              <div className="border-t border-black/10 pt-8">
                <h2 className="font-serif text-4xl font-black opacity-20">{letter}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
                {grouped[letter].map((artist, index) => (
                  <motion.div
                    key={artist.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  >
                    <Link
                      href={getLocalizedUrl(`/artists/${artist.slug}`)}
                      className="group block border-t border-black/10 pt-6 hover:border-black transition-colors"
                    >
                      <div className="archive-text text-[10px] opacity-40 mb-2">
                        {lang === "zh" ? artist.roleEn : artist.role}
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight group-hover:underline underline-offset-8 decoration-2">
                        {lang === "zh" ? artist.name : artist.nameEn}
                      </h3>
                      <p className="text-sm opacity-50 italic mt-1">
                        {lang === "zh" ? artist.nameEn : artist.name}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
