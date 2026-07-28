import { ArchiveItem, getLocalizedArchiveItem } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { getAssetPath, getLocalSrcSet, srcSetFallback } from "@/lib/path";
import { useState } from "react";

export function ArchiveCard({ item }: { item: ArchiveItem }) {
  const { lang } = useI18n();
  const localized = getLocalizedArchiveItem(item, lang);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Link href={`/archive/${item.id}`}>
      <div
        className="group relative border-t border-black/10 pt-6 pb-12 cursor-pointer flex flex-col h-full transition-transform duration-300 hover:-translate-y-1"
      >
        <div className="archive-text text-[9px] mb-4 flex justify-between opacity-50">
          <span>{item.id} // {localized.location.code}</span>
          <span>{item.year}</span>
        </div>

        <div className="aspect-[4/5] bg-neutral-100 mb-6 relative overflow-hidden group-hover:bg-neutral-200 transition-colors border border-black/5">
          <div className="absolute inset-0 opacity-10 diagonal-line z-10 pointer-events-none"></div>

          {item.thumbnail ? (
            <img
              src={getAssetPath(item.thumbnail)}
              srcSet={getLocalSrcSet(item.thumbnail) || undefined}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              alt={localized.title}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={srcSetFallback}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:brightness-105 ${
                imgLoaded ? "img-loaded" : "img-loading"
              }`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto border border-black/10 relative">
                  <div className="absolute inset-0 diagonal-line opacity-30" />
                </div>
                <div className="archive-text text-[9px] opacity-30">{item.id}</div>
              </div>
            </div>
          )}

          {/* 悬浮时底部红线强调 */}
          <div
            className="absolute bottom-0 left-0 h-[2px] bg-diagonal-red w-0 group-hover:w-full transition-all duration-500 z-20"
          />
        </div>

        <div className="space-y-4 mt-auto">
          <div className="archive-text text-[9px] bg-black text-white px-2 py-0.5 inline-block mb-1">
            {localized.type}
          </div>
          <h3 className="text-2xl font-bold tracking-tight leading-[1.3] uppercase group-hover:underline underline-offset-8 decoration-2">
            {localized.title}
          </h3>
          <p className="text-sm font-medium opacity-60 italic font-serif">{localized.artist}</p>

          <div className="flex flex-wrap gap-2 pt-4">
            {localized.tags.map(tag => (
              <span key={tag} className="archive-text text-[9px] opacity-40">#{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
