"use client";

import { useI18n } from "@/lib/i18n";

interface ArchiveContentProps {
  zhContent: string;
  enContent?: string;
}

export function ArchiveContent({ zhContent, enContent }: ArchiveContentProps) {
  const { lang } = useI18n();

  return (
    <div
      className="archive-html-content"
      dangerouslySetInnerHTML={{ __html: lang === "en" && enContent ? enContent : zhContent }}
    />
  );
}
