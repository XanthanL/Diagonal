// 江南小园 · 园门 —— PARTS 元数据 + 双语文案(单一来源)
// cam / target 为世界坐标(米)。措辞朴素,只讲"怎么看懂这张画面",不装学术。
// 本园林为对角线档案中的架空创作,不指涉任何真实园林。

export const PARTS = [
  {
    id: 'overview', index: 0,
    name: '总览', subtitle: '粉墙黛瓦围出的一方园子',
    nameEn: 'Overview', subtitleEn: 'A garden walled in white and grey',
    color: 0x55565a,
    cam: [32, 20, 56], target: [0, 12, 0],
    principle:
      '园门朝南临河,粉墙从台基两侧一路铺开 —— 白墙是这张画里的纸,先有纸,才有画。' +
      '三层石台基托起三重檐的楼身,廊下立一圈栗壳柱,格扇窗透出窗纸的黄。' +
      '拱形门洞是通透的,穿过它看得见园里那道月洞门 —— 这是全园的第一重框景。' +
      '河在门前拐了一道弯,桥偏在左侧,松与竹散在坡上,山一层让一层,最远交给雾。',
    principleEn:
      'The gate faces south over the river, and the whitewashed wall runs out from the terrace on both sides — ' +
      'whitewash is the paper this picture is drawn on; the paper comes first. Three stone terraces carry a ' +
      'triple-roofed tower, chestnut columns ring the veranda, and the lattice windows show the yellow of paper. ' +
      'The arch is open: through it you can see the moon gate beyond — the first framed view of the garden.',
    reaction: {
      zh: ['墙是负空间:全画面最亮的一块,恰恰是空出来的', '门楼是唯一的密集体,水、山、树全部让位', '桥偏左 = 全画面唯一的破对称处'],
      en: ['The wall is negative space: the brightest area is the empty one',
        'The gate is the only dense mass; water, hills and pines all give way',
        'The bridge leaning left is the one deliberate break in symmetry'],
    },
    params: ['通高 ≈31 m', '檐 3 重 / 台基 3 层', '园墙 3.3 m / 延展 52 m', '漏窗 6 扇'],
    paramsEn: ['Height ≈31 m', '3 roofs / 3 terraces', 'Wall 3.3 m / 52 m long', '6 lattice windows'],
  },
  {
    id: 'terrace', index: 1,
    name: '台基 · 踏道', subtitle: '三层石作收分',
    nameEn: 'Terrace & Steps', subtitleEn: 'Three stone terraces',
    color: 0x9b968a,
    cam: [10, 4.5, 24], target: [0, 2.2, 6],
    principle:
      '台基三层,逐层收窄:每层是一圈暗色台身加一圈外突的亮色压顶,读作两道线。' +
      '周圈望柱矮栏,正对门洞开缺;三级踏道自场坪逐台而上,一条石径从桥头蜿蜒接入。' +
      '台基用青石。园林里石作不抢戏 —— 它是给白墙垫脚的那一层,越安静越好。',
    principleEn:
      'Three terraces taper upward, each a dark body with a projecting bright coping — two lines per level. ' +
      'A low post-and-rail rings the deck and stops before the doorway; three flights climb from the field, ' +
      'and a stone path winds in from the bridge. Grey limestone throughout — in a garden stonework never ' +
      'takes the lead; it is the layer the white wall stands on, and the quieter it is the better.',
    reaction: {
      zh: ['压顶外突半格 → 侧看是一条线,不是一摞盒子', '栏杆在踏道处断开,缺口自己说话', '石径偏左接入,把桥的不对称引到门前'],
      en: ['The coping projects half a voxel — a line from the side, not a stack of boxes',
        'The rail breaks at the stair; the gap speaks for itself',
        'The path joins from the left, carrying the bridge asymmetry to the door'],
    },
    params: ['台高 2.35 m(3 层)', '底层 31 × 22 m', '踏道 3 段', '望柱间距 2.6 m'],
    paramsEn: ['Rise 2.35 m (3 tiers)', 'Base 31 × 22 m', 'Flights: 3', 'Post gap 2.6 m'],
  },
  {
    id: 'gate', index: 2,
    name: '门 · 墙 · 匾', subtitle: '唯一的入口',
    nameEn: 'Gate, Wall & Plaque', subtitleEn: 'The only entrance',
    color: 0x8a6046,
    cam: [8, 10, 21], target: [0, 8, 3],
    principle:
      '粉墙拱墩是一整块面,只在正中开一道券门。门不装扇 —— 它通向园子,不防盗。' +
      '栗壳柱一圈立在墩顶,格扇窗里透出窗纸的黄,像屋里始终有灯。' +
      '门额挂一方无字匾:没有描金,只有一枚浅浅的印。园子才刚动土,名还空着 —— ' +
      '留白不是没做完,是把题名的权力留给园主。',
    principleEn:
      'The whitewashed podium is a single plane pierced once by an arched opening. No door leaves — it leads ' +
      'into the garden, not against thieves. A ring of chestnut columns stands on the podium; the lattice ' +
      'windows carry the yellow of paper, as if a lamp burns within. Above hangs a plaque with no words: no ' +
      'gilding, just a faint seal. The garden has only just been broken ground, so the name is left blank — ' +
      'that is not an omission, it is the naming left to the owner.',
    reaction: {
      zh: ['券门不开第二洞:一个入口就够了', '窗里的黄光是"屋里有人"的暗示,不是灯火橙', '匾无字、无金:留白本身就是内容'],
      en: ['One arch, no second opening — one entrance is enough',
        'The yellow behind the lattice says "inhabited" — it is paper light, not lamp orange',
        'A plaque with no words and no gold: the blank is the content'],
    },
    params: ['墩 19 × 12 × 5.6 m', '券门宽 4.6 m', '柱高 4.0 m', '匾 3.4 × 1.2 m'],
    paramsEn: ['Podium 19 × 12 × 5.6 m', 'Arch 4.6 m wide', 'Columns 4.0 m', 'Plaque 3.4 × 1.2 m'],
  },
  {
    id: 'eaves', index: 3,
    name: '三重檐 · 戗角', subtitle: '一整片连续曲面',
    nameEn: 'Three Roofs', subtitleEn: 'One continuous curve each',
    color: 0x46616a,
    cam: [24, 22, 32], target: [0, 20, 0],
    principle:
      '每重檐是一片连续曲面,不是一摞板:檐口平直、只向角端起翘,屋面按举折曲线爬向顶部平座,' +
      '平座恰好托住上一重楼身。半跨 11.6 → 7.9 → 5.1 逐层收分,戗角逐层变短、变轻。' +
      '园林的戗角比官式收敛 —— 翘得太高就成了庙,不是宅。',
    principleEn:
      'Each roof is one continuous curved sheet, not a stack of slabs: the eave rim stays level and lifts only ' +
      'toward the corners, the surface climbs a rising curve to a plateau that carries the body above. ' +
      'Half-spans shrink 11.6 → 7.9 → 5.1; the corner horns shorten and lighten tier by tier. ' +
      'In a garden the horns lift far less than in official architecture — lift them high and it becomes a ' +
      'temple, not a house.',
    reaction: {
      zh: ['檐角上翘处外撇半米,读作"挑",不是"翘板"', '檐口下压一道暗带,大面保持干净', '角尖只收一粒素脊头——全园没有一处金'],
      en: ['Corners flare outward as they lift — a "flick", not a bent plank',
        'A dark course under the eave keeps the big faces clean',
        'Each horn ends in a plain tile tip — there is not one grain of gold in the garden'],
    },
    params: ['半跨 11.6 → 7.9 → 5.1 m', '戗角抬升 0.82 / 0.62 / 0.42 m', '举折指数 1.55', '黛瓦'],
    paramsEn: ['Half-spans 11.6 → 7.9 → 5.1 m', 'Horn lift 0.82 / 0.62 / 0.42 m', 'Rise exponent 1.55', 'Grey tile'],
  },
  {
    id: 'portal', index: 4,
    name: '门洞 · 框景', subtitle: '门里留着一层薄雾',
    nameEn: 'The Arch', subtitleEn: 'A frame, and a little mist',
    color: 0xd8e6e0,
    cam: [4.6, 5.6, 17.5], target: [0.2, 4.75, 2.4],
    principle:
      '门洞里没有门扇,也没有东西挡着 —— 你能一眼看穿它,看见园里那道月洞门和白墙。' +
      '门里只留一层极薄的月白色雾气,慢得几乎不动。' +
      '这是全园最要紧的一处:苏州人管它叫框景 —— 门不是墙上的洞,门是给园子配的画框。',
    principleEn:
      'There is no door leaf in the arch, and nothing blocking it — you can see straight through, to the moon ' +
      'gate and the white walls inside. Only a very thin moon-white mist drifts there, almost still. ' +
      'This is the most important move in the whole garden: a door is not a hole in a wall, a door is the ' +
      'frame the garden is hung in.',
    reaction: {
      zh: ['通透是目的:挡住视线的那层暗幕已经拿掉了', '薄雾只做"里外有别",不做奇观', '月白只在门洞与匾印出现——全站的高光纪律'],
      en: ['Transparency is the point: the black curtain that used to block the view is gone',
        'The mist only marks inside from outside — it never becomes a spectacle',
        'Moon-white appears only at the arch and the seal — the site-wide highlight discipline'],
    },
    params: ['门洞 4.6 × 4.7 m', '雾膜一层', '流光 60 粒', '自转 ≈0.26 圈/秒'],
    paramsEn: ['Portal 4.6 × 4.7 m', 'One mist film', 'Stream: 60 motes', 'Spin ≈0.26 rev/s'],
  },
  {
    id: 'lanterns', index: 5,
    name: '檐灯 · 窗纸', subtitle: '六盏素灯',
    nameEn: 'Eave Lanterns', subtitleEn: 'Six plain lamps',
    color: 0xffd98a,
    cam: [12, 12, 18], target: [-6, 11, -3],
    principle:
      '一层檐四角各垂一盏,拱门两侧再各一盏:深栗木胎、素盖,内里一点暖芯。' +
      '灯不灭、不摇。园林的灯不照亮路 —— 它只在檐角的阴影里点一个位置出来,' +
      '让人知道这楼是住人的。',
    principleEn:
      'One lantern hangs from each corner of the first eave, two more flank the arch: dark chestnut bodies, ' +
      'plain caps, a warm core inside. They neither go out nor sway. A garden lantern does not light the path — ' +
      'it only marks a position in the eave shadow, so you know the house is lived in.',
    reaction: {
      zh: ['全园唯一的暖光源,只有六处,小而克制', '暖芯与窗纸同一色温——整座楼是一个灯火系统', '灯垂在檐角阴影里,靠光晕读出位置'],
      en: ['The only warm light in the garden — six of them, small and held back',
        'The cores share one colour temperature with the window paper — one lamp system',
        'Lanterns sit in eave shadow; the halo tells you where they hang'],
    },
    params: ['灯 ⌀ 0.84 m', '垂距 0.9 m', '共 6 盏', '光晕半径 2.6 m'],
    paramsEn: ['Lantern ⌀ 0.84 m', 'Drop 0.9 m', 'Total 6', 'Halo ⌀ 2.6 m'],
  },
  {
    id: 'crown', index: 6,
    name: '宝顶', subtitle: '收成一粒素珠',
    nameEn: 'The Finial', subtitleEn: 'Tapered to a plain bead',
    color: 0x8e8578,
    cam: [8, 32, 14], target: [0, 30.5, 0],
    principle:
      '顶不再起檐,两级薄层收成一条素脊领,领上一只宝珠,珠尖一点极淡的光。' +
      '顶要么一条线收掉,要么一个尖收掉 —— 这里选了尖。' +
      '宝顶用砖细的灰褐色,不用金葫芦:园林的屋顶是瓦的,不是金的。',
    principleEn:
      'No more roofs: two thin courses close into a plain collar, a bead above it, one very faint spark at the ' +
      'tip. A top ends either as a line or as a point — here it chooses the point. The finial is brick-grey, ' +
      'not a gilded gourd: a garden roof is made of tile, not of gold.',
    reaction: {
      zh: ['宝珠与尖光是通高的视觉终点,视线自然被引上去', '素脊领窄于顶层平座:不是又一摞盒子', '珠尖微光与门洞月白同色,首尾呼应'],
      en: ['The bead and spark finish the full height — the eye rides them up',
        'The collar is narrower than the top plateau: not another stack of boxes',
        'The tip spark matches the moon-white of the arch — a rhyme between top and gate'],
    },
    params: ['素脊领 ⌀ 1.1 m', '宝珠 2 级', '顶光 ⌀ 0.28 m', '总高 ≈31 m'],
    paramsEn: ['Collar ⌀ 1.1 m', 'Bead: 2 courses', 'Tip spark ⌀ 0.28 m', 'Total ≈31 m'],
  },
  {
    id: 'landscape', index: 7,
    name: '河 · 远山 · 桥', subtitle: '园门之外的一切',
    nameEn: 'River, Hills & Bridge', subtitleEn: 'Everything but the gate',
    color: 0x5fa8a0,
    cam: [12, 5.5, 42], target: [-16, 2, 33],
    principle:
      '门前的河是园子的边界,也是它的借景:水色近岸浅、潭心深,粼光随时间走。' +
      '石桥偏左跨水,是唯一破对称处。远山三重,一重让一重,颜色逐层提浅;' +
      '晨雾在山与水之间慢漂,松三五成组。园林不造山 —— 园林把别人的山借来看。',
    principleEn:
      'The river before the gate is both the garden\'s edge and its borrowed view: pale shallows at the rim, a ' +
      'deep green heart, glints drifting with time. The stone bridge crosses left — the only break in symmetry. ' +
      'Three ridges recede and pale layer by layer; morning mist drifts slowly between them, pines stand in ' +
      'small groups. A garden does not build mountains — it borrows someone else\'s and looks at them.',
    reaction: {
      zh: ['水面是 PBR:映天、涟漪、近岸浅色三层叠加', '山不种一棵树——细节让位给剪影', '萤火偏冷、晨雾偏纸白:两种"光尘"分工'],
      en: ['The water is PBR: sky reflection, ripples and pale shallows in three layers',
        'Not one tree on the hills — detail yields to silhouette',
        'Fireflies lean cool, mist leans paper white: two kinds of dust, two jobs'],
    },
    params: ['园前河 84 × 20 m', '桥跨 14 m', '雾幕 3 重 / 晨雾 9 团', '萤火 20 点'],
    paramsEn: ['River 84 × 20 m', 'Bridge span 14 m', 'Ridges 3 / mist 9', 'Fireflies: 20 motes'],
  },
  {
    id: 'wall', index: 8,
    name: '园墙 · 月洞门', subtitle: '粉墙为纸,漏窗为墨',
    nameEn: 'Garden Wall & Moon Gate', subtitleEn: 'Whitewash for paper, lattice for ink',
    color: 0xe8e4d8,
    cam: [13, 5.4, -52], target: [0, 3.0, -19],
    principle:
      '园林的第一笔不是造景,是砌墙 —— 白墙把山、水、天隔在外头,园里才有余地做文章。' +
      '墙要砌得压得住场:3.3 m 高配 0.62 m 青石勒脚,墙头再压一道黛瓦,墙才读成三段而不是一块板。' +
      '南墙三扇漏窗纹样各不同 —— 六角龟背、乱冰裂、海棠;墙根一丛竹。' +
      '北墙是园子的内门:⌀2.6 m 月洞门居中,两侧各嵌一扇漏窗,26 m 长的墙面于是读成「窗 · 洞 · 窗」。' +
      '这一站从池对岸回看:洞口正好把门楼的拱洞与后头的树影框进来 —— 框景是双向的,门楼框园子,园子也框门楼。',
    principleEn:
      'The first stroke of a garden is not scenery but a wall — whitewash shuts out hill, water and sky, and ' +
      'only then is there room to compose. Plinth, body and cap: three bands, so a wall reads as a wall and ' +
      'not a slab. Three lattice windows on the south wall, three patterns — hexagon, cracked ice, begonia. ' +
      'The north wall is the garden\'s inner door: a ⌀2.6 m moon gate centred, one lattice window either side, ' +
      'so 26 m of wall reads as window · opening · window. From across the pond the opening frames the ' +
      'gatehouse arch and the trees behind it: borrowed scenery works both ways.',
    reaction: {
      zh: ['墙是负空间:全画面最亮的一块,恰恰是空出来的', '勒脚+墙身+墙帽 = 三段横向分层,少一层就成一块板', '「窗·洞·窗」的横向节奏:先有节奏,再谈纹样'],
      en: ['The wall is negative space: the brightest area is the empty one',
        'Plinth, body, cap — three horizontal bands; drop one and it becomes a slab',
        'Window · opening · window: rhythm first, pattern second'],
    },
    params: ['墙高 3.3 m / 厚 0.34 m', '漏窗 8 扇 / 3 种纹样', '月洞门 ⌀2.6 m', '竹丛 5 处'],
    paramsEn: ['Wall 3.3 × 0.34 m', '8 windows / 3 patterns', 'Moon gate ⌀2.6 m', 'Bamboo: 5 clumps'],
  },
  {
    id: 'garden', index: 9,
    name: '园心 · 池 · 亭', subtitle: '一勺代水,一峰代山',
    nameEn: 'The Garden Heart · Pond & Pavilion', subtitleEn: 'A spoonful for a lake, a stone for a hill',
    color: 0x3f6b63,
    cam: [13, 6.0, -26], target: [11, 2.4, -52],
    principle:
      '园子中间是水。江南造园讲「一勺代水」—— 池不必真大,但必须有一片静水把天接住,四周景物才有倒影可依。' +
      '池岸不是几何圆:42 块驳岸石贴着实际岸线一块块摆,石间留缺口,水才有进有退。' +
      '临水一座六角亭,攒尖顶配美人靠,坐在亭里四面临水,是全园唯一的看台。' +
      '亭前挑出一方石矶,两块条石伸进水里 —— 它不看景,它给看景的人一个落脚的由头。' +
      '水面上零星荷叶是全园唯一的尺度参照物:没有它,再大的池也只是「一片颜色」,人眼读不出深浅。',
    principleEn:
      'Water sits at the centre. The Jiangnan rule is a spoonful standing in for a lake: the pond need not ' +
      'be large, but it must be still enough to hold the sky, so everything around it has something to ' +
      'reflect. The bank is not a geometric circle — 42 boulders are set one by one onto the real shoreline, ' +
      'gaps left between them so the water can come and go. A hexagonal pavilion stands at the water: ' +
      'conical roof, railed seats, water on four sides — the garden\'s only grandstand. A stone jetty of two ' +
      'slabs pushes out over the water; it is not for looking, it is the excuse for looking. A few lotus pads ' +
      'are the garden\'s only scale reference: without them even a big pond is just a patch of colour.',
    reaction: {
      zh: ['静水是镜子:看池面有没有把天与山接住', '驳岸石大小交错、贴岸不浮空 —— 石下水陆接缝被吃掉', '荷叶是尺度锚点:有它才读得出池的大小与亭的高低'],
      en: ['Still water is a mirror: does it hold the sky and the hill?',
        'Boulders alternate in size and sit on the real shoreline — the seam between land and water disappears',
        'Lotus pads are the scale anchor: with them you can finally read the pond\'s size'],
    },
    params: ['池面 椭圆 40 × 24 m', '六角亭 对角 4.7 m', '驳岸石 42 块', '荷叶 20 片 / 石矶 1 处'],
    paramsEn: ['Pond 40 × 24 m ellipse', 'Hex pavilion ⌀4.7 m', '42 shore boulders', '20 lotus pads / 1 jetty'],
  },
];

export const I18N = {
  sideTitle: { zh: '园门 · 江南小园', en: 'Garden Gate · A Jiangnan Garden' },
  ipIndexLabel: { zh: '构件', en: 'Element' },
  principleTitle: { zh: '形制 · 读法', en: 'Form & reading' },
  reactionTitle: { zh: '看图要点', en: 'What to notice' },
  paramsTitle: { zh: '尺度(虚构参考值)', en: 'Scale (invented)' },
};
