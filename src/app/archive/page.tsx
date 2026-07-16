"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { archiveData } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { ArchiveCard } from "@/components/ArchiveCard";

export default function ArchiveIndexPage() {
  const { lang } = useI18n();

  return (
    <div className="relative overflow-hidden pt-32 min-h-screen bg-white text-black">
      {/* 视觉背景 */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="diagonal-line opacity-5" />
      </div>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <header className="mb-32 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="archive-text text-xs text-diagonal-red font-bold tracking-[0.3em] border-l-2 border-diagonal-red pl-4"
          >
            {t(lang, "totalArchiveAccess")}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-7xl md:text-9xl font-black tracking-tighter leading-none"
            dangerouslySetInnerHTML={{ __html: t(lang, "archiveTitle") }}
          />
          <p className="max-w-xl text-lg opacity-60 leading-relaxed italic">
            {t(lang, "archiveIntro")}
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
          {archiveData.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={index % 2 !== 0 ? "lg:mt-24" : ""}
            >
              <ArchiveCard item={item} />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
