/**
 * 构建期图片优化脚本
 *
 * 扫描 public/images/archive/ 与 public/images/artists/ 下所有 jpg/jpeg/png，
 * 为每张图生成多档宽度的 WebP 变体（只缩不放）：
 *   foo.jpg → foo.w480.webp / foo.w960.webp / foo.w1600.webp
 *
 * - 幂等增量：变体已存在且比原图新则跳过
 * - CI 中通过 npm prebuild 自动执行，变体随 public/ 一起进入 out/
 * - 变体不提交 git（见 .gitignore），本地 dev 可手动 `npm run images`
 *
 * 2026-10-17：artists/ 此前完全没纳入扫描 —— 该目录 62 张图里有 16 张宽 2000px
 * （合计 4.4MB），前端又是裸 <img>，等于整站唯一一处会直发原图的图库。
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOTS = ["archive", "artists"].map((d) =>
  path.join(__dirname, "..", "public", "images", d)
);
const WIDTHS = [480, 960, 1600];
const WEBP_QUALITY = 78;
const EXT_RE = /\.(jpe?g|png)$/i;
const VARIANT_RE = /\.w\d+\.webp$/i;

let generated = 0;
let skipped = 0;
let failed = 0;

async function processImage(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath).replace(EXT_RE, "");
  const srcStat = fs.statSync(filePath);

  for (const w of WIDTHS) {
    // 小图也生成全部命名档位（withoutEnlargement 保证不放大），
    // 确保前端 srcSet 引用的 URL 一定存在
    const outPath = path.join(dir, `${base}.w${w}.webp`);
    if (fs.existsSync(outPath) && fs.statSync(outPath).mtimeMs >= srcStat.mtimeMs) {
      skipped++;
      continue;
    }

    try {
      await sharp(filePath)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outPath);
      generated++;
    } catch (e) {
      console.warn(`  [WARN] 生成失败 ${outPath}: ${e.message}`);
      failed++;
    }
  }
}

async function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fp);
    } else if (EXT_RE.test(entry.name) && !VARIANT_RE.test(entry.name)) {
      await processImage(fp);
    }
  }
}

(async () => {
  const roots = ROOTS.filter((d) => {
    if (fs.existsSync(d)) return true;
    console.log("[optimize-images] 目录不存在，跳过:", d);
    return false;
  });
  const t0 = Date.now();
  for (const root of roots) {
    console.log("[optimize-images] 扫描", root);
    await walk(root);
  }
  console.log(
    `[optimize-images] 完成: 生成 ${generated}, 跳过 ${skipped}, 失败 ${failed}, 耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s`
  );
})();
