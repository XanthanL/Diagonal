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

// vacuum-salt 子项目的五大工艺环节（用于首页入口展示，与 vacuum-salt/lib/data.ts 同步）
const vacuumStages = [
  { id: "brine", zh: "井卤开采与净化", en: "Well Brine Mining & Purification" },
  { id: "evaporate", zh: "多效蒸发结晶", en: "Multi-effect Evaporation & Crystallization" },
  { id: "centrifuge", zh: "离心脱水", en: "Centrifugal Dewatering" },
  { id: "dry", zh: "干燥与筛分", en: "Drying & Screening" },
  { id: "pack", zh: "包装与仓储", en: "Packaging & Storage" },
];

export default function Home() {
  const { lang } = useI18n();

  return (
    <div className="relative overflow-hidden pt-24 min-h-screen">
      {/* 视觉核心：巨大的对角斜线装饰（仅覆盖 Hero 区域） */}
      <div className="absolute top-0 left-0 w-full h-screen pointer-events-none z-0">
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

      {/* Vacuum Salt Section - diagonal 子项目入口 */}
      <section id="vacuum-salt" className="relative z-10 max-w-7xl mx-auto px-6 py-40 border-t border-black/5">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-24 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="archive-text text-[10px] text-diagonal-red font-bold tracking-widest border-l border-diagonal-red pl-4">
              {t(lang, "vacuumSaltLabel")}
            </div>
            <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-none">
              {t(lang, "vacuumSaltTitle")}
            </h2>
          </motion.div>
          <div className="archive-text text-[10px] space-y-1 opacity-60">
            <div>SUBPROJECT OF DIAGONAL</div>
            <div>05 STAGES · INTERACTIVE 3D</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* 左：介绍 + 五环节列表 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-10"
          >
            <p className="text-xl leading-relaxed font-serif">{t(lang, "vacuumSaltIntro")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-black/5 border border-black/5">
              {vacuumStages.map((s, i) => (
                <div key={s.id} className="bg-[#FAFAF8] p-5 flex gap-3 items-baseline">
                  <span className="archive-text text-[10px] text-diagonal-red">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink-900">{s.zh}</div>
                    <div className="text-[11px] text-ink-500 font-mono">{s.en}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 右：可点击预览卡（呼应对角母题与盐标记） */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link
              href="/vacuum-salt/"
              className="group relative block aspect-[4/5] w-full border border-black/10 bg-[#FAFAF8] overflow-hidden hover:border-diagonal-red/40 transition-colors"
            >
              <div className="diagonal-line opacity-10" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
                <div className="relative w-20 h-20 overflow-hidden rounded-2xl border border-diagonal-red/40 bg-white">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(135deg, transparent 46%, rgba(179,58,42,0.55) 49%, rgba(179,58,42,0.9) 50%, rgba(179,58,42,0.55) 51%, transparent 54%)",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-diagonal-red font-bold text-3xl">
                    盐
                  </div>
                </div>
                <div className="archive-text text-[10px] text-center opacity-60 leading-relaxed">
                  VACUUM SALT
                  <br />
                  3D PIPELINE
                </div>
              </div>
              <div className="absolute bottom-4 right-4 archive-text text-[10px] text-diagonal-red opacity-0 group-hover:opacity-100 transition-opacity">
                ENTER →
              </div>
            </Link>
          </motion.div>
        </div>

        <div className="mt-16 flex justify-center">
          <Link
            href="/vacuum-salt/"
            className="archive-text text-sm font-bold border border-black px-12 py-4 hover:bg-black hover:text-white transition-all"
          >
            {t(lang, "vacuumSaltEnter")}
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
