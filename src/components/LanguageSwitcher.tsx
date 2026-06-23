"use client";

import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";

export function LanguageSwitcher() {
  const { lang, toggleLang } = useI18n();

  return (
    <button
      onClick={toggleLang}
      aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}
      className="group relative flex items-center gap-2 archive-text text-[11px] font-bold uppercase tracking-widest text-current hover:opacity-70 transition-opacity"
    >
      <span className="relative flex h-4 w-8 items-center rounded-full border border-current/30 bg-current/5 px-0.5">
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="block h-2.5 w-2.5 rounded-full bg-current"
          style={{ marginLeft: lang === "en" ? "auto" : "0" }}
        />
      </span>
      <span className="min-w-[1.5rem] text-right">{lang === "zh" ? "EN" : "中"}</span>
    </button>
  );
}
