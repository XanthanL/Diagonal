"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { archiveData, atlasData, getLocalizedArchiveItem, getLocalizedAtlasItem } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { getAssetPath } from "@/lib/path";
import { DiagonalSlash } from "@/components/DiagonalSlash";

// 与 CSS 的 --ease-out 同一条曲线，避免 JS 与 CSS 两套手感
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// 组进入：装饰性，必须够快且不阻塞交互
const groupItem = {
  initial: { opacity: 0, transform: "translateY(12px)" },
  whileInView: { opacity: 1, transform: "translateY(0px)" },
  viewport: { once: true, margin: "-80px" },
};

// 移动端吸底章节跳转条：01/02/03 三章节，滚动高亮 + 点击直达，
// 与汉堡菜单互补——跨章节移动不必再开菜单找入口
const DOCK_IDS = ["archive", "atlas", "lab"] as const;

function SectionDock() {
  const { lang } = useI18n();
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => {
      const probe = window.scrollY + window.innerHeight * 0.45;
      let current = "";
      for (const id of DOCK_IDS) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= probe) current = id;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
        current = DOCK_IDS[DOCK_IDS.length - 1];
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const items = [
    { id: "archive", num: "01", label: t(lang, "dockDocuments") },
    { id: "atlas", num: "02", label: t(lang, "dockAtlas") },
    { id: "lab", num: "03", label: t(lang, "dockLab") },
  ];

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-black/10 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="grid grid-cols-3">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => jump(it.id)}
            aria-current={active === it.id ? "true" : undefined}
            className={`press archive-text relative py-3.5 text-[10px] tracking-widest transition-opacity ${
              active === it.id ? "opacity-100" : "opacity-60"
            }`}
          >
            <span
              className={`absolute left-1/2 top-0 h-[2px] -translate-x-1/2 bg-foreground transition-[width] duration-300 ease-out-strong ${
                active === it.id ? "w-10" : "w-0"
              }`}
            />
            {it.num} · {it.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

// 章节头：沿用 /about 的语言——发丝顶线 + 小字号 mono 编号标签 + 中号衬线标题，
// 右侧可挂一段引言；不再用巨型黑体斜体标题压场
function SectionHeading({
  code,
  title,
  aside,
}: {
  code: string;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <motion.div
      {...groupItem}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="border-t border-black/10 pt-8 mb-10 md:mb-12"
    >
      <div className="md:flex md:items-end md:justify-between md:gap-16">
        <div className="space-y-4">
          <div className="archive-text text-[11px] opacity-65" style={{ letterSpacing: "0.3em" }}>
            {code}
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-bold uppercase leading-none tracking-tight">
            {title}
          </h2>
        </div>
        {aside && <div className="mt-8 md:mt-0 md:max-w-xs md:pb-1">{aside}</div>}
      </div>
    </motion.div>
  );
}

// 索引行：左缘 mono 编号列 + 右侧衬线条目，行之间只用最轻的发丝线分隔。
// 加重只用在章节头，可进入的条目标题保持衬线常规字重——层级靠字号与留白，不靠字重
function IndexRow({
  href,
  code,
  title,
  desc,
  artist,
  tags,
  trailing,
  status,
}: {
  href: string;
  code: ReactNode;
  title: string;
  desc?: string;
  artist?: string;
  tags?: ReactNode;
  trailing?: ReactNode;
  status?: string;
}) {
  return (
    <Link
      href={href}
      className="press group block border-b border-black/5 py-5 md:grid md:grid-cols-[11rem_1fr_auto] md:items-baseline md:gap-10"
    >
      <div className="archive-text flex justify-between gap-3 text-[11px] opacity-65 md:block md:space-y-1">
        {code}
      </div>
      <div className="mt-2 min-w-0 md:mt-0">
        <h3 className="font-serif text-xl font-medium leading-snug tracking-tight decoration-black/30 decoration-1 underline-offset-4 group-hover:underline md:text-2xl">
          {title}
          {status && (
            <span className="archive-text ml-3 inline-flex translate-y-[-2px] items-center gap-1.5 border border-black/15 px-2 py-[3px] align-baseline text-[8px] tracking-[0.2em] opacity-70 no-underline">
              <span className="h-1 w-1 shrink-0 bg-diagonal-red" />
              {status}
            </span>
          )}
        </h3>
        {desc && (
          <p className="mt-1.5 max-w-2xl font-serif text-sm leading-relaxed opacity-70">{desc}</p>
        )}
        {(artist || tags) && (
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {artist && <span className="font-serif text-[15px] italic opacity-65">{artist}</span>}
            {tags && (
              <span className="archive-text flex flex-wrap gap-x-3 text-[10px] opacity-65">{tags}</span>
            )}
          </div>
        )}
      </div>
      {trailing && (
        <div className="archive-text mt-2 text-[10px] opacity-65 transition-opacity group-hover:opacity-85 md:mt-0 md:text-right">
          {trailing}
        </div>
      )}
    </Link>
  );
}

export default function Home() {
  const { lang } = useI18n();

  const labEntries: {
    href: string;
    code: string;
    title: string;
    desc: string;
    status?: string;
  }[] = [
    {
      href: "/vacuum-salt/",
      code: t(lang, "vacuumSaltLabel"),
      title: t(lang, "vacuumSaltTitle"),
      desc: t(lang, "labVacuumDesc"),
    },
    {
      href: "/lab/salt-particle",
      code: "INTERACTIVE",
      title: t(lang, "labSaltTitle"),
      desc: t(lang, "labSaltDesc"),
    },
    {
      href: "/salt-plant-3d/index.html",
      code: t(lang, "labSaltPlantLabel"),
      title: t(lang, "labSaltPlantTitle"),
      desc: t(lang, "labSaltPlantDesc"),
      status: t(lang, "labWip"),
    },
    {
      href: "/gatehouse-3d/index.html",
      code: t(lang, "gatehouseLabel"),
      title: t(lang, "gatehouseTitle"),
      desc: t(lang, "gatehouseDesc"),
      status: t(lang, "labWip"),
    },
  ];

  return (
    <div className="relative overflow-hidden pt-24 min-h-screen">
      {/* Hero Section —— 原样保留（字标 / 斜切母题 / 介绍 / 右缘 meta） */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-10 md:py-20">
        <div className="relative space-y-8 md:space-y-12">
          <motion.h1
            initial={{ opacity: 0, transform: "translateX(-20px)" }}
            animate={{ opacity: 1, transform: "translateX(0px)" }}
            transition={{ delay: 0.15, duration: 0.55, ease: EASE_OUT }}
            className="font-serif font-black leading-[0.8] tracking-tighter relative"
          >
            {/* 对角线母题：DIA 与 GONAL 沿对角错位咬合，而非水平堆叠。
                宽屏下字号随视口放大，让字标撑满栏宽、右侧不再空荡 */}
            <span className="block text-[18vw] sm:text-8xl md:text-[clamp(6rem,12vw,11rem)]">DIA</span>
            <span
              className="block text-[18vw] sm:text-8xl md:text-[clamp(6rem,12vw,11rem)] -mt-2 md:-mt-4"
              style={{ transform: "translateX(0.3em)" }}
            >
              GONAL
            </span>
            <DiagonalSlash />
          </motion.h1>

          <div className="md:flex md:items-end md:justify-between md:gap-16">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5, ease: EASE_OUT }}
              className="max-w-md space-y-6 md:max-w-xl"
            >
              <div className="archive-text text-sm font-bold border-l-2 border-diagonal-red pl-4">
                {t(lang, "projectStatus")}
              </div>
              <p className="text-xl leading-relaxed font-serif">
                {t(lang, "heroIntro")}
              </p>
            </motion.div>

            {/* 桌面右缘元信息列：与章节头「左标题右 meta」同款语言，平衡字标右侧空白 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5, ease: EASE_OUT }}
              className="hidden md:block archive-text text-[10px] leading-relaxed space-y-2 opacity-65 text-right pb-1"
            >
              <div>{t(lang, "totalRecords")}: {archiveData.length}</div>
              <div>{t(lang, "axis")}</div>
              <div>ZIGONG / HEGANG / CHENGDU</div>
              <div>EST. 2024 — ONGOING</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section id="archive" className="relative z-10 scroll-mt-14">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <SectionHeading code={t(lang, "documentsLabel")} title={t(lang, "documentsTitle")} />

          <div>
            {archiveData.slice(0, 4).map((item, index) => {
              const localized = getLocalizedArchiveItem(item, lang);
              return (
                <motion.div
                  key={item.id}
                  {...groupItem}
                  transition={{ duration: 0.4, ease: EASE_OUT, delay: Math.min(index * 0.04, 0.24) }}
                >
                  <IndexRow
                    href={`/archive/${item.id}`}
                    title={localized.title}
                    artist={localized.artist}
                    code={
                      <>
                        <span className="md:block">{item.id}</span>
                        <span className="md:block">{localized.year}</span>
                      </>
                    }
                    tags={
                      <>
                        <span>{localized.type}</span>
                        <span>{localized.location.code}</span>
                      </>
                    }
                  />
                </motion.div>
              );
            })}
          </div>

          {/* 全索引入口：描边按钮 + hover 填满红，首页只给 4 条时它必须显眼 */}
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/archive"
              className="press group archive-text flex items-center gap-3 border border-diagonal-red px-8 py-3.5 text-xs font-bold text-diagonal-red hover:bg-diagonal-red hover:text-background"
            >
              {t(lang, "loadFullIndex")}
              <span className="transition-transform group-hover:translate-x-1.5">→</span>
            </Link>
            <span className="archive-text text-[11px] opacity-65">
              {t(lang, "totalRecords")}: {archiveData.length}
            </span>
          </div>
        </div>
      </section>

      {/* Atlas */}
      <section id="atlas" className="relative z-10 scroll-mt-14">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <SectionHeading
            code={t(lang, "atlasLabel")}
            title={t(lang, "atlasTitle")}
            aside={
              <>
                <p className="font-serif text-sm italic leading-relaxed opacity-65">
                  {t(lang, "atlasIntro")}
                </p>
                {/* 流动线：CSS animation，不占主线程 */}
                <div className="relative mt-6 h-px w-full overflow-hidden bg-black/10">
                  <div className="animate-atlasProgress absolute inset-0 w-1/4 bg-diagonal-red" />
                </div>
              </>
            }
          />

          {/* 图版索引：小缩略图作视觉锚点，信息仍以文字完整呈现 */}
          <div>
            {atlasData.map((item, index) => {
              const localized = getLocalizedAtlasItem(item, lang);
              const subs = localized.subCollections?.length ?? 0;
              return (
                <motion.div
                  key={item.id}
                  {...groupItem}
                  transition={{ duration: 0.4, ease: EASE_OUT, delay: Math.min(index * 0.05, 0.2) }}
                >
                  <Link
                    href={`/atlas/${item.id}`}
                    className="press group flex items-start gap-5 border-b border-black/5 py-6 md:gap-8"
                  >
                    {item.cover && (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-black/10 bg-neutral-100 md:h-16 md:w-16">
                        <img
                          src={getAssetPath(item.cover)}
                          alt={localized.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                        <div className="diagonal-line pointer-events-none absolute inset-0 opacity-10" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="archive-text text-[11px] opacity-65">{item.id}</div>
                      <h3 className="font-serif text-xl font-medium leading-snug tracking-tight decoration-black/30 decoration-1 underline-offset-4 group-hover:underline md:text-2xl">
                        {localized.title}
                      </h3>
                      <div className="archive-text flex flex-wrap gap-x-3 text-[10px] opacity-65">
                        <span>{localized.category}</span>
                        <span>{localized.location.city}</span>
                        {subs > 0 && <span>SUB-COLLECTIONS ×{subs}</span>}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lab —— 实验性质，置于最后 */}
      <section id="lab" className="relative z-10 scroll-mt-14">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <SectionHeading
            code={t(lang, "labLabel")}
            title={t(lang, "labTitle")}
            aside={
              <p className="font-serif text-sm italic leading-relaxed opacity-65">{t(lang, "labIntro")}</p>
            }
          />

          <div>
            {labEntries.map((entry, index) => (
              <motion.div
                key={entry.href}
                {...groupItem}
                transition={{ duration: 0.4, ease: EASE_OUT, delay: index * 0.05 }}
              >
                <IndexRow
                  href={entry.href}
                  code={entry.code}
                  title={entry.title}
                  desc={entry.desc}
                  status={entry.status}
                  trailing={t(lang, "labEnter")}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 移动端吸底章节跳转条 */}
      <SectionDock />
    </div>
  );
}
