"use client";

import type { ArchiveItem } from "@/lib/admin/types";
import {
  LOCATION_PRESETS,
  PROJECT_OPTIONS,
  REGION_OPTIONS,
  SERIES_OPTIONS,
  TYPE_OPTIONS,
} from "@/lib/admin/constants";

interface Props {
  item: ArchiveItem;
  onChange: (patch: Partial<ArchiveItem>) => void;
  idEditable: boolean;
  kicker: string;
  onKicker: (v: string) => void;
  coverCaption: string;
  onCoverCaption: (v: string) => void;
  coverPreview?: string; // dataURL 或已有路径
  onCoverFile: (file: File | null) => void;
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="archive-text text-[10px] opacity-50 uppercase">{label}</span>
      {children}
      {hint && <span className="block text-[11px] opacity-40">{hint}</span>}
    </label>
  );
}

const inputCls = "w-full border border-black/20 focus:border-black outline-none px-3 py-2 text-sm";

export function ArticleForm({
  item,
  onChange,
  idEditable,
  kicker,
  onKicker,
  coverCaption,
  onCoverCaption,
  coverPreview,
  onCoverFile,
}: Props) {
  function applyPreset(code: string) {
    const p = LOCATION_PRESETS.find((x) => x.code === code);
    if (p) onChange({ location: { ...p } });
  }

  function nowStr() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="文章 ID" hint="发布后不可改；仅字母数字与 -._">
          <input
            className={inputCls}
            value={item.id}
            disabled={!idEditable}
            onChange={(e) => onChange({ id: e.target.value })}
            placeholder="DIAGONAL-2026-XXX"
          />
        </Field>
        <Field label="发布时间 (year)" hint="格式 2026.07.07 12:26；决定排序">
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={item.year}
              onChange={(e) => onChange({ year: e.target.value })}
              placeholder="2026.07.07 12:26"
            />
            <button
              type="button"
              onClick={() => onChange({ year: nowStr() })}
              className="border border-black/20 px-3 text-sm hover:border-black shrink-0"
            >
              现在
            </button>
          </div>
        </Field>
      </div>

      <Field label="中文标题（必填）">
        <input className={inputCls} value={item.title} onChange={(e) => onChange({ title: e.target.value })} />
      </Field>
      <Field label="英文标题（可选，用于英文版）">
        <input className={inputCls} value={item.titleEn} onChange={(e) => onChange({ titleEn: e.target.value })} />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="作者 / 艺术家（中）">
          <input className={inputCls} value={item.artist} onChange={(e) => onChange({ artist: e.target.value })} />
        </Field>
        <Field label="作者 / 艺术家（英）">
          <input className={inputCls} value={item.artistEn} onChange={(e) => onChange({ artistEn: e.target.value })} />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="类型">
          <select className={inputCls} value={item.type} onChange={(e) => onChange({ type: e.target.value as ArchiveItem["type"] })}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.zh}</option>
            ))}
          </select>
        </Field>
        <Field label="所属项目">
          <select className={inputCls} value={item.project} onChange={(e) => onChange({ project: e.target.value as ArchiveItem["project"] })}>
            {PROJECT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.zh}</option>
            ))}
          </select>
        </Field>
        <Field label="子系列">
          <select className={inputCls} value={item.series || ""} onChange={(e) => onChange({ series: e.target.value })}>
            {SERIES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.zh}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="地区">
          <select className={inputCls} value={item.region} onChange={(e) => onChange({ region: e.target.value as ArchiveItem["region"] })}>
            {REGION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.zh}</option>
            ))}
          </select>
        </Field>
        <Field label="地点预设（快速填充下方）">
          <select className={inputCls} defaultValue="" onChange={(e) => e.target.value && applyPreset(e.target.value)}>
            <option value="">— 选择常用地点 —</option>
            {LOCATION_PRESETS.map((p) => (
              <option key={p.code} value={p.code}>{p.city} {p.cityEn}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="城市（中）">
          <input className={inputCls} value={item.location.city} onChange={(e) => onChange({ location: { ...item.location, city: e.target.value } })} />
        </Field>
        <Field label="城市（英）">
          <input className={inputCls} value={item.location.cityEn} onChange={(e) => onChange({ location: { ...item.location, cityEn: e.target.value } })} />
        </Field>
        <Field label="代码">
          <input className={inputCls} value={item.location.code} onChange={(e) => onChange({ location: { ...item.location, code: e.target.value } })} />
        </Field>
        <Field label="坐标">
          <input className={inputCls} value={item.location.coordinates} onChange={(e) => onChange({ location: { ...item.location, coordinates: e.target.value } })} />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="标签（中，逗号分隔）">
          <input
            className={inputCls}
            value={item.tags.join(", ")}
            onChange={(e) => onChange({ tags: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })}
          />
        </Field>
        <Field label="标签（英，逗号分隔）">
          <input
            className={inputCls}
            value={item.tagsEn.join(", ")}
            onChange={(e) => onChange({ tagsEn: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="页眉栏目号 (kicker)" hint="显示为红色小字，如 DIAGONAL_EVENT">
          <input className={inputCls} value={kicker} onChange={(e) => onKicker(e.target.value)} placeholder="DIAGONAL_EVENT" />
        </Field>
        <Field label="封面图说明 (figcaption)" hint="可留空">
          <input className={inputCls} value={coverCaption} onChange={(e) => onCoverCaption(e.target.value)} />
        </Field>
      </div>

      <Field label="封面图" hint="作为列表缩略图与文章顶部大图">
        <div className="flex items-center gap-4">
          <input type="file" accept="image/*" onChange={(e) => onCoverFile(e.target.files?.[0] || null)} className="text-sm" />
          {coverPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreview} alt="封面预览" className="h-16 w-auto border border-black/10" />
          )}
        </div>
      </Field>
    </div>
  );
}
