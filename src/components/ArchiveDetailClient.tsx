"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ArchiveContent } from "@/components/ArchiveContent";
import { ArchiveTableOfContents } from "@/components/ArchiveTableOfContents";

interface ArchiveDetailClientProps {
  id: string;
  zhContent: string;
  enContent?: string;
  isHtml: boolean;
}

export function ArchiveDetailClient({ id, zhContent, enContent, isHtml }: ArchiveDetailClientProps) {
  const { lang } = useI18n();

  return (
    <article className="min-h-screen bg-white text-black pt-32 pb-40 selection:bg-black selection:text-white">
      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 w-full z-50 p-6 mix-blend-difference text-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/#archive" className="archive-text text-sm font-bold flex items-center gap-2 group text-white">
            <span className="group-hover:-translate-x-2 transition-transform">←</span> {t(lang, "backToDocuments")}
          </Link>
          <div className="flex items-center gap-6">
            <div className="archive-text text-[10px] opacity-50 uppercase tracking-widest text-white">{id} // {t(lang, "htmlRecord")}</div>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* 12 列布局：8 列正文 + 4 列 sticky 章节目录 */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <main className="lg:col-span-8 lg:col-start-1 xl:col-span-8 xl:col-start-1 max-w-3xl">
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
      <div className="mt-60 max-w-3xl mx-auto px-6 border-t border-black/10 pt-12 flex justify-between items-end">
        <div className="archive-text text-[10px] opacity-30 tracking-[0.2em] uppercase">
          {t(lang, "endOfRecord")} / {id}
        </div>
        <div className="archive-text text-[8px] opacity-20">
          {t(lang, "archiveSystemVersion")}
        </div>
      </div>
    </article>
  );
}
