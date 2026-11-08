/**
 * 公众号归档片段规范化（幂等，可反复跑）。
 *
 * 解决的是「搬运格式」而不是正文内容：
 *  1. 微信原文用 <p><strong> </strong></p> / <p><em> </em></p> 撑行距，
 *     落在站内的 space-y 排版里会变成大块空白 —— 只删这些无字段落，一个字不动。
 *  2. 旧版把作者单独写成一个 <p> 飘在正文前，与页眉脱节 —— 并进档案页眉的 Byline 字段。
 *  3. 页眉从一堆 Tailwind 字面量换成语义类，字号 / 间距 / 配色统一由 CSS 与主题变量管。
 *  4. tags 从标题粗暴按标点切分，会切出 "Salt" / "of" / "工厂" 这种碎片 ——
 *     改为只收中文开头的实词词组。
 *
 * 用法：node scripts/normalize-archive-html.js [--check]
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "src/content/archive");
const STORE = path.join(CONTENT_DIR, "_store/index.json");
const CHECK = process.argv.includes("--check");

function tagsFromTitle(title) {
  const cleaned = title.replace(/[《》"'"'「」【】\[\]()（）丨｜|]/g, " ");
  const found = cleaned.match(/[\u4e00-\u9fff][\u4e00-\u9fffA-Za-z0-9·]{2,19}/g) || [];
  const uniq = [...new Set(found.map((s) => s.replace(/[的地得与和及在为之]$/, "").trim()))]
    .filter((s) => s.length >= 3 && !/^(转发|推广|广告|转载)$/.test(s))
    .slice(0, 3);
  return uniq.length ? uniq : ["对角线计划"];
}

function isEmptyParagraph(inner) {
  if (/<img\b/i.test(inner)) return false;
  const text = inner
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;|&ensp;|&emsp;/gi, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, "")
    .replace(/\s/g, "");
  return !text;
}

/**
 * 微信原文常见 <p><img></p>：清洗时 img 被提升成 <figure>，但 p 的开闭标签
 * 还留在外面，变成 <p><figure>…</figure></p>。HTML 规范里 p 只能放行内容，
 * 浏览器解析时会自动闭合 p，图版的计数、间距、TOC 锚点全都会错位。
 * 这里按 figure 切开：图片各自独立，夹在图片之间的文字另起合法段落。
 */
function splitFigureParagraphs(html) {
  return html.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (m, inner) => {
    if (!/<figure>/i.test(inner)) return m;
    return inner
      .split(/(<figure>[\s\S]*?<\/figure>)/gi)
      .map((part) => {
        if (/^<figure>/i.test(part)) return part.trim();
        const text = part
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;|&#160;|&ensp;|&emsp;/gi, " ")
          .replace(/&[a-z]+;|&#\d+;/gi, "")
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          .replace(/\s/g, "");
        return text ? `<p>${part.trim()}</p>` : "";
      })
      .filter(Boolean)
      .join("\n");
  });
}

function normalizeHtml(src) {
  const hasNewHeader = /class="archive-doc-header"/.test(src);
  let kicker = "", h1 = "", location = "Location: ON / Online", publish = "", byline = "";

  const kickerM = src.match(/DIAGONAL_WECHAT\s*\/\s*([\d.]+)/);
  if (kickerM) kicker = kickerM[0].replace(/\s+/g, " ");
  const h1M = src.match(/<h1>([\s\S]*?)<\/h1>/);
  if (h1M) h1 = h1M[1].trim();
  const locM = src.match(/<span>(Location:[^<]*)<\/span>/) || src.match(/<span><i>Location<\/i>([^<]*)<\/span>/);
  if (locM) location = /^Location:/.test(locM[1]) ? locM[1].trim() : `Location: ${locM[1].trim()}`;
  const pubM = src.match(/<span>(Publish:[^<]*)<\/span>/) || src.match(/<span><i>Publish<\/i>([^<]*)<\/span>/);
  if (pubM) publish = /^Publish:/.test(pubM[1]) ? pubM[1].trim() : `Publish: ${pubM[1].trim()}`;
  const bylineM = src.match(/<p class="archive-text text-sm opacity-60">([\s\S]*?)<\/p>/);
  if (bylineM) byline = bylineM[1].trim();
  // 已经是新版页眉时，Byline 存在 meta 行里
  if (hasNewHeader) {
    const b2 = src.match(/<span><i>Byline<\/i>([\s\S]*?)<\/span>/);
    if (b2) byline = b2[1].trim();
  }

  // 正文 = 去掉 section 壳、页眉、旧作者行
  let body = src
    .replace(/^\s*<section class="archive-html-content">\s*/i, "")
    .replace(/<\/section>\s*$/i, "")
    .replace(/<header[\s\S]*?<\/header>/i, "")
    .replace(/<p class="archive-text text-sm opacity-60">[\s\S]*?<\/p>/i, "");

  body = splitFigureParagraphs(body);
  let removed = 0;
  body = body.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (m, inner) => {
    if (isEmptyParagraph(inner)) { removed++; return ""; }
    return m;
  });
  body = body.replace(/\n{3,}/g, "\n\n").trim();

  const meta = [];
  if (publish) meta.push(`<span><i>Publish</i>${publish.replace(/^Publish:\s*/, "")}</span>`);
  meta.push(`<span><i>Source</i>WeChat / 对角线计划Diagonal</span>`);
  meta.push(`<span><i>Location</i>${location.replace(/^Location:\s*/, "")}</span>`);
  if (byline) meta.push(`<span><i>Byline</i>${byline}</span>`);

  const header = `<header class="archive-doc-header">
    <div class="archive-doc-kicker">${kicker || "DIAGONAL_WECHAT"}</div>
    <h1>${h1}</h1>
    <div class="archive-doc-meta">
      ${meta.join("\n      ")}
    </div>
  </header>`;

  return { html: `<section class="archive-html-content">\n  ${header}\n\n${body}\n</section>\n`, removed };
}

function main() {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => /^DIAGONAL-\d{4}-WX.*\.html$/.test(f));
  let changed = 0, emptyTotal = 0;
  for (const f of files) {
    const p = path.join(CONTENT_DIR, f);
    const src = fs.readFileSync(p, "utf8");
    const { html, removed } = normalizeHtml(src);
    emptyTotal += removed;
    if (html !== src) {
      changed++;
      if (!CHECK) fs.writeFileSync(p, html, "utf8");
    }
  }
  console.log(`[normalize] 片段 ${files.length} 篇，${CHECK ? "待修复" : "已重写"} ${changed} 篇，清理无字段落 ${emptyTotal} 个`);

  const store = JSON.parse(fs.readFileSync(STORE, "utf8"));
  let tagsChanged = 0;
  for (const item of store) {
    if (!/^DIAGONAL-\d{4}-WX/.test(item.id)) continue;
    const next = tagsFromTitle(item.title);
    if (JSON.stringify(next) !== JSON.stringify(item.tags)) { item.tags = next; tagsChanged++; }
  }
  console.log(`[normalize] tags 修正 ${tagsChanged} 条`);
  if (!CHECK) fs.writeFileSync(STORE, JSON.stringify(store, null, 2) + "\n", "utf8");
}

module.exports = { tagsFromTitle, normalizeHtml, splitFigureParagraphs };
if (require.main === module) main();
