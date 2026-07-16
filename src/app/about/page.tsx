"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { getLocalizedUrl } from "@/lib/path";

// 项目时间线（左边时间 / 右边事件，中英双语）
const timeline = [
  {
    date: "2024.12",
    zh: "鹤岗城市实验 / 黑龙江",
    en: "Hegang City Experiment / Heilongjiang",
  },
  {
    date: "2026.03",
    zh: "生命之盐 1.0 驻留 / 自贡",
    en: "The Salt of Life 1.0 Residency / Zigong",
  },
  {
    date: "2026.04",
    zh: "重走盐道 / 贡井老街",
    en: "Retracing the Salt Road / Gongjing Old Street",
  },
  {
    date: "2026.05",
    zh: "生命之盐 1.0 成果展 / 自贡",
    en: "The Salt of Life 1.0 Outcomes Exhibition / Zigong",
  },
  {
    date: "2026.05",
    zh: "生命之盐 2.0 驻留 / 自贡",
    en: "The Salt of Life 2.0 Residency / Zigong",
  },
  {
    date: "2026.06.27",
    zh: "生命之盐当代艺术展览开幕 / 自流井老街",
    en: "The Salt of Life Contemporary Art Exhibition Opens / Ziliujing Old Street",
  },
  {
    date: "2026.07.04",
    zh: "分享会 / 自贡市图书馆",
    en: "Sharing Session / Zigong Library",
  },
  {
    date: "2026.07.07",
    zh: "旅行的艺术沙龙 / 自贡",
    en: "The Art of Travel Salon / Zigong",
  },
];

// 核心团队（4 人，中英双语）
const team = [
  {
    name: "孙晓鸣",
    nameEn: "Kerribin",
    role: "策展人 / 发起人",
    roleEn: "CURATOR / FOUNDER",
    bio: "跨媒介创作者、研究者与艺术管理者。",
    bioEn: "Intermedia creator, researcher, and art manager.",
  },
  {
    name: "彭玮雯",
    nameEn: "Vivienne Peng",
    role: "联合发起人 / 展览执行",
    roleEn: "CO-FOUNDER / EXHIBITION EXECUTIVE",
    bio: "普利茅斯大学博士候选人。跨媒介艺术家、社会参与式艺术研究者。",
    bioEn:
      "PhD candidate at University of Plymouth. Intermedia artist and socially engaged art researcher.",
  },
  {
    name: "兰雅杰",
    nameEn: "Lannie",
    role: "空间设计",
    roleEn: "SPATIAL DESIGN",
    bio: "毕业于雪城大学建筑学院。",
    bioEn: "Graduated from Syracuse University School of Architecture.",
  },
  {
    name: "Christian",
    nameEn: "",
    role: "策展助理",
    roleEn: "CURATORIAL ASSISTANT",
    bio: "四川大学艺术学研究生。",
    bioEn: "Graduate student in Art, Sichuan University.",
  },
];

// 项目介绍（中英双语，使用原版单段长文）
const introZh = [
  "对角线计划，缘起从东北到西南的身体游走，游走构成了中国版图上一条从“草原森林平原”地区到“山地高地”地区的对应线，这条线也与当年胡焕庸的从东北黑河到西南腾冲线呼应。从自然地理到人文经济，从近百年前到当代社会，从农业传统到工业繁荣，我们试图寻找和关联共同的意象、符号、理念与精神，以艺术的形式呈现两个地区的多样风貌，实践与理论结合，并尝试总结一些有效的方法，以促进和影响在地生态的演进。",
];

const introEn = [
  "The Diagonal, which originated from the body from the northeast to the southwest, formed a corresponding line from the \"grassland, forest plain\" to the \"mountain highland\" area on the Chinese map, and this line also echoed Hu Huanyong's Tengchong line from the Heihe in the northeast to the southwest. From physical geography to human economy, from nearly a hundred years ago to contemporary society, from agricultural tradition to industrial prosperity, we try to find and relate common images, symbols, ideas and spirits, present the diverse features of the two regions in the form of art, combine practice and theory, and try to summarize some effective methods to promote and influence the evolution of local ecology.",
];

export default function AboutPage() {
  const { lang } = useI18n();
  const intro = lang === "zh" ? introZh : introEn;

  return (
    <div className="relative overflow-hidden pt-32 min-h-screen bg-white text-black">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="diagonal-line opacity-5" />
      </div>

      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        {/* 顶部返回 */}
        <Link
          href={getLocalizedUrl("/")}
          className="archive-text text-[10px] opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2 group w-fit mb-24"
        >
          <span className="group-hover:-translate-x-2 transition-transform">←</span>
          {lang === "zh" ? "返回首页" : "BACK_HOME"}
        </Link>

        {/* 标题区 */}
        <header className="mb-32 space-y-6">
          <div className="archive-text text-xs text-diagonal-red font-bold tracking-[0.3em] border-l-2 border-diagonal-red pl-4">
            {lang === "zh" ? "关于" : "ABOUT"}
          </div>

          <h1 className="font-serif font-black tracking-tighter leading-none">
            <span className="block text-6xl md:text-9xl">
              {lang === "zh" ? "对角线计划" : "Diagonal"}
            </span>
            <span className="block text-2xl md:text-4xl opacity-40 italic font-medium mt-4">
              {lang === "zh" ? "Diagonal" : "对角线计划"}
            </span>
          </h1>
        </header>

        {/* 项目介绍 */}
        <div className="mb-32 max-w-3xl space-y-6 text-lg leading-relaxed">
          {intro.map((para, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={i === 0 ? "text-xl font-medium" : "opacity-80"}
            >
              {para}
            </motion.p>
          ))}
        </div>

        {/* 时间线 */}
        <div className="mb-32">
          <h2 className="archive-text text-sm font-bold tracking-[0.2em] opacity-70 mb-12 border-t border-black/10 pt-8">
            {lang === "zh" ? "项目时间线" : "TIMELINE"}
          </h2>
          <div className="space-y-6">
            {timeline.map((node, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-baseline gap-8 border-b border-black/5 pb-4"
              >
                <span className="archive-text text-xs opacity-50 w-28 shrink-0 tracking-wider">
                  {node.date}
                </span>
                <span className="text-lg leading-snug">
                  {lang === "zh" ? node.zh : node.en}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 核心团队 */}
        <div className="mb-32">
          <h2 className="archive-text text-sm font-bold tracking-[0.2em] opacity-70 mb-12 border-t border-black/10 pt-8">
            {lang === "zh" ? "核心团队" : "CORE_TEAM"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="space-y-2"
              >
                <div className="text-2xl font-bold tracking-tight">
                  {lang === "zh" ? member.name : member.nameEn || member.name}
                  {member.nameEn && lang === "zh" && (
                    <span className="text-base opacity-50 italic ml-3">
                      {member.nameEn}
                    </span>
                  )}
                </div>
                <div className="archive-text text-[10px] tracking-[0.2em] opacity-60">
                  {lang === "zh" ? member.role : member.roleEn}
                </div>
                <p className="text-sm opacity-70 leading-relaxed mt-2">
                  {lang === "zh" ? member.bio : member.bioEn}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 联系方式 */}
        <div>
          <h2 className="archive-text text-sm font-bold tracking-[0.2em] opacity-70 mb-12 border-t border-black/10 pt-8">
            {lang === "zh" ? "联系方式" : "CONTACT"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="archive-text text-[10px] opacity-50 tracking-[0.2em]">
                {lang === "zh" ? "邮箱" : "EMAIL"}
              </div>
              <div className="archive-text text-sm opacity-60 italic">
                {lang === "zh" ? "暂定" : "TBD"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="archive-text text-[10px] opacity-50 tracking-[0.2em]">
                {lang === "zh" ? "微信" : "WECHAT"}
              </div>
              <div className="archive-text text-sm">
                Diagonal {lang === "zh" ? "对角线计划" : ""}
              </div>
            </div>
            <div className="space-y-2">
              <div className="archive-text text-[10px] opacity-50 tracking-[0.2em]">
                {lang === "zh" ? "网站" : "WEBSITE"}
              </div>
              <a
                href="https://www.diagonal-art.com"
                className="archive-text text-sm underline hover:text-diagonal-red transition-colors"
              >
                www.diagonal-art.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
