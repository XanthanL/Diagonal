"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { archiveData } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { ArchiveCard } from "@/components/ArchiveCard";

const types = ["Performance", "Video", "Document", "Installation"];
const regions = ["Southwest", "Northeast", "Transition"] as const;
const projects = ["the-salt-of-life", "diagonal-talks", "research-notes", "other"] as const;

const projectLabels: Record<string, { zh: string; en: string }> = {
  "the-salt-of-life": { zh: "生命之盐", en: "The Salt of Life" },
  "diagonal-talks": { zh: "对角线漫谈", en: "Diagonal Talks" },
  "research-notes": { zh: "研究笔记", en: "Research Notes" },
  "other": { zh: "其他", en: "Other" },
};

const filterChipClass = (active: boolean) =>
  `archive-text text-[10px] px-3 py-1 border transition-all ${
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

  const countByType = (type: string) =>
    archiveData.filter((item) => item.type === type).length;
  const countByRegion = (region: string) =>
    archiveData.filter((item) => item.region === region).length;
  const countByProject = (project: string) =>
    archiveData.filter((item) => item.project === project).length;

  return (
    <div className="relative overflow-hidden pt-32 min-h-screen bg-white text-black">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="diagonal-line opacity-5" />
      </div>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <header className="mb-24 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="archive-text text-xs text-diagonal-red font-bold tracking-[0.3em] border-l-2 border-diagonal-red pl-4"
          >
            {t(lang, "totalArchiveAccess")}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
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
            className="w-full max-w-md px-4 py-3 border border-black/20 focus:border-black outline-none archive-text text-sm bg-transparent"
          />

          {/* 类型筛选 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="archive-text text-[10px] opacity-40 mr-2">
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
            <span className="archive-text text-[10px] opacity-40 mr-2">
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
            <span className="archive-text text-[10px] opacity-40 mr-2">
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

          {/* 结果计数 */}
          <div className="archive-text text-[10px] opacity-40">
            {lang === "zh" ? "共" : "TOTAL"} {filtered.length}{" "}
            {lang === "zh" ? "条结果" : "RESULTS"}
          </div>
        </div>

        {/* 档案列表 */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
            {filtered.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className={index % 2 !== 0 ? "lg:mt-24" : ""}
              >
                <ArchiveCard item={item} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center">
            <div className="archive-text text-sm opacity-40">
              {lang === "zh" ? "无匹配结果" : "NO MATCHING RESULTS"}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
