export interface Location {
  city: string;
  code: string;
  coordinates: string;
}

export interface ArchiveItem {
  id: string;
  title: string;
  artist: string;
  year: string;
  type: "Performance" | "Video" | "Document" | "Installation";
  thumbnail?: string;
  tags: string[];
  location: Location;
  region: "Southwest" | "Northeast" | "Transition";
}

export interface AtlasItem {
  id: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  category: "Visual Record" | "Field Report" | "Atlas";
  cover?: string;
  location: Location;
  region: "Southwest" | "Northeast" | "Transition";
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

export const archiveData: ArchiveItem[] = [
  {
    id: "DIAGONAL-2026-LIST2",
    title: "名单公布丨“生命之盐 2.0”自贡盐文化考察创作驻留计划",
    artist: "对角线计划",
    year: "2026.06.07 19:07",
    type: "Document",
    tags: ["名单公布", "驻留", "自贡"],
    location: { city: "自贡", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-LIST2/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-SH",
    title: "回顾：对角线计划参加上海社区枢纽站讲座",
    artist: "对角线计划",
    year: "2026.06.03 19:38",
    type: "Document",
    tags: ["讲座", "艺术社区", "学科创新", "回顾"],
    location: { city: "上海", code: "SH", coordinates: "31.2N, 121.5E" },
    region: "Transition",
    thumbnail: "/images/archive/DIAGONAL-2026-SH/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-A4",
    title: "盐记忆之场：A4国际驻留艺术中心成都艺术周分享会",
    artist: "对角线计划",
    year: "2026.04.08 13:07",
    type: "Document",
    tags: ["分享会", "成都", "A4驻留", "在地实践"],
    location: { city: "成都", code: "CD", coordinates: "30.6N, 104.1E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-A4/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-ZG01",
    title: "展览回顾：生命之盐 1.0 自贡盐文化考察创作驻留成果展",
    artist: "对角线计划 / 驻留创作者",
    year: "2026.04.02 07:16",
    type: "Document",
    tags: ["展览回顾", "自贡", "工业遗产", "驻留成果"],
    location: { city: "自贡", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-ZG01/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-ZG02",
    title: "共居与共情：生命之盐 1.0 驻留成果展览现场交互行动招募",
    artist: "对角线计划",
    year: "2026.03.31 23:53",
    type: "Installation",
    tags: ["驻留", "交互行动", "展览"],
    location: { city: "自贡", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-ZG02/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-YD",
    title: "重走盐道 2026：在贡井老街用盐重新走一遍历史",
    artist: "生命之盐 1.0 参与创作者",
    year: "2026.03.26 20:42",
    type: "Performance",
    tags: ["生命之盐", "重走盐道", "现场考察"],
    location: { city: "自贡", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-YD/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-FORUM-01",
    title: "开幕论坛回顾丨“生命之盐 1.0”自贡盐文化考察创作驻留计划",
    artist: "对角线计划 / 论坛嘉宾",
    year: "2026.03.19 21:52",
    type: "Document",
    tags: ["论坛", "自贡", "工业遗产", "当代艺术"],
    location: { city: "自贡", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-FORUM-01/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-LIST1",
    title: "日程名单公布：“生命之盐 1.0”自贡驻留计划",
    artist: "对角线计划",
    year: "2026.02.23 16:53",
    type: "Document",
    tags: ["名单公布", "日程", "驻留", "自贡"],
    location: { city: "自贡", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-LIST1/cover.jpg",
  },
  {
    id: "DIAGONAL-2026-OC1",
    title: "Open Call 招募丨“生命之盐 1.0”自贡盐文化考察创作驻留计划",
    artist: "对角线计划 (Diagonal)",
    year: "2026.02.16 08:45",
    type: "Document",
    tags: ["生命之盐", "招募", "自贡", "驻留计划"],
    location: { city: "自贡", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    thumbnail: "/images/archive/DIAGONAL-2026-OC1/cover.jpg",
  },
];

export const atlasData: AtlasItem[] = [
  {
    id: "ATLAS-ZG-2.0",
    title: "生命之盐 2.0",
    author: "对角线计划 (Diagonal)",
    date: "2026.04 - 06",
    excerpt: "对角线计划·自贡火井沱驻留与共创项目是一个以工业遗产、物质记忆与社会参与式艺术为核心的长期跨学科实践...",
    category: "Atlas",
    location: { city: "自贡", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    cover: "/images/archive/DIAGONAL-2026-LIST2/cover.jpg",
    subCollections: [
      {
        id: "P1",
        title: "防空洞与废弃盐厂考察",
        cover: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255858/防空洞与废弃盐厂_1_t8a7d7.jpg",
        gallery: [
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255862/防空洞与废弃盐厂_9_cxd1ou.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255880/防空洞与废弃盐厂_8_d432oe.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255860/防空洞与废弃盐厂_7_f9vbql.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255858/防空洞与废弃盐厂_69_kmztwb.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255859/防空洞与废弃盐厂_68_hkw0gp.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255859/防空洞与废弃盐厂_67_yuhffg.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255865/防空洞与废弃盐厂_66_umarnn.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255846/防空洞与废弃盐厂_65_zlvss5.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255847/防空洞与废弃盐厂_64_nifrkj.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255856/防空洞与废弃盐厂_63_hgpgx5.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255859/防空洞与废弃盐厂_62_pfw4n1.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255856/防空洞与废弃盐厂_60_kus4ww.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255875/防空洞与废弃盐厂_6_wi43rr.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255855/防空洞与废弃盐厂_59_krazx1.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255856/防空洞与废弃盐厂_58_bj60xf.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255852/防空洞与废弃盐厂_57_vud7e2.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255851/防空洞与废弃盐厂_56_omcb10.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255849/防空洞与废弃盐厂_55_qhyxrq.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255849/防空洞与废弃盐厂_54_fpiwrq.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255854/防空洞与废弃盐厂_53_fzw950.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255849/防空洞与废弃盐厂_52_vpvdxk.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255847/防空洞与废弃盐厂_51_gfgjdl.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255848/防空洞与废弃盐厂_50_potw2e.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255846/防空洞与废弃盐厂_5_nenw0u.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255852/防空洞与废弃盐厂_49_jjbsqk.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255851/防空洞与废弃盐厂_48_sbhkhq.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255870/防空洞与废弃盐厂_47_hvjab4.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255854/防空洞与废弃盐厂_46_rlh4tb.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255855/防空洞与废弃盐厂_45_bjprvt.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255848/防空洞与废弃盐厂_44_qgnk5q.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255852/防空洞与废弃盐厂_43_nhs6r8.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255856/防空洞与废弃盐厂_42_k1jpfz.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255868/防空洞与废弃盐厂_41_axkmoh.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255867/防空洞与废弃盐厂_40_kehd7n.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255867/防空洞与废弃盐厂_39_iloxlk.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255891/防空洞与废弃盐厂_38_jewxuq.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255845/防空洞与废弃盐厂_37_g3fyl9.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255845/防空洞与废弃盐厂_36_unowae.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255866/防空洞与废弃盐厂_35_x04y3z.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255869/防空洞与废弃盐厂_34_wzpdn0.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255865/防空洞与废弃盐厂_33_qqppyq.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255868/防空洞与废弃盐厂_32_rgdhwm.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255853/防空洞与废弃盐厂_31_n64bce.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255863/防空洞与废弃盐厂_30_ihuqik.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255865/防空洞与废弃盐厂_3_pxetbg.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255869/防空洞与废弃盐厂_29_mj11ba.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255862/防空洞与废弃盐厂_28_s2sjwa.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255862/防空洞与废弃盐厂_27_w5k4lo.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255850/防空洞与废弃盐厂_26_lusvax.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255846/防空洞与废弃盐厂_25_mc5cmb.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255853/防空洞与废弃盐厂_24_olpx78.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255848/防空洞与废弃盐厂_23_c8tl05.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255845/防空洞与废弃盐厂_22_ewwhjh.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255847/防空洞与废弃盐厂_21_tr4ryn.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255849/防空洞与废弃盐厂_2_x9s5vv.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255864/防空洞与废弃盐厂_19_eejcab.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255846/防空洞与废弃盐厂_18_ndxfnp.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255851/防空洞与废弃盐厂_17_bn5kaa.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255844/防空洞与废弃盐厂_16_moh47d.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255844/防空洞与废弃盐厂_15_xywxo4.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255843/防空洞与废弃盐厂_14_cxznl0.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255843/防空洞与废弃盐厂_13_qperzv.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255843/防空洞与废弃盐厂_12_zpttrg.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255843/防空洞与废弃盐厂_11_qlesiv.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255869/防空洞与废弃盐厂_10_lw7lau.jpg", caption: "" },
          { url: "https://res.cloudinary.com/de0wfewt8/image/upload/v1781255858/防空洞与废弃盐厂_1_t8a7d7.jpg", caption: "" }
        ]
      }
    ]
  },
  {
    id: "ATLAS-ZG-1.0",
    title: "生命之盐 1.0",
    author: "对角线计划 (Diagonal)",
    date: "2026.02",
    excerpt: "作为项目的启动阶段，1.0 聚焦于火井沱社区的口述史采集与工业遗存初步调研。12位创作者在20天的时间里，通过考察与调研在自贡留下了深刻印记。",
    category: "Atlas",
    location: { city: "自贡", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    cover: "",
  },
  {
    id: "ATLAS-HG-WIND",
    title: "鹤岗",
    author: "Roamers 项目组",
    date: "2024.12",
    excerpt: "在零下三十度的极端气候中，我们试图捕捉那些正在消逝的工业纹理与人的面孔...",
    category: "Visual Record",
    location: { city: "鹤岗", code: "HG", coordinates: "47.3N, 130.3E" },
    region: "Northeast",
    cover: "",
  }
];
