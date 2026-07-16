import { ArchiveItem } from "@/lib/data";

export type ProjectSlug = "the-salt-of-life" | "diagonal-talks" | "research-notes" | "other";

export const PROJECT_SLUGS: ProjectSlug[] = [
  "the-salt-of-life",
  "diagonal-talks",
  "research-notes",
  "other",
];

export const PROJECT_TITLES: Record<ProjectSlug, { zh: string; en: string }> = {
  "the-salt-of-life": { zh: "生命之盐", en: "The Salt of Life" },
  "diagonal-talks": { zh: "对角线漫谈", en: "Diagonal Talks" },
  "research-notes": { zh: "研究笔记", en: "Research Notes" },
  "other": { zh: "其他", en: "Other" },
};

export const PROJECT_STATEMENTS: Record<ProjectSlug, { zh: string; en: string }> = {
  "the-salt-of-life": {
    zh: "以自贡盐文化为核心，通过驻留、展览、分享会等形式展开的跨学科当代艺术项目。",
    en: "An interdisciplinary contemporary art project centered on Zigong salt culture, unfolding through residencies, exhibitions, and sharing sessions.",
  },
  "diagonal-talks": {
    zh: "对角线计划的讲座、沙龙与公共教育活动，在各地展开跨学科对话。",
    en: "Lectures, salons, and public education programs by the Diagonal Project, fostering interdisciplinary dialogue across locations.",
  },
  "research-notes": {
    zh: "田野调查、文献研究与理论梳理的档案记录。",
    en: "Archival records of fieldwork, literature research, and theoretical inquiry.",
  },
  "other": {
    zh: "其他独立项目与活动。",
    en: "Other independent projects and events.",
  },
};

export const SERIES_LABELS: Record<string, { zh: string; en: string }> = {
  "open-call": { zh: "公开招募", en: "Open Call" },
  "residency-1.0": { zh: "驻留 1.0", en: "Residency 1.0" },
  "residency-2.0": { zh: "驻留 2.0", en: "Residency 2.0" },
  "exhibition": { zh: "展览", en: "Exhibition" },
  "sharing-session": { zh: "分享会", en: "Sharing Session" },
  "salon": { zh: "沙龙", en: "Salon" },
};

export const SERIES_ORDER: string[] = [
  "open-call",
  "residency-1.0",
  "residency-2.0",
  "exhibition",
  "sharing-session",
  "salon",
];

export interface SeriesGroup {
  series: string;
  items: ArchiveItem[];
}

export function groupBySeries(items: ArchiveItem[]): SeriesGroup[] {
  const groups: Record<string, ArchiveItem[]> = {};
  for (const item of items) {
    const key = item.series || "other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return SERIES_ORDER
    .filter((s) => groups[s])
    .map((s) => ({ series: s, items: groups[s] }))
    .concat(
      Object.keys(groups)
        .filter((k) => !SERIES_ORDER.includes(k))
        .map((k) => ({ series: k, items: groups[k] }))
    );
}
