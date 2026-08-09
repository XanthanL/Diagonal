"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { SaltSimulation } from "@/components/SaltSimulation";

export default function SaltParticlePage() {
  const { lang } = useI18n();

  return (
    <main className="relative min-h-screen bg-[#FAFAF8] pt-24">
      {/* 对角斜线装饰（呼应首页母题，仅作氛围） */}
      <div className="absolute top-0 left-0 w-full h-72 pointer-events-none opacity-[0.04]">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black to-transparent transform skew-y-12" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <Link
          href="/#lab"
          className="archive-text text-[11px] opacity-60 hover:opacity-100 transition-opacity"
        >
          ← {t(lang, "labTitle")}
        </Link>

        <div className="mt-8 flex flex-col md:flex-row justify-between items-baseline gap-6">
          <div>
            <div className="archive-text text-[10px] text-diagonal-red font-bold tracking-widest border-l border-diagonal-red pl-4">
              {t(lang, "labLabel")}
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic mt-4 leading-none">
              {t(lang, "labSaltTitle")}
            </h1>
          </div>
          <p className="max-w-xs text-sm opacity-50 leading-relaxed italic">
            {t(lang, "labSaltDesc")}
          </p>
        </div>

        <div className="mt-10 aspect-[4/5] md:aspect-[2/1] w-full">
          <SaltSimulation />
        </div>

        <p className="mt-6 archive-text text-[10px] opacity-50 tracking-widest">
          MOVE / TOUCH TO STIR THE CRYSTAL CLOUD
        </p>
      </div>
    </main>
  );
}
