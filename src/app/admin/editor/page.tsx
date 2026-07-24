"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { RichEditor } from "@/components/admin/RichEditor";
import { useAdminAuth } from "@/components/admin/AdminGate";
import { buildArticleHtml } from "@/lib/admin/htmlTemplate";
import { buildCover, collectInlineImages } from "@/lib/admin/clientImages";
import { getArticle, publishArticle } from "@/lib/admin/github";
import type { ArchiveItem, PublishPayload } from "@/lib/admin/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function nowStr() {
  const d = new Date();
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function newItemDefaults(): ArchiveItem {
  const d = new Date();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return {
    id: `DIAGONAL-${d.getFullYear()}-${rand}`,
    title: "",
    titleEn: "",
    artist: "对角线计划",
    artistEn: "Diagonal",
    year: nowStr(),
    type: "Document",
    typeEn: "Document",
    tags: [],
    tagsEn: [],
    location: { city: "自贡", cityEn: "Zigong", code: "ZG", coordinates: "29.3N, 104.7E" },
    region: "Southwest",
    project: "the-salt-of-life",
  };
}

// 读取文件为 dataURL
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function EditorInner() {
  const { token } = useAdminAuth();
  const searchParams = useSearchParams();
  const rawId = searchParams.get("id") || "new";
  const isNew = rawId === "new";

  const [item, setItem] = useState<ArchiveItem | null>(null);
  const [source, setSource] = useState<"store" | "legacy" | "new">("new");
  const [bodyZh, setBodyZh] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [kicker, setKicker] = useState("DIAGONAL_EVENT");
  const [coverCaption, setCoverCaption] = useState("");
  const [coverDataUrl, setCoverDataUrl] = useState<string>(""); // 新选封面的 dataURL

  const [tab, setTab] = useState<"zh" | "en">("zh");
  const [showPreview, setShowPreview] = useState(true);
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // —— 载入 ——
  useEffect(() => {
    if (isNew) {
      setItem(newItemDefaults());
      setSource("new");
      return;
    }
    let alive = true;
    getArticle(token, rawId)
      .then((data) => {
        if (!alive) return;
        setItem(data.item);
        setSource(data.source);
        setBodyZh(data.bodyZh || "");
        setBodyEn(data.bodyEn || "");
      })
      .catch((e) => {
        if (alive) setMsg({ kind: "err", text: (e as Error).message || "读取失败" });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawId, token]);

  function patchItem(patch: Partial<ArchiveItem>) {
    setItem((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function onCoverFile(file: File | null) {
    if (!file) {
      setCoverDataUrl("");
      return;
    }
    setCoverDataUrl(await readAsDataUrl(file));
  }

  const coverPreview = coverDataUrl || item?.thumbnail;

  // —— 实时预览 HTML ——
  const previewHtml = useMemo(() => {
    if (!item) return "";
    const previewItem: ArchiveItem = { ...item, thumbnail: coverPreview };
    const lang = tab;
    const body = lang === "en" ? bodyEn : bodyZh;
    return buildArticleHtml({ item: previewItem, kicker, coverCaption, body, lang });
  }, [item, coverPreview, kicker, coverCaption, bodyZh, bodyEn, tab]);

  async function submit(draft: boolean) {
    if (!item) return;
    setMsg(null);

    if (!item.id || !/^[A-Za-z0-9._-]+$/.test(item.id)) {
      setMsg({ kind: "err", text: "文章 ID 缺失或含非法字符（仅允许字母数字与 -._）" });
      return;
    }
    if (!item.title.trim()) {
      setMsg({ kind: "err", text: "请填写中文标题" });
      return;
    }
    if (!item.year.trim()) {
      setMsg({ kind: "err", text: "请填写发布时间" });
      return;
    }
    if (!bodyZh.trim()) {
      setMsg({ kind: "err", text: "中文正文不能为空" });
      return;
    }

    setBusy(true);
    try {
      // 1) 正文内联图片 → 提取转存
      const hasEn = Boolean(bodyEn.trim() && item.titleEn.trim());
      const { htmls, images: inlineImages } = collectInlineImages(
        [bodyZh, hasEn ? bodyEn : ""],
        item.id
      );
      const [outZh, outEn] = htmls;

      // 2) 封面
      const cover = buildCover(coverDataUrl || undefined, item.thumbnail, item.id);
      const finalItem: ArchiveItem = { ...item, thumbnail: cover.thumbnail };

      const images = [...(cover.image ? [cover.image] : []), ...inlineImages];

      const payload: PublishPayload = {
        item: finalItem,
        kicker,
        coverCaption: coverCaption || undefined,
        bodyZh: outZh,
        bodyEn: hasEn ? outEn : undefined,
        images,
        draft,
      };

      await publishArticle(token, payload);

      setItem(finalItem);
      setCoverDataUrl("");
      setMsg({
        kind: "ok",
        text: draft
          ? "已保存为草稿（不会出现在线上）。"
          : "已发布！GitHub 正在重建站点，约 1–2 分钟后线上生效。",
      });
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  if (loading || !item) {
    return <div className="max-w-6xl mx-auto px-6 py-24 text-center opacity-50">加载中…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* 顶部操作栏 */}
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="min-w-0">
          <Link href="/admin" className="archive-text text-[10px] opacity-40 hover:opacity-100">
            ← 返回列表
          </Link>
          <h1 className="text-2xl font-black tracking-tight truncate mt-1">
            {isNew ? "新建文章" : `编辑：${item.title || item.id}`}
          </h1>
          {source === "legacy" && (
            <p className="text-[11px] text-amber-600 mt-1">
              历史文章：元数据将通过 overlay 覆盖生效，原始手写数据不被改动。
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="border border-black/20 px-3 py-2 archive-text text-xs hover:border-black"
          >
            {showPreview ? "隐藏预览" : "显示预览"}
          </button>
          <button
            onClick={() => submit(true)}
            disabled={busy}
            className="border border-black/20 px-4 py-2 archive-text text-sm hover:border-black disabled:opacity-40"
          >
            存草稿
          </button>
          <button
            onClick={() => submit(false)}
            disabled={busy}
            className="bg-black text-white px-5 py-2 archive-text text-sm font-bold hover:bg-neutral-800 disabled:opacity-40"
          >
            {busy ? "提交中…" : "发布"}
          </button>
        </div>
      </header>

      {msg && (
        <div
          className={`mb-6 px-4 py-3 text-sm border ${
            msg.kind === "ok"
              ? "border-green-600 text-green-700 bg-green-50"
              : "border-diagonal-red text-diagonal-red bg-red-50"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className={`grid gap-8 ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* 左：编辑 */}
        <div className="space-y-8">
          <section className="bg-white border border-black/10 p-6">
            <h2 className="archive-text text-xs tracking-widest opacity-40 mb-5">元数据</h2>
            <ArticleForm
              item={item}
              onChange={patchItem}
              idEditable={isNew}
              kicker={kicker}
              onKicker={setKicker}
              coverCaption={coverCaption}
              onCoverCaption={setCoverCaption}
              coverPreview={coverPreview}
              onCoverFile={onCoverFile}
            />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setTab("zh")}
                className={`px-4 py-1.5 archive-text text-xs border ${
                  tab === "zh" ? "bg-black text-white border-black" : "border-black/20 hover:border-black"
                }`}
              >
                中文正文
              </button>
              <button
                onClick={() => setTab("en")}
                className={`px-4 py-1.5 archive-text text-xs border ${
                  tab === "en" ? "bg-black text-white border-black" : "border-black/20 hover:border-black"
                }`}
              >
                英文正文（可选）
              </button>
            </div>
            {tab === "zh" ? (
              <RichEditor key="zh" value={bodyZh} onChange={setBodyZh} />
            ) : (
              <RichEditor key="en" value={bodyEn} onChange={setBodyEn} />
            )}
            {tab === "en" && (
              <p className="text-[11px] opacity-40 mt-2">
                英文版仅在「英文标题」与「英文正文」均填写时才会生成 {item.id}.en.html。
              </p>
            )}
          </section>
        </div>

        {/* 右：预览 */}
        {showPreview && (
          <div className="space-y-3">
            <div className="archive-text text-xs tracking-widest opacity-40">
              实时预览（{tab === "zh" ? "中文" : "英文"}）· 最终以重建后的线上页面为准
            </div>
            <div className="bg-white border border-black/10 p-8 lg:sticky lg:top-6 max-h-[calc(100vh-6rem)] overflow-auto">
              <div
                className="archive-preview"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={<div className="max-w-6xl mx-auto px-6 py-24 text-center opacity-50">加载中…</div>}
    >
      <EditorInner />
    </Suspense>
  );
}
