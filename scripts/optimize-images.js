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

// 单张图的失败不能拖垮整条流程，但也不能静悄悄：累计 failures 会打在末尾统计里。
// 外围再包一层 try/catch 是为了接住 statSync/readdirSync 这类 IO 异常 ——
// 它们不在上面的 try 里，一抛就是 unhandled rejection、直接终止进程。
async function processImage(filePath) {
  try {
    await processImageUnsafe(filePath);
  } catch (e) {
    console.warn(`  [WARN] 跳过 ${filePath}: ${e.message}`);
    failed++;
  }
}

async function processImageUnsafe(filePath) {
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
      await sharp(filePath, {
        // 长微博/长图或超大 CMYK 图在解码阶段的像素总量可能撞上 libvips 默认
        // 上限（268MP），届时整张图连缩减边防都比不过。这里显式解除 + 顺序读，
        // 让它退化为「慢」而不是「崩」。
        limitInputPixels: false,
        sequentialRead: true,
      })
        .rotate()                       // 读 EXIF 方向后再动手，避免长图躺倒
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
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    console.warn(`  [WARN] 目录不可读 ${dir}: ${e.message}`);
    failed++;
    return;
  }
  for (const entry of entries) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fp);
    } else if (EXT_RE.test(entry.name) && !VARIANT_RE.test(entry.name)) {
      await processImage(fp);
    }
  }
}

// 退出码策略（2026-10-17 事故后定）：图片优化是**增强项，不是发布前置条件**。
// 它跑在 prebuild 里，一旦 exit≠0 就会连带 `npm run build` 失败，站点根本发不出去 ——
// 而站点没有 WebP 变体顶多是慢一点（还有 srcset 回退），两者损失完全不对称。
// 所以默认永远 exit(0)；需要把「变体缺失」当硬错误时，显式跑 IMAGES_STRICT=1。
(async () => {
  const strict = process.env.IMAGES_STRICT === "1";
  try {
    const roots = ROOTS.filter((d) => {
      if (fs.existsSync(d)) return true;
      console.log("[optimize-images] 目录不存在，跳过:", d);
      return false;
    });
    const t0 = Date.now();
    for (const root of roots) {
      console.log("[optimize-images] 扫描", root);
      try {
        await walk(root);
      } catch (e) {
        console.warn(`  [WARN] 扫描中断 ${root}: ${e.message}`);
        failed++;
      }
    }
    console.log(
      `[optimize-images] 完成: 生成 ${generated}, 跳过 ${skipped}, 失败 ${failed}, 耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s`
    );
    if (failed > 0) {
      console.warn(
        `[optimize-images] 有 ${failed} 项失败：对应图片将回退到 <img src> 原图（仍然可看），` +
          (strict ? " strict 模式，判定为构建失败。" : " 不影响本次发布。")
      );
    }
  } catch (e) {
    console.warn(`[optimize-images] 未预期错误，已降级跳过: ${e.message}`);
  }
  process.exitCode = strict && failed > 0 ? 1 : 0;
})();
