import { AtlasItem, getLocalizedAtlasItem } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import Link from "next/link";
import { getAssetPath, getLocalSrcSet, srcSetFallback } from "@/lib/path";

/**
 * 区位两字码。原来取的是 region 前两位，Southwest 和 Southeast 都会变成 "SO" ——
 * 多了一个大区之后卡片上就分不出来了，改成显式映射。
 */
const REGION_CODE: Record<string, string> = {
  Southwest: "SW",
  Northeast: "NE",
  Transition: "TR",
  Southeast: "SE",
};

export function AtlasCover({ item }: { item: AtlasItem }) {
  const { lang } = useI18n();
  const localized = getLocalizedAtlasItem(item, lang);

  return (
    <Link href={`/atlas/${item.id}`}>
      {/* hover 上浮 + 按压回缩由 .press-card 统一接管（CSS，无 JS 开销）
          封面体量大，抬升给到 6px */}
      <div
        className="press-card group relative cursor-pointer"
        style={{ "--lift": "-6px" } as React.CSSProperties}
      >
        {/* 档案封面主体 */}
        <div className="aspect-[4/5] bg-diagonal-warmGray relative overflow-hidden border border-black/10 group-hover:border-diagonal-red/40 transition-colors">
          {/* 背景对角线 */}
          <div className="absolute inset-0 opacity-[0.12] diagonal-line mix-blend-overlay" />

          {/* 封面图片 - 原色呈现 */}
          {item.cover ? (
            <div className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out-strong scale-105 group-hover:scale-100">
              <img
                src={getAssetPath(item.cover)}
                srcSet={getLocalSrcSet(item.cover) || undefined}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                alt={localized.title}
                loading="lazy"
                decoding="async"
                onError={srcSetFallback}
                className="w-full h-full object-cover opacity-100"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-diagonal-warmGray opacity-60 text-foreground">
              <span className="archive-text text-[9px]">{t(lang, "noVisualRecord")}</span>
            </div>
          )}

          {/* 封面元数据标注 */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
            <div className="archive-text text-[9px] bg-white/80 backdrop-blur-md px-2 py-1 text-foreground border border-black/10">
              {item.id}
            </div>
            <div className="archive-text text-[9px] text-white/45 vertical-rl tracking-[0.3em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              LOC: {item.location.code}_{REGION_CODE[item.region] ?? item.region.toUpperCase()}
            </div>
          </div>

          {/* 底部交互提示 */}
          <div className="absolute bottom-0 left-0 w-full p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-[transform,opacity] duration-200 ease-out-strong bg-gradient-to-t from-black/70 to-transparent">
            <span className="archive-text text-[9px] text-diagonal-red font-bold tracking-widest">
              {t(lang, "openAtlas")}
            </span>
          </div>
        </div>

        {/* 外部标题信息：/atlas 是黑底页，这里不能用 text-foreground（#1A1A1A 压黑底 = 看不见） */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="archive-text text-[9px] text-white/45 tracking-widest uppercase italic">
              {localized.category}
            </span>
            <span className="archive-text text-[9px] text-white/45">
              {localized.location.city}
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-diagonal-red transition-colors leading-snug">
            {localized.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
