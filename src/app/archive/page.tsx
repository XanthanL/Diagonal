"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { archiveData, ArchiveItem } from "@/lib/data";
import {
  archiveYear,
  compareByPublishAsc,
  compareByPublishDesc,
} from "@/lib/archiveOrder";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { ArchiveCard } from "@/components/ArchiveCard";

// 与 CSS 的 --ease-out 同一条曲线
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const types = ["Performance", "Video", "Document", "Installation"];
const regions = ["Southwest", "Northeast", "Transition"] as const;
const projects = ["the-salt-of-life", "diagonal-talks", "research-notes", "other"] as const;

const projectLabels: Record<string, { zh: string; en: string }> = {
  "the-salt-of-life": { zh: "生命之盐", en: "The Salt of Life" },
  "diagonal-talks": { zh: "对角线漫谈", en: "Diagonal Talks" },
  "research-notes": { zh: "研究笔记", en: "Research Notes" },
  "other": { zh: "其他", en: "Other" },
};

type SortOrder = "newest" | "oldest";
type Row =
  | { kind: "year"; year: string; count: number }
  | { kind: "item"; item: ArchiveItem; index: number };

// .press 提供按压回缩 + 颜色过渡（取代 transition-all）
const filterChipClass = (active: boolean) =>
  `press archive-text text-[10px] px-3 py-1 border ${
    active
      ? "border-black bg-black text-white"
      : "border-black/20 hover:border-black"
  }`;

export default function ArchiveIndexPage() {
  const { lang } = useI18n();
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // 默认「最近发布在前」；筛选/搜索后同样保持时间顺序
  const [order, setOrder] = useState<SortOrder>("newest");

  const filtered = useMemo(() => {
    return archiveData.filter((item) => {
      if (activeType && item.type !== activeType) return false;
      if (activeRegion && item.region !== activeRegion) return false;
      if (activeProject && item.project !== activeProject) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.titleEn.toLowerCase().includes(q) ||
          item.artist.toLowerCase().includes(q) ||
          item.artistEn.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          item.tagsEn.some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activeType, activeRegion, activeProject, search]);

  const ordered = useMemo(
    () => [...filtered].sort(order === "newest" ? compareByPublishDesc : compareByPublishAsc),
    [filtered, order]
  );

  // 年份分隔行把「严格按发布时间排序」变成页面上可直接核对的事实；
  // counts 只统计当前筛选结果，切换筛选后年份条数会跟着变。
  const rows = useMemo<Row[]>(() => {
    const counts = new Map<string, number>();
    for (const item of ordered) {
      const y = archiveYear(item);
      counts.set(y, (counts.get(y) || 0) + 1);
    }
    const out: Row[] = [];
    let last = "";
    let index = 0;
    for (const item of ordered) {
      const y = archiveYear(item);
      if (y !== last) {
        out.push({ kind: "year", year: y, count: counts.get(y) || 0 });
        last = y;
      }
      out.push({ kind: "item", item, index: index++ });
    }
    return out;
  }, [ordered]);

  const countByType = (type: string) =>
    archiveData.filter((item) => item.type === type).length;
  const countByRegion = (region: string) =>
    archiveData.filter((item) => item.region === region).length;
  const countByProject = (project: string) =>
    archiveData.filter((item) => item.project === project).length;

  return (
    <div className="relative overflow-hidden pt-32 min-h-screen site-surface-white archive-index">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="diagonal-line opacity-5" />
      </div>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <header className="mb-24 space-y-6">
          <motion.div
            initial={{ opacity: 0, transform: "translateY(12px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="archive-text text-xs text-diagonal-red font-bold tracking-[0.3em] border-l-2 border-diagonal-red pl-4"
          >
            {t(lang, "totalArchiveAccess")}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, transform: "translateX(-20px)" }}
            animate={{ opacity: 1, transform: "translateX(0px)" }}
            transition={{ delay: 0.08, duration: 0.55, ease: EASE_OUT }}
            className="font-serif text-7xl md:text-9xl font-black tracking-tighter leading-none"
            dangerouslySetInnerHTML={{ __html: t(lang, "archiveTitle") }}
          />
          <p className="max-w-xl text-lg opacity-60 leading-relaxed italic">
            {t(lang, "archiveIntro")}
          </p>
        </header>

        {/* 筛选栏 */}
        <div className="mb-16 space-y-6">
          {/* 关键词搜索 */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "zh" ? "搜索关键词…" : "Search…"}
            aria-label={lang === "zh" ? "搜索档案" : "Search archives"}
            className="w-full max-w-md px-4 py-3 border border-black/20 focus:border-black outline-none archive-text text-sm bg-transparent transition-colors duration-200 ease-out-strong"
          />

          {/* 类型筛选 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="archive-text text-[10px] opacity-65 mr-2">
              {lang === "zh" ? "类型" : "TYPE"}:
            </span>
            <button
              onClick={() => setActiveType(null)}
              aria-pressed={activeType === null}
              className={filterChipClass(activeType === null)}
            >
              {lang === "zh" ? "全部" : "ALL"} ({archiveData.length})
            </button>
            {types.map((type) => {
              const count = countByType(type);
              if (count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => setActiveType(activeType === type ? null : type)}
                  aria-pressed={activeType === type}
                  className={filterChipClass(activeType === type)}
                >
                  {type} ({count})
                </button>
              );
            })}
          </div>

          {/* 地区筛选 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="archive-text text-[10px] opacity-65 mr-2">
              {lang === "zh" ? "地区" : "REGION"}:
            </span>
            <button
              onClick={() => setActiveRegion(null)}
              aria-pressed={activeRegion === null}
              className={filterChipClass(activeRegion === null)}
            >
              {lang === "zh" ? "全部" : "ALL"} ({archiveData.length})
            </button>
            {regions.map((region) => {
              const count = countByRegion(region);
              if (count === 0) return null;
              const label =
                region === "Southwest"
                  ? lang === "zh" ? "西南" : "Southwest"
                  : region === "Northeast"
                  ? lang === "zh" ? "东北" : "Northeast"
                  : lang === "zh" ? "过渡地带" : "Transition";
              return (
                <button
                  key={region}
                  onClick={() => setActiveRegion(activeRegion === region ? null : region)}
                  aria-pressed={activeRegion === region}
                  className={filterChipClass(activeRegion === region)}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {/* 项目筛选 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="archive-text text-[10px] opacity-65 mr-2">
              {lang === "zh" ? "项目" : "PROJECT"}:
            </span>
            <button
              onClick={() => setActiveProject(null)}
              aria-pressed={activeProject === null}
              className={filterChipClass(activeProject === null)}
            >
              {lang === "zh" ? "全部" : "ALL"} ({archiveData.length})
            </button>
            {projects.map((project) => {
              const count = countByProject(project);
              if (count === 0) return null;
              const labels = projectLabels[project];
              return (
                <button
                  key={project}
                  onClick={() => setActiveProject(activeProject === project ? null : project)}
                  aria-pressed={activeProject === project}
                  className={filterChipClass(activeProject === project)}
                >
                  {lang === "zh" ? labels.zh : labels.en} ({count})
                </button>
              );
            })}
          </div>

          {/* 排序 + 结果计数 */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="archive-text text-[10px] opacity-65">
              {lang === "zh" ? "共" : "TOTAL"} {ordered.length}{" "}
              {lang === "zh" ? "条结果" : "RESULTS"}
              <span className="mx-3 opacity-40">/</span>
              {lang === "zh" ? "按发布时间" : "BY PUBLISH DATE"}
            </div>
            <div className="flex items-center gap-2">
              <span className="archive-text text-[10px] opacity-50 mr-1">
                {lang === "zh" ? "排序" : "ORDER"}:
              </span>
              <button
                onClick={() => setOrder("newest")}
                aria-pressed={order === "newest"}
                className={filterChipClass(order === "newest")}
              >
                {lang === "zh" ? "最近发布 ↓" : "NEWEST ↓"}
              </button>
              <button
                onClick={() => setOrder("oldest")}
                aria-pressed={order === "oldest"}
                className={filterChipClass(order === "oldest")}
              >
                {lang === "zh" ? "最早发布 ↑" : "OLDEST ↑"}
              </button>
            </div>
          </div>
        </div>

        {/* 档案列表 */}
        {rows.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
            {rows.map((row) =>
              row.kind === "year" ? (
                <div
                  key={`year-${row.year}`}
                  className="col-span-full -my-8 flex items-center gap-6"
                  aria-label={lang === "zh" ? `${row.year} 年` : `Year ${row.year}`}
                >
                  <span className="archive-text text-sm font-bold tracking-[0.3em] text-diagonal-red">
                    {row.year}
                  </span>
                  <span className="h-px flex-1 bg-current opacity-10" />
                  <span className="archive-text text-[10px] opacity-45 tracking-[0.2em]">
                    {row.count} {lang === "zh" ? "条" : "ITEMS"}
                  </span>
                </div>
              ) : (
                <motion.div
                  key={row.item.id}
                  initial={{ opacity: 0, transform: "translateY(12px)" }}
                  animate={{ opacity: 1, transform: "translateY(0px)" }}
                  transition={{
                    duration: 0.45,
                    ease: EASE_OUT,
                    delay: Math.min(row.index * 0.05, 0.3),
                  }}
                >
                  <ArchiveCard item={row.item} />
                </motion.div>
              )
            )}
          </div>
        ) : (
          /* 空状态属于「少见」层级，是允许放一点动效预算的地方 */
          <motion.div
            initial={{ opacity: 0, transform: "translateY(8px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="py-40 text-center"
          >
            <div className="archive-text text-sm opacity-65">
              {lang === "zh" ? "无匹配结果" : "NO MATCHING RESULTS"}
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}
