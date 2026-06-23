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

export const archiveData: ArchiveItem[] = [
  {
    id: "DIAGONAL-2026-ARTISTS",
    title: "参展艺术家介绍｜“生命之盐”自贡盐文化当代艺术展",
    titleEn: "Artists Introduction | The Salt of Life: Contemporary Art Exhibition on Zigong Salt Culture",
    artist: "对角线计划",
    artistEn: "Diagonal",
    year: "2026.06.21 23:59",
    type: "Document",
    typeEn: "Document",
    tags: ["参展艺术家", "当代艺术展", "自贡", "生命之盐", "自流井老街"],
    tagsEn: ["Artists Introduction", "Contemporary Art", "Zigong", "The Salt of Life", "Ziliujing Old Street"],
    location: { city: "自贡", cityEn: "Zigong", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-ARTISTS/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-ZG03",
    title: "展览预告｜“生命之盐”自贡盐文化当代艺术展",
    titleEn: "Exhibition Preview | The Salt of Life: Contemporary Art Exhibition on Zigong Salt Culture",
    artist: "对角线计划 / 孙晓鸣 Kerribin",
    artistEn: "Diagonal / Kerribin",
    year: "2026.06.20 18:01",
    type: "Document",
    typeEn: "Document",
    tags: ["展览预告", "当代艺术展", "自贡", "生命之盐", "自流井老街"],
    tagsEn: ["Exhibition Preview", "Contemporary Art", "Zigong", "The Salt of Life", "Ziliujing Old Street"],
    location: { city: "自贡", cityEn: "Zigong", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-ZG03/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-LIST2",
    title: "名单公布丨“生命之盐 2.0”自贡盐文化考察创作驻留计划",
    titleEn: "List Announcement | The Salt of Life 2.0: Zigong Salt Culture Research & Creation Residency",
    artist: "对角线计划",
    artistEn: "Diagonal",
    year: "2026.06.07 19:07",
    type: "Document",
    typeEn: "Document",
    tags: ["名单公布", "驻留", "自贡"],
    tagsEn: ["List Announcement", "Residency", "Zigong"],
    location: { city: "自贡", cityEn: "Zigong", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-LIST2/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-SH",
    title: "回顾：对角线计划参加上海社区枢纽站讲座",
    titleEn: "Review: Diagonal at the Shanghai Community Hub Station Lecture",
    artist: "对角线计划",
    artistEn: "Diagonal",
    year: "2026.06.03 19:38",
    type: "Document",
    typeEn: "Document",
    tags: ["讲座", "艺术社区", "学科创新", "回顾"],
    tagsEn: ["Lecture", "Art Community", "Disciplinary Innovation", "Review"],
    location: { city: "上海", cityEn: "Shanghai", code: "SH", coordinates: "31.2N, 121.5E" },
    region: "Transition",
    thumbnail: "/images/archive/DIAGONAL-2026-SH/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-A4",
    title: "盐记忆之场：A4国际驻留艺术中心成都艺术周分享会",
    titleEn: "Field of Salt Memory: A4 International Residency Art Center Chengdu Art Week Sharing Session",
    artist: "对角线计划",
    artistEn: "Diagonal",
    year: "2026.04.08 13:07",
    type: "Document",
    typeEn: "Document",
    tags: ["分享会", "成都", "A4驻留", "在地实践"],
    tagsEn: ["Sharing Session", "Chengdu", "A4 Residency", "Site-specific Practice"],
    location: { city: "成都", cityEn: "Chengdu", code: "CD", coordinates: "30.6N, 104.1E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-A4/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-ZG01",
    title: "展览回顾：生命之盐 1.0 自贡盐文化考察创作驻留成果展",
    titleEn: "Exhibition Review: The Salt of Life 1.0 — Zigong Salt Culture Research & Creation Residency Outcomes",
    artist: "对角线计划 / 驻留创作者",
    artistEn: "Diagonal / Resident Artists",
    year: "2026.04.02 07:16",
    type: "Document",
    typeEn: "Document",
    tags: ["展览回顾", "自贡", "工业遗产", "驻留成果"],
    tagsEn: ["Exhibition Review", "Zigong", "Industrial Heritage", "Residency Outcomes"],
    location: { city: "自贡", cityEn: "Zigong", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-ZG01/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-ZG02",
    title: "共居与共情：生命之盐 1.0 驻留成果展览现场交互行动招募",
    titleEn: "Co-living & Co-empathy: The Salt of Life 1.0 — Live Interaction Action Call at the Residency Outcomes Exhibition",
    artist: "对角线计划",
    artistEn: "Diagonal",
    year: "2026.03.31 23:53",
    type: "Installation",
    typeEn: "Installation",
    tags: ["驻留", "交互行动", "展览"],
    tagsEn: ["Residency", "Interaction", "Exhibition"],
    location: { city: "自贡", cityEn: "Zigong", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-ZG02/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-YD",
    title: "重走盐道 2026：在贡井老街用盐重新走一遍历史",
    titleEn: "Retracing the Salt Road 2026: Walking Through History with Salt in Gongjing Old Street",
    artist: "生命之盐 1.0 参与创作者",
    artistEn: "The Salt of Life 1.0 Participants",
    year: "2026.03.26 20:42",
    type: "Performance",
    typeEn: "Performance",
    tags: ["生命之盐", "重走盐道", "现场考察"],
    tagsEn: ["The Salt of Life", "Salt Road", "Field Investigation"],
    location: { city: "自贡", cityEn: "Zigong", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-YD/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-FORUM-01",
    title: "开幕论坛回顾丨“生命之盐 1.0”自贡盐文化考察创作驻留计划",
    titleEn: "Opening Forum Review | The Salt of Life 1.0: Zigong Salt Culture Research & Creation Residency",
    artist: "对角线计划 / 论坛嘉宾",
    artistEn: "Diagonal / Forum Guests",
    year: "2026.03.19 21:52",
    type: "Document",
    typeEn: "Document",
    tags: ["论坛", "自贡", "工业遗产", "当代艺术"],
    tagsEn: ["Forum", "Zigong", "Industrial Heritage", "Contemporary Art"],
    location: { city: "自贡", cityEn: "Zigong", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-FORUM-01/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-LIST1",
    title: "日程名单公布：“生命之盐 1.0”自贡驻留计划",
    titleEn: "Schedule & List Announcement: The Salt of Life 1.0 — Zigong Residency",
    artist: "对角线计划",
    artistEn: "Diagonal",
    year: "2026.02.23 16:53",
    type: "Document",
    typeEn: "Document",
    tags: ["名单公布", "日程", "驻留", "自贡"],
    tagsEn: ["List Announcement", "Schedule", "Residency", "Zigong"],
    location: { city: "自贡", cityEn: "Zigong", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-LIST1/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-OC1",
    title: "Open Call 招募丨“生命之盐 1.0”自贡盐文化考察创作驻留计划",
    titleEn: "Open Call | The Salt of Life 1.0: Zigong Salt Culture Research & Creation Residency",
    artist: "对角线计划 (Diagonal)",
    artistEn: "Diagonal",
    year: "2026.02.16 08:45",
    type: "Document",
    typeEn: "Document",
    tags: ["生命之盐", "招募", "自贡", "驻留计划"],
    tagsEn: ["The Salt of Life", "Open Call", "Zigong", "Residency"],
    location: { city: "自贡", cityEn: "Zigong", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-OC1/cover.jpg",
  },
];

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
