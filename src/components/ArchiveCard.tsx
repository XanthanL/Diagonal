import { ArchiveItem, getLocalizedArchiveItem } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { motion } from "framer-motion";
import Link from "next/link";
import { getAssetPath } from "@/lib/path";

export function ArchiveCard({ item }: { item: ArchiveItem }) {
  const { lang } = useI18n();
  const localized = getLocalizedArchiveItem(item, lang);

  return (
    <Link href={`/archive/${item.id}`}>
      <motion.div
        whileHover={{ y: -5 }}
        className="group relative border-t border-black/10 pt-6 pb-12 cursor-pointer flex flex-col h-full"
      >
        <div className="archive-text text-[10px] mb-4 flex justify-between opacity-50">
          <span>{item.id} // {localized.location.code}</span>
          <span>{item.year}</span>
        </div>

        <div className="aspect-[4/5] bg-neutral-100 mb-6 relative overflow-hidden group-hover:bg-neutral-200 transition-colors border border-black/5">
          <div className="absolute inset-0 opacity-10 diagonal-line z-10 pointer-events-none"></div>

          {item.thumbnail ? (
            <img
              src={getAssetPath(item.thumbnail)}
              alt={localized.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="archive-text text-[8px] text-center opacity-30 leading-tight"
              dangerouslySetInnerHTML={{ __html: t(lang, "archiveDataPending") }}
            />
          )}

          {/* 悬浮时的对角线强调 */}
          <motion.div
            className="absolute bottom-0 right-0 w-0 h-[1px] bg-black group-hover:w-full transition-all duration-500 z-20"
          />
        </div>

        <div className="space-y-4 mt-auto">
          <div className="archive-text text-[10px] bg-black text-white px-2 py-0.5 inline-block mb-1">
            {localized.type}
          </div>
          <h3 className="text-2xl font-bold tracking-tight leading-[1.3] uppercase group-hover:underline underline-offset-8 decoration-2">
            {localized.title}
          </h3>
          <p className="text-sm font-medium opacity-60 italic">{localized.artist}</p>

          <div className="flex flex-wrap gap-2 pt-4">
            {localized.tags.map(tag => (
              <span key={tag} className="archive-text text-[8px] opacity-40">#{tag}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
