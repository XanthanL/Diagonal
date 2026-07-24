"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/components/admin/AdminGate";
import { deleteArticle, listArticles } from "@/lib/admin/github";
import type { ArticleListItem } from "@/lib/admin/types";

export default function DashboardPage() {
  const { token, logout } = useAdminAuth();
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    listArticles(token)
      .then((list) => {
        if (alive) setArticles(list);
      })
      .catch((e) => {
        if (alive) setError((e as Error).message || "加载失败");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  async function onDelete(id: string, title: string) {
    if (!confirm(`确认删除文章「${title}」？\n此操作会同时删除中英文 HTML 和所有图片，且无法撤销。`)) return;
    try {
      await deleteArticle(token, id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (e: unknown) {
      alert((e as Error).message || "删除失败");
    }
  }

  const filtered = articles.filter(
    (a) => !q || a.title.toLowerCase().includes(q.toLowerCase()) || a.id.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <header className="flex justify-between items-end mb-10 gap-6">
        <div className="space-y-1">
          <div className="archive-text text-[10px] tracking-[0.3em] text-diagonal-red">
            DIAGONAL / CONTENT CONSOLE
          </div>
          <h1 className="text-4xl font-black tracking-tighter">文章管理</h1>
          <p className="text-sm opacity-50">
            新建文章会自动套用与现有文章一致的排版风格；编辑历史文章不会破坏其它内容。
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/admin/editor?id=new"
            className="bg-black text-white px-5 py-2.5 archive-text text-sm font-bold hover:bg-neutral-800 transition-colors"
          >
            + 新建文章
          </Link>
          <button
            onClick={logout}
            className="border border-black/20 px-4 py-2.5 archive-text text-sm hover:border-black transition-colors"
          >
            登出
          </button>
        </div>
      </header>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索标题或 ID…"
        className="w-full max-w-md border border-black/20 focus:border-black outline-none px-3 py-2 mb-6 archive-text text-sm"
      />

      {loading && <div className="opacity-50 py-20 text-center">加载中…</div>}
      {error && <div className="text-diagonal-red py-10">{error}</div>}

      {!loading && !error && (
        <div className="border border-black/10 divide-y divide-black/10 bg-white">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 px-5 py-4 hover:bg-neutral-50 transition-colors"
            >
              <Link
                href={`/admin/editor?id=${encodeURIComponent(a.id)}`}
                className="flex items-center justify-between gap-4 flex-1 min-w-0"
              >
                <div className="min-w-0">
                  <div className="font-bold truncate">{a.title}</div>
                  <div className="archive-text text-[10px] opacity-40 mt-1">
                    {a.id}
                    {a.year ? ` · ${a.year}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 archive-text text-[10px]">
                  {a.draft && (
                    <span className="border border-amber-500 text-amber-600 px-2 py-0.5">草稿</span>
                  )}
                  {a.hasEn && <span className="border border-black/20 px-2 py-0.5">EN</span>}
                  <span className="px-2 py-0.5 border border-black/20">
                    {a.source === "store" ? "可编辑" : "历史 · 可编辑"}
                  </span>
                </div>
              </Link>
              <button
                onClick={() => onDelete(a.id, a.title)}
                className="shrink-0 text-black/20 hover:text-diagonal-red transition-colors px-2 py-1"
                title="删除文章"
                aria-label="删除文章"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 4h10M6 4V2.5h4V4M5 4l.5 9h5L11 4M7 6.5v5M9 6.5v5" />
                </svg>
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-16 text-center opacity-40 text-sm">无匹配文章</div>
          )}
        </div>
      )}
    </div>
  );
}
