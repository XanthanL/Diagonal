export interface ArchiveItem {
  id: string;
  title: string;
  artist: string;
  year: string;
  type: "Performance" | "Video" | "Document" | "Installation";
  thumbnail?: string;
  tags: string[];
}

export interface LabItem {
  id: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  category: "Interview" | "Essay" | "Report";
}

export const archiveData: ArchiveItem[] = [
  {
    id: "DIAGONAL-2024-HG01",
    title: "Roamers：鹤岗煤之痕·荒野Ⅰ",
    artist: "对角线计划 / 多个艺术家",
    year: "2024",
    type: "Performance",
    tags: ["行为艺术", "在地创作", "鹤岗", "现场回顾"],
  },
  {
    id: "DIAGONAL-2024-BW01",
    title: "黑白之痕：彭玮雯的工业家庭叙事（一）",
    artist: "彭玮雯 (Peng Weiwen)",
    year: "2024",
    type: "Performance",
    tags: ["工业叙事", "家庭史", "行为创作"],
  },
  {
    id: "DIAGONAL-2024-BW02",
    title: "黑白之痕：彭玮雯的工业家庭叙事（二）",
    artist: "彭玮雯 (Peng Weiwen)",
    year: "2024",
    type: "Performance",
    tags: ["行为艺术", "档案活化"],
  },
  {
    id: "DIAGONAL-2024-AMR",
    title: "阿木热艺术节：鄂尔多斯圆桌分享",
    artist: "对角线计划 / 阿木热艺术节",
    year: "2024",
    type: "Document",
    tags: ["艺术节", "圆桌对谈", "西北考察"],
  },
  {
    id: "DIAGONAL-2024-CH",
    title: "草海“拾物”艺术驻地计划回顾",
    artist: "互联合作项目",
    year: "2023",
    type: "Installation",
    tags: ["驻地计划", "贵州草海", "拾物"],
  },
  {
    id: "DIAGONAL-2024-ZG",
    title: "生命之盐 1.0：自贡盐文化考察",
    artist: "驻留计划成员",
    year: "2023",
    type: "Document",
    tags: ["盐文化", "社会参与", "自贡"],
  },
  {
    id: "DIAGONAL-2024-XYR",
    title: "小盐人直播卖盐：行为艺术现场",
    artist: "线存项目组",
    year: "2023",
    type: "Performance",
    tags: ["直播艺术", "行为现场", "带货实验"],
  },
];

export const labData: LabItem[] = [
  {
    id: "LAB-001",
    title: "对角线作为一种方法论：从文献到现场的跳跃",
    author: "陈进 (Chen Jin)",
    date: "2024.01.15",
    excerpt: "本文探讨了在行为艺术档案化过程中，如何通过非线性的“对角线”路径，将静止的文献重新激活为具有当下性的现场行动...",
    category: "Essay",
  },
  {
    id: "LAB-002",
    title: "Chat into a Book: 与郭孟浩关于‘蛙王’身份的对谈",
    author: "UP-ON Research Group",
    date: "2023.11.20",
    excerpt: "在这场跨越三小时的深度对话中，我们试图解构‘蛙王’这一艺术符号背后的社会隐喻及其在当代档案系统中的定位...",
    category: "Interview",
  },
  {
    id: "LAB-003",
    title: "行为艺术档案的数字化生存：技术与真实性的博弈",
    author: "李勇 (Li Yong)",
    date: "2023.09.05",
    excerpt: "随着数字孪生技术的普及，行为艺术的‘临场感’正面临前所未有的挑战。本报告分析了多媒体数据库在保留艺术张力方面的潜力...",
    category: "Report",
  },
];
