"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { archiveData, atlasData } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { ArchiveCard } from "@/components/ArchiveCard";
import { AtlasCover } from "@/components/AtlasCover";
import { DiagonalSlash } from "@/components/DiagonalSlash";

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
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="max-w-4xl space-y-14">
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

      {/* THE LAB Section - 与 Documents / Atlas 并列的实验/展示板块 */}
      <section id="lab" className="relative z-10 max-w-7xl mx-auto px-6 py-40 border-t border-black/5">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-24 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="archive-text text-[10px] text-diagonal-red font-bold tracking-widest border-l border-diagonal-red pl-4">
              {t(lang, "labLabel")}
            </div>
            <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-none">
              {t(lang, "labTitle")}
            </h2>
          </motion.div>
          <div className="max-w-xs space-y-6">
            <p className="text-sm opacity-50 leading-relaxed italic">
              {t(lang, "labIntro")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 卡片 1：真空制盐 3D 解构 → /vacuum-salt/ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link
              href="/vacuum-salt/"
              className="group relative block aspect-[16/10] w-full border border-black/10 bg-[#FAFAF8] overflow-hidden hover:border-diagonal-red/40 transition-colors"
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
                {t(lang, "labEnter")}
              </div>
            </Link>
            <div className="mt-5 space-y-1.5">
              <div className="archive-text text-[10px] text-diagonal-red font-bold tracking-widest">
                {t(lang, "vacuumSaltLabel")}
              </div>
              <h3 className="text-2xl font-black tracking-tight">{t(lang, "vacuumSaltTitle")}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{t(lang, "labVacuumDesc")}</p>
            </div>
          </motion.div>

          {/* 卡片 2：盐粒子模拟 → /lab/salt-particle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link
              href="/lab/salt-particle"
              className="group relative block aspect-[16/10] w-full border border-black/10 bg-[#0c0c0e] overflow-hidden hover:border-diagonal-red/40 transition-colors"
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,0.045) 0px, rgba(255,255,255,0.045) 1px, transparent 1px, transparent 4px), radial-gradient(120% 120% at 72% 18%, rgba(179,58,42,0.22), transparent 55%)",
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8">
                <div className="archive-text text-[11px] text-white/70 tracking-[0.3em]">
                  SALT · PARTICLE · SIM
                </div>
                <div className="archive-text text-[10px] text-white/40">
                  REAL-TIME CRYSTAL CLOUD
                </div>
              </div>
              <div className="absolute bottom-4 right-4 archive-text text-[10px] text-diagonal-red opacity-0 group-hover:opacity-100 transition-opacity">
                {t(lang, "labEnter")}
              </div>
            </Link>
            <div className="mt-5 space-y-1.5">
              <div className="archive-text text-[10px] text-diagonal-red font-bold tracking-widest">
                INTERACTIVE · 实时模拟
              </div>
              <h3 className="text-2xl font-black tracking-tight">{t(lang, "labSaltTitle")}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{t(lang, "labSaltDesc")}</p>
            </div>
          </motion.div>
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
