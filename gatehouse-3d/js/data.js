// 门楼（架空）· The Gatehouse —— PARTS 元数据 + 文案（单一来源）
// 判据只有一份：docs/STYLE.md。措辞按 §六：架空、朴素，只讲"怎么看懂这张图"，不装学术。
// cam / target 为世界坐标（米）；体素 → 世界：((x-58.5)·0.2, y·0.2, (z-21)·0.2)。
// 本建筑为对角线档案中的架空创作，不指涉任何真实建筑。

export const PARTS = [
  {
    id: 'overview', index: 0,
    name: '总览', subtitle: '一张纸上的山水',
    nameEn: 'Overview', subtitleEn: 'A landscape on paper',
    color: 0x55565a,
    cam: [12, 14, 46], target: [0, 8, -2],
    principle:
      '一座无名的门楼，立于一片地、一湾水、几道山之间。画面按中国山水的读法组织：' +
      '近景是平地与水面，中景只有门楼这一个密集体，远景的山脊越远越浅，最后交给雾。' +
      '所有体量都是虚构的，尺度只作参考值。',
    principleEn:
      'An unnamed gatehouse stands among a field, a bay of water and several ranges. ' +
      'It reads like a Chinese landscape: flat ground and water in the near band, the gatehouse as the ' +
      'single dense mass in the middle, ridges fading into fog beyond. Every dimension is invented.',
    reaction: {
      zh: ['大开面优先：地、水、山各占一块，不加分量', '门楼是唯一密集体，其余全部让位', '细部只在读得出轮廓处才画'],
      en: ['Large flat planes first — ground, water, mountains each hold one band',
           'The gatehouse is the only dense mass; everything else gives way',
           'Detail is drawn only where silhouette still reads'],
    },
    params: ['面阔 ≈24 m（120 vx）', '通高 ≈20 m（100 vx）', '檐层数 3', '元素种类 5'],
    paramsEn: ['Width ≈24 m (120 vx)', 'Height ≈20 m (100 vx)', 'Eave tiers: 3', 'Element types: 5'],
  },
  {
    id: 'terrace', index: 1,
    name: '台基 · 踏道', subtitle: '石作基座',
    nameEn: 'Terrace & Steps', subtitleEn: 'Stone platform',
    color: 0x98938a,
    cam: [-9, 5, 16], target: [0, 0.9, 2],
    principle:
      '台基是一条整石：暗色台身托起一圈亮色压顶，压顶四周外突一格，读作一条檐口线。' +
      '台面周圈两道矮栏，正对门洞开缺；缺口中是三级实砌踏道，再外是一块阶前地平石。',
    principleEn:
      'The terrace is one stone bed: a dark body under a bright coping that projects one voxel all round, ' +
      'reading as a single cornice line. A low balustrade rings the deck and stops before the doorway, ' +
      'where three solid flights step down onto an apron slab.',
    reaction: {
      zh: ['压顶外突一格 → 侧看是一条线，不是一摞盒子', '栏板在踏道处断开，缺口自己说话', '踏道实砌，所以永不悬空'],
      en: ['Coping projects one voxel — a line from the side, not a stack of boxes',
           'Balustrade breaks at the stair; the gap speaks for itself',
           'Solid-built flights, so nothing floats'],
    },
    params: ['台明高 ≈0.8 m（4 vx）', '台面 94 × 35 vx', '踏道 3 级'],
    paramsEn: ['Plinth ≈0.8 m (4 vx)', 'Deck 94 × 35 vx', 'Flights: 3'],
  },
  {
    id: 'gate', index: 2,
    name: '门 · 墙 · 柱', subtitle: '唯一的入口',
    nameEn: 'Gate & Wall', subtitleEn: 'The only entrance',
    color: 0xa03828,
    cam: [3, 5.5, 15], target: [0, 3.6, 0.4],
    principle:
      '白灰墙是一整块面，只在正中挖一个门洞。门扇凹在腔里，黑漆双扇、中缝一道亮色；' +
      '洞口用栗木收成一个明确的框。三对朱红柱立在墙皮之前，只承担"看着像承重"这件事。',
    principleEn:
      'The wall is one white plane pierced once, at the centre. Doors sit recessed in the cavity — two black ' +
      'leaves with a bright seam — inside a chestnut frame. Three pairs of vermilion columns ' +
      'stand in front of the wall, doing the work of looking load-bearing.',
    reaction: {
      zh: ['一整个面 + 一个洞：不开第二扇窗抢戏', '匾有金框而无字：架空之物无名可题', '柱身一侧一条受光棱，方柱读成圆'],
      en: ['One plane, one opening — no second window to compete',
           'The plaque has a gilded frame but no word: an invented gate is nameless',
           'One lit arris per shaft turns a square column round'],
    },
    params: ['墙身 78 × 23 × 21 vx', '门洞 24 × 17 vx', '柱列 3 对 × 3 vx'],
    paramsEn: ['Wall 78 × 23 × 21 vx', 'Opening 24 × 17 vx', 'Colonnade 3 pairs × 3 vx'],
  },
  {
    id: 'eaves', index: 3,
    name: '三重檐', subtitle: '出挑与收分',
    nameEn: 'Three Eave Tiers', subtitleEn: 'Cantilever & taper',
    color: 0x8b939c,
    cam: [2, 12, 27], target: [0, 9.2, 0],
    principle:
      '每重檐是一整片连续坡屋面：檐口周圈通长等厚，顶缘按平方曲线向角端起翘；' +
      '屋面逐格举折爬上正脊平台，平台正好托住上一重墙身。自下而上半跨 47 → 34 → 22，严格递减。',
    principleEn:
      'Each tier is one continuous roof field — the eave rim holds a constant thickness while its top edge ' +
      'rises toward the corners on a squared curve, and the surface climbs in micro-steps to a ridge plateau ' +
      'that carries the wall above exactly. Half-spans shrink 47 → 34 → 22 from bottom to top.',
    reaction: {
      zh: ['檐口通长同高、只抬角端——弧线读得清', '举折是控制点插值的 1 格微台阶，读作平滑曲面', '檐口外圈压一道椽望暗层，大面保持干净'],
      en: ['The eave rim holds one height; only the corners lift, so the arc reads',
           'The roof curve is control-point interpolation — 1-voxel micro-steps read as a smooth surface',
           'A dark rafter course rings the eave edge; the big faces stay clean'],
    },
    params: ['半跨 47 → 34 → 22 vx', '翘角段数 4 → 3 → 2', '檐口高 7.2 → 13.2 → 17.4 m'],
    paramsEn: ['Half-spans 47 → 34 → 22 vx', 'Horn segments 4 → 3 → 2', 'Eave heads 7.2 → 13.2 → 17.4 m'],
  },
  {
    id: 'crown', index: 4,
    name: '翘角 · 顶', subtitle: '收成一个尖',
    nameEn: 'Horns & Crown', subtitleEn: 'Tapered to a point',
    color: 0xc9a13b,
    cam: [5, 19.5, 9], target: [0, 18.8, 0],
    principle:
      '翘角自檐带角端向外挑出 N 段，轨迹先缓后陡，深度 3 → 2 → 1 收成尖，末段贴金，' +
      '尖端一枚灵光。顶只两级薄檐加一道金领，最后是一枚灵光收口——顶要么一条线收掉，要么一个尖收掉。',
    principleEn:
      'Each horn cantilevers N segments out of the eave corner, gentle then steep, its depth tapering 3 → 2 → 1 ' +
      'to a point; the last segment is gilt and the tip a single spark. The crown is two thin caps, ' +
      'a gilded collar and one spark — a roof ends either as a line or as a point.',
    reaction: {
      zh: ['金 + 灵光 < 1% 画面占比，所以两点就够跳', '冠尖与末段同行起 —— 为的是 6-连通不悬空', '板状尾、平伸不出挑、末端不尖：出现即判不合格'],
      en: ['Gold plus spark stay under 1% of the frame, so two touches carry it',
           'The finial starts on the last segment’s row — six-connectivity, no floating',
           'Flat tails, straight projections, blunt tips: any of these fails the model'],
    },
    params: ['翘角轨迹 y = base + round(0.25k²)', '冠部 4 级 / 通高至 99 vx', '金 + 灵光占比 < 1%'],
    paramsEn: ['Horn curve y = base + round(0.25k²)', 'Crown: 4 courses up to vx 99', 'Gold + spark < 1% of frame'],
  },
  {
    id: 'water', index: 5,
    name: '地 · 水 · 桥', subtitle: '一湾水、一座桥',
    nameEn: 'Ground, Water, Bridge', subtitleEn: 'A bay and a bridge',
    color: 0x6fa9ac,
    cam: [5, 6, 27], target: [2, 0.6, 8],
    principle:
      '地不铺体素——一张苔绿圆盘就是纸面。水是一湾：两岸由控制点插值收拢成圆头湾形，' +
      '水面单层碧水，墨线只描远岸一格深潭，近岸直接接纸。一座低缓弧背的石桥不立栏，' +
      '出于中轴之右——全画面唯一破对称处。',
    principleEn:
      'The ground is a single moss-green disc — the paper itself. Water is one bay: both shores interpolate ' +
      'from a few control points into rounded heads, held to one tone of green, the ink line drawn only on ' +
      'the far shore while the near shore meets the paper. A low stone bridge with a gentle camber and no ' +
      'rails leans right of the axis — the single deliberate break in symmetry.',
    reaction: {
      zh: ['地 = 纸：省下的是一个数量级的三角形', '墨线只描远岸，轮廓不成闭合边框（那是胶带）', '桥拱也是 1 格台阶：坡率够缓就读作弧'],
      en: ['Ground as paper saves an order of magnitude of triangles',
           'The ink line draws only the far shore — never a closed border, which is tape',
           'The bridge camber is 1-voxel steps too: gentle enough, they read as a curve'],
    },
    params: ['水湾 ≈220 × 60 vx（单层）', '桥 11 vx 宽 / 弧背最高 0.8 m', '墨线 = 远岸一格深潭'],
    paramsEn: ['Bay ≈220 × 60 vx (one layer)', 'Bridge 11 vx wide, camber peak 0.8 m', 'Ink line: one deep voxel on the far shore'],
  },
  {
    id: 'hills', index: 6,
    name: '山', subtitle: '两道纸幕山脊',
    nameEn: 'Mountains', subtitleEn: 'Two paper ridges',
    color: 0x2f4a3a,
    cam: [-26, 15, 6], target: [0, 11, -40],
    principle:
      '山是纸幕：进深一格，正身读作崖壁，侧看是一张纸。顶缘由控制点插值成一条连续脊线；' +
      '颜色只按高度两分——近幕黛绿脚→松绿，远幕松绿脚→岩影——越远越浅、山外有山，峰顶一律不戴帽。',
    principleEn:
      'Mountains are paper screens one voxel deep — a cliff face head-on, a sheet from the side. Ridge tops ' +
      'interpolate from control points into one continuous line; colour splits by height only, near screen ' +
      'ink-green to pine, far screen pine to stone-grey — lighter with distance, summits never capped.',
    reaction: {
      zh: ['峰顶就是浅色，不戴"帽子"', '近幕矮深、远幕高浅，门楼正后方压到最低 = 留白', '一棵树也不种：元素种类让位给大色块'],
      en: ['Summits are simply lighter — no caps',
           'Near screen low and dark, far screen high and light; behind the gate the ridges drop to blank paper',
           'No trees at all — element types give way to the large planes'],
    },
    params: ['两道脊幕 / 进深 1 vx', '远幕最高 134 vx（≈27 m）', '门楼后方压最低 = 留白'],
    paramsEn: ['Two ridge screens, 1 vx deep', 'Far screen tallest 134 vx (≈27 m)', 'Ridges drop behind the gate = blank paper'],
  },
];

export const I18N = {
  sideTitle: { zh: '门楼 · 一张纸上的山水', en: 'The Gatehouse · Landscape on paper' },
  ipIndexLabel: { zh: '构件', en: 'Element' },
  principleTitle: { zh: '形制 · 读法', en: 'Form & reading' },
  reactionTitle: { zh: '看图要点', en: 'What to notice' },
  paramsTitle: { zh: '尺度（虚构参考值）', en: 'Scale (invented)' },
};
