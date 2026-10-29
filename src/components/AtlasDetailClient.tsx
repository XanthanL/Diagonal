"use client";

import { AtlasItem, getLocalizedAtlasItem } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getCloudinaryUrl, getCloudinarySrcSet } from "@/lib/path";
import { SquareLensGallery } from "@/components/SquareLensGallery";
import { ShaderToggles } from "@/components/ShaderToggles";
import { FloraBackdrop } from "@/components/FloraBackdrop";

export function AtlasDetailClient({ item }: { item: AtlasItem }) {
  const { lang } = useI18n();
  const localized = getLocalizedAtlasItem(item, lang);
  const subCollections = localized.subCollections || [];

  // 草木主题只给这一个相册（data.ts 里 item.theme === "herbarium"）。
  // 版式与字体一行不动，换的只是色：底色、字色、强调色、细线，
  // 以及一层只在页头露面的底光（flowers themselves，见 FloraBackdrop）。
  const isFlora = item.theme === "herbarium";
  const accent = isFlora ? "text-[var(--flora-accent)]" : "text-diagonal-red";
  const line = isFlora ? "border-[color:var(--flora-line)]" : "border-white/10";
  const surface = isFlora ? "bg-[var(--flora-bg)] text-[var(--flora-ink)] flora" : "bg-black text-white";
  const selection = isFlora ? "selection:bg-[var(--flora-accent)]" : "selection:bg-diagonal-red";

  return (
    <div className={`relative isolate min-h-screen pt-32 pb-60 font-sans ${surface} ${selection}`}>
      {isFlora && <FloraBackdrop />}
      <nav className="fixed top-0 left-0 w-full z-50 p-6 mix-blend-difference">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            href="/#atlas"
            className={`archive-text text-xs font-bold sm:text-sm flex items-center gap-2 group ${
              isFlora ? "text-[var(--flora-ink)]" : "text-white"
            }`}
          >
            <span className="group-hover:-translate-x-2 transition-transform">←</span> {t(lang, "backToAtlas")}
          </Link>
          {/* 详情页不挂 GlobalNav，开关要在这里也留一份 —— 方形取样框就活在这一页。
              手机 390 宽下这一条要塞下返回链接 + 两个开关 + 语言切换，间距和字号都得收一档 */}
          <div className="flex items-center gap-3 sm:gap-8">
            <ShaderToggles />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-24 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-8 space-y-6">
            <div className={`archive-text text-xs font-bold tracking-[0.4em] ${accent}`}>
              {localized.region.toUpperCase()} / {localized.category.toUpperCase()}
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase italic">{localized.title}</h1>
          </div>
          <div className={`md:col-span-4 space-y-4 border-l pl-6 ${line}`}>
            <div className="archive-text text-[10px] opacity-60 uppercase">{t(lang, "investigator")}</div>
            <div className="text-lg font-bold italic">{localized.author}</div>
            <div className="archive-text text-[10px] opacity-60 uppercase pt-2">{t(lang, "timeline")}</div>
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
                <div className={`relative aspect-[4/5] overflow-hidden border ${line}`}>
                  <img
                    src={getCloudinaryUrl(sub.cover, 800)}
                    srcSet={getCloudinarySrcSet(sub.cover, [480, 800, 1200]) || undefined}
                    sizes="(min-width: 768px) 620px, 100vw"
                    alt={sub.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h3 className="text-3xl font-bold uppercase">{sub.title}</h3>
                  </div>                </div>
              </Link>
            ))}
          </section>
        ) : localized.gallery && localized.gallery.length > 0 ? (
          // 没有子集合的相册（如个人影像记录）：打开即是照片墙，按画幅分区
          <SquareLensGallery photos={localized.gallery} label={localized.title} layout="sequence" />
        ) : (
          <div className={`py-40 text-center border border-dashed opacity-20 archive-text ${line}`}>
            {t(lang, "noSubCollections")}
          </div>
        )}
      </div>
    </div>
  );
}
