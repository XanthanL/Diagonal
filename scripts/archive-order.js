#!/usr/bin/env node
/**
 * 归档台账顺序的唯一真相 + CI 门禁。
 *
 *   node scripts/archive-order.js          只校验，失败 exit 1（prebuild 调用）
 *   node scripts/archive-order.js --fix    把 _store/index.json 重排为发布时间倒序
 *
 * 与 src/lib/archiveOrder.ts 使用同一套规则（纯数字时间戳 + id 兜底），
 * 保证「源文件顺序」「运行时 archiveData」「页面渲染」三者一致。
 * 搬运脚本 import-wechat.js / normalize-archive-html.js 写台账前都调 sortStore()。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const STORE = path.join(ROOT, "src/content/archive/_store/index.json");
const LEGACY = path.join(ROOT, "src/content/archive/_store/legacy.json");

function timestamp(year) {
  if (!year) return 0;
  const m = /^(\d{4})\.(\d{1,2})\.(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/.exec(String(year).trim());
  if (!m) return 0;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const h = Number(m[4] || 0), mi = Number(m[5] || 0);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return 0;
  return (((y * 100 + mo) * 100 + d) * 100 + h) * 100 + mi;
}

function cmpDesc(a, b) {
  const diff = timestamp(b.year) - timestamp(a.year);
  if (diff !== 0) return diff;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** 不改原数组，返回按发布时间倒序的新数组。 */
function sortStore(items) {
  return [...items].sort(cmpDesc);
}

function read(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function validate() {
  const problems = [];
  const store = read(STORE);
  const legacy = read(LEGACY);

  // 1. 时间字段格式、ID 内嵌日期与 year 是否一致
  for (const [label, list] of [["index.json", store], ["legacy.json", legacy]]) {
    for (const x of list) {
      if (!/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/.test(x.year || "")) {
        problems.push(`${label}: ${x.id} 的 year 不是 YYYY.MM.DD HH:mm（${JSON.stringify(x.year)}）`);
      }
      const m = /^DIAGONAL-(\d{4})-WX(\d{2})(\d{2})/.exec(x.id);
      if (m && String(x.year || "").slice(0, 10) !== `${m[1]}.${m[2]}.${m[3]}`) {
        problems.push(`${label}: ${x.id} 的 ID 日期与 year 不一致（${x.year}）`);
      }
    }
  }

  // 2. 台账本身必须已是发布时间倒序（源文件的默认顺序不能是导入顺序）
  for (let i = 1; i < store.length; i++) {
    if (cmpDesc(store[i - 1], store[i]) > 0) {
      problems.push(`index.json: 第 ${i} 条 ${store[i - 1].id}(${store[i - 1].year}) 早于第 ${i + 1} 条 ${store[i].id}(${store[i].year})，顺序错误`);
      if (problems.length >= 12) break;
    }
  }

  // 3. 运行时合并结果必须严格倒序（模拟 data.ts 的 overlay + legacy 合并）
  const overlay = store.filter((x) => !x.draft);
  const ids = new Set(overlay.map((x) => x.id));
  const merged = sortStore([...overlay, ...legacy.filter((x) => !ids.has(x.id))]);
  for (let i = 1; i < merged.length; i++) {
    if (timestamp(merged[i - 1].year) < timestamp(merged[i].year)) {
      problems.push(`合并后第 ${i} 条出现时间倒挂：${merged[i - 1].year} → ${merged[i].year}`);
      break;
    }
  }

  return { store, legacy, merged, problems };
}

function main() {
  const { store, merged, problems } = validate();
  if (process.argv.includes("--fix")) {
    fs.writeFileSync(STORE, JSON.stringify(sortStore(store), null, 2) + "\n", "utf8");
    console.log(`[archive-order] 已按发布时间倒序重写 index.json（${store.length} 条）`);
    return;
  }
  const years = [...new Set(merged.map((x) => String(x.year || "").slice(0, 4)))].join(" → ");
  if (problems.length) {
    console.error(`[archive-order] 校验失败，共 ${problems.length} 处：`);
    problems.slice(0, 12).forEach((p) => console.error("  - " + p));
    console.error("  修复：node scripts/archive-order.js --fix");
    process.exit(1);
  }
  console.log(`[archive-order] OK：index.json ${store.length} 条 / 合并后 ${merged.length} 条，严格按发布时间倒序（${years}）`);
}

module.exports = { timestamp, cmpDesc, sortStore };
if (require.main === module) main();
