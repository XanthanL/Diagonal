// 仓库内容路径与下拉选项常量（内容后台）

export const ARCHIVE_CONTENT_DIR = "src/content/archive";
export const STORE_PATH = "src/content/archive/_store/index.json";
export const IMAGE_DIR_BASE = "public/images/archive";

// 目标仓库坐标（浏览器直连 GitHub API 提交；token 由使用者在登录门粘贴，存 localStorage）
export const GH_OWNER = "XanthanL";
export const GH_REPO = "Diagonal";
export const GH_BRANCH = "main";

// localStorage 中保存 PAT 的键名
export const TOKEN_STORAGE_KEY = "diagonal_admin_pat";

export const TYPE_OPTIONS: { value: string; zh: string; en: string }[] = [
  { value: "Document", zh: "文献 Document", en: "Document" },
  { value: "Performance", zh: "行为 Performance", en: "Performance" },
  { value: "Video", zh: "影像 Video", en: "Video" },
  { value: "Installation", zh: "装置 Installation", en: "Installation" },
];

export const REGION_OPTIONS: { value: string; zh: string; en: string }[] = [
  { value: "Southwest", zh: "西南 Southwest", en: "Southwest" },
  { value: "Northeast", zh: "东北 Northeast", en: "Northeast" },
  { value: "Transition", zh: "过渡地带 Transition", en: "Transition" },
];

export const PROJECT_OPTIONS: { value: string; zh: string; en: string }[] = [
  { value: "the-salt-of-life", zh: "生命之盐", en: "The Salt of Life" },
  { value: "diagonal-talks", zh: "对角线漫谈", en: "Diagonal Talks" },
  { value: "research-notes", zh: "研究笔记", en: "Research Notes" },
  { value: "other", zh: "其他", en: "Other" },
];

export const SERIES_OPTIONS: { value: string; zh: string }[] = [
  { value: "", zh: "（无 / 不分系列）" },
  { value: "open-call", zh: "公开招募 Open Call" },
  { value: "residency-1.0", zh: "驻留 1.0" },
  { value: "residency-2.0", zh: "驻留 2.0" },
  { value: "exhibition", zh: "展览 Exhibition" },
  { value: "sharing-session", zh: "分享会 Sharing Session" },
  { value: "salon", zh: "沙龙 Salon" },
];

// 常用地点预设，便于快速选择（也可手动填）
export const LOCATION_PRESETS: {
  city: string;
  cityEn: string;
  code: string;
  coordinates: string;
}[] = [
  { city: "自贡", cityEn: "Zigong", code: "ZG", coordinates: "29.3N, 104.7E" },
  { city: "成都", cityEn: "Chengdu", code: "CD", coordinates: "30.6N, 104.1E" },
  { city: "上海", cityEn: "Shanghai", code: "SH", coordinates: "31.2N, 121.5E" },
  { city: "鹤岗", cityEn: "Hegang", code: "HG", coordinates: "47.3N, 130.3E" },
];
