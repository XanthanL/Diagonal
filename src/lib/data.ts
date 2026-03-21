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
    id: "DIAGONAL-2024-001",
    title: "Plastic Bag Action",
    artist: "Frog King (Kwok Mang-ho)",
    year: "2024",
    type: "Performance",
    tags: ["Live", "Social Action", "Archive"],
  },
  {
    id: "DIAGONAL-2024-002",
    title: "Chat into a Book",
    artist: "UP-ON Collective",
    year: "2023",
    type: "Document",
    tags: ["Research", "Dialogue", "Publication"],
  },
  {
    id: "DIAGONAL-2023-015",
    title: "Diagonal Intersection",
    artist: "Anonymous",
    year: "2023",
    type: "Video",
    tags: ["Experiment", "Visual", "Non-linear"],
  },
  {
    id: "DIAGONAL-2022-089",
    title: "Night School Session #4",
    artist: "Various Artists",
    year: "2022",
    type: "Installation",
    tags: ["Education", "Interaction", "Site-specific"],
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
