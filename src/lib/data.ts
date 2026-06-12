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
  gallery?: {
    url: string;
    caption: string;
    width?: number;
    height?: number;
  }[];
}

export const archiveData: ArchiveItem[] = [
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

// 对应 "THE ATLAS" (视觉图册)
export const atlasData: AtlasItem[] = [
  {
    id: "ATLAS-ZG-2.0",
    title: "生命之盐 2.0：自贡火井沱驻留与共创",
    author: "对角线计划 (Diagonal)",
    date: "2026.04 - 06",
    excerpt: "对角线计划·自贡火井沱驻留与共创项目是一个以工业遗产、物质记忆与社会参与式艺术为核心的长期跨学科实践。自贡因井盐生产而形成独特的城市景观与社区结构...",
    category: "Atlas",
    location: { city: "自贡", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    cover: "",
    gallery: [
      {
        url: "https://mmbiz.qpic.cn/sz_mmbiz_jpg/IiaUvUibIiaLp7p300P29Aicy99ibicmP6D0ibRiaicN1vYyic19YF9V5icic7W59Ym56Y9z9E5W/640?wx_fmt=jpeg",
        caption: "自贡井盐生产遗址现场考察",
        width: 1200,
        height: 800
      },
      {
        url: "https://mmbiz.qpic.cn/sz_mmbiz_jpg/IiaUvUibIiaLp7p300P29Aicy99ibicmP6D0ibRiaicN1vYyic19YF9V5icic7W59Ym56Y9z9E5W/640?wx_fmt=jpeg",
        caption: "社区工作坊与本地居民的对话",
        width: 800,
        height: 1200
      }
    ]
  },
  {
    id: "ATLAS-ZG-1.0",
    title: "生命之盐 1.0：火井沱的记忆重构",
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
    title: "鹤岗：寒带面孔与工业余温",
    author: "Roamers 项目组",
    date: "2024.12",
    excerpt: "在零下三十度的极端气候中，我们试图捕捉那些正在消逝的工业纹理与人的面孔...",
    category: "Visual Record",
    location: { city: "鹤岗", code: "HG", coordinates: "47.3N, 130.3E" },
    region: "Northeast",
    cover: "",
  }
];
