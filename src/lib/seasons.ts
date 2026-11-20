/**
 * 四季主题的单一真相。
 *
 * 背景：站点原本有 archive / herbarium 二元主题，herbarium 是那套「纸本植物标本册」
 * （淡雾粉 + 橄榄绿 + 墨绿），它本身就是「春」。现在要把这套语言延展到夏秋冬。
 *
 * 关键设计：**季节是正交维度 `data-season`，不是新的主题值。**
 * - `data-theme` 仍是 archive / herbarium，二元不动；
 * - `data-season` 只在 herbarium 内部生效（archive 档案风零变化，一条规则都不命中）；
 * - 默认 `spring`，且 spring 不写任何覆盖规则 —— 用 :root 现有的 --flora-* 值，
 *   因此默认春与接入前逐像素一致，零回归。
 *
 * 每季只换两样东西：① 色板 token（--flora-*）② 素材路径（--season-*）。
 * 素材由用户按 docs/SEASONS-IMAGE-GUIDE.md 生成；图未到位前，夏秋冬的路径
 * 一律 fallback 到春图（assetPaths 里的 stub 标记），所以现在切换不会 404，
 * 只是色板变了。图到位后，把对应季的 assetPaths 换到 /images/seasons/<id>/ 即可，
 * CSS 与组件都不用改。
 */

export type SiteSeason = "spring" | "summer" | "autumn" | "winter";

export const SEASON_IDS: SiteSeason[] = ["spring", "summer", "autumn", "winter"];

/** 一套植物标本素材的 9 个槽位，值与文件名/文档一一对应。 */
export type SeasonAssetKey =
  | "paper"
  | "press1"
  | "press2"
  | "press3"
  | "band"
  | "specimen"
  | "portrait"
  | "seal"
  | "heroDesktop";

export type SeasonPal = {
  bg: string;
  bgRgb: string;
  ink: string;
  accent: string;
  green: string;
  line: string;
};

export type SeasonDef = {
  id: SiteSeason;
  zh: string;
  en: string;
  /** 眉标用的简短编号 */
  code: string;
  pal: SeasonPal;
  /**
   * 该季 9 张素材的站点路径。
   * stub=true 表示尚未生成、暂时复用春图；图到位后改这里的路径即可接入。
   */
  assetPaths: Record<SeasonAssetKey, string>;
  stub: boolean;
};

/** 春的素材路径 —— 现有 herbarium 目录，逐字照抄，不要动。 */
const SPRING_ASSETS: Record<SeasonAssetKey, string> = {
  paper: "/images/herbarium/paper-grain.webp",
  press1: "/images/herbarium/press-1.webp",
  press2: "/images/herbarium/press-2.webp",
  press3: "/images/herbarium/press-3.webp",
  band: "/images/herbarium/press-rule-band.webp",
  specimen: "/images/herbarium/plate-specimen.webp",
  portrait: "/images/herbarium/hero-portrait.webp",
  seal: "/images/herbarium/seal.webp",
  heroDesktop: "/images/hero-botanical.webp",
};

/** 某季素材目录的约定路径。 */
export function seasonAssetBase(id: SiteSeason): string {
  return `/images/seasons/${id}`;
}

/** 某季 9 张派生 WebP 的站点路径（由 prepare-season.js 从同名源图生成）。 */
function seasonAssets(id: Exclude<SiteSeason, "spring">): Record<SeasonAssetKey, string> {
  const b = seasonAssetBase(id);
  return {
    paper: `${b}/paper-grain.webp`,
    press1: `${b}/press-1.webp`,
    press2: `${b}/press-2.webp`,
    press3: `${b}/press-3.webp`,
    band: `${b}/press-rule-band.webp`,
    specimen: `${b}/plate-specimen.webp`,
    portrait: `${b}/hero-portrait.webp`,
    seal: `${b}/seal.webp`,
    heroDesktop: `${b}/hero-botanical.webp`,
  };
}

export const SEASONS: Record<SiteSeason, SeasonDef> = {
  spring: {
    id: "spring",
    zh: "春",
    en: "SPRING",
    code: "01",
    pal: {
      bg: "#F3F1E7",
      bgRgb: "243, 241, 231",
      ink: "#1F2419",
      accent: "#7D1C18",
      green: "#6D8438",
      line: "rgba(31, 36, 25, 0.16)",
    },
    assetPaths: SPRING_ASSETS,
    stub: false,
  },
  summer: {
    id: "summer",
    zh: "夏",
    en: "SUMMER",
    code: "02",
    pal: {
      bg: "#EFF1E6",
      bgRgb: "239, 241, 230",
      ink: "#16251C",
      accent: "#A64228",
      green: "#3E7A3F",
      line: "rgba(22, 37, 28, 0.16)",
    },
    assetPaths: seasonAssets("summer"),
    stub: false,
  },
  autumn: {
    id: "autumn",
    zh: "秋",
    en: "AUTUMN",
    code: "03",
    pal: {
      bg: "#F4EEE0",
      bgRgb: "244, 238, 224",
      ink: "#2A2118",
      accent: "#8E3A1C",
      green: "#9A6E2E",
      line: "rgba(42, 33, 24, 0.16)",
    },
    assetPaths: seasonAssets("autumn"),
    stub: false,
  },
  winter: {
    id: "winter",
    zh: "冬",
    en: "WINTER",
    code: "04",
    pal: {
      bg: "#EFF1F1",
      bgRgb: "239, 241, 241",
      ink: "#1B2226",
      accent: "#7C2C2A",
      green: "#5A6B6E",
      line: "rgba(27, 34, 38, 0.16)",
    },
    assetPaths: seasonAssets("winter"),
    stub: false,
  },
};

/** 把任意字符串收敛到合法季节值；非法一律春。 */
export function parseSeason(v: string | null | undefined): SiteSeason {
  if (v === "summer" || v === "autumn" || v === "winter") return v;
  return "spring";
}

/**
 * 生成供 <head> 同步脚本注入的 `--season-*` CSS 变量声明。
 * 只生成非春三季：spring 用 :root 默认值，不写覆盖，保证零回归。
 * 变量值形如 `url("...")`，herbarium-assets.css 用 var(--season-paper) 等读取。
 */
export function seasonCssVars(id: SiteSeason): string {
  const map: Record<SeasonAssetKey, string> = {
    paper: "--season-paper",
    press1: "--season-press-1",
    press2: "--season-press-2",
    press3: "--season-press-3",
    band: "--season-band",
    specimen: "--season-specimen",
    portrait: "--season-portrait",
    seal: "--season-seal",
    heroDesktop: "--season-hero-desktop",
  };
  const assets = SEASONS[id].assetPaths;
  return (Object.keys(map) as SeasonAssetKey[])
    .map((k) => `${map[k]}:url("${assets[k]}")`)
    .join(";");
}

/** 供 <img src> 组件读取某季某槽位的路径（见 seasons.ts 顶部关于首帧的说明）。 */
export function getSeasonAsset(id: SiteSeason, key: SeasonAssetKey): string {
  return SEASONS[id].assetPaths[key];
}
