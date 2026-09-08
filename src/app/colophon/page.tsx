"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { getLocalizedUrl } from "@/lib/path";

type Work = {
  id: string;
  name: string;
  nameEn: string;
  url: string;
  meta?: string;
  metaEn?: string;
  zh: string;
  en: string;
};

// ── 枢纽：其余作品的入口站 ────────────────────────────────────────────
const hubs: Work[] = [
  {
    id: "H1",
    name: "Xanthan 观测站 · 项目星系",
    nameEn: "Xanthan Observatory · Project Constellation",
    url: "https://xanthanl.github.io/",
    meta: "枢纽 / 3D 导航",
    metaEn: "HUB / 3D NAVIGATION",
    zh: "3D 太阳系风格的个人项目导航站——每一颗行星都是一个已部署上线的真实项目，点击行星即可跃迁前往。React 18 + TypeScript + Vite + Three.js，新增项目只需在数据表里加一条记录。",
    en: "A 3D solar-system navigation site for personal projects — every planet is a live, deployed project; click one to jump. React 18 + TypeScript + Vite + Three.js, with projects added by a single data record.",
  },
  {
    id: "H2",
    name: "GAME LAB 前端游戏实验场",
    nameEn: "GAME LAB — Frontend Playground",
    url: "https://xanthanl.github.io/game-lab/",
    meta: "枢纽 / 14 个子项目",
    metaEn: "HUB / 14 SUB-PROJECTS",
    zh: "一个纯前端的杂物间：主要是游戏，外加几座小站和小工具。索引上每一条只要能点开，就是已经部署好、直接能玩的东西——不用装、不用注册、也不用你构建。这也是一份关于「一个 HTML 文件到底能走多远」的草稿本。",
    en: "A pile of frontend things — games mostly, plus a few sites and small tools written because they ought to exist. Everything clickable on the index is already deployed and runs in the browser: no install, no account, no build step. It is also a scratchpad for one recurring question — how far can a single HTML file go?",
  },
];

// ── 作品索引：按性质分组，编号连续 ────────────────────────────────────
const groups: {
  key: string;
  label: string;
  labelEn: string;
  tag: string;
  tagEn: string;
  items: Work[];
}[] = [
  {
    key: "play",
    label: "游戏",
    labelEn: "PLAY",
    tag: "游戏",
    tagEn: "GAME",
    items: [
      {
        id: "01",
        name: "奇点回响",
        nameEn: "Singularity Echo",
        url: "https://xanthanl.github.io/game-lab/singularity-echo/",
        meta: "260 KB 单页 · 键鼠 / 触屏",
        metaEn: "260 KB PAGE · KB/M + TOUCH",
        zh: "惯性漂移的星域 roguelike 弹幕射击：三艘船体拖着彗尾出击，27 种模块升到 LV6 触发镀金质变，每 5 波巨像降临，第 30 波肃清后可无尽漂移。屏外目标在边缘留下同色亮点，进度自动缓存、关页可续。内置粒子引擎与 WebGL 星云——跑不动会自己降档。",
        en: "Inertia-drift asteroid-belt survival roguelike: three hulls trailing comet tails, 27 modules that level to LV6 and break through into gold, a colossus every 5th wave, endless drift after wave 30. Offscreen targets glow as same-coloured dots on the edge; runs auto-cache and resume. Vendored particle engine plus a WebGL nebula that sheds its own layers when a GPU falls behind.",
      },
      {
        id: "02",
        name: "微软大战代码",
        nameEn: "Microsoft vs. Code",
        url: "https://xanthanl.github.io/game-lab/microsoft-vs-code/",
        meta: "5 章 10 关",
        metaEn: "5 CHAPTERS × 10 LEVELS",
        zh: "梗图改编的恶搞塔防：把植物大战僵尸的元游戏整套搬进程序员世界——离线机房、冲突水道、祖传迷雾、只有抛过去的 bug 报告才打得动的跨域高墙。★ 经济 + npm 商店（鸭店主）+ 每行 Ctrl+Z，手机可玩。",
        en: "A meme-born tower-defense parody that ports the whole meta-game into programmer lore: offline server rooms, merge-conflict waterways, legacy-code fog, and a CORS wall only lobbed bug reports can breach. Star economy, an npm shop run by the rubber duck, a per-row Ctrl+Z.",
      },
      {
        id: "03",
        name: "植物大战僵尸",
        nameEn: "Plants vs Zombies",
        url: "https://xanthanl.github.io/game-lab/PVZ/",
        meta: "23 关 · 26 植物 · 17 僵尸",
        metaEn: "23 LEVELS · 26 PLANTS · 17 ZOMBIES",
        zh: "完整复刻：23 关 6 世界、2 个 Boss、阳光经济与波次节奏。美术全部由矢量代码绘制——仓库里没有一张游戏图片，是机制研究与零素材重写。",
        en: "A full recreation: 23 levels across 6 worlds, 2 bosses, sun economy and wave pacing. Every sprite is drawn in vector code — not one game image in the folder. A mechanics study, rebuilt from scratch.",
      },
      {
        id: "04",
        name: "强渡火星",
        nameEn: "Forcing Mars",
        url: "https://xanthanl.github.io/game-lab/forcing-mars/",
        meta: "Phaser 3 · 中英双语",
        metaEn: "PHASER 3 · BILINGUAL",
        zh: "杀戮尖塔式卡牌构筑：30 张卡 / 12 件遗物 / 6 种药水 / 4 个职业，从火星地表下潜到 2000 米地核，有真实结局。",
        en: "A Slay-the-Spire-like deckbuilder: 30 cards, 12 relics, 6 potions, 4 classes, descending three layers from the Martian surface to a 2,000 m core. A real ending, bilingual.",
      },
      {
        id: "05",
        name: "咒 · 怨宅",
        nameEn: "Cursed House",
        url: "https://xanthanl.github.io/game-lab/cursed-house/",
        meta: "单文件 · 5 章 6 图",
        metaEn: "SINGLE FILE · 5 CHAPTERS / 6 MAPS",
        zh: "第一人称中式恐怖：一个 HTML 文件里的 DDA 光线投射引擎。怨灵会 BFS 寻路、有视野锥，仪式推进后听觉越来越灵。衣柜躲藏、屏息机制、程序化 WebAudio，手机可玩。",
        en: "First-person Chinese horror with a DDA raycaster inside a single HTML file. The ghost runs BFS pathfinding, holds a view cone, and hears sharper as the ritual advances. Wardrobe hiding, breath-holding, procedural WebAudio.",
      },
      {
        id: "06",
        name: "欧陆风云 · 1444",
        nameEn: "Europa 1444",
        url: "https://xanthanl.github.io/game-lab/europa/",
        meta: "60+ 国家 · 纯静态",
        metaEn: "60+ NATIONS · STATIC",
        zh: "浏览器大战略：手绘欧洲 / 北非 / 安纳托利亚地图，60 多个国家 1444 开局，经济、外交、战争、围城与历史事件。无构建步骤。",
        en: "Browser grand strategy on a hand-drawn Europe / North Africa / Anatolia map: 60+ countries at the 1444 bookmark, with economy, diplomacy, war, sieges and historical events. No build step.",
      },
      {
        id: "07",
        name: "Vampire 2D",
        nameEn: "Vampire 2D",
        url: "https://xanthanl.github.io/game-lab/Vampire-2D/",
        meta: "45 KB 单文件",
        metaEn: "45 KB SINGLE FILE",
        zh: "顶视角自动攻击生存：5 种武器 6 种被动，升级三选一，180 秒起遭遇 Boss 并有鲜血狂潮事件，同屏 220 只。",
        en: "Top-down auto-attacking survival: 5 weapons, 6 passives, choose-one-on-level-up, bosses from 180 s and a Blood Frenzy event, 220 enemies on screen.",
      },
    ],
  },
  {
    key: "experiment",
    label: "实验",
    labelEn: "EXPERIMENT",
    tag: "实验",
    tagEn: "EXPERIMENT",
    items: [
      {
        id: "08",
        name: "像素舞台剧 · 十一部",
        nameEn: "Persona — Eleven Stage Plays",
        url: "https://xanthanl.github.io/game-lab/persona/",
        meta: "11 agent · 892–2219 行",
        metaEn: "11 AGENTS · 892–2219 LINES",
        zh: "同一句话原封不动发给 11 个 coding agent——「新建子目录，在前端实现一部像素动画舞台剧，从剧本到演出，纯前端」——得到 11 个答案：5 部改编《三体》，5 部各自在黑暗里点了一盏灯，1 部进了妖怪夜市。",
        en: "One brief issued verbatim to 11 coding agents — \"create a subfolder and implement a pixel-art animated stage play in the frontend, script to performance\" — and 11 answers: 5 adapt Three-Body, 5 independently put a lamp in the dark, 1 goes to a monster night market.",
      },
      {
        id: "09",
        name: "ASCII ∴ LAB",
        nameEn: "ASCII ∴ LAB",
        url: "https://xanthanl.github.io/game-lab/ascii-art/",
        meta: "6 字体 · 6 套笔触",
        metaEn: "6 FONTS · 6 STROKE SETS",
        zh: "把汉字或英文写成 ASCII 图：6 种字体（含 CJK 字形）、4 种字形、6 套笔触（经典字符、方块、笔刷、盲文），输出宽度 / gamma / 阈值可调，可复制图片、存 PNG 或复制纯文本。",
        en: "Turns Chinese or Latin text into ASCII art: 6 fonts (including CJK faces), 4 glyph styles, 6 stroke sets — classic ramp, blocks, brush strokes, braille — with adjustable width, gamma and threshold. Copy as image, save PNG, or copy plain text.",
      },
    ],
  },
  {
    key: "site",
    label: "站点与工具",
    labelEn: "SITES & TOOLS",
    tag: "站点",
    tagEn: "SITE",
    items: [
      {
        id: "10",
        name: "树言 · 旅记",
        nameEn: "Shuyan Travel",
        url: "https://xanthanl.github.io/game-lab/shuyan-travel/",
        meta: "53 篇 · 53 个地点",
        metaEn: "53 ENTRIES · 53 PLACES",
        zh: "私人旅行时间线：八年驾车，之后两年零一个月徒步走完西南 → 东北的对角线（雨崩到鹤岗）。路线用本地 vendored 的 Leaflet 画。这份行走，正是对角线计划这条线的来处。",
        en: "A private travel timeline: eight years of driving, then two years and a month walking the south-west → north-east diagonal from Yubeng to Hegang. Route map drawn with a locally vendored Leaflet. This walk is where the Diagonal line comes from.",
      },
      {
        id: "11",
        name: "NeonDAW",
        nameEn: "NeonDAW",
        url: "https://xanthanl.github.io/neon-daw/",
        meta: "React + Tone.js · 100% 客户端",
        metaEn: "REACT + TONE.JS · 100% CLIENT-SIDE",
        zh: "浏览器里的数字音频工作站：步进音序器、钢琴卷帘、带效果器的混音台、曲目编排、生成式轨道与离线 WAV 导出。全部在浏览器本地完成，不上传一个字节。",
        en: "A browser-based DAW — step sequencer, piano roll, mixer with FX, song arrangement, generative tracks and offline WAV export. Entirely client-side; not a byte leaves the machine.",
      },
      {
        id: "12",
        name: "Electric Mirage",
        nameEn: "Electric Mirage",
        url: "https://xanthanl.github.io/game-lab/XanthanLMusic/dist/",
        meta: "5 首 · 含 numpy 合成",
        metaEn: "5 TRACKS · INCL. NUMPY SYNTH",
        zh: "以 XanthanL 名义发布的 5 首曲子，站内流式播放（缓冲探测 / 重试 / 拖动 / 自动续播）。也收录《静电合唱团》——一首用 numpy 从零合成、自带 Web Audio 可视化的曲子。",
        en: "Five tracks released under the name XanthanL, streamed in place with buffer probing, retry, seek and auto-advance. Also hosts Choir of Static, a track synthesized from scratch in numpy with its own Web Audio visualizer.",
      },
      {
        id: "13",
        name: "金价观象台",
        nameEn: "Golden Wind",
        url: "https://xanthanl.github.io/game-lab/golden-wind/out/",
        meta: "Next.js 静态导出",
        metaEn: "NEXT.JS STATIC EXPORT",
        zh: "金价看板：实时报价、均线，以及用 lightweight-charts 标出的金叉 / 死叉。",
        en: "A gold dashboard: live quote, moving averages, and golden / death-cross markers drawn with lightweight-charts.",
      },
      {
        id: "14",
        name: "ARH · 意识形态坐标测试",
        nameEn: "ARH — Ideology Coordinate Test",
        url: "https://xanthanl.github.io/game-lab/ARH/dist/",
        meta: "7 维 · 30 / 65 / 95 题",
        metaEn: "7 AXES · 30 / 65 / 95 Q",
        zh: "七个维度的光谱定位问卷，提供 30 / 65 / 95 题三档长度。",
        en: "A seven-axis spectrum questionnaire, offered in three lengths — 30, 65 or 95 questions.",
      },
      {
        id: "15",
        name: "图印工坊",
        nameEn: "PicMark Studio",
        url: "https://xanthanl.github.io/picmark-studio/",
        meta: "纯前端 · 批量生成",
        metaEn: "PURE FRONTEND · BATCH",
        zh: "批量个性化图片生成工具——上传底图，标记文字位置，导入名单，一键生成并打包下载。图片全程不出浏览器。",
        en: "A batch image personalization tool — upload a base image, mark where text goes, import a name list, generate and download in one click. Images never leave the browser.",
      },
    ],
  },
  {
    key: "app",
    label: "应用与插件",
    labelEn: "APPS & PLUGINS",
    tag: "应用",
    tagEn: "APP",
    items: [
      {
        id: "16",
        name: "弦诵 XianSong",
        nameEn: "XianSong",
        url: "https://github.com/XanthanL/XianSong",
        meta: "Android · Kotlin · GPLv3",
        metaEn: "ANDROID · KOTLIN · GPLV3",
        zh: "离线优先的 Android 电子书阅读器：EPUB / PDF / TXT，分页与滚动双模式，书架子架与 SHA-256 去重。朗读基于 sherpa-onnx 的神经网络离线合成——不联网、不上传，高亮跟着念到的句子走。",
        en: "An offline-first Android reader for EPUB / PDF / TXT with paginated and scroll modes, sub-shelves and SHA-256 deduplication. Narration runs on sherpa-onnx neural TTS entirely on device — no network, no upload, highlight following the spoken sentence.",
      },
      {
        id: "17",
        name: "Photoria · Backrooms Camera",
        nameEn: "Photoria · Backrooms Camera",
        url: "https://github.com/XanthanL/backrooms-camera",
        meta: "Android · OpenGL ES 3.0 · Release ≈ 4 MB",
        metaEn: "ANDROID · OPENGL ES 3.0 · ~4 MB",
        zh: "原生 Android 相机：CameraX + Jetpack Compose + OpenGL ES 3.0 实时渲染管线，23 种滤镜各带三档预设。多帧预处理是真的在跑——HDR+ 做曝光包围对齐融合，夜景做时域降噪；复古 VHS 取景框会直接烧进视频文件。",
        en: "A native Android camera: CameraX + Jetpack Compose over an OpenGL ES 3.0 real-time pipeline, 23 filters with three presets each. The multi-frame pre-processing actually runs — HDR+ does burst alignment and fusion, Night Sight does temporal denoising — and the retro VHS overlay is burned into the video file.",
      },
      {
        id: "18",
        name: "dsh-plugin-uisfx",
        nameEn: "dsh-plugin-uisfx",
        url: "https://github.com/XanthanL/dsh-plugin-uisfx",
        meta: "DSH 插件 · 12 组音色包",
        metaEn: "DSH PLUGIN · 12 SOUND PACKS",
        zh: "为 DeepSeek Harness 写的语义化 UI 音效插件：任务开始 / 成功 / 失败、按钮反馈各有其声，设置页可即时试听，并允许其他插件调用。",
        en: "A semantic UI sound-effect plugin for DeepSeek Harness: distinct sounds for task start, success and failure plus button feedback, instant preview in settings, and an API other plugins can call.",
      },
    ],
  },
];

const totalWorks = hubs.length + groups.reduce((n, g) => n + g.items.length, 0);

// ── 制作者自述 ────────────────────────────────────────────────────────
const makerZh = [
  "XanthanL，本站的设计与开发者。写前端，也写游戏、小工具和两个 Android 应用；大部分东西开源在 GitHub，能跑在浏览器里的一律部署上线，点开就能用。",
  "他反复琢磨一个有点偏执的问题：一个 HTML 文件到底能走多远？于是有了塞进单文件的光线投射恐怖游戏、45 KB 的生存射击，以及把同一句话交给十一个 coding agent 后收到的十一部像素舞台剧。",
  "本站是他做的另一件事：一个从东北到西南的长期艺术项目的线上档案。这和他自己的行走并不矛盾——那条对角线的走向，最早出现在他自己的旅行时间线上。",
];

const makerEn = [
  "XanthanL — designer and developer of this site. He writes frontend, but also games, small tools and two Android apps. Most of it is open on GitHub, and anything that can run in a browser is deployed: click and it works.",
  "He keeps returning to one slightly obsessive question — how far can a single HTML file go? That produced a raycast horror game inside one file, a 45 KB survivor, and eleven pixel stage plays returned by eleven coding agents given the same one-line brief.",
  "This site is the other thing he builds: the online archive of a long-form art project running north-east to south-west across China. It is not separate from his own walking — the bearing of that diagonal first showed up on his own travel timeline.",
];

// ── 本站版本说明 ──────────────────────────────────────────────────────
const specZh: [string, string][] = [
  ["框架", "Next.js 14（App Router）+ TypeScript，全站静态导出"],
  ["样式", "Tailwind CSS；动效统一走自定义曲线令牌"],
  ["字体", "Inter（正文）· JetBrains Mono（标签与数值）· Newsreader + 思源宋体（标题）"],
  ["图像", "构建期生成多档 WebP 变体；远程图由 Cloudinary 协商格式"],
  ["三维", "天车、门楼两座子站为独立 vanilla Three.js 静态站，由单一登记表同步"],
  ["编辑", "自建后台 + TipTap 富文本，中英双语分栏撰写"],
  ["语言", "客户端 i18n，选择持久化于本地，路径不随语言变化"],
  ["部署", "GitHub Pages + 自定义域 www.diagonal-art.com"],
];

const specEn: [string, string][] = [
  ["FRAMEWORK", "Next.js 14 (App Router) + TypeScript, statically exported"],
  ["STYLING", "Tailwind CSS, with motion routed through shared easing tokens"],
  ["TYPEFACES", "Inter (body) · JetBrains Mono (labels, figures) · Newsreader + Noto Serif SC (display)"],
  ["IMAGES", "Multi-width WebP variants generated at build time; remote art negotiated via Cloudinary"],
  ["3D", "Two subsites — the derrick and the gatehouse — as standalone vanilla Three.js static builds, synced from one manifest"],
  ["EDITORIAL", "Self-built admin on TipTap, with parallel Chinese / English columns"],
  ["LANGUAGES", "Client-side i18n persisted locally; the URL never changes with language"],
  ["HOSTING", "GitHub Pages behind the custom domain www.diagonal-art.com"],
];

export default function ColophonPage() {
  const { lang } = useI18n();
  const zh = lang === "zh";

  return (
    <div className="relative overflow-hidden pt-32 min-h-screen bg-white text-black">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="diagonal-line opacity-5" />
      </div>

      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        {/* 顶部返回 */}
        <Link
          href={getLocalizedUrl("/")}
          className="archive-text text-[10px] opacity-65 hover:opacity-100 transition-opacity flex items-center gap-2 group w-fit mb-24"
        >
          <span className="group-hover:-translate-x-2 transition-transform">←</span>
          {zh ? "返回首页" : "BACK_HOME"}
        </Link>

        {/* 标题区 */}
        <header className="mb-24 space-y-6">
          <div className="archive-text text-xs text-diagonal-red font-bold tracking-[0.3em] border-l-2 border-diagonal-red pl-4">
            {zh ? "制作说明 / 作者" : "COLOPHON / THE MAKER"}
          </div>

          <h1 className="font-serif font-black tracking-tighter leading-none">
            <span className="block text-6xl md:text-9xl">{zh ? "制作说明" : "Colophon"}</span>
            <span className="block text-2xl md:text-4xl opacity-50 italic font-medium mt-4">
              {zh ? "Colophon" : "制作说明"}
            </span>
          </h1>

          <p className="archive-text text-[10px] opacity-55 tracking-[0.2em] pt-2">
            XANTHANL — {totalWorks} {zh ? "个项目 · 全部已部署上线" : "PROJECTS · ALL DEPLOYED"}
          </p>
        </header>

        {/* 01 · 关于制作者 */}
        <div className="mb-28">
          <SectionHeading index="01" label={zh ? "关于制作者" : "THE MAKER"} note="XANTHANL" />

          <div className="grid md:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-4 md:gap-10">
            <div className="archive-text text-[10px] opacity-45 tracking-[0.2em] md:pt-1">
              {zh ? "自述" : "STATEMENT"}
            </div>
            <div className="space-y-5 text-base md:text-lg leading-relaxed font-serif max-w-2xl">
              {(zh ? makerZh : makerEn).map((p, i) => (
                <p key={i} className={i === 0 ? "font-medium" : "opacity-75"}>
                  {p}
                </p>
              ))}

              <blockquote className="border-l-2 border-diagonal-red pl-5 py-1 my-8 font-serif italic text-lg opacity-80">
                {zh ? "「一个 HTML 文件到底能走多远？」" : "“How far can one HTML file go?”"}
              </blockquote>

              <p className="archive-text text-[10px] opacity-45 tracking-[0.15em] leading-loose">
                {zh
                  ? "另有两件无法在浏览器里跑的东西未公开：Protocol Extract（Godot 4.5）与一个 Minecraft Fabric 模组。"
                  : "Two things that cannot run in a browser stay unpublished: Protocol Extract (Godot 4.5) and a Minecraft Fabric mod."}
              </p>
            </div>
          </div>
        </div>

        {/* 02 · 枢纽 */}
        <div className="mb-28">
          <SectionHeading
            index="02"
            label={zh ? "枢纽" : "HUBS"}
            note={zh ? "两座入口站 · 其余作品都在里面" : "TWO ENTRY POINTS · EVERYTHING ELSE LIVES THERE"}
          />
          <div className="space-y-0">
            {hubs.map((w) => (
              <HubRow key={w.id} work={w} zh={zh} />
            ))}
          </div>
        </div>

        {/* 03 · 作品索引 */}
        <div className="mb-28">
          <SectionHeading
            index="03"
            label={zh ? "作品索引" : "INDEX OF WORKS"}
            note={`${groups.reduce((n, g) => n + g.items.length, 0)} ${zh ? "项 · 按性质分组" : "ENTRIES · GROUPED BY KIND"}`}
          />
          {groups.map((g) => (
            <div key={g.key} className="mb-14">
              <div className="flex items-baseline gap-4 mb-5">
                <h3 className="archive-text text-[11px] font-bold tracking-[0.2em]">
                  {zh ? g.label : g.labelEn}
                </h3>
                <span className="archive-text text-[9px] opacity-45 tracking-[0.2em]">
                  {String(g.items.length).padStart(2, "0")}
                </span>
                <span className="flex-1 h-px bg-black/10" />
              </div>
              <div className="space-y-0">
                {g.items.map((w) => (
                  <WorkRow key={w.id} work={w} zh={zh} tag={zh ? g.tag : g.tagEn} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 04 · 本站版本说明 */}
        <div className="mb-32">
          <SectionHeading
            index="04"
            label={zh ? "本站版本说明" : "THIS SITE, IN SPEC"}
            note={zh ? "对角线计划 · 线上档案" : "DIAGONAL · ONLINE ARCHIVE"}
          />
          <dl className="border-t border-black/10">
            {(zh ? specZh : specEn).map(([k, v]) => (
              <div
                key={k}
                className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-8 border-b border-black/5 py-4"
              >
                <dt className="archive-text text-[10px] tracking-[0.2em] opacity-55 w-28 shrink-0">
                  {k}
                </dt>
                <dd className="font-serif text-sm md:text-base opacity-80 leading-relaxed max-w-2xl">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <p className="archive-text text-[10px] opacity-45 tracking-[0.15em] mt-6 leading-loose">
            {zh
              ? "本站亦是 Xanthan 观测站星系中的 02 号天体——一颗气态巨星。"
              : "This site is also body 02 in the Xanthan Observatory constellation — a gas giant."}
          </p>
        </div>

        {/* 底部落款 */}
        <div className="archive-text text-[9px] opacity-45 tracking-[0.2em] border-t border-black/10 pt-8 pb-12">
          {zh
            ? "网站设计与开发 — XANTHANL / 对角线计划"
            : "SITE DESIGN & DEVELOPMENT — XANTHANL / DIAGONAL PROJECT"}
        </div>
      </section>
    </div>
  );
}

// ── 小节标题 ──────────────────────────────────────────────────────────
function SectionHeading({
  index,
  label,
  note,
}: {
  index: string;
  label: string;
  note: string;
}) {
  return (
    <div className="mb-10 border-t border-black/10 pt-8">
      <div className="flex items-baseline gap-4">
        <span className="archive-text text-[10px] text-diagonal-red font-bold tracking-[0.2em]">
          {index}
        </span>
        <h2 className="archive-text text-sm font-bold tracking-[0.2em] opacity-80">{label}</h2>
      </div>
      <p className="archive-text text-[10px] opacity-50 tracking-[0.15em] mt-2">{note}</p>
    </div>
  );
}

// ── 枢纽行（更大的卡片式条目）─────────────────────────────────────────
function HubRow({ work, zh }: { work: Work; zh: boolean }) {
  return (
    <a
      href={work.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border-b border-black/10 py-8 hover:bg-black/[0.02] transition-colors"
    >
      <div className="flex items-baseline gap-3 flex-wrap mb-3">
        <span className="text-xl md:text-2xl font-serif font-bold leading-snug group-hover:text-diagonal-red transition-colors">
          {zh ? work.name : work.nameEn}
        </span>
        <span className="archive-text text-[9px] opacity-55 tracking-[0.2em] border border-black/15 px-1.5 py-0.5">
          {zh ? work.meta : work.metaEn}
        </span>
        <span className="archive-text text-[10px] opacity-45 group-hover:opacity-100 group-hover:translate-x-1 transition-[opacity,transform] duration-200 ease-out-strong">
          ↗
        </span>
      </div>
      <p className="text-sm md:text-base opacity-70 font-serif leading-relaxed max-w-3xl">
        {zh ? work.zh : work.en}
      </p>
    </a>
  );
}

// ── 作品行 ────────────────────────────────────────────────────────────
function WorkRow({ work, zh, tag }: { work: Work; zh: boolean; tag: string }) {
  return (
    <a
      href={work.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-8 border-b border-black/5 py-6 hover:bg-black/[0.02] transition-colors"
    >
      <span className="archive-text text-xs opacity-55 w-8 shrink-0 tracking-wider">{work.id}</span>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-lg font-serif font-bold leading-snug group-hover:text-diagonal-red transition-colors">
            {zh ? work.name : work.nameEn}
          </span>
          <span className="archive-text text-[9px] opacity-55 tracking-[0.2em] border border-black/15 px-1.5 py-0.5">
            {tag}
          </span>
        </div>
        <p className="text-sm opacity-65 font-serif leading-relaxed max-w-2xl">
          {zh ? work.zh : work.en}
        </p>
        {work.meta && (
          <p className="archive-text text-[9px] opacity-40 tracking-[0.15em] pt-1">
            {zh ? work.meta : work.metaEn}
          </p>
        )}
      </div>
      <span className="archive-text text-[10px] opacity-55 group-hover:opacity-100 group-hover:translate-x-1 transition-[opacity,transform] duration-200 ease-out-strong shrink-0">
        ↗
      </span>
    </a>
  );
}
