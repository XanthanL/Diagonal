"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface ArchiveTableOfContentsProps {
  /**
   * 用于在 DOM 中查找 h2/h3 的容器选择器
   */
  contentSelector?: string;
}

/**
 * 从已渲染的 archive-html-content 中自动抽取 h2/h3 章节并生成侧边 sticky 目录。
 * - 为每个 h2/h3 注入 id（若未提供）
 * - 监听滚动位置，高亮当前章节
 */
export function ArchiveTableOfContents({ contentSelector = ".archive-html-content" }: ArchiveTableOfContentsProps) {
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
      // 避免重复
      if (usedIds.has(id)) {
        id = `toc-${index}-${Math.random().toString(36).slice(2, 6)}`;
        heading.id = id;
      }
      usedIds.add(id);
      tocItems.push({ id, text, level });
    });

    setItems(tocItems);

    if (tocItems.length === 0) return;

    // 监听滚动位置以高亮当前章节
    const observer = new IntersectionObserver(
      (entries) => {
        // 找到最靠近视口顶部的可见 heading
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [contentSelector]);

  if (items.length < 2) return null;

  return (
    <nav className="hidden lg:block sticky top-32 max-h-[calc(100vh-10rem)] overflow-y-auto pr-4 pb-12">
      <div className="archive-text text-[10px] opacity-40 uppercase tracking-widest mb-4 pb-2 border-b border-black/10">
        Contents
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={item.level === 3 ? "ml-4" : ""}
          >
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`block text-xs leading-relaxed transition-all ${
                activeId === item.id
                  ? "text-diagonal-red font-bold"
                  : "opacity-50 hover:opacity-90"
              } ${item.level === 3 ? "py-1" : "py-1.5"}`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
