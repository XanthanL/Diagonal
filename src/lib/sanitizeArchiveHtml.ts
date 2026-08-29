/**
 * 档案正文 HTML 白名单清洗。
 *
 * 定位：正文只经 /admin 富文本编辑器与仓库提交进入，编辑器粘贴（Word/网页）会带进
 * script、内联事件与畸形样式；这里把「能用」与「能执行」切开。
 * 它不是防住仓库写权限持有者的那道墙（那种人可以直接改代码），
 * 真正的边界是 PAT 最小权限 + main 分支保护 + Pages 部署审批。
 *
 * 实现是纯字符串处理，不用 DOMParser：本页是全静态导出，
 * 同一段代码要在构建期（Node）与hydration（浏览器）产出逐字一致的结果，
 * 否则 SSR 与客户端渲染会不匹配。
 *
 * 白名单来自对 src/content/archive/*.html 的实测统计 + TipTap 可能产出的行内标记。
 */

const ALLOWED_TAGS = new Set([
  "p", "div", "span", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "del", "ins", "mark",
  "sub", "sup", "code", "pre",
  "blockquote", "ul", "ol", "li",
  "figure", "figcaption", "img", "a",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "section", "article", "header", "footer",
]);

// 整个丢弃（连同内部内容）的元素：留文本没有意义，反而会夹带脚本
const DANGEROUS_ELEMENTS = [
  "script", "style", "noscript", "template", "svg", "math",
  "iframe", "frame", "frameset", "object", "embed", "applet",
  "form", "input", "button", "select", "textarea", "option",
  "link", "meta", "base",
];

// 全局可留属性：class/style 是排版与编辑器对齐、字色的载体，不能一刀切
const GLOBAL_ATTRS = new Set(["class", "style", "dir", "lang", "title"]);

const ATTRS_BY_TAG: Record<string, string[]> = {
  img: ["src", "alt", "width", "height", "srcset", "sizes", "loading", "decoding"],
  a: ["href", "target", "rel"],
  td: ["colspan", "rowspan", "align"],
  th: ["colspan", "rowspan", "scope", "align"],
  ol: ["start", "type"],
  li: ["value"],
  caption: ["align"],
};

// 放行协议：http/https/协议相对/绝对路径/相对路径/锚点
// img 额外放行 data:image/*;base64 —— 后台上传（clientImages.ts）会以这种 src 落盘
const SAFE_URL = /^(https?:\/\/|\/\/|\/|\.\/|\.\.\/|#)/i;
const SAFE_IMG = /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,/i;

// style 里最危险的几类：外联、表达式、IE behavior、以及任何 url()（可用于探测/外联）
const UNSAFE_STYLE = /url\(|expression\(|javascript:|@import|behavior\s*:/i;

function isSafeUrl(value: string, isImg: boolean): boolean {
  const v = value.trim();
  if (isImg && SAFE_IMG.test(v)) return true;
  // 不以已知协议开头且不含「:」的，视为相对路径（如 images/a.jpg）
  if (!SAFE_URL.test(v)) return !/^[a-z][a-z0-9+.-]*:/i.test(v);
  return true;
}

function cleanAttributes(tag: string, raw: string): string {
  const perTag = ATTRS_BY_TAG[tag];
  const out: string[] = [];
  // 属性名 + 可选的 =值（双引号/单引号/裸值）
  const attrRe = /([a-zA-Z_:][\w:.-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(raw))) {
    const name = m[1].toLowerCase();
    const value = m[2] ?? m[3] ?? m[4] ?? "";

    if (name.startsWith("on")) continue; // 任何内联事件处理器
    const allowed = (perTag?.includes(name) || GLOBAL_ATTRS.has(name));
    if (!allowed) continue;

    if ((name === "href" || name === "src") && !isSafeUrl(value, name === "src")) continue;
    if (name === "srcset") {
      // srcset 是逗号分隔的候选列表，逐个校验 URL
      const parts = value.split(",");
      if (parts.some((part) => !isSafeUrl(part.trim().split(/\s+/)[0] ?? "", true))) continue;
    }
    if (name === "style" && UNSAFE_STYLE.test(value)) continue;
    if (name === "target" && value !== "_blank") continue;

    out.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
  }

  // 允许在新窗口打开，但补上 noopener，避免 reverse tabnabbing
  if (out.some((a) => a.startsWith("target=")) && !out.some((a) => a.startsWith("rel="))) {
    out.push('rel="noopener noreferrer"');
  }
  return out.join(" ");
}

/**
 * 清洗一段档案正文 HTML。
 */
export function sanitizeArchiveHtml(html: string): string {
  if (!html) return "";

  let s = html.replace(/<!--[\s\S]*?(?:-->|$)/g, "");

  for (const tag of DANGEROUS_ELEMENTS) {
    // 成对元素连同内容一起删；自闭合/未闭合的标签壳单独删
    s = s.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, "gi"), "");
    s = s.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi"), "");
  }

  // 逐个标签重写：不在白名单的标签去掉外壳、保留其中的文字
  s = s.replace(
    /<\/?([a-zA-Z][^\s>/]*)\s*((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g,
    (_full, name: string, attrs: string, selfClose: string) => {
      const tag = name.toLowerCase();
      const closing = _full[1] === "/";
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (closing) return `</${tag}>`;
      const cleaned = cleanAttributes(tag, attrs);
      const voidTag = ["img", "br", "hr"].includes(tag);
      return `<${tag}${cleaned ? " " + cleaned : ""}${selfClose && !voidTag ? " /" : ""}>`;
    },
  );

  return s;
}
