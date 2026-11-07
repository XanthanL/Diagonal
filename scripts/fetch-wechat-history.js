#!/usr/bin/env node
/**
 * 拉取微信公众号「全部历史文章」链接清单，串到 import-wechat.js 完成搬运。
 *
 * 背景（2026-11-07 实测）：
 * - GitHub 上 star 最高的 wechat-article/wechat-article-exporter（13.1k）已于 2026-07-30
 *   停止维护：微信关闭了「公众号后台搜索其他号文章」接口，在线站 10 月下线。
 * - qiye45/wechatDownload（9.9k，2026-11-01 v5.0 仍在更新）走的是另一条路：
 *   让用户把一条链接在微信内置浏览器里打开，工具自动抓到 key / uin / pass_ticket，
 *   再用 mp/profile_ext?action=getmsg 分页拿全量历史。本项目缺的正是这份登录态。
 *
 * 因此本脚本不重复造下载器，只负责「把登录态变成 links.txt」这一环，
 * 正文抓取、清洗、图片本地化、建档全部交给已有的 import-wechat.js。
 *
 * 用法：
 *   # A. 最省事：把 wechatDownload / Fiddler 里那条完整请求 URL 原样贴进来
 *   node scripts/fetch-wechat-history.js --from-url 'https://mp.weixin.qq.com/mp/profile_ext?action=getmsg&__biz=...&uin=...&key=...' [--cookie '...']
 *
 *   # B. 凭据放 JSON 文件
 *   node scripts/fetch-wechat-history.js --creds .workbuddy/wx/creds.json
 *
 *   # C. 凭据放环境变量：WX_BIZ / WX_UIN / WX_KEY / WX_PASS_TICKET / WX_APPMSG_TOKEN / WX_COOKIE
 *   node scripts/fetch-wechat-history.js
 *
 *   # D. 已有导出结果（wechatDownload 的 CSV / JSON，或任意含链接的文本）→ 只做转换
 *   node scripts/fetch-wechat-history.js --from-export ~/Downloads/articles.csv
 *
 *   # 拿到清单后直接搬运（也可分步：先人工核对 history.json 再跑）
 *   node scripts/fetch-wechat-history.js --from-url '...' --import
 *
 * 输出：.workbuddy/wx/links.txt     一行一条 mp.weixin.qq.com/s/ 链接
 *       .workbuddy/wx/history.json  标题 / 日期 / 链接，供人工剔除转发推广类
 *
 * 凭据是短时效的（key 通常 20 分钟～2 小时），拿到后请立刻跑；
 * 中断可重跑，脚本按 sn 去重并保留已抓到的 history.json。
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const zlib = require("zlib");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, ".workbuddy/wx");
const LINKS = path.join(OUT_DIR, "links.txt");
const HISTORY = path.join(OUT_DIR, "history.json");
const WX_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.40(0x1800282a) NetType/WIFI Language/zh_CN";

const HELP = `拉取公众号全部历史文章链接 → .workbuddy/wx/links.txt

  --from-url <URL>        wechatDownload / 抓包得到的完整 profile_ext 请求 URL，参数自动拆
  --creds <file.json>     JSON 凭据（__biz / uin / key / pass_ticket / appmsg_token / cookie）
  --from-export <file>    已有导出（CSV / JSON / TXT），只提取链接、不联网
  --cookie <string>       覆盖 Cookie（也可设 WX_COOKIE）
  --biz <string>          覆盖 __biz（也可从任意一篇文章 URL 里带 __biz 参数）
  --offset <n>            起始偏移，默认 0（断点续跑）
  --max-pages <n>         最多翻几页，默认 200（防死循环）
  --import                 生成清单后立刻调用 import-wechat.js --list
  --dry-run                只打印将要写入的链接，不落盘
  --help                   本说明

凭据也可用环境变量：WX_BIZ WX_UIN WX_KEY WX_PASS_TICKET WX_APPMSG_TOKEN WX_COOKIE

没有凭据时怎么拿（任选其一，都只需一次）：
  A. wechatDownload（最完整，能一次拿全量）
     1. 下载 qiye45/wechatDownload 的 Windows 版（GitHub Releases，v5.0+）
     2. 把本站任意一篇公众号文章链接粘进软件，点「获取公众号id」，并勾选「启动MCP」
     3. 按提示把自动复制的链接发到微信「文件传输助手」，用微信内置浏览器点开
     4. 看到「获取密钥成功」后，把导出的 CSV（export_article_data）或那条完整请求 URL 交给我
  B. 公众号后台（零安装，号主可用）
     登录 mp.weixin.qq.com →「已发表内容 / 素材管理」，把列表页面另存为 HTML，
     直接 --from-export that.html 即可；本脚本会从任意文本里正则抽链接。
        node scripts/fetch-wechat-history.js --from-export 已发表.html
  之后本脚本 + import-wechat.js 全自动，不需要你再动手。

注：远程 MCP（changfengbox.top/api/mcp）实测只提供单篇与合集下载，不返回历史列表；
    且本号样例文章的 album_info_list 为空，合集路径也不通。全量只能走上面两条。`;

// ---------------------------------------------------------------- 参数
function parseArgs(argv) {
  const o = { offset: 0, maxPages: 200, dryRun: false, doImport: false };
  const take = (flag) => {
    const i = argv.indexOf(flag);
    if (i < 0) return undefined;
    return argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "";
  };
  o.fromUrl = take("--from-url");
  o.credsFile = take("--creds");
  o.fromExport = take("--from-export");
  o.cookie = take("--cookie");
  o.biz = take("--biz");
  const off = take("--offset");
  const mp = take("--max-pages");
  if (off) o.offset = parseInt(off, 10) || 0;
  if (mp) o.maxPages = parseInt(mp, 10) || 200;
  o.dryRun = argv.includes("--dry-run");
  o.doImport = argv.includes("--import");
  o.help = argv.includes("--help") || argv.includes("-h");
  return o;
}

// ---------------------------------------------------------------- 网络
function httpGet(url, headers = {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": WX_UA,
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "zh-CN,zh;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Referer: "https://mp.weixin.qq.com/mp/profile_ext",
          ...headers,
        },
        timeout: 30000,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 4) {
          res.resume();
          return resolve(httpGet(new URL(res.headers.location, url).href, headers, redirects + 1));
        }
        let stream = res;
        const enc = (res.headers["content-encoding"] || "").toLowerCase();
        if (enc === "gzip") stream = res.pipe(zlib.createGunzip());
        else if (enc === "deflate") stream = res.pipe(zlib.createInflate());
        else if (enc === "br") stream = res.pipe(zlib.createBrotliDecompress());
        const chunks = [];
        stream.on("data", (c) => chunks.push(c));
        stream.on("end", () =>
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8"), headers: res.headers })
        );
        stream.on("error", reject);
      }
    );
    req.on("timeout", () => req.destroy(new Error("请求超时（30s）")));
    req.on("error", reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- 凭据
function fromUrl(url) {
  const u = new URL(url);
  const p = u.searchParams;
  const c = {
    __biz: p.get("__biz") || "",
    uin: p.get("uin") || "",
    key: p.get("key") || "",
    pass_ticket: p.get("pass_ticket") || "",
    appmsg_token: p.get("appmsg_token") || "",
    wxtoken: p.get("wxtoken") || "",
    x5: p.get("x5") || "0",
    scene: p.get("scene") || "124",
    is_ok: p.get("is_ok") || "1",
  };
  // 有的抓包结果把 biz 藏在文章 URL 里而不是 profile_ext 上
  if (!c.__biz && p.get("biz")) c.__biz = p.get("biz");
  return c;
}

function readCreds(o) {
  let c = {};
  if (o.credsFile) {
    c = JSON.parse(fs.readFileSync(path.resolve(o.credsFile), "utf8"));
  } else {
    c = {
      __biz: process.env.WX_BIZ || "",
      uin: process.env.WX_UIN || "",
      key: process.env.WX_KEY || "",
      pass_ticket: process.env.WX_PASS_TICKET || "",
      appmsg_token: process.env.WX_APPMSG_TOKEN || "",
      cookie: process.env.WX_COOKIE || "",
    };
  }
  if (o.fromUrl) c = { ...c, ...fromUrl(o.fromUrl) };
  if (o.biz) c.__biz = o.biz;
  if (o.cookie) c.cookie = o.cookie;
  // __biz 也可能直接从任意文章链接传来
  if (c.__biz && /^https?:/.test(c.__biz)) {
    try { c.__biz = new URL(c.__biz).searchParams.get("__biz") || c.__biz; } catch (_) { /* keep */ }
  }
  return c;
}

function validate(c) {
  const missing = ["__biz", "uin", "key"].filter((k) => !c[k]);
  if (missing.length) {
    console.error("缺少凭据：" + missing.join(", ") + "\n");
    console.error("公众号历史列表不是公开接口，必须带一次微信客户端登录态。\n" + HELP);
    process.exit(2);
  }
}

// ---------------------------------------------------------------- 列表解析
function decodeUrl(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/\\u0026/gi, "&")
    .replace(/\\\//g, "/")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function urlKey(u) {
  try {
    const x = new URL(u);
    const p = x.searchParams;
    // /s/ 短链没有 query，不能一律拿空 __biz|mid|idx 当键，否则所有文章被去重成一篇
    if (p.get("sn")) return "sn:" + p.get("sn");
    if (p.get("__biz") && p.get("mid")) return `biz:${p.get("__biz")}|${p.get("mid")}|${p.get("idx") || 1}`;
    return "path:" + x.pathname.replace(/\/+$/, "");
  } catch (_) { return "raw:" + String(u).split("?")[0]; }
}

/** general_msg_list 是「被转义的 JSON 字符串」，要二次 parse；一次群发可含多篇图文 */
function parseGeneralMsgList(raw) {
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  const list = data.list || data.msgList || [];
  const out = [];
  const push = (item, datetime, msgId) => {
    if (!item) return;
    const url = decodeUrl(item.content_url || item.url || item.link);
    if (!/mp\.weixin\.qq\.com\/s/.test(url)) return;
    out.push({
      title: String(item.title || "").replace(/&amp;/g, "&").trim(),
      url,
      cover: decodeUrl(item.cover || item.cover_img || ""),
      digest: String(item.digest || "").trim(),
      datetime: Number(datetime || item.datetime || 0),
      msgId: msgId || "",
      key: urlKey(url),
    });
  };
  for (const msg of list) {
    const ci = msg.comm_msg_info || {};
    const ext = msg.app_msg_ext_info || msg.appmsg_ext_info || {};
    push(ext, ci.datetime, ci.id);
    for (const sub of ext.multi_app_msg_item_list || msg.multi_app_msg_item_list || []) {
      push(sub, ci.datetime, ci.id);
    }
  }
  return out;
}

async function fetchAll(c, o) {
  const all = new Map();
  if (fs.existsSync(HISTORY)) {
    try {
      for (const x of JSON.parse(fs.readFileSync(HISTORY, "utf8"))) all.set(x.key, x);
      console.log(`续跑：已载入 ${all.size} 条历史记录`);
    } catch (_) { /* 损坏就重来 */ }
  }

  let offset = o.offset;
  for (let page = 0; page < o.maxPages; page++) {
    const q = new URLSearchParams({
      action: "getmsg",
      __biz: c.__biz,
      f: "json",
      offset: String(offset),
      count: "10",
      is_ok: c.is_ok || "1",
      scene: c.scene || "124",
      uin: c.uin,
      key: c.key,
      pass_ticket: c.pass_ticket || "",
      wxtoken: c.wxtoken || "",
      appmsg_token: c.appmsg_token || "",
      x5: c.x5 || "0",
    });
    const url = `https://mp.weixin.qq.com/mp/profile_ext?${q.toString()}`;
    const headers = {};
    if (c.cookie) headers.Cookie = c.cookie;

    let res;
    try { res = await httpGet(url, headers); }
    catch (e) { console.error(`第 ${page + 1} 页请求失败：${e.message}`); break; }

    let payload;
    try { payload = JSON.parse(res.body); }
    catch (_) {
      console.error("返回的不是 JSON —— 通常是 key 已过期或被重定向到验证页。");
      console.error("响应开头：", res.body.slice(0, 160).replace(/\s+/g, " "));
      break;
    }
    if (payload.ret !== 0 && payload.base_resp && payload.base_resp.ret !== 0) {
      console.error(`接口返回 ret=${payload.ret ?? payload.base_resp.ret} errmsg=${payload.errmsg || payload.base_resp.err_msg || ""}`);
      console.error("凭据多半已失效：回微信里重新点一次链接拿新的 key，然后立刻重跑。");
      break;
    }
    if (!payload.general_msg_list) {
      console.error("响应里没有 general_msg_list，可能触发了频率限制或凭据不完整。");
      console.error("响应键：", Object.keys(payload).slice(0, 12).join(", "));
      break;
    }

    let items;
    try { items = parseGeneralMsgList(payload.general_msg_list); }
    catch (e) { console.error("general_msg_list 解析失败：", e.message); break; }
    let fresh = 0;
    for (const it of items) if (!all.has(it.key)) { all.set(it.key, it); fresh++; }
    console.log(`第 ${String(page + 1).padStart(2)} 页 offset=${String(offset).padStart(4)}  本页 ${items.length} 篇 / 新增 ${fresh} 篇 / 累计 ${all.size}`);

    const cont = Number(payload.can_msg_continue ?? 1);
    const next = Number(payload.next_offset || offset + 10);
    if (!cont || items.length === 0) { console.log("已到列表末尾"); break; }
    if (next <= offset) { console.log("offset 未推进，提前结束"); break; }
    offset = next;
    await sleep(700 + Math.random() * 500);
  }

  return [...all.values()].sort((a, b) => a.datetime - b.datetime);
}

// ---------------------------------------------------------------- 已有导出
function parseCsvLine(line) {
  const cells = [];
  let cur = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === "," && !quoted) { cells.push(cur); cur = ""; }
    else cur += ch;
  }
  cells.push(cur);
  return cells.map((s) => s.trim());
}

/** 兼容 Unix 秒 / 毫秒 / 2026-11-07 / 2026年11月7日 等常见导出格式 */
function toUnix(s) {
  const t = String(s ?? "").trim();
  if (!t) return 0;
  if (/^\d{10}$/.test(t)) return Number(t);
  if (/^\d{13}$/.test(t)) return Math.floor(Number(t) / 1000);
  const m = t.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (m) return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 1000);
  const d = Date.parse(t);
  return Number.isFinite(d) ? Math.floor(d / 1000) : 0;
}

function parseExport(file) {
  const raw = fs.readFileSync(path.resolve(file), "utf8");
  const seen = new Map();
  const add = (url, title = "", date = 0) => {
    const u = decodeUrl(url).replace(/["'\\]+$/, "");
    if (!/mp\.weixin\.qq\.com\/s/.test(u)) return;
    const k = urlKey(u);
    const dt = typeof date === "number" ? date : toUnix(date);
    if (!seen.has(k)) seen.set(k, { key: k, url: u, title: String(title || ""), datetime: dt, cover: "", digest: "" });
    else if (dt && !seen.get(k).datetime) seen.get(k).datetime = dt;
  };

  // JSON：递归找所有像链接的字符串，顺带捞同级的标题与日期
  const trimmed = raw.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const walk = (v) => {
        if (typeof v === "string") { if (/mp\.weixin\.qq\.com/.test(v)) add(v); return; }
        if (Array.isArray(v)) return v.forEach(walk);
        if (v && typeof v === "object") {
          for (const [, val] of Object.entries(v)) {
            if (typeof val === "string" && /mp\.weixin\.qq\.com/.test(val)) {
              add(val, v.title || v.标题 || "", v.datetime || v.date || v.发布时间 || v.publish_time || 0);
            } else walk(val);
          }
        }
      };
      walk(JSON.parse(raw));
    } catch (_) { /* 当成纯文本兜底 */ }
  }

  // CSV：wechatDownload 的 export_article_data 产物，按表头认列，保留标题与发布日期
  const lines = raw.split(/\r?\n/);
  if (lines.length > 1 && lines[0].includes(",")) {
    const head = parseCsvLine(lines[0]);
    const col = (re) => head.findIndex((h) => re.test(h));
    const iUrl = col(/链接|网址|地址|url|link/i);
    const iTitle = col(/标题|题目|文章|title|name/i);
    const iDate = col(/日期|时间|发布|date|time|publish/i);
    if (iUrl >= 0) {
      for (const line of lines.slice(1)) {
        if (!line.trim()) continue;
        const cells = parseCsvLine(line);
        add(cells[iUrl] || "", iTitle >= 0 ? cells[iTitle] : "", iDate >= 0 ? cells[iDate] : 0);
      }
    }
  }

  // TXT / 兜底：正则抓链接（含 &amp; 转义过的）
  for (const m of raw.matchAll(/https?:\/\/mp\.weixin\.qq\.com\/s\/[^\s"'<>,;\\)]+/g)) add(m[0]);
  for (const m of raw.matchAll(/https?:\/\/mp\.weixin\.qq\.com\/s\?[^"'<>\s,;]+/g)) add(m[0]);
  return [...seen.values()].sort((a, b) => a.datetime - b.datetime);
}

// ---------------------------------------------------------------- 主流程
async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.help) { console.log(HELP); return; }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let rows;
  if (o.fromExport) {
    rows = parseExport(o.fromExport);
    console.log(`从导出文件解析到 ${rows.length} 条链接：${path.resolve(o.fromExport)}`);
  } else {
    const c = readCreds(o);
    validate(c);
    console.log(`开始拉取 __biz=${c.__biz.slice(0, 12)}… ，key=${String(c.key).slice(0, 8)}…`);
    rows = await fetchAll(c, o);
  }

  if (!rows.length) {
    console.error("没有拿到任何链接，未写入文件（保留原有 links.txt / history.json）。\n" + HELP);
    process.exit(3);
  }

  const urls = rows.map((r) => r.url);
  console.log(`\n共 ${urls.length} 篇；日期范围 ${
    rows[0].datetime ? new Date(rows[0].datetime * 1000).toISOString().slice(0, 10) : "?"
  } → ${rows.at(-1).datetime ? new Date(rows.at(-1).datetime * 1000).toISOString().slice(0, 10) : "?"}`);
  for (const r of rows.slice(0, 5)) console.log("  ", r.datetime ? new Date(r.datetime * 1000).toISOString().slice(0, 10) : "????-??-??", r.title.slice(0, 40));
  if (rows.length > 5) console.log("   … 其余见 history.json");

  if (!o.dryRun) {
    fs.writeFileSync(LINKS, urls.join("\n") + "\n", "utf8");
    fs.writeFileSync(HISTORY, JSON.stringify(rows, null, 2) + "\n", "utf8");
    console.log(`\n已写入 ${path.relative(ROOT, LINKS)} 与 ${path.relative(ROOT, HISTORY)}`);
    console.log("可先打开 history.json 人工剔除转发/推广类，再跑：");
    console.log("  node scripts/import-wechat.js --list .workbuddy/wx/links.txt");
  }

  if (o.doImport && !o.dryRun) {
    console.log("\n==> 开始搬运");
    const r = spawnSync(process.execPath, [path.join(ROOT, "scripts/import-wechat.js"), "--list", LINKS], { stdio: "inherit" });
    process.exitCode = r.status ?? 1;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
