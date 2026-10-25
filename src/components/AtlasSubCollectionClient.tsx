"use client";

import { AtlasItem, getLocalizedAtlasItem } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SquareLensGallery } from "@/components/SquareLensGallery";

export function AtlasSubCollectionClient({ item, subId }: { item: AtlasItem; subId: string }) {
  const { lang } = useI18n();
  const localized = getLocalizedAtlasItem(item, lang);
  const subCollection = localized.subCollections?.find((s) => s.id === subId);

  if (!subCollection) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-60 selection:bg-diagonal-red font-sans">
      <nav className="fixed top-0 left-0 w-full z-50 p-6 mix-blend-difference">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href={`/atlas/${item.id}`} className="archive-text text-sm font-bold flex items-center gap-2 group text-white">
            <span className="group-hover:-translate-x-2 transition-transform">←</span> {t(lang, "backToAtlasItem").replace("{title}", localized.title.toUpperCase())}
          </Link>
          <LanguageSwitcher />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-24">
          <h1 className="text-4xl md:text-6xl font-black uppercase italic">{subCollection.title}</h1>
        </header>

        {/* 照片墙 + 指针取样框：框内是同批次的下一张底片 */}
        <SquareLensGallery photos={subCollection.gallery} label={subCollection.title} />
      </div>
    </div>
  );
}
