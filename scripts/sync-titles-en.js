/* 把 titles-en.tsv 的英文标题同步进归档台账 index.json 的 titleEn。
   公众号导入脚本只会把中文 title 复制到 titleEn，所以译文必须单独存一份源清单，
   并由 prebuild 的 --check 保证台账不会被重新导入时覆盖回中文。
   --check 只校验不写；未收录的新文章只警告不阻塞（等补译文即可）。 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TSV = path.join(ROOT, "src/content/archive/_store/titles-en.tsv");
const INDEX = path.join(ROOT, "src/content/archive/_store/index.json");
const CHECK = process.argv.includes("--check");

const map = new Map();
for (const line of fs.readFileSync(TSV, "utf8").trim().split(/\r?\n/)) {
  const tab = line.indexOf("\t");
  if (tab < 1) throw new Error(`[titles-en] 非法行（缺 TAB）：${line}`);
  const id = line.slice(0, tab).trim();
  const title = line.slice(tab + 1).trim();
  if (!title) throw new Error(`[titles-en] 空译文：${id}`);
  if (/[\u4e00-\u9fff]/.test(title)) throw new Error(`[titles-en] 译文含中文：${id} ${title}`);
  if (map.has(id)) throw new Error(`[titles-en] 重复 id：${id}`);
  map.set(id, title);
}

const items = JSON.parse(fs.readFileSync(INDEX, "utf8"));
const diffs = [];
for (const item of items) {
  const en = map.get(item.id);
  if (!en) continue;
  if (item.titleEn !== en) {
    diffs.push(item.id);
    if (!CHECK) item.titleEn = en;
  }
}
const uncovered = items.filter((x) => !map.has(x.id));
const extra = [...map.keys()].filter((id) => !items.some((x) => x.id === id));

if (CHECK) {
  console.log(`CHECK | 台账 ${items.length} 条 | 需更新 ${diffs.length} | 未收录 ${uncovered.length} | 清单多余 ${extra.length}`);
  if (diffs.length) console.log("  需更新:", diffs.slice(0, 10).join(", "));
  if (uncovered.length) console.log("  未收录:", uncovered.slice(0, 10).map((x) => x.id).join(", "));
  if (extra.length) console.log("  清单多余:", extra.slice(0, 10).join(", "));
  process.exit(diffs.length || extra.length ? 1 : 0);
}

if (diffs.length) {
  fs.writeFileSync(INDEX, JSON.stringify(items, null, 2) + "\n");
}
console.log(`SYNC | 更新 ${diffs.length} 条 | 未收录 ${uncovered.length} | 清单多余 ${extra.length}`);
