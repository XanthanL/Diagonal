/**
 * 草木主题生图素材 → 站点 WebP
 *
 * 源：DIAGONAL_草本素材_全套/（用户用元宝 hy3.5image 生成，不入库）
 * 出：public/images/herbarium/（入库，随静态导出发布）
 *
 * 源图本身已是真 alpha、纸纹已做过 2×2 镜像无缝，这里只负责：
 *   1. 等比缩到站点实际需要的尺寸、转 WebP 压体积；
 *   2. 纸纹先放大纤维对比再高保真编码：源图明度标准差只有 1.58/255，
 *      直接走默认 WebP quality 78 会被整块抹成纯色（实测掉到 0.10），
 *      铺到页面上等于没铺。围绕纸色均值放大 2.2 倍后仍有 ±1.4% 明度，
 *      是「斜光下才看得出」的纸浆感，不会把照片墙染脏。
 *   3. 三枝压花按 alpha 包围盒裁掉提示词要求的上方留白：那 2/3 空白是留给
 *      「压标题」的，而压花在站点里是 z-index:-1 的背景水印、永远在文字之下，
 *      留白只会把枝叶缩成一枚小点（上一批藤蔓就是这么消失的）。
 *   4. 印章单独加深：原图双线圆环是浅灰绿，铺在 #F3F1E7 上几乎看不见。
 *      把非透明像素往墨绿 #1F2419 插值、再抬 alpha，线条才立得住。
 *   5. 分隔带单独做「自带渐隐」版 press-rule-band.webp：源图上下有大片留白、
 *      底边的枝叶被画幅硬切，直接当 background 用会被 96px 高的容器裁掉
 *      上半截。这里裁掉留白、固定成 1600×300，并把四边 alpha 平滑收到 0，
 *      两端与底边不再有断口；CSS 用同一 aspect-ratio 保证整幅显示，不再裁切。
 *
 * 幂等可复跑：node scripts/prepare-herbarium.js
 * 这个目录不在 optimize-images.js 的 ROOTS 内（只扫 archive / artists），
 * 不会被再生成一份没人用的 w480 / w960 变体。
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "DIAGONAL_草本素材_全套");
const OUT = path.join(ROOT, "public", "images", "herbarium");

const JOBS = [
  { src: "paper-grain_tile.png", out: "paper-grain.webp", width: 768, quality: 96, paper: true },
  { src: "press-1_2x3.png", out: "press-1.webp", width: 800, quality: 82, trim: true },
  { src: "press-2_2x3.png", out: "press-2.webp", width: 800, quality: 82, trim: true },
  { src: "press-3_2x3.png", out: "press-3.webp", width: 800, quality: 82, trim: true },
  { src: "press-rule_4x1.png", out: "press-rule.webp", width: 1600, quality: 80 },
  { src: "plate-specimen_4x5.png", out: "plate-specimen.webp", width: 720, quality: 80 },
  { src: "hero-botanical-portrait_3x4.png", out: "hero-portrait.webp", width: 720, quality: 80 },
  { src: "seal_1x1.png", out: "seal.webp", width: 480, quality: 90, ink: true },
];

/** 纸纹：围绕各通道均值放大纤维起伏，底色保持 --flora-bg #F3F1E7。 */
async function enhancePaper(input) {
  const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  const MEAN = [243, 241, 231];
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

/** 细线印章：向墨绿插值 + alpha 增益。透明像素的 RGB 改了也不可见。 */
async function inkSeal(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const TARGET = [31, 36, 25]; // --flora-ink #1F2419
  const MIX = 0.72;
  for (let i = 0; i < data.length; i += info.channels) {
    for (let c = 0; c < 3; c++) {
      data[i + c] = Math.round(data[i + c] * (1 - MIX) + TARGET[c] * MIX);
    }
    data[i + 3] = Math.min(255, Math.round(data[i + 3] * 1.9));
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
}

/** 按 alpha 包围盒裁掉死透明画布，四周留一点余量给羽化边。 */
async function trimAlpha(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const C = info.channels;
  // 原图有一层 alpha<96 的抠图残影铺满整幅，按 24 取包围盒等于没裁。
  // 96 与 140/200 的包围盒几乎一致，说明实体枝叶的边缘就落在这一档。
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
  const padX = Math.round(W * 0.02);
  const padY = Math.round(H * 0.02);
  const left = Math.max(0, minX - padX);
  const top = Math.max(0, minY - padY);
  const right = Math.min(W, maxX + 1 + padX);
  const bottom = Math.min(H, maxY + 1 + padY);
  return sharp(input).extract({ left, top, width: right - left, height: bottom - top });
}

const smooth = (t) => { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); };

/**
 * 分隔带专用：裁掉上下留白 → 固定 1600×240 → 四边 alpha 平滑归零。
 * 底边给更长的坡（源图枝叶在画幅底边被硬切），左右两端给淡入淡出，
 * 这样 CSS 只要完整显示就不会出现「一条被切断的花边」。
 */
async function makeRuleBand(input) {
  // 1600×300 是「横贯分隔带」的画幅，不是源图的 4:1。源内容带约 2500×600，
  // 用 fill 轻微压扁（横 0.63 / 纵 0.50）比 contain 好：contain 会在左右各留
  // 367px 死透明，铺到页面上只剩中间一小截花。
  const W = 1600, H = 300;
  const src = sharp(input).ensureAlpha().raw();
  const { data, info } = await src.toBuffer({ resolveWithObject: true });
  const SW = info.width, SH = info.height, C = info.channels;
  const alphaAt = (x, y) => data[(y * SW + x) * C + 3];
  // 低阈值：把淡淡的花梢也包进来，别把渐隐的末梢裁掉
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
  const px = cropped.data;
  const CC = cropped.info.channels;
  const FADE = { l: 0.13, r: 0.15, t: 0.10, b: 0.16 };
  for (let y = 0; y < H; y++) {
    const fy = Math.min(smooth(y / (H * FADE.t)), smooth((H - 1 - y) / (H * FADE.b)));
    for (let x = 0; x < W; x++) {
      const fx = Math.min(smooth(x / (W * FADE.l)), smooth((W - 1 - x) / (W * FADE.r)));
      const i = (y * W + x) * CC + 3;
      px[i] = Math.round(px[i] * fx * fy);
    }
  }
  console.log(`  press-rule-band 裁切源 y=[${top},${bottom}] x=[${left},${right}] → ${W}×${H}`);
  return sharp(px, { raw: { width: W, height: H, channels: CC } });
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`源素材目录不存在：${SRC}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  for (const job of JOBS) {
    const input = path.join(SRC, job.src);
    if (!fs.existsSync(input)) {
      console.error(`缺素材：${job.src}`);
      process.exit(1);
    }
    let pipeline = sharp(input);
    if (job.paper) pipeline = await enhancePaper(input);
    if (job.ink) pipeline = await inkSeal(input);
    if (job.trim) pipeline = await trimAlpha(input);
    const dest = path.join(OUT, job.out);
    await pipeline
      .resize({ width: job.width, withoutEnlargement: true })
      .webp({ quality: job.quality, alphaQuality: 92, effort: 6 })
      .toFile(dest);
    const meta = await sharp(dest).metadata();
    console.log(
      `${job.out.padEnd(22)} ${String(meta.width).padStart(4)}×${String(meta.height).padEnd(4)} ` +
      `${String(Math.round(fs.statSync(dest).size / 1024)).padStart(4)} KB` +
      (meta.hasAlpha ? "  alpha" : "")
    );
  }

  const bandSrc = path.join(SRC, "press-rule_4x1.png");
  if (fs.existsSync(bandSrc)) {
    const dest = path.join(OUT, "press-rule-band.webp");
    const pipeline = await makeRuleBand(bandSrc);
    await pipeline.webp({ quality: 84, alphaQuality: 100, effort: 6 }).toFile(dest);
    const meta = await sharp(dest).metadata();
    console.log(
      `${"press-rule-band.webp".padEnd(22)} ${String(meta.width).padStart(4)}×${String(meta.height).padEnd(4)} ` +
      `${String(Math.round(fs.statSync(dest).size / 1024)).padStart(4)} KB  alpha`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
