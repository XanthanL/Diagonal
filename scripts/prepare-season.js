/**
 * 季节生图素材 → 站点 WebP（通用版，对应 prepare-herbarium.js）
 *
 * 用法：node scripts/prepare-season.js <summer|autumn|winter>
 *   npm run seasons:assets -- summer
 *
 * 源：<季节目录>/ 下的 9 张 PNG/JPG（用户按 docs/SEASONS-IMAGE-GUIDE.md 生成）
 * 出：<季节目录>/*.webp（同目录，站点直接引用；不入库由 optimize-images 再处理，
 *   因为 seasons/ 不在它的 ROOTS 内，不会生成多余 w480/w960 变体）
 *
 * 处理与春完全一致，四个手法照搬 prepare-herbarium.js：
 *   1. 纸纹围绕该季纸色放大纤维对比（否则 WebP q78 抹成纯色）
 *   2. 压花按 alpha 包围盒裁掉四周留白（阈值 96，避开抠图残影）
 *   3. 印章向该季墨色插值 + 抬 alpha（原线太浅铺在纸上看不见）
 *   4. 分隔带裁留白 → 固定 1600×300 → 四边 smoothstep 渐隐（自带淡出，不再被容器硬裁）
 *
 * 幂等可复跑。season 参数必填且白名单校验，避免误覆盖春的 herbarium 目录。
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SEASON = process.argv[2];
const VALID = ["summer", "autumn", "winter"];

if (!VALID.includes(SEASON)) {
  console.error(`用法: node scripts/prepare-season.js <${VALID.join("|")}>  (收到: ${SEASON})`);
  process.exit(1);
}

const SRC = path.join(ROOT, "public", "images", "seasons", SEASON);
if (!fs.existsSync(SRC)) {
  console.error(`目录不存在: ${SRC}`);
  process.exit(1);
}

// 每季纸色 / 墨色（与 seasons.ts 的 pal 一致；check-seasons.js 会校验）
const PAL = {
  summer: { paper: [239, 241, 230], ink: [22, 37, 28] },
  autumn: { paper: [244, 238, 224], ink: [42, 33, 24] },
  winter: { paper: [239, 241, 241], ink: [27, 34, 38] },
}[SEASON];

const JOBS = [
  { src: "paper-grain_tile.png", out: "paper-grain.webp", width: 768, quality: 96, paper: true },
  { src: "press-1_2x3.png", out: "press-1.webp", width: 800, quality: 82, trim: true },
  { src: "press-2_2x3.png", out: "press-2.webp", width: 800, quality: 82, trim: true },
  { src: "press-3_2x3.png", out: "press-3.webp", width: 800, quality: 82, trim: true },
  { src: "press-rule_4x1.png", out: "press-rule.webp", width: 1600, quality: 80 },
  { src: "plate-specimen_4x5.png", out: "plate-specimen.webp", width: 720, quality: 80 },
  { src: "hero-botanical-portrait_3x4.png", out: "hero-portrait.webp", width: 720, quality: 80 },
  { src: "seal_1x1.png", out: "seal.webp", width: 480, quality: 90, ink: true },
  { src: "hero-botanical.jpg", out: "hero-botanical.webp", width: 1920, quality: 82 },
];

async function enhancePaper(input) {
  const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  const MEAN = PAL.paper;
  const GAIN = 2.2;
  const CH = info.channels;
  for (let i = 0; i < data.length; i += CH) {
    for (let c = 0; c < 3; c++) {
      const v = MEAN[c] + (data[i + c] - MEAN[c]) * GAIN;
      data[i + c] = Math.max(0, Math.min(255, Math.round(v)));
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: CH } });
}

async function inkSeal(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const TARGET = PAL.ink;
  const MIX = 0.72;
  for (let i = 0; i < data.length; i += info.channels) {
    for (let c = 0; c < 3; c++) {
      data[i + c] = Math.round(data[i + c] * (1 - MIX) + TARGET[c] * MIX);
    }
    data[i + 3] = Math.min(255, Math.round(data[i + 3] * 1.9));
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
}

async function trimAlpha(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const THRESHOLD = 96;
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * C + 3] <= THRESHOLD) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return sharp(input);
  const padX = Math.round(W * 0.02), padY = Math.round(H * 0.02);
  const left = Math.max(0, minX - padX), top = Math.max(0, minY - padY);
  const right = Math.min(W, maxX + 1 + padX), bottom = Math.min(H, maxY + 1 + padY);
  return sharp(input).extract({ left, top, width: right - left, height: bottom - top });
}

const smooth = (t) => { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); };

async function makeRuleBand(input) {
  const W = 1600, H = 300;
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const SW = info.width, SH = info.height, C = info.channels;
  const alphaAt = (x, y) => data[(y * SW + x) * C + 3];
  let minY = SH, maxY = -1, minX = SW, maxX = -1;
  for (let y = 0; y < SH; y++) {
    for (let x = 0; x < SW; x++) {
      if (alphaAt(x, y) <= 24) continue;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  }
  const top = Math.max(0, minY - Math.round(SH * 0.02));
  const bottom = Math.min(SH, maxY + 1 + Math.round(SH * 0.02));
  const left = Math.max(0, minX - Math.round(SW * 0.01));
  const right = Math.min(SW, maxX + 1 + Math.round(SW * 0.01));
  const cropped = await sharp(input)
    .extract({ left, top, width: right - left, height: bottom - top })
    .resize(W, H, { fit: "fill" })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = cropped.data, CC = cropped.info.channels;
  const FADE = { l: 0.13, r: 0.15, t: 0.10, b: 0.16 };
  for (let y = 0; y < H; y++) {
    const fy = Math.min(smooth(y / (H * FADE.t)), smooth((H - 1 - y) / (H * FADE.b)));
    for (let x = 0; x < W; x++) {
      const fx = Math.min(smooth(x / (W * FADE.l)), smooth((W - 1 - x) / (W * FADE.r)));
      px[(y * W + x) * CC + 3] = Math.round(px[(y * W + x) * CC + 3] * fx * fy);
    }
  }
  return sharp(px, { raw: { width: W, height: H, channels: CC } });
}

async function main() {
  console.log(`[prepare-season] ${SEASON}  纸色 ${PAL.paper.join(",")}  墨色 ${PAL.ink.join(",")}`);
  let missing = 0;
  for (const job of JOBS) {
    const input = path.join(SRC, job.src);
    if (!fs.existsSync(input)) {
      console.warn(`  [SKIP] 缺素材 ${job.src}`);
      missing++;
      continue;
    }
    let pipeline = sharp(input);
    if (job.paper) pipeline = await enhancePaper(input);
    if (job.ink) pipeline = await inkSeal(input);
    if (job.trim) pipeline = await trimAlpha(input);
    const dest = path.join(SRC, job.out);
    await pipeline
      .resize({ width: job.width, withoutEnlargement: true })
      .webp({ quality: job.quality, alphaQuality: 92, effort: 6 })
      .toFile(dest);
    const meta = await sharp(dest).metadata();
    console.log(
      `  ${job.out.padEnd(30)} ${String(meta.width).padStart(4)}×${String(meta.height).padEnd(4)} ` +
      `${String(Math.round(fs.statSync(dest).size / 1024)).padStart(4)} KB${meta.hasAlpha ? "  alpha" : ""}`
    );
  }
  const bandSrc = path.join(SRC, "press-rule_4x1.png");
  if (fs.existsSync(bandSrc)) {
    const dest = path.join(SRC, "press-rule-band.webp");
    await (await makeRuleBand(bandSrc)).webp({ quality: 84, alphaQuality: 100, effort: 6 }).toFile(dest);
    console.log(`  ${"press-rule-band.webp".padEnd(30)} 1600×300 ${String(Math.round(fs.statSync(dest).size / 1024)).padStart(4)} KB  alpha`);
  }
  if (missing) console.warn(`[prepare-season] ${SEASON} 缺 ${missing} 张源图，未生成的槽位仍复用春图。`);
}

main().catch((e) => { console.error(e); process.exit(1); });
