// 魔幻门楼 · The Gatehouse —— PARTS 元数据 + 双语文案(单一来源)
// cam / target 为世界坐标(米)。措辞朴素,只讲"怎么看懂这张画面",不装学术。
// 本建筑为对角线档案中的架空创作,不指涉任何真实建筑。

export const PARTS = [
  {
    id: 'overview', index: 0,
    name: '总览', subtitle: '山谷中的灵光门楼',
    nameEn: 'Overview', subtitleEn: 'A spirit gate in the valley',
    color: 0x55565a,
    cam: [32, 20, 56], target: [0, 12, 0],
    principle:
      '一座无名的门楼立在山谷正中:三层石台基托起白墩与三重檐,拱门里亮着一扇灵光。' +
      '水在楼前拐了一道弯,桥偏在左侧,松与灵火散在坡上,山一层让一层,最远交给雾。',
    principleEn:
      'An unnamed gatehouse stands at the centre of the valley: three stone terraces carry a white podium ' +
      'and three tiered roofs, a spirit light burns inside the arch. Water bends before it, the bridge leans ' +
      'left, pines and spirit fires dot the slopes, and the ridges recede layer by layer into mist.',
    reaction: {
      zh: ['门楼是唯一的密集体,水、山、树全部让位', '灵光是画面唯一的高光,其余都是低声部', '桥偏左 = 全画面唯一的破对称处'],
      en: ['The gate is the only dense mass; water, hills and pines all give way',
        'The spirit light is the single highlight — everything else stays quiet',
        'The bridge leaning left is the one deliberate break in symmetry'],
    },
    params: ['通高 ≈31 m', '檐 3 重 / 台基 3 层', '灵光门 1 扇', '檐灯 6 盏'],
    paramsEn: ['Height ≈31 m', '3 roofs / 3 terraces', '1 spirit portal', '6 eave lanterns'],
  },
  {
    id: 'terrace', index: 1,
    name: '台基 · 踏道', subtitle: '三层石作收分',
    nameEn: 'Terrace & Steps', subtitleEn: 'Three stone terraces',
    color: 0x9b968a,
    cam: [10, 4.5, 24], target: [0, 2.2, 6],
    principle:
      '台基三层,逐层收窄:每层是一圈暗色台身加一圈外突的亮色压顶,读作两道线。' +
      '周圈望柱矮栏,正对门洞开缺;三级踏道自场坪逐台而上,一条石径从桥头蜿蜒接入。',
    principleEn:
      'Three terraces taper upward, each a dark body with a projecting bright coping — two lines per level. ' +
      'A low post-and-rail rings the deck and stops before the doorway; three flights climb from the field, ' +
      'and a stone path winds in from the bridge.',
    reaction: {
      zh: ['压顶外突半格 → 侧看是一条线,不是一摞盒子', '栏杆在踏道处断开,缺口自己说话', '石径偏左接入,把桥的不对称引到门前'],
      en: ['The coping projects half a voxel — a line from the side, not a stack of boxes',
        'The rail breaks at the stair; the gap speaks for itself',
        'The path joins from the left, carrying the bridge asymmetry to the door'],
    },
    params: ['台高 2.35 m(3 层)', '底层 34 × 24 m', '踏道 3 段', '望柱间距 2.6 m'],
    paramsEn: ['Rise 2.35 m (3 tiers)', 'Base 34 × 24 m', 'Flights: 3', 'Post gap 2.6 m'],
  },
  {
    id: 'gate', index: 2,
    name: '门 · 墙 · 匾', subtitle: '唯一的入口',
    nameEn: 'Gate, Wall & Plaque', subtitleEn: 'The only entrance',
    color: 0xa03828,
    cam: [8, 10, 21], target: [0, 8, 3],
    principle:
      '白灰墩子是一整块面,只在正中开一道拱门。拱门无扇——它通向灵光,不防盗。' +
      '朱红柱一圈立在墩顶,格扇窗里透出暖光,像楼里始终亮着人间灯火。' +
      '门额挂一方无字匾:金框之内只有一枚玉印在发光——架空之物无名可题。',
    principleEn:
      'The white podium is one plane pierced once, by an arch. The arch has no doors — it leads to the light, ' +
      'not against thieves. A ring of vermilion columns stands on the podium; warm light seeps through the ' +
      'lattice windows as if lamps burn inside. Above hangs a nameless plaque: within a gilded frame, a single ' +
      'jade seal glows — an invented gate is nameless.',
    reaction: {
      zh: ['拱门不开第二洞:一个入口就够了', '窗里的暖光是"有人间"的暗示,与门外灵火同一族', '匾有金框而无字,只有一枚发光的玉印'],
      en: ['One arch, no second opening — one entrance is enough',
        'The warm window light says "inhabited", kin to the spirit fires outside',
        'A gilded frame, no words — only one glowing jade seal'],
    },
    params: ['墩 19 × 12 × 4.6 m', '拱门宽 4.6 m', '柱高 4.0 m', '匾 3.4 × 1.2 m'],
    paramsEn: ['Podium 19 × 12 × 4.6 m', 'Arch 4.6 m wide', 'Columns 4.0 m', 'Plaque 3.4 × 1.2 m'],
  },
  {
    id: 'eaves', index: 3,
    name: '三重檐 · 翘角', subtitle: '一整片连续曲面',
    nameEn: 'Three Roofs', subtitleEn: 'One continuous curve each',
    color: 0x46616a,
    cam: [24, 22, 32], target: [0, 20, 0],
    principle:
      '每重檐是一片连续曲面,不是一摞板:檐口平直、只向角端起翘,屋面按举折曲线爬向顶部平座,' +
      '平座恰好托住上一重楼身。半跨 13.2 → 8.9 → 5.6 逐层收分,翘角逐层变短、变轻。',
    principleEn:
      'Each roof is one continuous curved sheet, not a stack of slabs: the eave rim stays level and lifts only ' +
      'toward the corners, the surface climbs a rising curve to a plateau that carries the body above. ' +
      'Half-spans shrink 13.2 → 8.9 → 5.6; the horns shorten and lighten tier by tier.',
    reaction: {
      zh: ['檐角上翘处外撇半米,读作"挑",不是"翘板"', '檐口下压一道暗带,大面保持干净', '角尖各点一粒金珠——金的预算只有这几粒'],
      en: ['Corners flare outward as they lift — a "flick", not a bent plank',
        'A dark course under the eave keeps the big faces clean',
        'One gold bead at each horn tip — that is the whole gold budget'],
    },
    params: ['半跨 11.6 → 7.9 → 5.1 m', '翘角抬升 1.05 / 0.8 / 0.55 m', '举折指数 1.55', '金珠 8 粒'],
    paramsEn: ['Half-spans 11.6 → 7.9 → 5.1 m', 'Horn lift 1.05 / 0.8 / 0.55 m', 'Rise exponent 1.55', 'Gold beads: 8'],
  },
  {
    id: 'portal', index: 4,
    name: '灵光门', subtitle: '拱洞里的漩涡',
    nameEn: 'The Spirit Portal', subtitleEn: 'A vortex in the arch',
    color: 0x7fe0c8,
    cam: [4.6, 5.6, 17.5], target: [0.2, 4.75, 2.4],
    principle:
      '拱门不装门扇,装一扇灵光:玉青与暖金绞成三臂漩涡,缓缓自转,流光被一圈圈吸入门心。' +
      '它是整座建筑唯一的"非常"之物——前面的山、水、楼都按人间规制来,只有这一扇不解释。',
    principleEn:
      'Where doors would hang, a spirit light hangs instead: jade and warm gold twisted into a three-armed ' +
      'vortex, slowly turning, streams of light drawn inward, ring by ring. It is the single uncanny thing ' +
      'here — hills, water and tower all follow the human rules; only this one refuses to explain.',
    reaction: {
      zh: ['漩涡三臂、内亮外暗:读作"深处有光",不是贴图', '流光粒子沿螺旋吸入,方向与漩涡同旋', '玉青只在门内与匾印出现——全站的高光纪律'],
      en: ['Three arms, bright core: reads as "light from deep inside", not a texture',
        'Stream particles spiral inward, turning with the vortex',
        'Jade appears only in the portal and the seal — the site-wide highlight discipline'],
    },
    params: ['门洞 4.6 × 4.7 m', '对数双螺旋', '流光 60 粒', '自转 ≈0.26 圈/秒'],
    paramsEn: ['Portal 4.6 × 4.7 m', 'Dual log-spiral', 'Stream: 60 motes', 'Spin ≈0.26 rev/s'],
  },
  {
    id: 'lanterns', index: 5,
    name: '檐灯', subtitle: '六盏不灭的灯',
    nameEn: 'Eave Lanterns', subtitleEn: 'Six undying lamps',
    color: 0xffd98a,
    cam: [12, 12, 18], target: [-6, 11, -3],
    principle:
      '一层檐四角各垂一盏,拱门两侧再各一盏:红灯金盖,内里一点暖芯。' +
      '灯不灭、不摇——它们是给夜行灵火引路的,不是给人照明的。',
    principleEn:
      'One lantern hangs from each corner of the first eave, two more flank the arch: red bodies, gilt caps, ' +
      'a warm core inside. They neither go out nor sway — they guide the spirit fires home, not travellers.',
    reaction: {
      zh: ['金只花在灯盖与翘角珠:两处小面积,刚好跳出来', '暖芯与窗光同一色温——整座楼是一个灯火系统', '灯垂在檐角阴影里,靠光晕读出位置'],
      en: ['Gold is spent on caps and horn beads only — two small accents, enough',
        'The cores share one colour temperature with the windows — one lamp system',
        'Lanterns sit in eave shadow; the halo tells you where they hang'],
    },
    params: ['灯 ⌀ 0.84 m', '垂距 0.9 m', '共 6 盏', '光晕半径 2.6 m'],
    paramsEn: ['Lantern ⌀ 0.84 m', 'Drop 0.9 m', 'Total 6', 'Halo ⌀ 2.6 m'],
  },
  {
    id: 'crown', index: 6,
    name: '金顶', subtitle: '收成一粒宝珠',
    nameEn: 'The Gilded Crown', subtitleEn: 'Tapered to a pearl',
    color: 0xc9a13b,
    cam: [8, 32, 14], target: [0, 30.5, 0],
    principle:
      '顶不再起檐,两级薄层收成一条金领,领上一只葫芦宝珠,珠尖一点灵光。' +
      '顶要么一条线收掉,要么一个尖收掉——这里选了尖。',
    principleEn:
      'No more roofs: two thin courses close into a gilded collar, a gourd pearl above it, one spark at the tip. ' +
      'A top ends either as a line or as a point — here it chooses the point.',
    reaction: {
      zh: ['宝珠与灵光是通高的视觉终点,视线自然被引上去', '金领窄于顶层平座:不是又一摞盒子', '珠尖灵光与拱门灵光同色,首尾呼应'],
      en: ['The pearl and spark finish the full height — the eye rides them up',
        'The collar is narrower than the top plateau: not another stack of boxes',
        'The tip spark matches the portal jade — a rhyme between top and gate'],
    },
    params: ['金领 ⌀ 1.1 m', '宝珠 2 级', '顶灵光 ⌀ 0.28 m', '总高 ≈31 m'],
    paramsEn: ['Collar ⌀ 1.1 m', 'Pearl: 2 courses', 'Tip spark ⌀ 0.28 m', 'Total ≈31 m'],
  },
  {
    id: 'landscape', index: 7,
    name: '山水 · 雾 · 桥', subtitle: '门楼之外的一切',
    nameEn: 'Hills, Water & Mist', subtitleEn: 'Everything but the gate',
    color: 0x5fa8a0,
    cam: [12, 5.5, 42], target: [-16, 2, 33],
    principle:
      '水是楼前一湾碧水:玉色近岸、深色潭心,粼光随时间走。石桥偏左跨水,是唯一破对称处。' +
      '山是三重纸幕,一重让一重,颜色逐层提浅;灵雾在山与水之间慢漂,松三五成组,灵火满坡。',
    principleEn:
      'Water bends before the gate: jade shallows at the rim, a deep green heart, glints drifting with time. ' +
      'The stone bridge crosses left — the only break in symmetry. Hills are three paper ridges receding and ' +
      'paling layer by layer; mist drifts slowly between them, pines stand in small groups, spirit fires fill the slopes.',
    reaction: {
      zh: ['水面是 shader:涟漪、近岸玉色、粼光三层叠加', '山不种一棵树——细节让位给剪影', '灵火偏暖金、灵雾偏纸白:两种"光尘"分工'],
      en: ['The water is a shader: ripples, jade shallows and glints in three layers',
        'Not one tree on the hills — detail yields to silhouette',
        'Spirit fires lean warm gold, mist leans paper white: two kinds of dust, two jobs'],
    },
    params: ['水湾 92 × 28 m', '桥跨 17 m', '雾幕 3 重 / 灵雾 9 团', '灵火 70 点'],
    paramsEn: ['Bay 92 × 28 m', 'Bridge span 17 m', 'Ridges 3 / mist 9', 'Fires: 70 motes'],
  },
];

export const I18N = {
  sideTitle: { zh: '门楼 · 魔幻绿水青山', en: 'The Gatehouse · Spirit of the Valley' },
  ipIndexLabel: { zh: '构件', en: 'Element' },
  principleTitle: { zh: '形制 · 读法', en: 'Form & reading' },
  reactionTitle: { zh: '看图要点', en: 'What to notice' },
  paramsTitle: { zh: '尺度(虚构参考值)', en: 'Scale (invented)' },
};
