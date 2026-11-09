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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
