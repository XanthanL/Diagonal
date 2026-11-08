"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface ArchiveTableOfContentsProps {
  /** 用于在 DOM 中查找 h2/h3 的容器选择器 */
  contentSelector?: string;
}

/**
 * 从已渲染的 archive-html-content 中自动抽取 h2/h3 章节并生成侧边 sticky 目录。
 * - 为每个 h2/h3 注入 id（若未提供）
 * - 监听滚动位置，高亮当前章节
 * - 语言切换时重建目录（依赖 lang 触发重扫描）
 */
export function ArchiveTableOfContents({ contentSelector = ".archive-html-content" }: ArchiveTableOfContentsProps) {
  const { lang } = useI18n();
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const container = document.querySelector(contentSelector);
    if (!container) return;

    const headings = Array.from(container.querySelectorAll("h2, h3"));
    const tocItems: TocItem[] = [];
    const usedIds = new Set<string>();

    headings.forEach((heading, index) => {
      const level = (heading.tagName === "H2" ? 2 : 3) as 2 | 3;
      const text = (heading.textContent || "").trim();
      if (!text) return;

      let id = heading.id;
      if (!id) {
        id = `toc-${index}`;
        heading.id = id;
      }
      if (usedIds.has(id)) {
        id = `toc-${index}-${Math.random().toString(36).slice(2, 6)}`;
        heading.id = id;
      }
      usedIds.add(id);
      tocItems.push({ id, text, level });
    });

    setItems(tocItems);
    setActiveId("");

    if (tocItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [contentSelector, lang]);

  if (items.length < 2) return null;

  return (
    <nav className="archive-toc hidden lg:block sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto pr-4 pb-12">
      <div className="archive-toc-head">
        <span>Contents</span>
        <span>{String(items.length).padStart(2, "0")}</span>
      </div>
      <ul>
        {items.map((item, i) => (
          <li
            key={item.id}
            className={`archive-toc-item${item.level === 3 ? " is-sub" : ""}${activeId === item.id ? " is-active" : ""}`}
          >
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <span className="archive-toc-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="archive-toc-text">{item.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
