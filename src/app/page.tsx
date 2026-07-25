"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { archiveData, atlasData } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { ArchiveCard } from "@/components/ArchiveCard";
import { AtlasCover } from "@/components/AtlasCover";
import { DiagonalSlash } from "@/components/DiagonalSlash";
import { SaltSimulation } from "@/components/SaltSimulation";

export default function Home() {
  const { lang } = useI18n();

  return (
    <div className="relative overflow-hidden pt-24 min-h-screen">
      {/* 视觉核心：巨大的对角斜线装饰 */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 0.05, scaleY: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 bg-gradient-to-br from-transparent via-black to-transparent transform skew-y-12"
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-end">
          <div className="space-y-12 pr-8 md:pr-12">
            <motion.h1
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-serif font-black leading-[0.8] tracking-tighter relative"
            >
              {/* 对角线母题：DIA 与 GONAL 沿对角错位咬合，而非水平堆叠 */}
              <span className="block text-[18vw] sm:text-8xl md:text-[9rem]">DIA</span>
              <span
                className="block text-[18vw] sm:text-8xl md:text-[9rem] -mt-2 md:-mt-4"
                style={{ transform: "translateX(0.3em)" }}
              >
                GONAL
              </span>
              <DiagonalSlash />
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="max-w-md space-y-6"
            >
              <div className="archive-text text-sm font-bold border-l-2 border-diagonal-red pl-4">
                {t(lang, "projectStatus")}
              </div>
              <p className="text-xl leading-relaxed font-serif">
                {t(lang, "heroIntro")}
              </p>
            </motion.div>
          </div>

          <div className="space-y-12 block">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="aspect-[2/3] sm:aspect-[3/4] md:aspect-[4/5] relative w-full"
            >
              <SaltSimulation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Documents Section (Formerly Archive Box) */}
      <section id="archive" className="relative z-10 max-w-7xl mx-auto px-6 py-40 border-t border-black/5">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-24 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="text-6xl font-black tracking-tighter uppercase italic">{t(lang, "documentsTitle")}</h2>
          </motion.div>

          <div className="archive-text text-[10px] space-y-1 opacity-60">
            <div>{t(lang, "totalRecords")}: {archiveData.length}</div>
            <div>{t(lang, "axis")}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
          {archiveData.slice(0, 4).map((item, index) => (
            <div
              key={item.id}
              className={index % 2 !== 0 ? "lg:mt-24" : ""}
            >
              <ArchiveCard item={item} />
            </div>
          ))}
        </div>

        <div className="mt-40 pt-12 border-t border-black flex justify-center">
          <Link href="/archive" className="archive-text text-sm font-bold border border-black px-12 py-4 hover:bg-black hover:text-white transition-all">
            {t(lang, "loadFullIndex")}
          </Link>
        </div>
      </section>

      {/* Atlas Section - 多步渐变过渡带 + DARK THEME */}
      <div
        className="relative z-10 h-80"
        style={{
          background: `linear-gradient(to bottom,
            #FAFAF8 0%,
            #F0EFEC 15%,
            #D4D2CE 30%,
            #8A8885 50%,
            #4A4845 70%,
            #2A2928 85%,
            #1a1a1a 100%
          )`
        }}
      />
      <section id="atlas" className="relative z-10 bg-[#1a1a1a] text-white py-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-32 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="archive-text text-[10px] text-diagonal-red font-bold tracking-widest border-l border-diagonal-red pl-4">
                {t(lang, "atlasLabel")}
              </div>
              <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-none">
                {t(lang, "atlasTitle")}
              </h2>
            </motion.div>
            <div className="max-w-xs space-y-6">
              <p className="text-sm opacity-50 leading-relaxed italic">
                {t(lang, "atlasIntro")}
              </p>
              {/* 红色进度条装饰（CSS animation，不占主线程） */}
              <div className="w-full h-px bg-white/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-diagonal-red w-1/4 animate-atlasProgress" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-24">
            {atlasData.map((item) => (
              <div key={item.id}>
                <AtlasCover item={item} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scroll Indicator（CSS animation，不占主线程） */}
      <div
        className="fixed bottom-10 right-10 archive-text text-[9px] opacity-30 tracking-widest vertical-rl hidden md:block mix-blend-difference animate-scrollBob"
      >
        {t(lang, "scrollToDiscover")}
      </div>
    </div>
  );
}
