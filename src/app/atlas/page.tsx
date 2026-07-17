"use client";

import { motion } from "framer-motion";
import { atlasData } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { AtlasCover } from "@/components/AtlasCover";

export default function AtlasIndexPage() {
  const { lang } = useI18n();

  return (
    <div className="relative overflow-hidden pt-32 min-h-screen bg-black text-white">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="diagonal-line opacity-5" />
      </div>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <header className="mb-32 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="archive-text text-[10px] text-diagonal-red font-bold tracking-widest border-l border-diagonal-red pl-4"
          >
            {t(lang, "atlasLabel")}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-7xl md:text-9xl font-black tracking-tighter uppercase italic leading-none"
          >
            {t(lang, "atlasTitle")}
          </motion.h1>
          <p className="max-w-xl text-sm opacity-50 leading-relaxed italic">
            {t(lang, "atlasIntro")}
          </p>
          <div className="w-full h-px bg-white/20 relative overflow-hidden max-w-xs">
            <motion.div
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-diagonal-red w-1/4"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-24">
          {atlasData.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.1, 0.4) }}
            >
              <AtlasCover item={item} />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
