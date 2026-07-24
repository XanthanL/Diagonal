import type { ArchiveItem } from "@/lib/admin/types";

// 从 "2026.07.07 12:26" 取 "2026.07"
function yearMonth(year: string): string {
  const m = year.match(/^(\d{4})\.(\d{2})/);
  return m ? `${m[1]}.${m[2]}` : year.slice(0, 7);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface BuildArgs {
  item: ArchiveItem;
  kicker: string;
  coverCaption?: string;
  body: string; // 富文本正文（不含 header/section）
  lang: "zh" | "en";
}

// 生成与现有文章完全一致的 HTML 文件内容
export function buildArticleHtml({ item, kicker, coverCaption, body, lang }: BuildArgs): string {
  const ym = yearMonth(item.year);
  const label = `${kicker || "DIAGONAL_EVENT"} / ${ym}`;

  // h1：中文版仅中文标题；英文版为英文标题 + 中文副标题 span
  const h1 =
    lang === "en"
      ? `${escapeHtml(item.titleEn)}<br/><span class="text-3xl font-light italic opacity-70">${escapeHtml(item.title)}</span>`
      : escapeHtml(item.title);

  const locCity = lang === "en" ? item.location.cityEn : item.location.city;

  // 封面 figure（仅当有 thumbnail 时）
  let cover = "";
  if (item.thumbnail) {
    const alt = escapeHtml(lang === "en" ? item.titleEn : item.title);
    const cap = coverCaption ? `\n    <figcaption>${escapeHtml(coverCaption)}</figcaption>` : "";
    cover = `\n  <figure>\n    <img src="${item.thumbnail}" alt="${alt}" />${cap}\n  </figure>\n`;
  }

  return `<section class="archive-html-content">
  <header class="mb-24">
    <div class="archive-text text-xs text-diagonal-red mb-4 tracking-[0.3em]">${escapeHtml(label)}</div>
    <h1>${h1}</h1>
    <div class="flex gap-12 archive-text text-[10px] opacity-40 uppercase mt-8">
      <span>Location: ${escapeHtml(item.location.code)} / ${escapeHtml(locCity)}</span>
      <span>Publish: ${escapeHtml(item.year)}</span>
    </div>
  </header>
${cover}
${body.trim()}
</section>
`;
}

// —— 解析已有文章（编辑回填，best-effort）——

// 取 section 内部；去掉 header 块，返回可编辑的正文
export function extractBody(html: string): string {
  let inner = html;
  const sec = html.match(/<section[^>]*class="archive-html-content"[^>]*>([\s\S]*?)<\/section>/i);
  if (sec) inner = sec[1];
  // 移除第一个 header 块
  inner = inner.replace(/<header[\s\S]*?<\/header>/i, "");
  return inner.trim();
}

// 从 h1 中提取（去标签）标题文本；优先取中文副标题 span，否则整段
export function extractTitle(html: string): string {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!h1) return "";
  const span = h1[1].match(/<span[^>]*>([\s\S]*?)<\/span>/i);
  const raw = span ? span[1] : h1[1];
  return raw.replace(/<[^>]+>/g, "").trim();
}
