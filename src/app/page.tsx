"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { archiveData, atlasData } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { ArchiveCard } from "@/components/ArchiveCard";
import { AtlasCover } from "@/components/AtlasCover";
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
              <span className="block text-8xl md:text-[9rem]">DIA</span>
              <span
                className="block text-8xl md:text-[9rem] -mt-2 md:-mt-4"
                style={{ transform: "translateX(0.3em)" }}
              >
                GONAL
              </span>
              {/* 贯穿 DIA/GONAL 的对角斜线 —— 项目核心视觉母题
                  更粗、浅灰、略缓于 45° 贴近水平轴，两端收尖形成笔触/刻痕感 */}
              {/* 外层柔化光晕：让斜线从背景中“浮”出来 */}
              <span
                aria-hidden="true"
                className="block absolute pointer-events-none"
                style={{
                  top: "2%",
                  left: "50%",
                  width: "76px",
                  height: "100%",
                  marginLeft: "-38px",
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.03) 8%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.03) 92%, transparent 100%)",
                  transform: "rotate(14deg)",
                  transformOrigin: "center center",
                  filter: "blur(10px)",
                }}
              />
              {/* 主斜线体：加粗至 52px，带立体灰渐变 */}
              <span
                aria-hidden="true"
                className="block absolute pointer-events-none"
                style={{
                  top: "3%",
                  left: "50%",
                  width: "52px",
                  height: "98%",
                  marginLeft: "-26px",
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.06) 5%, rgba(75,75,75,0.22) 18%, rgba(45,45,45,0.32) 50%, rgba(75,75,75,0.22) 82%, rgba(0,0,0,0.06) 95%, transparent 100%)",
                  transform: "rotate(14deg)",
                  transformOrigin: "center center",
                  clipPath:
                    "polygon(46% 0%, 54% 0%, 62% 1.5%, 68% 4.5%, 68% 95.5%, 62% 98.5%, 54% 100%, 46% 100%, 38% 98.5%, 32% 95.5%, 32% 4.5%, 38% 1.5%)",
                  filter: "drop-shadow(0 0 6px rgba(0,0,0,0.08)) drop-shadow(-4px 0 12px rgba(0,0,0,0.06))",
                }}
              />
              {/* 内层高光脊线：强化体积感与金属边缘 */}
              <span
                aria-hidden="true"
                className="block absolute pointer-events-none"
                style={{
                  top: "3%",
                  left: "50%",
                  width: "2px",
                  height: "98%",
                  marginLeft: "-1px",
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.28) 16%, rgba(255,255,255,0.28) 84%, transparent 100%)",
                  transform: "rotate(14deg)",
                  transformOrigin: "center center",
                  mixBlendMode: "screen",
                }}
              />
              {/* 伴随细线：强化层叠、速度感与刻痕张力 */}
              <span
                aria-hidden="true"
                className="block absolute pointer-events-none"
                style={{
                  top: "10%",
                  left: "50%",
                  width: "3px",
                  height: "76%",
                  marginLeft: "36px",
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.08) 14%, rgba(0,0,0,0.08) 86%, transparent 100%)",
                  transform: "rotate(14deg)",
                  transformOrigin: "center center",
                  clipPath: "polygon(50% 0%, 100% 3%, 100% 97%, 50% 100%, 0% 97%, 0% 3%)",
                }}
              />
              {/* 第二伴随细线：在主斜线另一侧形成对称刻痕 */}
              <span
                aria-hidden="true"
                className="block absolute pointer-events-none"
                style={{
                  top: "14%",
                  left: "50%",
                  width: "2px",
                  height: "68%",
                  marginLeft: "-40px",
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.05) 18%, rgba(0,0,0,0.05) 82%, transparent 100%)",
                  transform: "rotate(14deg)",
                  transformOrigin: "center center",
                  clipPath: "polygon(50% 0%, 100% 4%, 100% 96%, 50% 100%, 0% 96%, 0% 4%)",
                }}
              />
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
              <p className="text-xl leading-relaxed">
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
            <p className="archive-text text-sm opacity-50 tracking-[0.2em]">{t(lang, "documentsSubtitle")}</p>
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
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={index % 2 !== 0 ? "lg:mt-24" : ""}
            >
              <ArchiveCard item={item} />
            </motion.div>
          ))}
        </div>

        <div className="mt-40 pt-12 border-t border-black flex justify-center">
          <Link href="/archive" className="archive-text text-sm font-bold border border-black px-12 py-4 hover:bg-black hover:text-white transition-all">
            {t(lang, "loadFullIndex")}
          </Link>
        </div>
      </section>

      {/* Atlas Section - DARK THEME */}
      <section id="atlas" className="relative z-10 bg-black text-white py-40">
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
              <div className="w-full h-px bg-white/20 relative overflow-hidden">
                <motion.div
                  animate={{ x: ["-100%", "400%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-diagonal-red w-1/4"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-24">
            {atlasData.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <AtlasCover item={item} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="fixed bottom-10 right-10 archive-text text-[10px] opacity-30 tracking-widest vertical-rl hidden md:block mix-blend-difference"
      >
        {t(lang, "scrollToDiscover")}
      </motion.div>
    </div>
  );
}
