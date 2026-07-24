// overlay store：由自助后台写入的新增/覆盖条目（构建期静态导入）
import overlayArchiveRaw from "@/content/archive/_store/index.json";
import legacyArchiveRaw from "@/content/archive/_store/legacy.json";

export interface Location {
  city: string;
  code: string;
}

export interface ArchiveItem {
  id: string;
  title: string;
  titleEn: string;
  artist: string;
  artistEn: string;
  year: string;
  type: "Performance" | "Video" | "Document" | "Installation";
  typeEn: string;
  thumbnail?: string;
  tags: string[];
  tagsEn: string[];
  location: { city: string; cityEn: string; code: string; coordinates: string };
  region: "Southwest" | "Northeast" | "Transition";
  /**
   * 草稿标记：由自助后台写入的 overlay 条目使用。
   * 为 true 时不会出现在公开站点（构建期过滤）。
   */
  draft?: boolean;
  /**
   * 所属项目 slug，用于 /projects/[project] 路由聚合
   * - "the-salt-of-life"：生命之盐
   * - "diagonal-talks"：对角线漫谈
   * - "research-notes"：研究笔记
   * - "other"：其他独立项目
   */
  project: "the-salt-of-life" | "diagonal-talks" | "research-notes" | "other";
  /**
   * 在项目内的子系列 slug，用于项目总览页分组
   * 生命之盐：open-call / residency-1.0 / residency-2.0 / exhibition / sharing-session / salon
   */
  series?: string;
}

export interface AtlasItem {
  id: string;
  title: string;
  titleEn: string;
  author: string;
  authorEn: string;
  date: string;
  excerpt: string;
  excerptEn: string;
  category: "Visual Record" | "Field Report" | "Atlas";
  categoryEn: string;
  cover?: string;
  location: Location;
  region: "Southwest" | "Northeast" | "Transition";
  subCollections?: {
    id: string;
    title: string;
    titleEn: string;
    cover: string;
    gallery: {
      url: string;
      caption: string;
      captionEn?: string;
      width?: number;
      height?: number;
    }[];
  }[];
  gallery?: {
    url: string;
    caption: string;
    captionEn?: string;
    width?: number;
    height?: number;
  }[];
}

export interface LocalizedArchiveItem {
  id: string;
  title: string;
  artist: string;
  year: string;
  type: ArchiveItem["type"];
  thumbnail?: string;
  tags: string[];
  location: { city: string; code: string; coordinates: string };
  region: ArchiveItem["region"];
}

export interface LocalizedAtlasItem {
  id: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  category: AtlasItem["category"];
  cover?: string;
  location: Location;
  region: AtlasItem["region"];
  subCollections?: {
    id: string;
    title: string;
    cover: string;
    gallery: {
      url: string;
      caption: string;
      width?: number;
      height?: number;
    }[];
  }[];
  gallery?: {
    url: string;
    caption: string;
    width?: number;
    height?: number;
  }[];
}

function localizeCaption(caption: string): string {
  return caption.replace(/摄影师[：:]/g, "Photo: ");
}

export function getLocalizedArchiveItem(item: ArchiveItem, lang: "zh" | "en"): LocalizedArchiveItem {
  if (lang === "zh") {
    return {
      id: item.id,
      title: item.title,
      artist: item.artist,
      year: item.year,
      type: item.type,
      thumbnail: item.thumbnail,
      tags: item.tags,
      location: { city: item.location.city, code: item.location.code, coordinates: item.location.coordinates },
      region: item.region,
    };
  }
  return {
    id: item.id,
    title: item.titleEn,
    artist: item.artistEn,
    year: item.year,
    type: item.typeEn as ArchiveItem["type"],
    thumbnail: item.thumbnail,
    tags: item.tagsEn,
    location: { city: item.location.cityEn, code: item.location.code, coordinates: item.location.coordinates },
    region: item.region,
  };
}

export function getLocalizedAtlasItem(item: AtlasItem, lang: "zh" | "en"): LocalizedAtlasItem {
  if (lang === "zh") {
    return {
      id: item.id,
      title: item.title,
      author: item.author,
      date: item.date,
      excerpt: item.excerpt,
      category: item.category,
      cover: item.cover,
      location: item.location,
      region: item.region,
      subCollections: item.subCollections?.map((s) => ({
        id: s.id,
        title: s.title,
        cover: s.cover,
        gallery: s.gallery.map((g) => ({ url: g.url, caption: g.caption, width: g.width, height: g.height })),
      })),
      gallery: item.gallery?.map((g) => ({ url: g.url, caption: g.caption, width: g.width, height: g.height })),
    };
  }
  return {
    id: item.id,
    title: item.titleEn,
    author: item.authorEn,
    date: item.date,
    excerpt: item.excerptEn,
    category: item.categoryEn as AtlasItem["category"],
    cover: item.cover,
    location: item.location,
    region: item.region,
    subCollections: item.subCollections?.map((s) => ({
      id: s.id,
      title: s.titleEn,
      cover: s.cover,
      gallery: s.gallery.map((g) => ({ url: g.url, caption: g.captionEn || localizeCaption(g.caption), width: g.width, height: g.height })),
    })),
    gallery: item.gallery?.map((g) => ({ url: g.url, caption: g.captionEn || localizeCaption(g.caption), width: g.width, height: g.height })),
  };
}

/**
 * 现有（历史）档案条目：数据源为 src/content/archive/_store/legacy.json。
 * 后台可编辑历史文章——编辑结果写入 overlay(_store/index.json) 覆盖同 id 条目，legacy.json 本身不被回写。
 */
const legacyArchiveData = legacyArchiveRaw as ArchiveItem[];

const overlayArchiveData = (overlayArchiveRaw as ArchiveItem[]).filter((item) => !item.draft);
const overlayIds = new Set(overlayArchiveData.map((item) => item.id));

/**
 * 合并规则：
 * - overlay 中与 legacy 相同的 id → 覆盖该条元数据（编辑已有文章）
 * - overlay 中的新 id → 追加
 * - 统一按 year 时间倒序
 */
export const archiveData: ArchiveItem[] = [
  ...overlayArchiveData,
  ...legacyArchiveData.filter((item) => !overlayIds.has(item.id)),
].sort((a, b) => b.year.localeCompare(a.year));

export const atlasData: AtlasItem[] = [
  {
    id: "ATLAS-ZG-2.0",
    title: "生命之盐 2.0",
    titleEn: "The Salt of Life 2.0",
    author: "对角线计划 (Diagonal)",
    authorEn: "Diagonal",
    date: "2026.04 - 06",
    excerpt: "对角线计划·自贡火井沱驻留与共创项目是一个以工业遗产、物质记忆与社会参与式艺术为核心的长期跨学科实践...",
    excerptEn: "The Diagonal · Zigong Huojingtuo Residency & Co-creation Project is a long-term interdisciplinary practice centred on industrial heritage, material memory, and socially engaged art...",
    category: "Atlas",
    categoryEn: "Atlas",
    location: { city: "自贡", code: "ZG" },
    region: "Southwest",
    cover: "/images/archive/DIAGONAL-2026-LIST2/cover.jpg",
    subCollections: [
      {
        id: "P1",
        title: "防空洞与废弃盐厂考察",
        titleEn: "Investigation of Air-Raid Shelters & Abandoned Salt Works",
        cover: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255858/防空洞与废弃盐厂_1_t8a7d7.jpg",
        gallery: [
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255858/防空洞与废弃盐厂_1_t8a7d7.jpg", caption: "防空洞与废弃盐厂_001 摄影师：彭思崴" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255849/防空洞与废弃盐厂_2_x9s5vv.jpg", caption: "防空洞与废弃盐厂_002 摄影师：彭思崴" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255865/防空洞与废弃盐厂_3_pxetbg.jpg", caption: "防空洞与废弃盐厂_003 摄影师：彭玮雯（Vivienne Peng）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255846/防空洞与废弃盐厂_5_nenw0u.jpg", caption: "防空洞与废弃盐厂_005 摄影师：彭玮雯（Vivienne Peng）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255875/防空洞与废弃盐厂_6_wi43rr.jpg", caption: "防空洞与废弃盐厂_006 摄影师：彭玮雯（Vivienne Peng）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255860/防空洞与废弃盐厂_7_f9vbql.jpg", caption: "防空洞与废弃盐厂_007 摄影师：彭玮雯（Vivienne Peng）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255880/防空洞与废弃盐厂_8_d432oe.jpg", caption: "防空洞与废弃盐厂_008 摄影师：彭玮雯（Vivienne Peng）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255862/防空洞与废弃盐厂_9_cxd1ou.jpg", caption: "防空洞与废弃盐厂_009 摄影师：彭玮雯（Vivienne Peng）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255869/防空洞与废弃盐厂_10_lw7lau.jpg", caption: "防空洞与废弃盐厂_010 摄影师：彭玮雯（Vivienne Peng）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255843/防空洞与废弃盐厂_11_qlesiv.jpg", caption: "防空洞与废弃盐厂_011 摄影师：彭玮雯（Vivienne Peng）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255843/防空洞与废弃盐厂_12_zpttrg.jpg", caption: "防空洞与废弃盐厂_012 摄影师：彭玮雯（Vivienne Peng）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255843/防空洞与废弃盐厂_13_qperzv.jpg", caption: "防空洞与废弃盐厂_013 摄影师：彭玮雯（Vivienne Peng）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255843/防空洞与废弃盐厂_14_cxznl0.jpg", caption: "防空洞与废弃盐厂_014 摄影师：彭玮雯（Vivienne Peng）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255844/防空洞与废弃盐厂_15_xywxo4.jpg", caption: "防空洞与废弃盐厂_015 摄影师：彭玮雯（Vivienne Peng）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255844/防空洞与废弃盐厂_16_moh47d.jpg", caption: "防空洞与废弃盐厂_016 摄影师：彭玮雯（Vivienne Peng）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255851/防空洞与废弃盐厂_17_bn5kaa.jpg", caption: "防空洞与废弃盐厂_017 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255846/防空洞与废弃盐厂_18_ndxfnp.jpg", caption: "防空洞与废弃盐厂_018 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255864/防空洞与废弃盐厂_19_eejcab.jpg", caption: "防空洞与废弃盐厂_019 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255849/防空洞与废弃盐厂_20_mgg7mw.jpg", caption: "防空洞与废弃盐厂_020 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255847/防空洞与废弃盐厂_21_tr4ryn.jpg", caption: "防空洞与废弃盐厂_021 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255845/防空洞与废弃盐厂_22_ewwhjh.jpg", caption: "防空洞与废弃盐厂_022 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255848/防空洞与废弃盐厂_23_c8tl05.jpg", caption: "防空洞与废弃盐厂_023 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255853/防空洞与废弃盐厂_24_olpx78.jpg", caption: "防空洞与废弃盐厂_024 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255846/防空洞与废弃盐厂_25_mc5cmb.jpg", caption: "防空洞与废弃盐厂_025 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255850/防空洞与废弃盐厂_26_lusvax.jpg", caption: "防空洞与废弃盐厂_026 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255862/防空洞与废弃盐厂_27_w5k4lo.jpg", caption: "防空洞与废弃盐厂_027 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255862/防空洞与废弃盐厂_28_s2sjwa.jpg", caption: "防空洞与废弃盐厂_028 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255869/防空洞与废弃盐厂_29_mj11ba.jpg", caption: "防空洞与废弃盐厂_029 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255863/防空洞与废弃盐厂_30_ihuqik.jpg", caption: "防空洞与废弃盐厂_030 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255853/防空洞与废弃盐厂_31_n64bce.jpg", caption: "防空洞与废弃盐厂_031 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255868/防空洞与废弃盐厂_32_rgdhwm.jpg", caption: "防空洞与废弃盐厂_032 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255865/防空洞与废弃盐厂_33_qqppyq.jpg", caption: "防空洞与废弃盐厂_033 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255869/防空洞与废弃盐厂_34_wzpdn0.jpg", caption: "防空洞与废弃盐厂_034 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255866/防空洞与废弃盐厂_35_x04y3z.jpg", caption: "防空洞与废弃盐厂_035 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255845/防空洞与废弃盐厂_36_unowae.jpg", caption: "防空洞与废弃盐厂_036 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255845/防空洞与废弃盐厂_37_g3fyl9.jpg", caption: "防空洞与废弃盐厂_037 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255891/防空洞与废弃盐厂_38_jewxuq.jpg", caption: "防空洞与废弃盐厂_038 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255867/防空洞与废弃盐厂_39_iloxlk.jpg", caption: "防空洞与废弃盐厂_039 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255867/防空洞与废弃盐厂_40_kehd7n.jpg", caption: "防空洞与废弃盐厂_040 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255868/防空洞与废弃盐厂_41_axkmoh.jpg", caption: "防空洞与废弃盐厂_041 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255856/防空洞与废弃盐厂_42_k1jpfz.jpg", caption: "防空洞与废弃盐厂_042 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255852/防空洞与废弃盐厂_43_nhs6r8.jpg", caption: "防空洞与废弃盐厂_043 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255848/防空洞与废弃盐厂_44_qgnk5q.jpg", caption: "防空洞与废弃盐厂_044 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255855/防空洞与废弃盐厂_45_bjprvt.jpg", caption: "防空洞与废弃盐厂_045 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255854/防空洞与废弃盐厂_46_rlh4tb.jpg", caption: "防空洞与废弃盐厂_046 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255870/防空洞与废弃盐厂_47_hvjab4.jpg", caption: "防空洞与废弃盐厂_047 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255851/防空洞与废弃盐厂_48_sbhkhq.jpg", caption: "防空洞与废弃盐厂_048 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255852/防空洞与废弃盐厂_49_jjbsqk.jpg", caption: "防空洞与废弃盐厂_049 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255848/防空洞与废弃盐厂_50_potw2e.jpg", caption: "防空洞与废弃盐厂_050 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255847/防空洞与废弃盐厂_51_gfgjdl.jpg", caption: "防空洞与废弃盐厂_051 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255849/防空洞与废弃盐厂_52_vpvdxk.jpg", caption: "防空洞与废弃盐厂_052 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255854/防空洞与废弃盐厂_53_fzw950.jpg", caption: "防空洞与废弃盐厂_053 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255849/防空洞与废弃盐厂_54_fpiwrq.jpg", caption: "防空洞与废弃盐厂_054 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255849/防空洞与废弃盐厂_55_qhyxrq.jpg", caption: "防空洞与废弃盐厂_055 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255851/防空洞与废弃盐厂_56_omcb10.jpg", caption: "防空洞与废弃盐厂_056 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255852/防空洞与废弃盐厂_57_vud7e2.jpg", caption: "防空洞与废弃盐厂_057 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255856/防空洞与废弃盐厂_58_bj60xf.jpg", caption: "防空洞与废弃盐厂_058 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255855/防空洞与废弃盐厂_59_krazx1.jpg", caption: "防空洞与废弃盐厂_059 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255856/防空洞与废弃盐厂_60_kus4ww.jpg", caption: "防空洞与废弃盐厂_060 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255859/防空洞与废弃盐厂_62_pfw4n1.jpg", caption: "防空洞与废弃盐厂_062 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255856/防空洞与废弃盐厂_63_hgpgx5.jpg", caption: "防空洞与废弃盐厂_063 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255847/防空洞与废弃盐厂_64_nifrkj.jpg", caption: "防空洞与废弃盐厂_064 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255846/防空洞与废弃盐厂_65_zlvss5.jpg", caption: "防空洞与废弃盐厂_065 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255865/防空洞与废弃盐厂_66_umarnn.jpg", caption: "防空洞与废弃盐厂_066 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255859/防空洞与废弃盐厂_68_hkw0gp.jpg", caption: "防空洞与废弃盐厂_068 摄影师：刘洛甫（虫子声）" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255858/防空洞与废弃盐厂_69_kmztwb.jpg", caption: "防空洞与废弃盐厂_069 摄影师：刘洛甫（虫子声）" },
        ]
      }
    ]
  },
  {
    id: "ATLAS-ZG-1.0",
    title: "生命之盐 1.0",
    titleEn: "The Salt of Life 1.0",
    author: "对角线计划 (Diagonal)",
    authorEn: "Diagonal",
    date: "2026.02",
    excerpt: "作为项目的启动阶段，1.0 聚焦于火井沱社区的口述史采集与工业遗存初步调研。12位创作者在20天的时间里，通过考察与调研在自贡留下了深刻印记。",
    excerptEn: "As the project’s inaugural phase, 1.0 focused on oral history collection in Huojingtuo community and preliminary research into industrial remnants. Twelve creators left a profound mark on Zigong through 20 days of fieldwork and investigation.",
    category: "Atlas",
    categoryEn: "Atlas",
    location: { city: "自贡", code: "ZG" },
    region: "Southwest",
    cover: "",
  },
  {
    id: "ATLAS-HG",
    title: "鹤岗",
    titleEn: "Hegang",
    author: "占位符",
    authorEn: "TBC",
    date: "2024.12",
    excerpt: "在零下三十度的极端气候中，我们试图捕捉那些正在消逝的工业纹理与人的面孔...",
    excerptEn: "In the extreme climate of minus 30 degrees, we attempt to capture the fading industrial textures and human faces...",
    category: "Visual Record",
    categoryEn: "Visual Record",
    location: { city: "鹤岗", code: "HG" },
    region: "Northeast",
    cover: "",
  }
];
