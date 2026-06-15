"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { archiveData, atlasData } from "@/lib/data";
import { ArchiveCard } from "@/components/ArchiveCard";
import { AtlasCover } from "@/components/AtlasCover";
import { SaltSimulation } from "@/components/SaltSimulation";

export default function Home() {
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
          <div className="space-y-12">
            <motion.h1
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-8xl md:text-[10rem] font-black leading-[0.8] tracking-tighter"
            >
              DIA<br />GONAL
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="max-w-md space-y-6"
            >
              <div className="archive-text text-sm font-bold border-l-2 border-black pl-4">
                PROJECT STATUS: ACTIVE
              </div>
              <p className="text-xl leading-relaxed">
                对角线计划 (Diagonal) 是一个致力于跨学科行为艺术研究、文献编目与现场实践的独立艺术项目。我们通过“对角线”的视角，重新审视艺术与社会、档案与行动之间的非线性关系。
              </p>
            </motion.div>
          </div>

          <div className="space-y-12 block">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="aspect-[4/5] relative"
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
            <h2 className="text-6xl font-black tracking-tighter uppercase italic">The Documents</h2>
            <p className="archive-text text-sm opacity-50 tracking-[0.2em]">文献展示系统 V1.2 // FIELD_RECORDS</p>
          </motion.div>
          
          <div className="archive-text text-[10px] space-y-1 opacity-60">
            <div>TOTAL_RECORDS: {archiveData.length}</div>
            <div>AXIS: SW_TO_NE</div>
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
            LOAD FULL INDEX+
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
                VISUAL_MAPPING / THE_ATLAS
              </div>
              <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-none">
                THE ATLAS
              </h2>
            </motion.div>
            <div className="max-w-xs space-y-6">
              <p className="text-sm opacity-50 leading-relaxed italic">
                “地图集”通过视觉碎片记录现场考察、物质遗存与空间叙事，构建起从西南到东北的艺术地理图谱。
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
        SCROLL TO DISCOVER
      </motion.div>
    </div>
  );
}
