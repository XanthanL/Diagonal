#!/usr/bin/env node
/**
 * 子站同步器（单源：src/lib/subsites.json）。把每个「独立静态子站」的仓库根源目录
 * 复制进 public/<dir>/，并把共享外壳 shared/ 复制进 public/shared/，供 Next dev + build
 * 导出后以 /<dir>/ 与 /shared/ 提供。自动运行于：
 *   - npm run dev   （dev 钩子）
 *   - npm run prebuild （CI 亦生效）
 *   - npm run sync:sites（手动）
 * public/ 下一律为生成物，不入库（见 .gitignore）。sync=false 的子站（如 vacuum-salt，
 * 由 merge-vacuum.js 单独产出）不在此复制，仅登记于配置供导航判断。
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const { sites } = require("../src/lib/subsites.json");

function copyTree(src, dest, excludedTops) {
  try { fs.rmSync(dest, { recursive: true, force: true }); }
  catch (e) { console.warn(`⚠ could not clear ${path.relative(root, dest)} (${e.message}); overwriting`); }
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (p) => {
      const rel = path.relative(src, p);
      if (rel === "") return true;
      return !excludedTops.has(rel.split(path.sep)[0]);
    },
  });
}

let didAny = false;

// 1) 静态子站 → public/<dir>
for (const s of sites) {
  if (!s.sync) continue;
  const src = path.join(root, s.dir);
  const dest = path.join(root, "public", s.dir);
  if (!fs.existsSync(src)) { console.warn(`⚠ source not found, skipping: ${s.dir}/`); continue; }
  copyTree(src, dest, new Set(s.excludes || []));
  console.log(`✓ synced ${s.dir} → public/${s.dir} (excluded: ${(s.excludes || []).join(", ") || "—"})`);
  didAny = true;
}

// 2) 共享外壳 → public/shared
const sharedSrc = path.join(root, "shared");
if (fs.existsSync(sharedSrc)) {
  copyTree(sharedSrc, path.join(root, "public", "shared"), new Set());
  console.log("✓ synced shared/ → public/shared/");
  didAny = true;
}

if (!didAny) { console.error("✗ nothing to sync (check src/lib/subsites.json)"); process.exit(1); }
