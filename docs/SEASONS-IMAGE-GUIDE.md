# DIAGONAL 四季主题 · 图片生成指南

> 给生图用的一份可执行清单。目标：让夏、秋、冬三套素材和已经做好的**春（草木主题 herbarium）**说同一种语言——纸本植物标本册，而不是三套新的插画风格。
>
> 春不用重做。本文只描述夏秋冬要生成的图；每季 9 类，三季共 27 张。你把这些图生成好放回指定目录，剩下的接入由我完成。

---

## 0. 先记住三条（每季每张图都适用）

1. **同一套语言，只换季相与色温。** 画面始终是"旧纸 + 植物标本 + 细墨线 + 低饱和水彩"，靠植物的种类、枯荣状态和纸色区分季节。不要换成节日插画、节气海报、扁平矢量或油画。
2. **纯画面，零文字。** 任何图里都不要出现文字、字母、数字、编号、水印、标签、签名、边框。印章那张是"双线圆环"图形，环内保持空白——字是后期用 HTML 叠上去的。
3. **给字标留白。** 竖幅扉页与桌面横幅这两张带"站名区"，画面主体压在另一侧，站名区留干净纸面；HTML 会把 `DIAGONAL` 字标叠在那里。

纸本标本册的克制感优先于"好看的元素"。宁可少画一枝，不要多堆一层。

---

## 1. 四季色卡（硬约束，生成时照这个走）

每季 5 个颜色，用途固定。生成图的主色/纸色要落在对应行，不要串行。

| 角色 | 春（已完成·基准） | 夏 | 秋 | 冬 |
|---|---|---|---|---|
| 纸底 bg | `#F3F1E7` 暖象牙 | `#EFF1E6` 偏青米白 | `#F4EEE0` 微黄旧纸 | `#EFF1F1` 冷灰白 |
| 墨 ink | `#1F2419` 偏绿墨 | `#16251C` 深叶绿 | `#2A2118` 褐墨 | `#1B2226` 冷蓝墨 |
| 点色 accent | `#7D1C18` 山茶暗红 | `#A64228` 熟朱 | `#8E3A1C` 柿赭 | `#7C2C2A` 冬青红 |
| 叶色 green | `#6D8438` 橄榄绿 | `#3E7A3F` 浓叶绿 | `#9A6E2E` 枯黄 | `#5A6B6E` 灰绿 |
| 线 line | `rgba(31,36,25,.16)` | `rgba(22,37,28,.16)` | `rgba(42,33,24,.16)` | `rgba(27,34,38,.16)` |

**读法**：`bg` 是纸、`ink` 是枝干细线、`accent` 只点花心/果实、`green` 是叶子的主色、`line` 是拱窗那类细轮廓。一季之内不要跳到别的色卡去——比如夏的图里出现秋天的枯黄，就会在整页里显得脏。

**季相的植物语汇**（决定画面画什么，不写进文档以外的说明文字）：

- **夏**：浓绿的阔叶、竹、狗尾草、半开的莲或石榴花；叶面饱满、有水气，不要枯边。
- **秋**：银杏、枫、枯莲蓬、稻穗、脱落的种荚；黄褐为主，允许卷边、缺口、斑。
- **冬**：松针、腊梅、山茶、秃枝、残叶；灰绿与褐枝，花少而精，留白最多。

---

## 2. 交付规范（目录、命名、格式）

文件放进下面目录，名字一字不差。脚本按名字找文件，错一个字就接不上。

```
public/images/seasons/
├── summer/
│   ├── paper-grain_tile.png           不透明 RGB
│   ├── press-1_2x3.png                透明 RGBA
│   ├── press-2_2x3.png                透明 RGBA
│   ├── press-3_2x3.png                透明 RGBA
│   ├── press-rule_4x1.png             透明 RGBA
│   ├── plate-specimen_4x5.png         透明 RGBA
│   ├── hero-botanical-portrait_3x4.png 透明 RGBA
│   ├── seal_1x1.png                   透明 RGBA
│   └── hero-botanical.jpg             不透明 RGB
├── autumn/   （同名 9 张）
└── winter/   （同名 9 张）
```

- **格式**：纸纹和桌面横幅用 JPG/PNG 不透明底；其余 7 类必须**真透明背景 RGBA**（PNG），不是白底、不是纯色底后期抠。
- **尺寸**：按第 3 节每张图标注的像素生成，最小不要低于标注值；放大可以，缩小会糊。
- **不要**在文件名里加季节前缀、编号后缀、`final`、`v2` 之类。目录名已经区分了季节。
- 生成完直接把文件放进对应目录，告诉我"X 季好了"，我会跑处理脚本接入。

---

## 3. 每张图的提示词（27 张）

提示词是可直接复制的整段文字。每张都给了**尺寸 / 画面 / 提示词 / 负面词 / 站点用途**。同一类的三季只在植物与色值上不同，构图要求完全一致——这样接入后版式不用改。

### 3.1 纸纹 `paper-grain_tile.png`

> 不透明 RGB · 2400×2400（2×2 镜像无缝）· 春已有，夏秋冬各生成一张
> 用途：整页 body 的"纸"，平铺。决定全页底色和纸浆质感。

**夏 · 提示词**

```
Seamless tileable paper texture, flat top-down scan of a single sheet of off-white paper with a cool green undertone, base color approximately #EFF1E6. Extremely subtle fiber grain and pulp variation, soft even daylight, no shadows, no objects, no vignette. The texture must repeat perfectly in a 2x2 mirrored tile — no visible seams on any edge, no directional gradient, no distinct marks near borders. Muted, calm, archival paper. High resolution, flat even lighting.
```

**秋 · 提示词**

```
Seamless tileable paper texture, flat top-down scan of a single sheet of slightly yellowed aged paper, base color approximately #F4EEE0. Extremely subtle fiber grain and faint foxing, soft even daylight, no shadows, no objects, no vignette. The texture must repeat perfectly in a 2x2 mirrored tile — no visible seams on any edge, no directional gradient, no distinct marks near borders. Warm, quiet, old herbarium paper. High resolution, flat even lighting.
```

**冬 · 提示词**

```
Seamless tileable paper texture, flat top-down scan of a single sheet of cool pale grey-white paper, base color approximately #EFF1F1. Extremely subtle fiber grain, a faint cold bluish cast, soft even daylight, no shadows, no objects, no vignette. The texture must repeat perfectly in a 2x2 mirrored tile — no visible seams on any edge, no directional gradient, no distinct marks near borders. Sparse, clean, cold archival paper. High resolution, flat even lighting.
```

**负面词（三季通用）**：`text, letters, numbers, watermark, logo, strong pattern, dark spots, stains, vignette, gradient, folded edge, object, shadow`

> 注意：纸纹的明度跨度要极小（春的源图标准差只有约 1.6/255）。看起来"几乎纯色"是对的，处理脚本会再把纤维对比放大到可辨。**不要**为了"有质感"故意画重纹理——铺满整页会显脏。

---

### 3.2 压花枝 `press-1_2x3.png` / `press-2_2x3.png` / `press-3_2x3.png`

> 透明 RGBA · 各 1000×1500（竖幅 2:3）· 三张一组，三种走向
> 用途：首屏背景水印，压在文字之下（z-index:-1），所以画面要"实体集中在中部、四周透明"，处理脚本会按 alpha 包围盒裁掉空白。

**三张的姿态固定**（三季都一样）。下面提示词里的 `{POISE}` 按这张表替换成对应英文短语再生成：

- `press-1` → `rising from the lower right toward the upper left`（上扬枝，右下→左上）
- `press-2` → `hanging from the upper left toward the lower right`（垂落枝，左上→右下）
- `press-3` → `running diagonally from the lower left toward the upper right`（横斜枝，左下→右上）

**夏 · 提示词**（把 `{POISE}` 换成上面一种）

```
A single pressed botanical specimen of summer foliage, {POISE}, isolated on a fully transparent background, no shadow, no ground. Lush saturated green leaves (#3E7A3F), possibly bamboo leaves or a broad leaf sprig, a small ripe vermilion flower or berry (#A64228) as the only accent. Delicate dark green ink outlines (#16251C) and soft watercolor wash, pressed-flower herbarium plate aesthetic. Branches and leaves concentrated in the central area of the canvas, generous fully transparent margins on all four sides, edges softly fading out. No text, no border, no frame, no paper background. Museum botanical illustration, restrained, high detail, PNG with alpha.
```

**秋 · 提示词**

```
A single pressed botanical specimen of autumn foliage, {POISE}, isolated on a fully transparent background, no shadow, no ground. Dried yellow-brown leaves (#9A6E2E) — ginkgo or maple — with curled edges and small blemishes, a few persimmon-orange seed pods (#8E3A1C) as the only accent. Delicate brown ink outlines (#2A2118) and soft watercolor wash, pressed-flower herbarium plate aesthetic. Branches and leaves concentrated in the central area of the canvas, generous fully transparent margins on all four sides, thin fading edges. No text, no border, no frame, no paper background. Museum botanical illustration, restrained, high detail, PNG with alpha.
```

**冬 · 提示词**

```
A single pressed botanical specimen of winter foliage, {POISE}, isolated on a fully transparent background, no shadow, no ground. Sparse grey-green pine needles or bare twigs (#5A6B6E), one or two small dark red winter berry or camellia (#7C2C2A) as the only accent, lots of negative space. Delicate cool dark ink outlines (#1B2226) and very light watercolor wash, pressed-flower herbarium plate aesthetic. Branches concentrated in the central area of the canvas, generous fully transparent margins on all four sides, thin fading edges. No text, no border, no frame, no paper background. Museum botanical illustration, restrained, high detail, PNG with alpha.
```

**负面词（三季通用）**：`text, letters, numbers, watermark, white background, solid background, shadow, ground, pot, frame, border, label, tag, illustration of a whole scene, dense composition, bright neon color`

> 透明是关键。很多生图工具默认给纯色底——如果拿到的是白底图告诉我，我这边能抠，但边缘会比真 alpha 差。**务必让画面四周干脆地透明**，别在角上留水印块。

---

### 3.3 横贯分隔带 `press-rule_4x1.png`

> 透明 RGBA · 2800×700（横幅 4:1）· 春已有，夏秋冬各生成一张
> 用途：板块之间的横向压花分隔带。处理脚本会裁掉留白、压成 1600×300 并给四边做渐隐，所以你只要保证"一条横向的花枝带"。

**夏 · 提示词**

```
A wide horizontal band of pressed summer foliage, stretched left to right across the frame, isolated on a fully transparent background. A continuous slender vine with saturated green leaves (#3E7A3F) and one or two small vermilion accents (#A64228), thin dark green ink lines (#16251C), soft watercolor wash. The specimen runs horizontally through the middle of the canvas; the top and bottom thirds are mostly empty and fully transparent. No text, no border, no frame, no background. Herbarium plate, restrained, high detail, PNG with alpha.
```

**秋 · 提示词**

```
A wide horizontal band of pressed autumn foliage, stretched left to right across the frame, isolated on a fully transparent background. A continuous slender branch with yellow-brown leaves (#9A6E2E), curled edges, one or two persimmon-orange accents (#8E3A1C), thin brown ink lines (#2A2118), soft watercolor wash. The specimen runs horizontally through the middle of the canvas; the top and bottom thirds are mostly empty and fully transparent. No text, no border, no frame, no background. Herbarium plate, restrained, high detail, PNG with alpha.
```

**冬 · 提示词**

```
A wide horizontal band of pressed winter foliage, stretched left to right across the frame, isolated on a fully transparent background. A continuous slender branch of grey-green pine or bare twigs (#5A6B6E) with one or two small dark red berries (#7C2C2A), thin cool dark ink lines (#1B2226), very light watercolor wash. The specimen runs horizontally through the middle of the canvas; the top and bottom thirds are mostly empty and fully transparent. No text, no border, no frame, no background. Herbarium plate, restrained, high detail, PNG with alpha.
```

**负面词（三季通用）**：`text, letters, numbers, watermark, solid background, white background, vertical composition, dense filling, frame, border, label`

---

### 3.4 拱窗标本卡 `plate-specimen_4x5.png`

> 透明 RGBA · 1200×1500（4:5）· 春已有，夏秋冬各生成一张
> 用途：无封面文章的占位封套。一株标本 + 极细的拱形单线轮廓，铺满卡片。轮廓线要细，别画成窗框。

**夏 · 提示词**

```
A single pressed botanical specimen displayed inside a very thin hand-drawn arch outline — one continuous hairline, no double line, no frame thickness. The arch is drawn in faint dark green ink (#16251C) at low opacity. Inside it, one summer plant specimen: saturated green leaves (#3E7A3F) with a small vermilion flower (#A64228), delicate watercolor wash and fine ink detail. The arch and plant sit on a fully transparent background with no paper fill. Vertical 4:5 composition, specimen centered and complete, small even margins around the arch. No text, no letters, no label, no numbers, no watermark. Museum herbarium plate, restrained, high detail, PNG with alpha.
```

**秋 · 提示词**

```
A single pressed botanical specimen displayed inside a very thin hand-drawn arch outline — one continuous hairline, no double line, no frame thickness. The arch is drawn in faint brown ink (#2A2118) at low opacity. Inside it, one autumn plant specimen: yellow-brown ginkgo or maple leaves (#9A6E2E) with curled edges and a persimmon-orange seed pod (#8E3A1C), delicate watercolor wash and fine ink detail. The arch and plant sit on a fully transparent background with no paper fill. Vertical 4:5 composition, specimen centered and complete, small even margins around the arch. No text, no letters, no label, no numbers, no watermark. Museum herbarium plate, restrained, high detail, PNG with alpha.
```

**冬 · 提示词**

```
A single pressed botanical specimen displayed inside a very thin hand-drawn arch outline — one continuous hairline, no double line, no frame thickness. The arch is drawn in faint cool dark ink (#1B2226) at low opacity. Inside it, one winter plant specimen: sparse grey-green pine needles or a bare twig (#5A6B6E) with one small dark red berry (#7C2C2A), very light watercolor wash and fine ink detail, lots of negative space. The arch and plant sit on a fully transparent background with no paper fill. Vertical 4:5 composition, specimen centered and complete, small even margins around the arch. No text, no letters, no label, no numbers, no watermark. Museum herbarium plate, restrained, high detail, PNG with alpha.
```

**负面词（三季通用）**：`text, letters, numbers, watermark, label, tag, thick frame, ornate border, double outline, solid background, white background, multiple specimens, cropped plant`

---

### 3.5 竖幅扉页 `hero-botanical-portrait_3x4.png`

> 透明 RGBA · 1200×1600（竖幅 3:4）· 春已有，夏秋冬各生成一张
> 用途：手机端首页首屏。**画面主体压在右半边与下半边，左上到中部留出干净的站名区**（HTML 把 `DIAGONAL` 叠在那里）。四边约 15% 渐隐到透明。

**夏 · 提示词**

```
Vertical 3:4 hero illustration for a botanical specimen archive, on a fully transparent background. Composition: a lush summer botanical spray — saturated green leaves (#3E7A3F), bamboo or broad leaves, a small vermilion flower (#A64228) — rising along the RIGHT side and lower area, with thin dark green ink lines (#16251C) and soft watercolor wash. The upper-left and central-left area is left as clean empty transparent space for a large title to be added later. A very soft pale grey-green wash glow sits behind the foliage only. Edges fade to transparent on all four sides over about 15%. No text, no letters, no numbers, no watermark, no frame, no solid background. Restrained, elegant, high detail, PNG with alpha.
```

**秋 · 提示词**

```
Vertical 3:4 hero illustration for a botanical specimen archive, on a fully transparent background. Composition: an autumn botanical spray — yellow-brown ginkgo or maple leaves (#9A6E2E) with curled edges, a persimmon-orange pod (#8E3A1C) — rising along the RIGHT side and lower area, with thin brown ink lines (#2A2118) and soft watercolor wash. The upper-left and central-left area is left as clean empty transparent space for a large title to be added later. A very soft pale warm wash glow sits behind the foliage only. Edges fade to transparent on all four sides over about 15%. No text, no letters, no numbers, no watermark, no frame, no solid background. Restrained, elegant, high detail, PNG with alpha.
```

**冬 · 提示词**

```
Vertical 3:4 hero illustration for a botanical specimen archive, on a fully transparent background. Composition: a sparse winter botanical spray — grey-green pine needles or bare twigs (#5A6B6E), one or two small dark red berries (#7C2C2A) — rising along the RIGHT side and lower area, with thin cool dark ink lines (#1B2226) and very light watercolor wash, lots of negative space. The upper-left and central-left area is left as clean empty transparent space for a large title to be added later. A very soft pale cold-grey wash glow sits behind the foliage only. Edges fade to transparent on all four sides over about 15%. No text, no letters, no numbers, no watermark, no frame, no solid background. Restrained, elegant, high detail, PNG with alpha.
```

**负面词（三季通用）**：`text, letters, numbers, watermark, logo, frame, border, solid background, white background, title, caption, centered composition, foliage on the left`

---

### 3.6 双线印章 `seal_1x1.png`

> 透明 RGBA · 1200×1200（1:1）· 春已有，夏秋冬各生成一张
> 用途：文章页脚正中一枚压印。**双线圆环，环内空白**——处理脚本会把线条加深，所以画淡一点没关系，但线要连续、闭合、同心。

**夏 · 提示词**

```
A small circular seal stamp graphic, two concentric hand-drawn rings only, thin even lines in dark green (#16251C), simple and slightly imperfect ink texture like a rubber stamp. The interior of the inner ring is completely empty and transparent — no characters, no symbols, no image. Isolated on a fully transparent background, no shadow. Centered, 1:1 square, generous transparent margin around the rings. No text, no letters, no numbers, no watermark. Minimal, clean, PNG with alpha.
```

**秋 · 提示词**

```
A small circular seal stamp graphic, two concentric hand-drawn rings only, thin even lines in brown-black (#2A2118), simple and slightly imperfect ink texture like a rubber stamp. The interior of the inner ring is completely empty and transparent — no characters, no symbols, no image. Isolated on a fully transparent background, no shadow. Centered, 1:1 square, generous transparent margin around the rings. No text, no letters, no numbers, no watermark. Minimal, clean, PNG with alpha.
```

**冬 · 提示词**

```
A small circular seal stamp graphic, two concentric hand-drawn rings only, thin even lines in cool dark blue-black (#1B2226), simple and slightly imperfect ink texture like a rubber stamp. The interior of the inner ring is completely empty and transparent — no characters, no symbols, no image. Isolated on a fully transparent background, no shadow. Centered, 1:1 square, generous transparent margin around the rings. No text, no letters, no numbers, no watermark. Minimal, clean, PNG with alpha.
```

**负面词（三季通用）**：`text, letters, numbers, characters, symbols, watermark, logo, filled circle, solid disk, more than two rings, broken line, shadow, background`

---

### 3.7 桌面横幅题图 `hero-botanical.jpg`

> 不透明 JPG · 1920×974（宽幅约 2:1）· 春已有，夏秋冬各生成一张
> 用途：桌面端首页首屏。**这张图上要同时放藤蔓和站名**——但站名由 HTML 叠上去，你生成时只需在左侧留出干净的站名区，不要自己画字。

参考春的构图（见下图意）：左侧是大块柔色晕 + 两行大字的留白，一枝藤蔓从右下斜向上穿过中部到右上。右下角还有一扇圆形开窗让背景压花透出来。

**夏 · 提示词**

```
Wide 2:1 hero banner for a botanical specimen archive, no text. A sheet of pale cool green-white paper (#EFF1E6) as the background. On the LEFT side, a soft large blush of pale green wash (like out-of-focus light), and a wide clean empty area reserved for a large title to be added later — keep it calm and uncluttered. A delicate summer botanical vine with saturated green leaves (#3E7A3F) and one or two small vermilion flowers (#A64228), drawn in fine dark green ink (#16251C) with soft watercolor, enters from the LOWER RIGHT and sweeps diagonally up across the lower-middle toward the UPPER RIGHT. The upper-left stays clean. The lower-right corner has a slightly softer, lighter area. Restrained, elegant, paper texture, lots of negative space, museum botanical plate aesthetic. No letters, no words, no numbers, no watermark, no frame.
```

**秋 · 提示词**

```
Wide 2:1 hero banner for a botanical specimen archive, no text. A sheet of pale warm yellowed paper (#F4EEE0) as the background. On the LEFT side, a soft large blush of pale amber wash (like out-of-focus light), and a wide clean empty area reserved for a large title to be added later — keep it calm and uncluttered. A delicate autumn botanical branch with yellow-brown ginkgo or maple leaves (#9A6E2E), curled edges, one or two persimmon-orange pods (#8E3A1C), drawn in fine brown ink (#2A2118) with soft watercolor, enters from the LOWER RIGHT and sweeps diagonally up across the lower-middle toward the UPPER RIGHT. The upper-left stays clean. The lower-right corner has a slightly softer, lighter area. Restrained, elegant, paper texture, lots of negative space, museum botanical plate aesthetic. No letters, no words, no numbers, no watermark, no frame.
```

**冬 · 提示词**

```
Wide 2:1 hero banner for a botanical specimen archive, no text. A sheet of pale cool grey-white paper (#EFF1F1) as the background. On the LEFT side, a soft large blush of cold pale blue-grey wash (like out-of-focus light), and a wide clean empty area reserved for a large title to be added later — keep it calm and uncluttered. A delicate sparse winter botanical branch of grey-green pine needles or bare twigs (#5A6B6E) with one or two small dark red berries (#7C2C2A), drawn in fine cool dark ink (#1B2226) with very light watercolor, enters from the LOWER RIGHT and sweeps diagonally up across the lower-middle toward the UPPER RIGHT. The upper-left stays clean, lots of negative space. The lower-right corner has a slightly softer, lighter area. Restrained, elegant, paper texture, museum botanical plate aesthetic. No letters, no words, no numbers, no watermark, no frame.
```

**负面词（三季通用）**：`text, letters, words, numbers, watermark, logo, frame, border, dark background, dense composition, foliage covering the left side, cropped vine`

> 这张最容易被"自动加字"的工具毁掉——生成后检查左侧确实没有字，再交付。

---

## 4. 生成后自检（每张图过一遍）

- [ ] 没有任何文字、字母、数字、水印、签名
- [ ] 该透明的是真透明背景（用图像工具看 alpha 通道，不是白底）
- [ ] 纸纹四边接缝一致，没有明显图形或暗角
- [ ] 颜色落在对应季节那一行，没有串到别的季节
- [ ] 压花枝/分隔带四周有透明留白，主体集中在中部
- [ ] 竖幅与横幅的左上站名区干净
- [ ] 印章是双线同心圆、环内空白
- [ ] 尺寸不低于标注值，文件名与目录名完全一致

---

## 5. 你生成完，我要做的事（供你放心）

1. 跑通用处理脚本，把 9 类源图压成站点用的 WebP（纸纹放大纤维、压花按 alpha 裁空白、印章加深、分隔带做渐隐版——和春同一套处理）。
2. 季节数据接进 `seasons.ts`：色板 token + 素材路径。
3. 加顶栏季节切换入口（或你指定别的位置），持久化到 `localStorage`，首帧由 `<head>` 同步脚本写好，不闪。
4. 双主题 × 四季 × 桌面手机做视觉回归，确认 `archive` 档案风零变化、默认春逐像素不变。
5. 构建、推送、确认 CI。

---

## 附：为什么不做成四套完全不同的插画

春（草木主题）能被你认可，靠的是"纸本标本册"这一套克制语言——不是某几种植物。夏秋冬沿用同一语言只换季相，才能和整站（档案、相册、文章）共存，而不是变成四个互不相干的小站。这条是尺度判断，不是省事。
