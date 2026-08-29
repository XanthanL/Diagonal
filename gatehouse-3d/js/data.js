// 门楼（架空）· The Gatehouse —— PARTS 元数据（T5）
// PARTS 元数据（设定见 docs/DESIGN.md）；相机锚点 cam/target 为世界坐标（米）。
// 本建筑为对角线档案中的架空创作，不指涉任何真实建筑。
// build 字段由 main.js 按 id 注入 parts/ 生成模块；P8 特写件为浮层独立场景，主场景只放标记。

export const PARTS = [
  {
    id: 'overview', index: 0,
    name: '总览', subtitle: '复合门楼',
    nameEn: 'Overview', subtitleEn: 'Composite gatehouse',
    color: 0x55565a,
    cam: [18, 26, 68], target: [0, 9, 0],
    principle:
      '门楼是档案中的一座架空建筑——无名无署，只余一门。四重檐复合结构：' +
      '台基承柱网，柱网托第一重檐，其上三重檐逐层收分至宝顶。' +
      '整体面阔约 28 m、通高约 23.6 m（尺度均为虚构参考值）。',
    principleEn:
      'The The Gatehouse is a fictional building of the Diagonal archive — an imagined street-facing ' +
      'gate of an old salt administration bureau: a stone terrace carries the colonnade, the colonnade carries ' +
      'the first eave, and three upper tiers taper to the roof finial. ' +
      'Overall width approx. 28 m, height approx. 23.6 m (all dimensions invented reference values).',
    reaction: {
      zh: ['梁架穿斗与抬梁混合', '四重檐逐层收分，荷载递减'],
      en: ['Mixed chuandou-tailiang framing', 'Four tapering eave tiers shed load stepwise'],
    },
    params: ['面阔 ≈28 m', '通高 ≈23.6 m（118 vx）', '檐层数 4'],
    paramsEn: ['Width ≈28 m', 'Height ≈23.6 m (118 vx)', 'Eave tiers: 4'],
    build: null,
  },
  {
    id: 'terrace', index: 1,
    name: '台基 · 石阶', subtitle: '石作基座',
    nameEn: 'Terrace & Steps', subtitleEn: 'Stone platform',
    color: 0x98938a,                                // §4：图例色 = 该 Part 主色（砂岩·亮）
    cam: [0, 16, 105], target: [0, 5, 8],           // §6 P1 台基锚点（原值偏离契约，已校正）
    principle:
      '台基以整条石砌筑，围成门楼基座；正面垂带石阶四级而上，把地面人流抬入门堂。',
    principleEn:
      'Built of quarried stone blocks, the terrace forms the base; a four-step stair with splayed ' +
      'side walls raises visitors from street level into the gate hall.',
    reaction: {
      zh: ['条石错缝砌筑', '阶沿石整料过压'],
      en: ['Staggered-joint ashlar masonry', 'Single-piece threshold lintels'],
    },
    params: ['台明高 ≈0.8 m（4 vx）', '阶数 4', '参考值：条石长 1.2–1.6 m'],
    paramsEn: ['Plinth ≈0.8 m (4 vx)', 'Steps: 4', 'Ref: blocks 1.2–1.6 m'],
    build: null,
  },
  {
    id: 'lions', index: 2,
    name: '石狮', subtitle: '门枕双狮',
    nameEn: 'Stone Lions', subtitleEn: 'Gate guardian pair',
    color: 0x98938a,
    cam: [-6, 15, 42], target: [-17, 9, 6],         // §6 P2 石狮锚点（原 cam/target 写反，已校正）
    principle:
      '一对石狮踞于台基前沿两侧，左雄右雌；狮身与门枕石连作一体，兼作门框转角的结构配重。',
    principleEn:
      'A pair of stone lions crouch at the front corners of the terrace — male left, female right — ' +
      'carved integrally with the door sockets and acting as structural counterweights at the frame corners.',
    reaction: {
      zh: ['整料圆雕，与门枕石连体', '后足与台基榫接抗倾覆'],
      en: ['Full-round carving from single blocks, integral with door sockets', 'Hind legs tenoned into terrace against overturning'],
    },
    params: ['含须弥座通高 ≈2.4 m（12 vx）', '数量 2', '材质参考值：青石·砂岩两档'],
    paramsEn: ['Height incl. pedestal ≈2.4 m (12 vx)', 'Count: 2', 'Ref: bluestone / sandstone, two tones'],
    build: null,
  },
  {
    id: 'gatehouse', index: 3,                      // 与 parts/gatehouse.js、§2 目录契约对齐
    name: '门堂柱网', subtitle: '木构承重',
    nameEn: 'Gate Colonnade', subtitleEn: 'Timber column grid',
    color: 0xa03828,
    cam: [0, 22, 88], target: [0, 15, 0],           // §6 P3 门堂锚点（原 cam/target 写反，已校正）
    principle:
      '朱红列柱纵两排、横七间，构成门堂承重骨架；柱径上收、柱础石鼓形，明间两柱加粗以悬匾。',
    principleEn:
      'Two rows of vermilion columns across seven bays form the load-bearing frame; columns taper upward on drum-shaped bases, ' +
      'the two central columns thickened to carry the plaque.',
    reaction: {
      zh: ['柱础隔离地潮', '明间柱径 +2vx 抗匾额弯矩'],
      en: ['Stone bases isolate rising damp', 'Central bays +2 vx column girth for plaque bending loads'],
    },
    params: ['柱网 7 间', '柱高 ≈6.4 m（32 vx）', '参考值：柱径 0.5–0.6 m'],
    paramsEn: ['7 bays', 'Column height ≈6.4 m (32 vx)', 'Ref: shaft Ø 0.5–0.6 m'],
    build: null,
  },
  {
    id: 'eave1', index: 4,
    name: '第一重檐', subtitle: '斗栱出挑',
    nameEn: 'First Eave Tier', subtitleEn: 'Bracket cantilever',
    color: 0x6b6e6a,
    cam: [30, 45, 100], target: [0, 37, -4],
    principle:
      '第一重檐是全楼最宽的一层檐口，斗栱密排出挑承托檐檩；翘角沿弧线渐起，翼尖指向偏上。',
    principleEn:
      'The widest tier: closely spaced bracket sets cantilever the eave purlins; upturned corners rise along a smooth curve, tips pointing skyward.',
    reaction: {
      zh: ['斗栱层叠出挑 ≈1.6 m', '角梁斜置承接翼角荷载'],
      en: ['Stacked brackets cantilever ≈1.6 m', 'Raking corner beams carry wing-tip loads'],
    },
    params: ['檐口宽 ≈22.4 m（112 vx）', '斗栱带高 2 vx', '参考值：出挑 1.4–1.8 m'],
    paramsEn: ['Eave width ≈22.4 m (112 vx)', 'Bracket band 2 vx tall', 'Ref: cantilever 1.4–1.8 m'],
    build: null,
  },
  {
    id: 'walls', index: 5,                          // 与 parts/walls.js、§2 目录契约对齐
    name: '匾额墙身', subtitle: '团窠花板',
    nameEn: 'Plaque Wall', subtitleEn: 'Roundel panels',
    color: 0x211d1b,
    cam: [14, 58, 72], target: [0, 54, -8],
    principle:
      '黑漆墙身嵌描金大匾（匾文留白——架空之物不题名），两侧横矩形团窠花板中心对称、被檐带包裹于正中；描金纹样在黑漆地上读出轮廓。',
    principleEn:
      'A black-lacquer wall carries the gilded plaque "The Gatehouse", flanked by horizontal roundel panels, ' +
      'each bilaterally centered within its encircling eave band; gilt outlines read against the dark ground.',
    reaction: {
      zh: ['墙身减薄减载，仅 2–3 vx', '花板 D4 中心对称构图'],
      en: ['Wall thinned to 2–3 vx to cut load', 'Panels composed with D4 symmetry'],
    },
    params: ['大匾宽 ≈4.8 m（24 vx）', '花板横矩形 12×7 vx', '参考值：金漆描边'],
    paramsEn: ['Plaque width ≈4.8 m (24 vx)', 'Panel 12×7 vx horizontal', 'Ref: gilt-outlined lacquer'],
    build: null,
  },
  {
    id: 'upperRoofs', index: 6,                     // 与 parts/upperRoofs.js、§2 目录契约对齐
    name: '上层檐与脊', subtitle: '三重叠收',
    nameEn: 'Upper Tiers & Ridge', subtitleEn: 'Three stacked tapers',
    color: 0x55565a,
    cam: [38, 96, 125], target: [0, 86, -6],
    principle:
      '第二至第四重檐逐层收窄，檐带内分别嵌竖矩形与正方形花板；顶上灰塑宝顶以三段阶梯收束全楼轮廓。',
    principleEn:
      'Tiers two to four narrow stepwise, embedding vertical-rectangular then square roundel panels; ' +
      'a moulded finial in three steps closes the silhouette.',
    reaction: {
      zh: ['上层荷载经童柱传递', '宝顶分段预制榫接'],
      en: ['Upper loads pass through king posts', 'Finial precast in tenoned segments'],
    },
    params: ['顶层檐宽 ≈11.2 m（56 vx）', '宝顶高 ≈2.4 m（12 vx）', '参考值：总高 118 vx'],
    paramsEn: ['Top tier width ≈11.2 m (56 vx)', 'Finial ≈2.4 m (12 vx)', 'Ref: total 118 vx'],
    build: null,
  },
  {
    id: 'wings', index: 7,
    name: '次间两翼', subtitle: '侧廊披檐',
    nameEn: 'Side Wings', subtitleEn: 'Flanking lean-to bays',
    color: 0xe6e1d6,
    cam: [-70, 26, 88], target: [-52, 12, 0],
    principle:
      '次间两翼白灰墙披檐向左右展开，与中央门楼形成"一主两从"的横向三段式立面。',
    principleEn:
      'Whitewashed wing bays with lean-to roofs spread left and right, forming a tripartite facade of one dominant centre and two subordinates.',
    reaction: {
      zh: ['披檐一坡泄水朝天井', '翼墙与山墙共用基础'],
      en: ['Lean-to roofs drain to inner courtyard', 'Wing and gable walls share foundations'],
    },
    params: ['单翼宽 ≈6 m（30 vx）', '翼高 ≈7 m（35 vx）', '参考值：白灰墙面'],
    paramsEn: ['Each wing ≈6 m wide (30 vx)', 'Wing height ≈7 m (35 vx)', 'Ref: whitewashed finish'],
    build: null,
  },
  {
    id: 'closeups', index: 8,
    name: '特写件', subtitle: '雕刻细节',
    nameEn: 'Close-up Pieces', subtitleEn: 'Carving details',
    color: 0xc9a13b,
    cam: [0, 48, 60], target: [0, 50, 0],
    principle:
      '戏文看板、团窠雕件与石狮头等细部以独立小视口特写呈现（T13 起接入浮层），此处先以金色标记件占位。',
    principleEn:
      'Fine carvings — opera-scene boards, roundels, lion heads — will be shown in an inset viewport from T13; ' +
      'for now a gold marker stands in.',
    reaction: {
      zh: ['镂刻深浅分三层', '贴金罩清漆防潮'],
      en: ['Relief carved in three depths', 'Gilt sealed with varnish against damp'],
    },
    params: ['特写世界 1vx=0.02m', '浮层视口 160×110px', '参考值：DPR≥2'],
    paramsEn: ['Inset world 1vx=0.02m', 'Viewport 160×110 px', 'Ref: DPR≥2'],
    build: null,
  },
  {
    id: 'terrain', index: 9,
    name: '山水', subtitle: '赖以拄其间',
    nameEn: 'Terrain', subtitleEn: 'Between mountain and river',
    color: 0xb7d0cf,
    cam: [-44, 22, 56], target: [-2, 8, 2],
    principle:
      '门楼以山为倚、以水为邻：后岭连峰承其背，左带曲水绕其趾；石桥通渡，甬道引门——一门拄于山水之间。',
    principleEn:
      'The gatehouse leans on the ridge behind and listens to the river bending at its left; ' +
      'a stone bridge joins the banks and a paved way leads to the door — one gate propped between mountain and water.',
    reaction: {
      zh: ['地坪让位于台基领地', '山为阶梯台地、巅以灰塑作云帽', '水面单格浅青 + 泡点为纹'],
      en: ['Ground yields to the terrace plot', 'Stepped mesas, crested with pale plaster caps', 'Single-cell water with foam strokes'],
    },
    params: ['场景 x[-60,220] z[-36,74]', '河宽 13 vx · 主峰 30 vx', '全部取色于既定 20 色'],
    paramsEn: ['Scene x[-60,220] z[-36,74]', 'River 13 vx · main peak 30 vx', 'All colors within the 20-tone palette'],
    build: null,
  },
];

// 双语 UI 文案（applyLang 用）
export const I18N = {
  sideTitle: { zh: '门楼 · 四重檐复合结构', en: 'The Gatehouse · Fourfold Eaves' },
  navTitle: { zh: '构件导览', en: 'Parts' },
  ipIndexLabel: { zh: '构件', en: 'Part' },
  equipTitle: { zh: '建筑构成', en: 'Composition' },
  reactionTitle: { zh: '结构 · 营建要点', en: 'Structure · Building Notes' },
  paramsTitle: { zh: '关键形制', en: 'Key Figures' },
};
