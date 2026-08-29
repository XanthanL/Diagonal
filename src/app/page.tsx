"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
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
            className={`press relative py-3.5 archive-text text-[10px] tracking-widest transition-colors ${
              active === it.id ? "text-diagonal-red" : "opacity-50"
            }`}
          >
            <span
              className={`absolute left-1/2 top-0 h-[2px] -translate-x-1/2 bg-diagonal-red transition-[width] duration-300 ease-out-strong ${
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

// 章节分界：全宽发丝线（比索引行内的行线略强）+ 内容左缘一枚红色斜切刻线，
// 对角母题的轻量版——行线弱、章节线带刻痕，板块衔接由此区分层级
function SectionRule() {
  return (
    <div aria-hidden="true" className="relative h-px bg-black/20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative h-px">
          <span className="absolute -top-[7px] left-0 h-[15px] w-[2px] rotate-[24deg] bg-diagonal-red" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { lang } = useI18n();

  return (
    <div className="relative overflow-hidden pt-24 min-h-screen">
      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-10 md:py-20">
        {/* 扫描线：覆盖整个 Hero（含完整介绍段落），底部 mask 渐隐融入下个板块，无硬边。
            framer-motion 只动 opacity——若让它碰 transform 会覆盖 skew 类，导致斜切失效 */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute -inset-y-[12%] inset-x-0 bg-gradient-to-br from-transparent via-black/[0.05] to-transparent skew-y-6 [mask-image:linear-gradient(to_bottom,black_0%,black_58%,transparent_86%)]" />
        </motion.div>

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
              className="hidden md:block archive-text text-[10px] leading-relaxed space-y-2 opacity-60 text-right pb-1"
            >
              <div>{t(lang, "totalRecords")}: {archiveData.length}</div>
              <div>{t(lang, "axis")}</div>
              <div>ZIGONG / HEGANG / CHENGDU</div>
              <div>EST. 2024 — ONGOING</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Documents Section (Formerly Archive Box) */}
      <section id="archive" className="relative z-10 scroll-mt-14">
        <SectionRule />
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-24">
        {/* 章节头：三板块统一模板（红编号标签 + 同款大标题 + 右侧 meta） */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-14 gap-4 md:gap-8">
          <motion.div
            {...groupItem}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="space-y-3 md:space-y-4"
          >
            <div className="archive-text text-[10px] text-diagonal-red font-bold tracking-widest border-l-2 border-diagonal-red pl-4">
              {t(lang, "documentsLabel")}
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
              {t(lang, "documentsTitle")}
            </h2>
          </motion.div>

          <div className="archive-text text-[10px] space-y-1 opacity-60 md:text-right md:pb-2">
            <div>{t(lang, "totalRecords")}: {archiveData.length}</div>
            <div>{t(lang, "axis")}</div>
          </div>
        </div>

        {/* 文字索引：首页不给每条内容配封面，以档案索引行呈现内容总览，
            标题完整换行不裁切，桌面/手机都能一屏扫读 */}
        <div>
          {archiveData.slice(0, 10).map((item, index) => {
            const localized = getLocalizedArchiveItem(item, lang);
            return (
              <motion.div
                key={item.id}
                {...groupItem}
                transition={{ duration: 0.4, ease: EASE_OUT, delay: Math.min(index * 0.04, 0.24) }}
              >
                <Link
                  href={`/archive/${item.id}`}
                  className="press group block border-t border-black/10 py-4 md:grid md:grid-cols-[12rem_1fr_auto] md:items-baseline md:gap-8 md:py-3.5"
                >
                  <div className="archive-text text-[9px] opacity-50 flex justify-between gap-3 md:block md:space-y-1">
                    <span className="md:block">{item.id} // {localized.location.code}</span>
                    <span className="md:block">{localized.year}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold leading-snug tracking-tight decoration-diagonal-red decoration-2 underline-offset-4 group-hover:underline md:mt-0 md:text-xl">
                    {localized.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-3 md:mt-0 md:max-w-[16rem] md:justify-end">
                    <span className="font-serif text-sm italic opacity-60">{localized.artist}</span>
                    <span className="archive-text shrink-0 bg-black px-2 py-0.5 text-[9px] text-white">{localized.type}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 md:mt-20 pt-8 border-t border-black flex justify-center">
          <Link href="/archive" className="press archive-text text-sm font-bold border border-black px-12 py-4 hover:bg-black hover:text-white">
            {t(lang, "loadFullIndex")}
          </Link>
        </div>
        </div>
      </section>

      {/* Atlas Section - 统一浅色，与全站视觉一致（暗室焦点改为纸面展墙） */}
      <section id="atlas" className="relative z-10 bg-black/[0.02] scroll-mt-14">
        <SectionRule />
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-24">
          {/* 章节头：三板块统一模板（红编号标签 + 同款大标题 + 右侧 meta） */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-14 gap-4 md:gap-8">
            <motion.div
              {...groupItem}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="space-y-3 md:space-y-4"
            >
              <div className="archive-text text-[10px] text-diagonal-red font-bold tracking-widest border-l-2 border-diagonal-red pl-4">
                {t(lang, "atlasLabel")}
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                {t(lang, "atlasTitle")}
              </h2>
            </motion.div>
            <div className="max-w-xs space-y-6 md:pb-2">
              <p className="text-sm opacity-50 leading-relaxed italic">
                {t(lang, "atlasIntro")}
              </p>
              {/* 红色进度条装饰（CSS animation，不占主线程） */}
              <div className="w-full h-px bg-black/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-diagonal-red w-1/4 animate-atlasProgress" />
              </div>
            </div>
          </div>

          {/* 图版索引：小缩略图仅作视觉锚点，信息以文字完整呈现 */}
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
                    className="press group flex items-start gap-5 border-t border-black/10 py-5"
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
                      <div className="archive-text flex justify-between gap-3 text-[9px] opacity-50">
                        <span>{item.id}</span>
                        <span>LOC: {item.location.code}</span>
                      </div>
                      <h3 className="text-xl font-bold leading-snug tracking-tight decoration-diagonal-red decoration-2 underline-offset-4 group-hover:underline md:text-2xl">
                        {localized.title}
                      </h3>
                      <div className="archive-text flex flex-wrap gap-x-3 gap-y-1 text-[9px] opacity-40">
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

      {/* THE LAB Section - 实验性质，置于 Atlas 之后、页面末尾 */}
      <section id="lab" className="relative z-10 scroll-mt-14">
        <SectionRule />
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-24">
        {/* 章节头：三板块统一模板（红编号标签 + 同款大标题 + 右侧 meta） */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-14 gap-4 md:gap-8">
          <motion.div
            {...groupItem}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="space-y-3 md:space-y-4"
          >
            <div className="archive-text text-[10px] text-diagonal-red font-bold tracking-widest border-l-2 border-diagonal-red pl-4">
              {t(lang, "labLabel")}
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
              {t(lang, "labTitle")}
            </h2>
          </motion.div>
          <div className="max-w-xs space-y-6 md:pb-2">
            <p className="text-sm opacity-50 leading-relaxed italic">
              {t(lang, "labIntro")}
            </p>
          </div>
        </div>

        {/* 实验场索引行：纯文字，与 Documents 同构；「进入」提示为行动 affordance */}
        <div>
          {/* 条目 1：真空制盐 3D 解构 → /vacuum-salt/ */}
          <motion.div
            {...groupItem}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            <Link
              href="/vacuum-salt/"
              className="press group block border-t border-black/10 py-4 md:grid md:grid-cols-[12rem_1fr_auto] md:items-baseline md:gap-8 md:py-3.5"
            >
              <div className="archive-text flex justify-between gap-3 text-[9px] opacity-50">
                <span>{t(lang, "vacuumSaltLabel")}</span>
                <span className="text-diagonal-red md:hidden">{t(lang, "labEnter")}</span>
              </div>
              <div className="mt-2 space-y-1 md:mt-0">
                <h3 className="text-lg font-bold tracking-tight decoration-diagonal-red decoration-2 underline-offset-4 group-hover:underline md:text-xl">
                  {t(lang, "vacuumSaltTitle")}
                </h3>
                <p className="text-sm leading-relaxed text-black/60">{t(lang, "labVacuumDesc")}</p>
              </div>
              <div className="archive-text hidden text-[9px] text-diagonal-red md:block">{t(lang, "labEnter")}</div>
            </Link>
          </motion.div>

          {/* 条目 2：盐粒子模拟 → /lab/salt-particle */}
          <motion.div
            {...groupItem}
            transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.05 }}
          >
            <Link
              href="/lab/salt-particle"
              className="press group block border-t border-black/10 py-4 md:grid md:grid-cols-[12rem_1fr_auto] md:items-baseline md:gap-8 md:py-3.5"
            >
              <div className="archive-text flex justify-between gap-3 text-[9px] opacity-50">
                <span>INTERACTIVE · 实时模拟</span>
                <span className="text-diagonal-red md:hidden">{t(lang, "labEnter")}</span>
              </div>
              <div className="mt-2 space-y-1 md:mt-0">
                <h3 className="text-lg font-bold tracking-tight decoration-diagonal-red decoration-2 underline-offset-4 group-hover:underline md:text-xl">
                  {t(lang, "labSaltTitle")}
                </h3>
                <p className="text-sm leading-relaxed text-black/60">{t(lang, "labSaltDesc")}</p>
              </div>
              <div className="archive-text hidden text-[9px] text-diagonal-red md:block">{t(lang, "labEnter")}</div>
            </Link>
          </motion.div>

          {/* 条目 3：天车 3D 解构 → /salt-plant-3d/ */}
          <motion.div
            {...groupItem}
            transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.1 }}
          >
            <Link
              href="/salt-plant-3d/index.html"
              className="press group block border-t border-black/10 py-4 md:grid md:grid-cols-[12rem_1fr_auto] md:items-baseline md:gap-8 md:py-3.5"
            >
              <div className="archive-text flex justify-between gap-3 text-[9px] opacity-50">
                <span>{t(lang, "labSaltPlantLabel")}</span>
                <span className="text-diagonal-red md:hidden">{t(lang, "labEnter")}</span>
              </div>
              <div className="mt-2 space-y-1 md:mt-0">
                <h3 className="text-lg font-bold tracking-tight decoration-diagonal-red decoration-2 underline-offset-4 group-hover:underline md:text-xl">
                  {t(lang, "labSaltPlantTitle")}
                </h3>
                <p className="text-sm leading-relaxed text-black/60">{t(lang, "labSaltPlantDesc")}</p>
              </div>
              <div className="archive-text hidden text-[9px] text-diagonal-red md:block">{t(lang, "labEnter")}</div>
            </Link>
          </motion.div>
        </div>

        <p className="mt-8 archive-text text-[10px] opacity-30 tracking-widest">
          EXPERIMENTAL · 实验性质 · 非档案主体内容
        </p>
        </div>
      </section>

      {/* Scroll Indicator（CSS animation，不占主线程） */}
      <div
        className="fixed bottom-10 right-10 archive-text text-[9px] opacity-30 tracking-widest vertical-rl hidden md:block mix-blend-difference animate-scrollBob"
      >
        {t(lang, "scrollToDiscover")}
      </div>

      {/* 移动端吸底章节跳转条 */}
      <SectionDock />
    </div>
  );
}
