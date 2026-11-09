#!/usr/bin/env node
/**
 * 补回微信搬运时漏掉的正文配图（幂等，可复跑）。
 *
 * 两类漏图，都不是「图片坏了」，而是导入器压根没看见：
 *  1. 纯文字预告类推文：正文 content_noencode 有字但一张 <img> 都没有，
 *     真正的海报在页面级字段 cdn_url（独立封面）里；旧逻辑只在正文完全为空时才取封面。
 *  2. E2.COOL 编辑器模板：海报被切成若干 <svg data-lazy-bgimg="..."> 背景图层，
 *     可见图不在 <img> 上，隐藏的 <img> 又落在 svg > foreignObject[opacity=0] 里；
 *     清洗器按 DROP_WITH_CONTENT 丢掉 svg，整篇图版一起消失。
 *
 * 清单在 src/content/archive/_store/recovered-images.json：URL 只用于首次下载，
 * 图片落盘后进 git，之后重跑不会再次请求 CDN。正文只插入 <figure>，不改一个字。
 *
 *   node scripts/recover-archive-images.js           下载 + 插回 + 更台账
 *   node scripts/recover-archive-images.js --check    只校验产物是否齐全
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "src/content/archive");
const IMG_ROOT = path.join(ROOT, "public/images/archive");
const MANIFEST = path.join(CONTENT, "_store/recovered-images.json");
const STORE = path.join(CONTENT, "_store/index.json");
const CHECK = process.argv.includes("--check");
const PROXY = process.env.WX_PROXY || "http://127.0.0.1:7890";

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));

function download(url, target) {
  // 直接写目标文件：本机 safe-delete 垫片会拦截 fs.unlinkSync，临时文件删不掉会污染 public/
  execFileSync("curl", [
    "-s", "--max-time", "45", "-L", "-x", PROXY,
    "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "-o", target, String(url).replace(/^http:\/\//, "https://"),
  ], { stdio: "ignore" });
  if (!fs.existsSync(target) || fs.statSync(target).size < 1024) throw new Error("下载为空");
}

/** 与 import-wechat.js 的落盘规格一致：白底、旋转、限宽 1600、jpeg q86 */
async function normalize(target) {
  const buf = await sharp(target, { animated: false })
    .flatten({ background: "#ffffff" })
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(target, buf); // toBuffer 已完成读取，原地覆写安全
  return buf.length;
}

function markOf(mode) { return `data-recovered="${mode}"`; }

function insertFigures(html, srcs, mark) {
  const figures = srcs.map((src) => `<figure ${mark}><img src="${src}" alt="" /></figure>`).join("\n");
  const i = html.indexOf("</header>");
  if (i < 0) throw new Error("找不到 </header>");
  const end = i + "</header>".length;
  return html.slice(0, end) + "\n\n" + figures + html.slice(end);
}

(async () => {
  let missing = 0, inserted = 0, downloaded = 0, errors = 0;
  for (const item of manifest.items) {
    const dir = path.join(IMG_ROOT, item.id);
    if (!CHECK) fs.mkdirSync(dir, { recursive: true });
    const srcs = [];
    for (let i = 0; i < item.urls.length; i++) {
      const target = path.join(dir, item.names[i]);
      const src = `/images/archive/${item.id}/${item.names[i]}`;
      srcs.push(src);
      if (!fs.existsSync(target) || fs.statSync(target).size <= 1024) {
        missing++;
        if (CHECK) continue;
        try {
          download(item.urls[i], target);
          const bytes = await normalize(target);
          downloaded++;
          console.log("  下载", item.id, item.names[i], (bytes / 1024).toFixed(0) + "KB");
        } catch (e) {
          errors++;
          console.warn("  ⚠ 下载失败", item.id, item.names[i], e.message);
          srcs.pop();
        }
      }
    }
    const htmlPath = path.join(CONTENT, item.id + ".html");
    // 兼容第一版留下的旧标记 data-recovered="1"，避免重复插图
    let html = fs.readFileSync(htmlPath, "utf8").replace(/\s*<figure data-recovered="1"[^>]*>\s*<img[^>]*>\s*<\/figure>/g, "");
    const mark = markOf(item.mode);
    const figureSrcs = item.mode === "cover" ? srcs.slice(0, 1) : srcs;
    // 以「图片 src 已出现」为准：分类脚本会重写 figure 标签，标记属性可能丢，
    // 但 src 不会。这样两个脚本任意先后顺序跑都幂等。
    const already = figureSrcs.length > 0 && figureSrcs.some((src) => html.includes(`src="${src}"`));
    if (!already) {
      if (CHECK) { missing++; console.log("  正文未插图", item.id, item.mode); continue; }
      fs.writeFileSync(htmlPath, insertFigures(html, figureSrcs, mark), "utf8");
      inserted++;
      console.log("  插图", item.id, figureSrcs.length, "张");
    }
    // 封面图顺手补进台账，让列表卡片也用真封面
    if (!CHECK && srcs.length) {
      const store = JSON.parse(fs.readFileSync(STORE, "utf8"));
      const entry = store.find((x) => x.id === item.id);
      // slices 批次的第一张才是真正的海报主视觉，优先于低清分享封面
      if (entry && (!entry.thumbnail || item.mode === "slices")) {
        entry.thumbnail = srcs[0];
        const { sortStore } = require("./archive-order.js");
        fs.writeFileSync(STORE, JSON.stringify(sortStore(store), null, 2) + "\n", "utf8");
        console.log("  台账封面", item.id);
      }
    }
  }
  console.log(`\n${CHECK ? "CHECK" : "DONE"} | 缺文件 ${missing} | 下载 ${downloaded} | 插图文章 ${inserted} | 错误 ${errors}`);
  if (CHECK && (missing || errors)) process.exit(1);
  if (errors) process.exit(1);
})();
