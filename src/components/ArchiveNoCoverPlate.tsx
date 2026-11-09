import { ArchiveItem } from "@/lib/data";
import { getAssetPath } from "@/lib/path";

/**
 * 无图版档案封套
 * ---------------------------------------------------------------------------
 * 公众号里有一批纯文字 / 纯海报推文没有可用封面。此前卡片只放一枚 12px 小方块
 * 和档案号，四比五的封面整块是空的。这里改成「印版封套」：把文章自己的
 * 栏目、标题、日期排成一张印刷题签，中间是一枚按档案号稳定派生的几何印版
 * （测绘 / 制版语汇，呼应全站对角线母题），底部一行记注说明「无图版」。
 *
 * 草木主题下不再排几何与题签，改用一张拱窗植物标本卡（herbarium-assets.css
 * 控制显隐）：图已经把话说完了，再压一层字就是重复。档案风逐像素不变。
 *
 * 约束：
 * - 几何印版纯 CSS + 内联 SVG，颜色全部走主题变量；
 * - 变体由 id 哈希决定，SSR / CSR 结果一致，不会水合抖动；
 * - 这些文字都是卡片下方已有信息的重复，故对读屏整体隐藏；
 * - 只展示真实元数据，截断处显式加省略号，不改写原文。
 */

type Variant = 0 | 1 | 2 | 3;

function hashId(id: string): number {
  // 初值与位移一起把四种印版摊匀（10 篇实测 3/2/2/3），
  // 又不引入与文章内容无关的随机数
  let h = 5434;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 从标题里拆出「栏目 / 题签」两级，拆不出就只留题签。 */
function plateTitle(title: string): { eyebrow: string; head: string } {
  const t = title.trim();
  const bracket = /^【([^】]{1,12})】\s*(.*)$/.exec(t);
  if (bracket) return { eyebrow: bracket[1], head: bracket[2] || t };

  // 「展览预告｜…」「召集令 | …」「分享会：…」「互联对话：…」
  const split = /^([^｜|丨:：，,。！？!?《》【】（）()]{1,9})\s*[｜|丨:：]\s*(.+)$/.exec(t);
  if (split) return { eyebrow: split[1], head: split[2] };

  // 「线上讲座《…》」这类没有分隔符，但书名号前就是栏目名
  const bookTitle = /^(.{2,6})《(.+)$/.exec(t);
  if (bookTitle) return { eyebrow: bookTitle[1], head: t.slice(bookTitle[1].length) };

  return { eyebrow: "", head: t };
}

function truncate(head: string, max = 15): string {
  const chars = Array.from(head);
  return chars.length > max ? `${chars.slice(0, max).join("")}…` : head;
}

/** 四角裁切标记 + 四种印版几何。线条走 currentColor，中心一点走品牌红。 */
function PlateMark({ variant }: { variant: Variant }) {
  const crop = "M2 13V2h11 M87 2h11v11 M98 87v11H87 M13 98H2V87";
  return (
    <svg className="anc-mark" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path className="anc-crop" d={crop} />
      {variant === 0 && (
        <>
          <path d="M50 8v84 M8 50h84" strokeDasharray="2 5" />
          <path d="M50 15 85 50 50 85 15 50Z M50 28 72 50 50 72 28 50Z M50 40 60 50 50 60 40 50Z" />
          <path className="anc-accent-fill" d="M50 45 55 50 50 55 45 50Z" />
        </>
      )}
      {variant === 1 && (
        <>
          <path d="M25 10v80 M50 10v80 M75 10v80 M10 25h80 M10 50h80 M10 75h80" />
          <path d="M16 84 84 16" />
          <path className="anc-accent-fill" d="M70 70h9v9h-9Z" />
          <rect x="42" y="42" width="16" height="16" />
        </>
      )}
      {variant === 2 && (
        <>
          <circle cx="50" cy="50" r="34" />
          <circle cx="50" cy="50" r="22" />
          <circle cx="50" cy="50" r="10" />
          <path d="M50 10v18 M50 72v18 M10 50h18 M72 50h18" />
          <path className="anc-accent-fill" d="M50 45 55 50 50 55 45 50Z" />
        </>
      )}
      {variant === 3 && (
        <>
          <rect x="22" y="22" width="56" height="56" />
          <path d="M22 58 58 22 M22 72 72 22 M34 78 78 34 M50 78 78 50 M66 78 78 66" />
          <path className="anc-accent-stroke" d="M50 34v32" />
        </>
      )}
    </svg>
  );
}

interface ArchiveNoCoverPlateProps {
  item: ArchiveItem;
  title: string;
  lang: "zh" | "en";
}

export function ArchiveNoCoverPlate({ item, title, lang }: ArchiveNoCoverPlateProps) {
  const variant = ((hashId(item.id) >>> 5) % 4) as Variant;
  const { eyebrow, head } = plateTitle(title);
  const date = (item.year || "").slice(0, 10) || "—";
  const noPlate = lang === "zh" ? "无图版" : "NO PLATE";

  return (
    <div className="archive-no-cover" data-variant={variant} aria-hidden="true">
      <div className="anc-paper" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="anc-specimen"
        src={getAssetPath("/images/herbarium/plate-specimen.webp")}
        alt=""
        loading="lazy"
        decoding="async"
      />
      <div className="anc-inner">
        <div className="anc-top archive-text">
          <span>DIAGONAL / ARCHIVE</span>
          <span>{date}</span>
        </div>

        <div className="anc-plate">
          <PlateMark variant={variant} />
        </div>

        <div className="anc-copy">
          <div className="anc-eyebrow archive-text">{eyebrow || "RECORD"}</div>
          <div className="anc-head" lang={lang === "zh" ? "zh" : undefined}>
            {truncate(head)}
          </div>
        </div>

        <div className="anc-bottom archive-text">
          <span className="anc-redbar" />
          <span>{noPlate}</span>
          <span>{item.type}</span>
        </div>
      </div>
    </div>
  );
}
