"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { archiveData, atlasData } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { ArchiveCard } from "@/components/ArchiveCard";
import { AtlasCover } from "@/components/AtlasCover";
import { DiagonalSlash } from "@/components/DiagonalSlash";
import { VacuumSaltCover } from "@/components/VacuumSaltCover";
import { SaltPlantCover } from "@/components/SaltPlantCover";

// 与 CSS 的 --ease-out 同一条曲线，避免 JS 与 CSS 两套手感
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// 组进入：装饰性，必须够快且不阻塞交互
const groupItem = {
  initial: { opacity: 0, transform: "translateY(12px)" },
  whileInView: { opacity: 1, transform: "translateY(0px)" },
  viewport: { once: true, margin: "-80px" },
};

export default function Home() {
  const { lang } = useI18n();

  return (
    <div className="relative overflow-hidden pt-24 min-h-screen">
      {/* 视觉核心：巨大的对角斜线装饰（仅覆盖 Hero 区域） */}
      <div className="absolute top-0 left-0 w-full h-screen pointer-events-none z-0">
        <motion.div
          initial={{ opacity: 0, scaleY: 0.6 }}
          animate={{ opacity: 0.05, scaleY: 1 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="absolute inset-0 bg-gradient-to-br from-transparent via-black to-transparent transform skew-y-12"
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="max-w-4xl space-y-14">
          <motion.h1
            initial={{ opacity: 0, transform: "translateX(-20px)" }}
            animate={{ opacity: 1, transform: "translateX(0px)" }}
            transition={{ delay: 0.15, duration: 0.55, ease: EASE_OUT }}
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
            transition={{ delay: 0.4, duration: 0.5, ease: EASE_OUT }}
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
            {...groupItem}
            transition={{ duration: 0.5, ease: EASE_OUT }}
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
            <motion.div
              key={item.id}
              {...groupItem}
              transition={{ duration: 0.45, ease: EASE_OUT, delay: index * 0.06 }}
              className={index % 2 !== 0 ? "lg:mt-24" : ""}
            >
              <ArchiveCard item={item} />
            </motion.div>
          ))}
        </div>

        <div className="mt-40 pt-12 border-t border-black flex justify-center">
          <Link href="/archive" className="press archive-text text-sm font-bold border border-black px-12 py-4 hover:bg-black hover:text-white">
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
              initial={{ opacity: 0, transform: "translateX(-20px)" }}
              whileInView={{ opacity: 1, transform: "translateX(0px)" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
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
            {atlasData.map((item, index) => (
              <motion.div
                key={item.id}
                {...groupItem}
                transition={{ duration: 0.45, ease: EASE_OUT, delay: Math.min(index * 0.06, 0.24) }}
              >
                <AtlasCover item={item} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* THE LAB Section - 实验性质，置于 Atlas 之后、页面末尾的低调版块 */}
      <div
        className="relative z-10 h-40"
        style={{
          background: `linear-gradient(to bottom, #1a1a1a 0%, #2A2928 15%, #4A4845 30%, #8A8885 50%, #D4D2CE 70%, #F0EFEC 85%, #FAFAF8 100%)`,
        }}
      />
      <section id="lab" className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-black/5">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-14 gap-6">
          <motion.div
            {...groupItem}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="space-y-3"
          >
            <div className="archive-text text-[10px] text-black/40 font-bold tracking-widest border-l border-black/20 pl-4">
              {t(lang, "labLabel")}
              <span className="ml-2 text-diagonal-red/60">· DEMO</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-none">
              {t(lang, "labTitle")}
            </h2>
          </motion.div>
          <div className="max-w-xs space-y-4">
            <p className="text-xs opacity-40 leading-relaxed italic">
              {t(lang, "labIntro")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 卡片 1：真空制盐 3D 解构 → /vacuum-salt/ */}
          <motion.div
            {...groupItem}
            transition={{ duration: 0.45, ease: EASE_OUT }}
          >
            <Link
              href="/vacuum-salt/"
              className="press-card group relative block aspect-[16/10] w-full border border-black/10 bg-[#FAFAF8] overflow-hidden hover:border-diagonal-red/40"
            >
              <VacuumSaltCover />
              <div className="absolute bottom-3 left-4 archive-text text-[10px] text-diagonal-red/80 tracking-[0.25em]">
                VACUUM SALT · 3D PIPELINE
              </div>
              <div className="absolute bottom-4 right-4 archive-text text-[10px] text-diagonal-red opacity-0 group-hover:opacity-100 transition-opacity">
                {t(lang, "labEnter")}
              </div>
            </Link>
            <div className="mt-5 space-y-1.5">
              <div className="archive-text text-[10px] text-black/40 font-bold tracking-widest">
                {t(lang, "vacuumSaltLabel")}
              </div>
              <h3 className="text-xl font-bold tracking-tight">{t(lang, "vacuumSaltTitle")}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{t(lang, "labVacuumDesc")}</p>
            </div>
          </motion.div>

          {/* 卡片 2：盐粒子模拟 → /lab/salt-particle */}
          <motion.div
            {...groupItem}
            transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.06 }}
          >
            <Link
              href="/lab/salt-particle"
              className="press-card group relative block aspect-[16/10] w-full border border-black/10 bg-[#0c0c0e] overflow-hidden hover:border-diagonal-red/40"
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
              <div className="archive-text text-[10px] text-black/40 font-bold tracking-widest">
                INTERACTIVE · 实时模拟
              </div>
              <h3 className="text-xl font-bold tracking-tight">{t(lang, "labSaltTitle")}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{t(lang, "labSaltDesc")}</p>
            </div>
          </motion.div>

          {/* 卡片 3：天车 3D 解构 → /salt-plant-3d/ */}
          <motion.div
            {...groupItem}
            transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.12 }}
          >
            <Link
              href="/salt-plant-3d/index.html"
              className="press-card group relative block aspect-[16/10] w-full border border-black/10 bg-[#FAFAF8] overflow-hidden hover:border-diagonal-red/40"
            >
              <SaltPlantCover />
              <div className="absolute bottom-3 left-4 archive-text text-[10px] text-diagonal-red/80 tracking-[0.25em]">
                DERRICK · TIMBER HEADFRAME
              </div>
              <div className="absolute bottom-4 right-4 archive-text text-[10px] text-diagonal-red opacity-0 group-hover:opacity-100 transition-opacity">
                {t(lang, "labEnter")}
              </div>
            </Link>
            <div className="mt-5 space-y-1.5">
              <div className="archive-text text-[10px] text-black/40 font-bold tracking-widest">
                {t(lang, "labSaltPlantLabel")}
              </div>
              <h3 className="text-xl font-bold tracking-tight">{t(lang, "labSaltPlantTitle")}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{t(lang, "labSaltPlantDesc")}</p>
            </div>
          </motion.div>
        </div>

        <p className="mt-10 archive-text text-[10px] opacity-30 tracking-widest">
          EXPERIMENTAL · 实验性质 · 非档案主体内容
        </p>
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
