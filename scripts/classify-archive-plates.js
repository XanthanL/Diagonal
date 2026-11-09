#!/usr/bin/env node
/**
 * 给归档正文的 <figure> 标注真实画幅，并把连排图版收进网格（幂等）。
 *
 * 为什么要标：CSS 无法从 <img> 的 src 推断宽高比。旧规则给所有正文图加了
 * `max-height:78vh + object-fit:contain`，1080×9792 这类长海报会被压成
 * 768×702 框里一条 77px 宽的窄条 —— 视觉上等于「配图不见了」。
 * 这里把真实尺寸写进 HTML，排版层才能按画幅分流：
 *
 *   doc-plate--wide     r >= 0.90  横图 / 方图 → 满栏自然高
 *   doc-plate--portrait 0.30<=r<0.90 竖图 → 桌面双栏（图左/右，字另一侧）
 *   doc-plate--long     r < 0.30  超长海报 → 满栏自然高，不再压扁
 *   doc-plate--spread   后面跟得上有字的段落 → 浮动图版，文字绕排
 *   doc-plate--solo     后面没有文字 → 满栏
 *   doc-plate--right    隔张换边，像报纸那样左右交替
 *   .doc-plate-grid     连续多张图（中间无字）→ 两列网格
 *
 * 只改属性 / 加包裹 div，正文一个字都不动。
 *
 *   node scripts/classify-archive-plates.js          标注
 *   node scripts/classify-archive-plates.js --check  只校验标注是否齐全
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "src/content/archive");
const IMG_ROOT = path.join(ROOT, "public/images");
const CHECK = process.argv.includes("--check");
const FIG_RE = /<figure\b([^>]*)>([\s\S]*?)<\/figure>/gi;
const PLATE_CLASSES = /\s*doc-plate(?:--[\w-]+)?/g;

const dims = new Map();
async function sizeOf(src) {
  if (!/^\/images\//.test(src)) return null;
  if (dims.has(src)) return dims.get(src);
  const file = path.join(IMG_ROOT, decodeURI(src.replace(/^\/images\//, "")));
  if (!fs.existsSync(file)) { dims.set(src, null); return null; }
  try {
    const m = await sharp(file).metadata();
    const v = { w: m.width, h: m.height };
    dims.set(src, v);
    return v;
  } catch { dims.set(src, null); return null; }
}

function plainText(html) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;|&#160;/gi, " ").replace(/\s+/g, " ").trim();
}

/** 图后面是否跟得上有字的内容（下一个 figure / 标题 / 分隔线之前） */
function hasCopyAfter(after) {
  const stop = after.search(/<(?:figure|h[1-6]|hr|table|blockquote)\b/i);
  const chunk = stop < 0 ? after : after.slice(0, stop);
  return [...chunk.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].some((m) => plainText(m[1]).length >= 20);
}

function kindOf(r) {
  if (r >= 0.9) return "wide";
  if (r >= 0.3) return "portrait";
  return "long";
}

/** 去掉上一次的标注，保证反复跑结果一致 */
function strip(source) {
  return source
    .replace(/<div class="doc-plate-grid">([\s\S]*?)<\/div>/g, "$1")
    .replace(/<figure\b([^>]*)>/gi, (m, attrs) => `<figure${attrs.replace(PLATE_CLASSES, "")}>`)
    .replace(/(<img\b[^>]*?)\s+width="\d+"\s+height="\d+"(?=\s*\/?>)/gi, "$1");
}

async function transform(html) {
  const s = strip(html);
  const matches = [...s.matchAll(FIG_RE)];
  if (!matches.length) return s;

  const infos = [];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const srcM = /<img\b[^>]*\ssrc="([^"]+)"/i.exec(m[2]);
    const dim = srcM ? await sizeOf(srcM[1]) : null;
    const ratio = dim ? dim.w / dim.h : 1;
    const gap = i + 1 < matches.length
      ? s.slice(m.index + m[0].length, matches[i + 1].index)
      : s.slice(m.index + m[0].length);
    const after = s.slice(m.index + m[0].length);
    infos.push({ m, dim, kind: kindOf(ratio), hasCopy: hasCopyAfter(after), gapOnly: !/[^\s]/.test(gap) });
  }

  // 连续图版（两两之间只有空白）归为一组
  const runs = [];
  let cur = [0];
  for (let i = 1; i < infos.length; i++) {
    if (infos[i - 1].gapOnly) cur.push(i);
    else { runs.push(cur); cur = [i]; }
  }
  runs.push(cur);
  const runOf = new Map();
  runs.forEach((run, ri) => run.forEach((i) => runOf.set(i, { ri, size: run.length })));

  let spreadIndex = 0;
  const rendered = infos.map((info, i) => {
    const { m, dim, kind, hasCopy } = info;
    const run = runOf.get(i);
    const spread = kind === "portrait" && hasCopy && run.size === 1;
    const side = spread && spreadIndex++ % 2 === 1 ? " doc-plate--right" : "";
    const cls = `doc-plate doc-plate--${kind}${spread ? " doc-plate--spread" : " doc-plate--solo"}${side}`;
    let inner = m[2];
    if (dim) {
      inner = inner.replace(/<img\b([^>]*?)\/?>/gi, (im, attrs) => {
        const clean = attrs.replace(/\s*\/$/, "");
        return `<img${clean} width="${dim.w}" height="${dim.h}" />`;
      });
    }
    // 保留 figure 原有属性（如补图脚本的 data-recovered 幂等标记），只接管 class
    const other = m[1].replace(/\s*class="[^"]*"/gi, "").trim();
    return `<figure${other ? " " + other : ""} class="${cls}">${inner}</figure>`;
  });

  // 按原顺序拼回：间隙原文（含空白）一律保留
  let out = s.slice(0, matches[0].index);
  for (let i = 0; i < infos.length; i++) {
    const run = runOf.get(i);
    // 不加任何换行：strip() 复原时必须逐字回到原串，否则幂等检查会假报错
    if (run.size > 1 && i === runs[run.ri][0]) out += '<div class="doc-plate-grid">';
    out += rendered[i];
    // 网格必须在「本组最后一张图」之后立刻收口，否则组后的段落会被包进网格
    if (run.size > 1 && i === runs[run.ri][runs[run.ri].length - 1]) out += '</div>';
    const gapEnd = i + 1 < matches.length ? matches[i + 1].index : s.length;
    out += s.slice(matches[i].index + matches[i][0].length, gapEnd);
  }
  return out;
}

(async () => {
  const files = fs.readdirSync(CONTENT).filter((f) => f.endsWith(".html"));
  let changed = 0, plates = 0, grids = 0, noDim = 0;
  for (const f of files) {
    const p = path.join(CONTENT, f);
    const before = fs.readFileSync(p, "utf8");
    const after = await transform(before);
    if (after !== before) {
      changed++;
      if (!CHECK) fs.writeFileSync(p, after, "utf8");
    }
    plates += (after.match(/class="doc-plate doc-plate--/g) || []).length;
    grids += (after.match(/class="doc-plate-grid"/g) || []).length;
    noDim += (after.match(/<figure class="doc-plate [^"]*">\s*<img(?![^>]*\bwidth=)/g) || []).length;
  }
  console.log(`${CHECK ? "CHECK" : "DONE"} | 文件 ${files.length} | 需更新 ${changed} | 图版 ${plates} | 网格 ${grids} | 无尺寸标注 ${noDim}`);
  if (CHECK && changed) process.exit(1);
})();
