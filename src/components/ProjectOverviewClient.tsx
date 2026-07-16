"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArchiveItem } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { getLocalizedUrl } from "@/lib/path";
import { ArchiveCard } from "@/components/ArchiveCard";
import {
  PROJECT_SLUGS,
  PROJECT_TITLES,
  PROJECT_STATEMENTS,
  SERIES_LABELS,
  type ProjectSlug,
  type SeriesGroup,
} from "@/lib/projects";

interface ProjectOverviewClientProps {
  project: ProjectSlug;
  groups: SeriesGroup[];
}

export function ProjectOverviewClient({ project, groups }: ProjectOverviewClientProps) {
  const { lang } = useI18n();
  const titles = PROJECT_TITLES[project];
  const statement = PROJECT_STATEMENTS[project];
  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

  const otherProjects = PROJECT_SLUGS.filter((slug) => slug !== project);

  return (
    <div className="relative overflow-hidden pt-32 min-h-screen bg-white text-black">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="diagonal-line opacity-5" />
      </div>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <header className="mb-24 space-y-6">
          <Link
            href={getLocalizedUrl("/archive")}
            className="archive-text text-[10px] opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2 group w-fit"
          >
            <span className="group-hover:-translate-x-2 transition-transform">←</span>
            {lang === "zh" ? "返回档案" : "BACK_TO_ARCHIVE"}
          </Link>

          <div className="archive-text text-xs text-diagonal-red font-bold tracking-[0.3em] border-l-2 border-diagonal-red pl-4">
            {lang === "zh" ? "项目总览" : "PROJECT_OVERVIEW"} // {totalItems}{" "}
            {lang === "zh" ? "条记录" : "RECORDS"}
          </div>

          <h1 className="font-serif font-black tracking-tighter leading-none">
            <span className="block text-6xl md:text-8xl">{titles.zh}</span>
            <span className="block text-2xl md:text-4xl opacity-40 italic font-medium mt-4">
              {titles.en}
            </span>
          </h1>

          <p className="max-w-2xl text-lg opacity-70 leading-relaxed">
            {lang === "zh" ? statement.zh : statement.en}
          </p>
        </header>

        {groups.length > 0 ? (
          <div className="space-y-32">
            {groups.map((group) => (
              <div key={group.series} className="space-y-12">
                <div className="border-t border-black/10 pt-8 flex items-baseline justify-between">
                  <h2 className="archive-text text-sm font-bold tracking-[0.2em] opacity-70">
                    {SERIES_LABELS[group.series]?.[lang] || group.series}
                  </h2>
                  <span className="archive-text text-[10px] opacity-40 tracking-widest">
                    {group.items.length} {lang === "zh" ? "条" : "ITEMS"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
                  {group.items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(index * 0.05, 0.3) }}
                      className={index % 2 !== 0 ? "lg:mt-24" : ""}
                    >
                      <ArchiveCard item={item} />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center">
            <div className="archive-text text-sm opacity-40">
              {lang === "zh" ? "暂无档案记录" : "NO RECORDS YET"}
            </div>
          </div>
        )}

        <nav className="mt-40 pt-12 border-t border-black/10">
          <div className="archive-text text-[10px] opacity-40 uppercase tracking-widest mb-6">
            {lang === "zh" ? "其他项目" : "OTHER_PROJECTS"}
          </div>
          <div className="flex flex-wrap gap-3">
            {otherProjects.map((slug) => (
              <Link
                key={slug}
                href={getLocalizedUrl(`/projects/${slug}`)}
                className="archive-text text-xs px-4 py-2 border border-black/20 hover:border-black hover:bg-black hover:text-white transition-all"
              >
                {PROJECT_TITLES[slug].zh} / {PROJECT_TITLES[slug].en}
              </Link>
            ))}
          </div>
        </nav>
      </section>
    </div>
  );
}
