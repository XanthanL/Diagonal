"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { ArchiveContent } from "@/components/ArchiveContent";
import { ArchiveTableOfContents } from "@/components/ArchiveTableOfContents";

interface ArchiveDetailClientProps {
  id: string;
  zhContent: string;
  enContent?: string;
  enTitle?: string;
  isHtml: boolean;
}

export function ArchiveDetailClient({ id, zhContent, enContent, enTitle, isHtml }: ArchiveDetailClientProps) {
  const { lang } = useI18n();
  // 公众号归档只搬运了中文原文；EN 下如实标注语言状态，别让界面假装已经翻译过。
  const originalOnly = lang === "en" && !enContent;

  return (
    <article className="archive-detail min-h-screen site-surface-white pt-28 sm:pt-32 pb-32 sm:pb-40">
      {/* 详情页顶栏：纸面底 + 细线，滚动时正文不会从字缝里透上来。
          390px 下隐藏档案号，否则返回、编号、两个开关会挤成三行互相压字。 */}
      <nav className="archive-doc-nav fixed top-0 left-0 w-full z-50 px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
          <Link href="/#archive" className="archive-text text-[11px] sm:text-sm font-bold flex items-center gap-2 group shrink-0">
            <span className="group-hover:-translate-x-2 transition-transform">←</span> {t(lang, "backToDocuments")}
          </Link>
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <div className="archive-text text-[10px] opacity-60 uppercase tracking-widest hidden md:block truncate">
              {id} // {t(lang, "htmlRecord")}
            </div>
            <ThemeSwitch />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* 12 列布局：8 列正文 + 4 列 sticky 章节目录 */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <main className="lg:col-span-8 lg:col-start-1 xl:col-span-8 xl:col-start-1 max-w-3xl">
          {originalOnly && (
            <div className="archive-lang-note">
              <div className="archive-lang-note__label">ENGLISH TITLE / {id}</div>
              <p className="archive-lang-note__title">{enTitle || id}</p>
              <div className="archive-lang-note__note">
                ORIGINAL TEXT IN CHINESE · NO ENGLISH TRANSLATION AVAILABLE
              </div>
            </div>
          )}
          {isHtml ? (
            <ArchiveContent zhContent={zhContent} enContent={enContent} />
          ) : (
            <pre className="whitespace-pre-wrap font-sans opacity-80">{zhContent}</pre>
          )}
        </main>
        <aside className="lg:col-span-4 lg:col-start-9 xl:col-span-4 xl:col-start-9">
          <ArchiveTableOfContents />
        </aside>
      </div>

      {/* 底部验证标注 */}
      <div className="archive-doc-footer mt-24 sm:mt-32 max-w-3xl mx-auto px-5 sm:px-6 pt-10 flex justify-between items-end gap-4">
        <div className="archive-text text-[10px] opacity-45 tracking-[0.2em] uppercase">
          {t(lang, "endOfRecord")} / {id}
        </div>
        <div className="archive-text text-[9px] opacity-35 text-right">
          {t(lang, "archiveSystemVersion")}
        </div>
      </div>
    </article>
  );
}
