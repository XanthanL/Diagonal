"use client";

import { AtlasItem, getLocalizedAtlasItem } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function AtlasDetailClient({ item }: { item: AtlasItem }) {
  const { lang } = useI18n();
  const localized = getLocalizedAtlasItem(item, lang);
  const subCollections = localized.subCollections || [];

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-60 selection:bg-diagonal-red font-sans">
      <nav className="fixed top-0 left-0 w-full z-50 p-6 mix-blend-difference">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/#atlas" className="archive-text text-sm font-bold flex items-center gap-2 group text-white">
            <span className="group-hover:-translate-x-2 transition-transform">←</span> {t(lang, "backToAtlas")}
          </Link>
          <LanguageSwitcher />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-24 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-8 space-y-6">
            <div className="archive-text text-xs text-diagonal-red font-bold tracking-[0.4em]">
              {localized.region.toUpperCase()} / {localized.category.toUpperCase()}
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase italic">{localized.title}</h1>
          </div>
          <div className="md:col-span-4 space-y-4 border-l border-white/10 pl-6">
            <div className="archive-text text-[10px] opacity-40 uppercase">{t(lang, "investigator")}</div>
            <div className="text-lg font-bold italic">{localized.author}</div>
            <div className="archive-text text-[10px] opacity-40 uppercase pt-2">{t(lang, "timeline")}</div>
            <div className="text-lg font-bold italic">{localized.date}</div>
          </div>
        </header>

        <section className="max-w-3xl mb-24">
          <p className="text-xl leading-relaxed opacity-70 italic">{localized.excerpt}</p>
        </section>

        {subCollections.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {subCollections.map((sub) => (
              <Link key={sub.id} href={`/atlas/${item.id}/${sub.id}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden border border-white/10">
                  <img src={sub.cover} alt={sub.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h3 className="text-3xl font-bold uppercase">{sub.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <div className="py-40 text-center border border-dashed border-white/10 opacity-20 archive-text">
            {t(lang, "noSubCollections")}
          </div>
        )}
      </div>
    </div>
  );
}
