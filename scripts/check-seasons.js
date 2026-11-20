/**
 * 四季主题一致性门禁（挂 prebuild）。
 *
 * 季节数据落地在两处：
 *   1. src/lib/seasons.ts  —— 运行时真相（组件 getSeasonAsset / 色板）
 *   2. src/app/seasons.css —— 首帧 CSS 变量（--flora-* 色板 / --season-* 图片）
 * 两处必须一致，否则首帧色与 hydration 后色会跳。这里从两边各自解析、逐项比对。
 *
 * 还校验：
 *   - spring 在 seasons.css 里没有覆盖规则（否则默认春不是零回归）
 *   - 四季色值不在彼此间重复（防止复制粘贴漏改）
 *   - 文档与素材目录骨架存在
 *   - 每季 pal 的合法性与 assetPaths 槽位齐全
 *
 * 任何一项不过 → exit(1)，prebuild 连带 build 失败，防止带病发布。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TS = fs.readFileSync(path.join(ROOT, "src", "lib", "seasons.ts"), "utf8");
// 解析一律用去注释版本：seasons.css 的注释里写了各季节名与选择器示例，
// 不去注释会让「spring 零回归」「选择器限定」等检查匹配到注释文字而误报。
const CSS = fs.readFileSync(path.join(ROOT, "src", "app", "seasons.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

// —— 从 seasons.ts 抓每季 pal ——
function parsePal(season) {
  const block = TS.match(new RegExp(`${season}:\\s*\\{[\\s\\S]*?pal:\\s*\\{([\\s\\S]*?)\\}`));
  if (!block) return null;
  const grab = (k) => (block[1].match(new RegExp(`${k}:\\s*"([^"]+)"`)) || [])[1];
  return {
    bgRgb: grab("bgRgb"),
    ink: grab("ink"),
    accent: grab("accent"),
    green: grab("green"),
    line: grab("line"),
  };
}
const ids = ["spring", "summer", "autumn", "winter"];
const tsPals = {};
for (const id of ids) {
  tsPals[id] = parsePal(id);
  ok(tsPals[id], `seasons.ts 缺 ${id} 的 pal`);
}

// —— 从 seasons.css 抓每季 --flora-* 覆盖 ——
function cssPal(id) {
  const block = CSS.match(new RegExp(`data-season="${id}"\\][\\s\\S]*?\\{([\\s\\S]*?)\\}`));
  if (!block) return null;
  const grab = (k) => (block[1].match(new RegExp(`--flora-${k}:\\s*([^;]+);`)) || [])[1]?.trim();
  return { bgRgb: grab("bg-rgb"), ink: grab("ink"), accent: grab("accent"), green: grab("green"), line: grab("line") };
}

const norm = (v) => (v || "").replace(/\s+/g, "").toLowerCase();
for (const id of ["summer", "autumn", "winter"]) {
  const t = tsPals[id], c = cssPal(id);
  ok(c, `seasons.css 缺 ${id} 的色板规则`);
  if (!c || !t) continue;
  // CSS 里 --flora-bg: rgb(var(--flora-bg-rgb)) 派生，只需比 bg-rgb
  ok(norm(t.bgRgb) === norm(c.bgRgb), `${id} bgRgb 不一致: ts=${t.bgRgb} css=${c.bgRgb}`);
  ok(norm(t.ink) === norm(c.ink), `${id} ink 不一致: ts=${t.ink} css=${c.ink}`);
  ok(norm(t.accent) === norm(c.accent), `${id} accent 不一致: ts=${t.accent} css=${c.accent}`);
  ok(norm(t.green) === norm(c.green), `${id} green 不一致: ts=${t.green} css=${c.green}`);
  ok(norm(t.line) === norm(c.line), `${id} line 不一致: ts=${t.line} css=${c.line}`);
}

// —— 默认春零回归：seasons.css 不得有 spring 覆盖规则 ——
ok(!/data-season="spring"/.test(CSS), "seasons.css 不应含 data-season=spring 覆盖（默认春必须零回归）");

// —— 色值不得在四季间重复（复制粘贴漏改探测）——
for (const key of ["bgRgb", "ink", "accent", "green"]) {
  const vals = ids.map((id) => norm(tsPals[id]?.[key]));
  ok(new Set(vals).size === ids.length, `${key} 在四季间有重复值: ${vals.join(" / ")}`);
}

// —— 三季规则都要求 herbarium 且排除 theme-locked ——
for (const id of ["summer", "autumn", "winter"]) {
  const sel = CSS.match(new RegExp(`([^{}]*data-season="${id}"[^{}]*)\\{`));
  ok(sel && /data-theme="herbarium"/.test(sel[1]), `${id} 规则缺 data-theme=herbarium 限定`);
  ok(sel && /:not\(:has\(\.theme-locked\)\)/.test(sel[1]), `${id} 规则缺 :not(:has(.theme-locked))`);
}

// —— 文档与目录骨架存在 ——
ok(fs.existsSync(path.join(ROOT, "docs", "SEASONS-IMAGE-GUIDE.md")), "缺生图文档 docs/SEASONS-IMAGE-GUIDE.md");
for (const id of ["summer", "autumn", "winter"]) {
  ok(fs.existsSync(path.join(ROOT, "public", "images", "seasons", id)), `缺素材目录 public/images/seasons/${id}`);
}

// —— 素材已到位：三季 assetPaths 指向季节目录、stub 关闭、9 张 WebP 齐全 ——
function useSeasonAssets(id) {
  return new RegExp(`${id}:\\s*\\{[\\s\\S]*?assetPaths:\\s*seasonAssets\\("${id}"\\)`).test(TS);
}
function stubClosed(id) {
  return new RegExp(`${id}:\\s*\\{[\\s\\S]*?stub:\\s*false`).test(TS);
}
const WEBP = [
  "paper-grain.webp", "press-1.webp", "press-2.webp", "press-3.webp",
  "press-rule-band.webp", "plate-specimen.webp", "hero-portrait.webp",
  "seal.webp", "hero-botanical.webp",
];
for (const id of ["summer", "autumn", "winter"]) {
  ok(useSeasonAssets(id), `${id} assetPaths 未指向 seasonAssets("${id}")`);
  ok(stubClosed(id), `${id} stub 仍为 true（图已到位，不应再复用春图）`);
  for (const n of WEBP) {
    ok(fs.existsSync(path.join(ROOT, "public", "images", "seasons", id, n)), `缺素材 public/images/seasons/${id}/${n}`);
  }
}

// —— seasons.css 的三条 --season-* 图片变量必须与 seasons.ts 的路径一致 ——
for (const id of ["summer", "autumn", "winter"]) {
  const block = CSS.match(new RegExp(`data-season="${id}"[\\s\\S]*?\\{([\\s\\S]*?)\\}`));
  const body = block ? block[1] : "";
  for (const [v, file] of [["paper", "paper-grain.webp"], ["band", "press-rule-band.webp"], ["seal", "seal.webp"]]) {
    const m = body.match(new RegExp(`--season-${v}:\\s*url\\("([^"]+)"\\)`));
    const want = `/images/seasons/${id}/${file}`;
    ok(m && m[1] === want, `${id} --season-${v} 应为 ${want}，实际 ${m ? m[1] : "缺失"}`);
  }
}

// —— intro 关键图清单必须与季节路径一致（揭幕等错图会出现空白/闪图）——
const INTRO = fs.readFileSync(path.join(ROOT, "src", "lib", "introAssets.ts"), "utf8");
for (const id of ["summer", "autumn", "winter"]) {
  for (const file of ["paper-grain.webp", "press-1.webp", "hero-botanical.webp", "hero-portrait.webp"]) {
    ok(INTRO.includes(`"/images/seasons/${id}/${file}"`), `introAssets 缺 ${id}/${file} 关键图`);
  }
}
// 默认春的关键图仍指向 herbarium（零回归）
ok(INTRO.includes('"/images/herbarium/paper-grain.webp"'), "introAssets 默认春关键图被改动");

// —— CSS 背景落位必须全部走变量，不能写死春图路径 ——
const HA = fs.readFileSync(path.join(ROOT, "src", "app", "herbarium-assets.css"), "utf8");
ok(!/\/images\/herbarium\/(paper-grain|press-rule-band|seal)\.webp/.test(HA),
  "herbarium-assets.css 仍有写死的春图路径（应改用 var(--season-*)）");

if (fails.length) {
  console.error(`[check-seasons] FAIL ${fails.length} 项:`);
  fails.forEach((f) => console.error("  - " + f));
  process.exit(1);
}
console.log("[check-seasons] OK — 四季色板两处一致，默认春零回归，规则限定正确，文档与目录齐全。");
