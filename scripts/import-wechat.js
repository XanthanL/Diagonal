/**
 * 微信公众号文章 → Diagonal /archive 文章页 批量搬运。
 *
 * 用法：
 *   node scripts/import-wechat.js <mp.weixin.qq.com/s/... 链接> [...]
 *   node scripts/import-wechat.js --list links.txt          # 一行一个链接
 *   node scripts/import-wechat.js --list links.txt --dry-run # 只解析、不落盘
 *
 * 产出（每篇）：
 *   src/content/archive/{id}.html
 *   src/content/archive/_store/index.json  追加元数据（同 id 覆盖，其余不动）
 *   public/images/archive/{id}/img-N.jpg   正文图片本地化
 *
 * 设计约束：
 * - 只从文章页内嵌的 window.cgiDataNew 取正文（content_noencode），不解析 #js_content 的懒加载壳。
 * - 输出严格走 src/lib/sanitizeArchiveHtml.ts 的标签白名单，不引入微信的 style/class/span 壳。
 * - 图片一律落本地 /images/archive/{id}/，避免 mmbiz.qpic.cn 防盗链。
 * - 不改动 legacy.json、data.ts、sitemap.ts —— 这些从 archiveData 自动派生。
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "src/content/archive");
const STORE = path.join(CONTENT_DIR, "_store/index.json");
const IMG_ROOT = path.join(ROOT, "public/images/archive");
const WX_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.40(0x1800282a) NetType/WIFI Language/zh_CN";

// ---------------------------------------------------------------- 网络
function fetchUrl(rawUrl, redirects = 0) {
  return new Promise((resolve, reject) => {
    // 微信的文章长链、正文图片（mmbiz.qpic.cn）在旧推文里都可能是 http://，
    // https.get 不认 http: 协议；微信全站 CDN 均已支持 https，统一升协议。
    const url = String(rawUrl).replace(/^http:\/\//i, "https://");
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": WX_UA,
          "Accept-Language": "zh-CN,zh;q=0.9",
          "Accept-Encoding": "gzip, deflate",
          Referer: "https://mp.weixin.qq.com/",
        },
        timeout: 30000,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 4) {
          res.resume();
          return resolve(fetchUrl(new URL(res.headers.location, url).toString(), redirects + 1));
        }
        const chunks = [];
        let stream = res;
        const enc = res.headers["content-encoding"];
        if (enc === "gzip") stream = res.pipe(zlib.createGunzip());
        else if (enc === "deflate") stream = res.pipe(zlib.createInflate());
        stream.on("data", (c) => chunks.push(c));
        stream.on("end", () => resolve({ body: Buffer.concat(chunks), headers: res.headers, status: res.statusCode }));
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout: " + url)); });
  });
}

function fetchWithRetry(url, n = 3) {
  return fetchUrl(url).catch((e) => (n > 1 ? fetchWithRetry(url, n - 1) : Promise.reject(e)));
}

// ------------------------------------------------------- JS 字符串解码
// cgiDataNew 里的字段是单引号 JS 字符串，正文用 \xHH 转义过。
function readJsString(src, start) {
  let out = "";
  let i = start;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === "\\") {
      const n = src[++i];
      if (n === "x" && /^[0-9a-fA-F]{2}$/.test(src.slice(i + 1, i + 3))) {
        out += String.fromCharCode(parseInt(src.slice(i + 1, i + 3), 16)); i += 2;
      } else if (n === "u" && /^[0-9a-fA-F]{4}$/.test(src.slice(i + 1, i + 5))) {
        out += String.fromCharCode(parseInt(src.slice(i + 1, i + 5), 16)); i += 4;
      } else if (n === "n") out += "\n";
      else if (n === "t") out += "\t";
      else if (n === "r") out += "\r";
      else out += n;
    } else if (c === "'") return { value: out, end: i + 1 };
    else out += c;
  }
  throw new Error("unterminated JS string");
}

function field(html, key) {
  const m = html.match(new RegExp("\\b" + key + ":\\s*'"));
  if (!m) return null;
  return readJsString(html, m.index + m[0].length).value;
}

function extractArticle(html, url) {
  const title = field(html, "title");
  let body = field(html, "content_noencode");
  if (!title) throw new Error("取不到 title（可能是验证页或链接失效）");
  // 少数老推文是纯海报：cgiDataNew.content_noencode 为空，但 cdn_url 里还留着封面图。
  // 这类不编造正文，只把封面搬进来留档，避免「重要文章一篇不落」时整篇漏掉。
  let coverOnly = false;
  if (!body) {
    const cover = field(html, "cdn_url") || field(html, "cover") || "";
    if (!cover) throw new Error("正文与封面都取不到（可能是验证页或链接失效）");
    body = `<figure><img src="${escapeAttr(cover)}" alt="" /></figure>`;
    coverOnly = true;
  }
  const createTime = field(html, "create_time") || "";
  return {
    // cgiDataNew 的 title / author 里常带 &amp; &quot; 这类实体，不解会在站内标题上直接显示出来
    title: decodeEntities(title),
    body,
    coverOnly,
    author: decodeEntities(field(html, "author") || ""),
    desc: decodeEntities(field(html, "desc") || ""),
    nick: decodeEntities(field(html, "nick_name") || "对角线计划Diagonal"),
    createTime,
    sourceUrl: (field(html, "msg_link") || url).trim(),
    cover: field(html, "cover") || "",
  };
}

// ---------------------------------------------------------- HTML 清洗
const INLINE_KEEP = new Set(["strong", "b", "em", "i", "u", "s", "del", "ins", "mark", "sub", "sup", "code", "a", "br"]);
const BLOCK_KEEP = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "ul", "ol", "li", "hr", "pre", "table", "tr", "td", "th"]);
// 微信正文的排版壳分两类：块级壳是段落边界，行内壳只是词级变色/加粗，
// 绝不能触发分段 —— 否则一句话会被切成十几个 <p>（实测一篇 16k 字切出 542 段）。
const UNWRAP_BLOCK = new Set(["section", "div", "article", "header", "footer", "figure", "figcaption", "center", "tbody", "thead"]);
const UNWRAP_INLINE = new Set(["span", "font", "label", "small", "big", "abbr", "time", "wbr"]);
const DROP_WITH_CONTENT = new Set(["script", "style", "noscript", "template", "svg", "math", "iframe", "form", "mpvoice", "mpvideo", "mp-common-videosnap", "iframe"]);

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function attrOf(raw, name) {
  const m = raw.match(new RegExp("\\b" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", "i"));
  return m ? decodeEntities(m[1] ?? m[2] ?? m[3] ?? "") : null;
}

/**
 * 把微信正文转成站内可渲染的语义 HTML。
 * 逐 token 扫描，维护一个「当前段落缓冲」：遇到块级边界就收成一个 <p>。
 */
function cleanBody(source) {
  const tokens = [];
  const re = /<\/?([a-zA-Z][\w:-]*)([^>]*)>|[^<]+/g;
  let m;
  while ((m = re.exec(source))) {
    if (m[0][0] !== "<") { tokens.push({ type: "text", value: m[0] }); continue; }
    const closing = m[0].startsWith("</");
    const tag = m[1].toLowerCase();
    tokens.push({ type: closing ? "close" : "open", tag, raw: m[2] || "", self: /\/\s*$/.test(m[2] || "") });
  }

  const out = [];
  let buf = "";
  let headingDepth = 0;
  const skipDepth = [];
  const flush = () => {
    const text = buf.replace(/[\u00a0\s]*<br\s*\/?>[\u00a0\s]*/gi, " ").replace(/\s+/g, " ").trim();
    // 标题内部只许纯文本，不能夹 <p>；目录组件要抓干净的 h2/h3
    if (text) out.push(headingDepth > 0 ? text : "<p>" + text.replace(/<br\s*\/?>/gi, "<br />") + "</p>");
    buf = "";
  };
  const block = (html) => { flush(); out.push(html); };

  for (const t of tokens) {
    if (t.type === "text") { if (!skipDepth.length) buf += decodeEntities(t.value).replace(/[\r\n\t]+/g, " "); continue; }
    const tag = t.tag;
    if (skipDepth.length) {
      if (t.type === "open" && DROP_WITH_CONTENT.has(tag)) skipDepth.push(tag);
      else if (t.type === "close" && skipDepth[skipDepth.length - 1] === tag) skipDepth.pop();
      continue;
    }
    if (t.type === "open" && DROP_WITH_CONTENT.has(tag) && !t.self) { skipDepth.push(tag); continue; }
    if (DROP_WITH_CONTENT.has(tag)) continue;

    // 图片：微信正文用 data-src 懒加载
    if (tag === "img") {
      const src = attrOf(t.raw, "data-src") || attrOf(t.raw, "src");
      const alt = attrOf(t.raw, "alt") || "";
      if (!src || /^data:/i.test(src)) continue;
      flush();
      out.push(`<figure><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" /></figure>`);
      continue;
    }
    if (tag === "br" || tag === "hr") {
      if (tag === "hr") block("<hr />");
      else buf += "<br />";
      continue;
    }
    if (tag === "li") {
      if (t.type === "open") { flush(); buf = "<li>"; }
      else { const text = buf.replace(/^<li>/, "").trim(); buf = ""; out.push("<li>" + text + "</li>"); }
      continue;
    }
    if (tag === "ul" || tag === "ol") {
      if (t.type === "open") block("<" + tag + ">"); else block("</" + tag + ">");
      continue;
    }
    if (BLOCK_KEEP.has(tag)) {
      const isHeading = /^h[1-6]$/.test(tag);
      if (t.type === "open") {
        flush();
        headingDepth++;
        out.push("<" + (tag === "h1" ? "h2" : tag) + ">");
      } else {
        flush();
        headingDepth = Math.max(0, headingDepth - 1);
        out.push("</" + (tag === "h1" ? "h2" : tag) + ">");
      }
      continue;
    }
    if (UNWRAP_BLOCK.has(tag)) {
      // 块级壳 = 段落边界；但标题内部的壳不另起段
      if (headingDepth === 0) { if (t.type === "close" || buf.trim()) flush(); }
      continue;
    }
    if (UNWRAP_INLINE.has(tag)) continue; // 纯行内壳：透传文本，不分段
    if (INLINE_KEEP.has(tag)) {
      if (tag === "a") {
        const href = attrOf(t.raw, "href");
        if (t.type === "open" && href && /^https?:\/\//i.test(href))
          buf += `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">`;
        else if (t.type === "close") buf += "</a>";
      } else if (t.type === "open") buf += "<" + tag + ">";
      else buf += "</" + tag + ">";
      continue;
    }
    // 其余未知标签（微信自定义组件等）：透传文本
  }
  flush();

  return out
    .join("\n")
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/<(h[1-6]|blockquote|pre)>\s*<\/\1>/g, "")
    .replace(/<p>(<h[1-6]>)/g, "$1")
    .replace(/(<\/h[1-6]>)<\/p>/g, "$1")
    .replace(/<(h[2-6])>\s*([^<]*?)\s*<\/\1>/g, "<$1>$2</$1>")
    .replace(/\n{3,}/g, "\n\n");
}

// ------------------------------------------------------------ 图片落盘
function imgExtFromUrl(u) {
  if (/wx_fmt=gif|\.gif/i.test(u)) return "gif";
  return "jpg";
}

async function localizeImages(bodyHtml, id, dryRun) {
  const dir = path.join(IMG_ROOT, id);
  if (!dryRun) fs.mkdirSync(dir, { recursive: true });
  const urls = [];
  let idx = 0;
  const mapped = bodyHtml.replace(/<figure><img src="([^"]+)" alt="([^"]*)" \/><\/figure>/g, (_, rawSrc, alt) => {
    const src = decodeEntities(rawSrc);
    if (!/^https?:\/\//.test(src)) return `<figure><img src="${rawSrc}" alt="${alt}" /></figure>`;
    idx++;
    const name = `img-${idx}.jpg`;
    urls.push({ url: src, name, alt });
    return `<figure><img src="/images/archive/${id}/${name}" alt="${alt}" /></figure>`;
  });

  for (const item of urls) {
    if (dryRun) { console.log("   [dry] 图片", item.name, item.url.slice(0, 90)); continue; }
    // 断点续跑：几百篇批量导入若中途被打断，图片已落盘的不要重新请求（CDN 有频控，
    // 重复抓既慢又容易触发验证页）。台账改为逐篇 flush 后，这里就是幂等的关键。
    const target = path.join(dir, item.name);
    if (fs.existsSync(target) && fs.statSync(target).size > 1024) {
      console.log("   图片", item.name, "已存在，跳过");
      continue;
    }
    try {
      const res = await fetchWithRetry(item.url);
      let buf = res.body;
      // 微信图片可能是 webp/gif/png，统一压成白底 jpeg（gif 只取首帧）
      const sharp = require("sharp");
      buf = await sharp(buf, { animated: false })
        .flatten({ background: "#ffffff" })
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 86, mozjpeg: true })
        .toBuffer();
      fs.writeFileSync(path.join(dir, item.name), buf);
      console.log("   图片", item.name, (buf.length / 1024).toFixed(0) + "KB");
    } catch (e) {
      console.warn("   ⚠ 图片下载失败", item.url.slice(0, 90), e.message);
    }
  }
  return { html: mapped, first: urls.length ? `/images/archive/${id}/${urls[0].name}` : undefined };
}

// ------------------------------------------------------------ 元数据
function buildId(createTime, used) {
  const d = /(\d{4})-(\d{2})-(\d{2})/.exec(createTime) || [, "2026", "01", "01"];
  const base = `DIAGONAL-${d[1]}-WX${d[2]}${d[3]}`;
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  return id;
}

function tagsFromTitle(title) {
  const parts = title
    .split(/[｜|丨:：·\-—《》、,，\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 12 && !/^(转发|推广)$/.test(s));
  const uniq = [...new Set(parts)].slice(0, 3);
  return uniq.length ? uniq : ["对角线计划"];
}

function metaFor(article, id, thumbnail) {
  const date = /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/.exec(article.createTime);
  const year = date ? `${date[1]}.${date[2]}.${date[3]} ${date[4]}` : article.createTime.replace(/-/g, ".");
  return {
    id,
    title: article.title,
    titleEn: article.title,
    artist: article.author || article.nick,
    artistEn: "Diagonal",
    year,
    type: "Document",
    typeEn: "Document",
    tags: tagsFromTitle(article.title),
    tagsEn: ["Article"],
    location: { city: "线上", cityEn: "Online", code: "ON", coordinates: "—" },
    region: "Southwest",
    project: "research-notes",
    ...(thumbnail ? { thumbnail } : {}),
  };
}

function wrap(article, id, bodyHtml) {
  const date = /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/.exec(article.createTime);
  const ym = date ? `${date[1]}.${date[2]}` : "";
  const pub = date ? `${date[1]}.${date[2]}.${date[3]} ${date[4]}` : article.createTime;
  const byline = article.author ? `<p class="archive-text text-sm opacity-60">${escapeAttr(article.author)}</p>` : "";
  return `<section class="archive-html-content">
  <header class="mb-24">
    <div class="archive-text text-xs text-diagonal-red mb-4 tracking-[0.3em]">DIAGONAL_WECHAT / ${ym}</div>
    <h1>${article.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h1>
    <div class="flex gap-12 archive-text text-[10px] opacity-40 uppercase mt-8">
      <span>Location: ON / Online</span>
      <span>Publish: ${pub}</span>
    </div>
  </header>

${byline}${byline ? "\n" : ""}${bodyHtml}
</section>
`;
}

// ---------------------------------------------------------------- 主流程
// 「帮忙转发 / 推广」类不作为项目文献搬入。只认标题开头的显式标记，不猜内容：
// 本号自己的活动预告 / 招募 / 回顾里即使提到别的机构也照搬，避免误杀项目文献。
// wechatDownload 的历史里这类文章以「友情推送」「互联合作」开头，旧规则会漏掉。
const PROMO_RE = /^\s*[【\[（(]?\s*(?:友情推送|友情转发|帮忙转发|帮转|转发|推广|广告|转载|互联合作)/;

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const listIdx = argv.indexOf("--list");
  let urls = argv.filter((a) => !a.startsWith("--"));
  if (listIdx >= 0) {
    const file = argv[listIdx + 1];
    urls = fs.readFileSync(path.resolve(file), "utf8").split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith("#"));
  }
  urls = urls.filter((u) => /mp\.weixin\.qq\.com\/s/.test(u));
  if (!urls.length) { console.error("没有可导入的微信公众号文章链接"); process.exit(1); }

  // 源链接台账：既做去重（同一清单可反复跑），也留一份「哪篇来自公众号哪条推文」的可追溯记录
  const sourcesPath = path.join(CONTENT_DIR, "_store/wechat-sources.json");
  const sources = fs.existsSync(sourcesPath) ? JSON.parse(fs.readFileSync(sourcesPath, "utf8")) : [];
  const known = new Set(sources.flatMap((s) => [s.source, s.url]).filter(Boolean));
  const store = JSON.parse(fs.readFileSync(STORE, "utf8"));
  const legacy = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, "_store/legacy.json"), "utf8"));
  const used = new Set([...store, ...legacy].map((x) => x.id));
  // 用户给全量清单时，legacy 里那 19 篇也会混进来；按标题认出「已搬过」，避免重复建档
  const normTitle = (s) => s.replace(/[\s|｜丨:：·\-—《》"'"',，。、]/g, "").toLowerCase();
  const knownTitles = new Map([...store, ...legacy].map((x) => [normTitle(x.title), x.id]));
  const added = [];
  const skipped = [];
  // 逐篇落盘：全量清单两百多篇，单次可能跑十几分钟。旧版「循环结束才统一写台账」
  // 一旦被打断，已抓好的正文/图片全变孤儿文件，重跑还得把几百张图重新下载一遍。
  const persist = (record) => {
    if (dryRun) return;
    if (record) sources.push(record);
    fs.writeFileSync(STORE, JSON.stringify(store, null, 2) + "\n", "utf8");
    fs.writeFileSync(sourcesPath, JSON.stringify(sources, null, 2) + "\n", "utf8");
  };

  for (const url of urls) {
    if (known.has(url)) { console.log("\n==>", url, "\n   – 台账里已有，跳过"); continue; }
    console.log("\n==>", url);
    let article;
    try {
      const { body } = await fetchWithRetry(url);
      article = extractArticle(body.toString("utf8"), url);
    } catch (e) { console.error("   ✗ 抓取失败:", e.message); continue; }

    if (PROMO_RE.test(article.title.replace(/^\s+/, ""))) {
      console.log("   – 跳过（转发/推广类）:", article.title);
      const promoRec = { url, title: article.title, reason: "promo" };
      skipped.push(promoRec);
      persist(promoRec);
      continue;
    }
    const dup = knownTitles.get(normTitle(article.title));
    if (dup) {
      console.log(`   – 站点已有同标题文章（${dup}），跳过`);
      const dupRec = { url, title: article.title, duplicateOf: dup };
      skipped.push(dupRec);
      persist(dupRec);
      continue;
    }
    console.log("   标题:", article.title);
    console.log("   时间:", article.createTime, " 作者:", article.author || "(未署名)");

    const cleaned = cleanBody(article.body);
    const textLen = cleaned.replace(/<[^>]+>/g, "").replace(/\s+/g, "").length;
    console.log("   正文:", textLen, "字, 图片", (cleaned.match(/<figure>/g) || []).length, "张");
    if (article.coverOnly) console.log("   ⓘ 微信侧正文已为空（纯海报推文），只保存封面留档");
    else if (textLen < 120) console.warn("   ⚠ 正文偏短，建议人工确认是否为纯转发/海报");

    const id = buildId(article.createTime, used);
    used.add(id);
    const { html, first } = await localizeImages(cleaned, id, dryRun);
    if (dryRun) { console.log("   [dry] id =", id, " 首图 =", first || "(无)"); continue; }

    fs.writeFileSync(path.join(CONTENT_DIR, `${id}.html`), wrap(article, id, html), "utf8");
    const meta = metaFor(article, id, first);
    const exist = store.findIndex((x) => x.id === id);
    if (exist >= 0) store[exist] = meta; else store.push(meta);
    const rec = { id, title: article.title, year: meta.year, source: article.sourceUrl, url };
    added.push(rec);
    known.add(url);
    known.add(article.sourceUrl);
    persist(rec);
    console.log("   ✓ 写入", id, first ? "(含封面)" : "(无图)");
    await new Promise((r) => setTimeout(r, 800));
  }

  // 台账已在循环内逐篇持久化（含「跳过」的链接，重跑不会反复抓取 / 反复问要不要搬）。
  if (!dryRun) {
    console.log(`\n完成：新增 ${added.length} 篇 / 跳过 ${skipped.length} 篇，_store/index.json 共 ${store.length} 条，源链接台账共 ${sources.length} 条`);
  }
}

module.exports = { extractArticle, cleanBody, wrap, metaFor, buildId };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
