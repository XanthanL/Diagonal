"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { getLocalSrcSet } from "@/lib/path";
import { sanitizeArchiveHtml } from "@/lib/sanitizeArchiveHtml";

interface ArchiveContentProps {
  zhContent: string;
  enContent?: string;
}

// 正文详情图默认展示宽度：移动端全宽，桌面端受排版容器约束
const CONTENT_SIZES = "(max-width: 768px) 100vw, 768px";

/**
 * 为正文 HTML 中引用本地 /images/ 的 <img> 注入响应式 srcset 与懒加载属性。
 * 变体缺失时由内联 onerror 清空 srcset 回退原图。
 */
function enhanceImages(html: string): string {
  let index = 0;
  return html.replace(/<img\b([^>]*?)\/?>/gi, (match, attrs: string) => {
    const isFirst = index++ === 0;
    if (/srcset=/i.test(attrs)) return match;
    const srcMatch = attrs.match(/src="([^"]+)"/i);
    if (!srcMatch) return match;
    const srcSet = getLocalSrcSet(decodeURI(srcMatch[1]));
    if (!srcSet) return match;
    // 首图通常是封面/LCP，不懒加载且提高优先级；其余懒加载
    const loading = /loading=/i.test(attrs)
      ? ""
      : isFirst
        ? ' fetchpriority="high"'
        : ' loading="lazy" decoding="async"';
    return `<img${attrs} srcset="${srcSet}" sizes="${CONTENT_SIZES}"${loading} onerror="this.srcset=''" />`;
  });
}

export function ArchiveContent({ zhContent, enContent }: ArchiveContentProps) {
  const { lang } = useI18n();

  const html = useMemo(() => {
    const raw = lang === "en" && enContent ? enContent : zhContent;
    // 先清洗再加 srcset：enhanceImages 注入的内联 onerror 回退必须活到最后
    return enhanceImages(sanitizeArchiveHtml(raw));
  }, [lang, zhContent, enContent]);

  return (
    <div
      className="archive-html-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
