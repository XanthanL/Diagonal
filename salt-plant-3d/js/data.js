// 自贡井盐 · 天车（木构井架）3D 解构数据（含中英文）
// PROCESS 现为一个「构件导览」：总览 + 7 个部件。每一项都可被左侧栏点击，
// 触发相机聚焦（cam/target）并展开右侧双语详情。UI 字段：
//   principle 功能与工艺 / reaction 结构·营建要点 {zh,en} /
//   params 关键形制 (paramsEn) / equipment 主要构件 (equipmentEn，仅总览) / output 提卤产出 (outputEn，仅总览)

export const PROCESS = [
  // 0 —— 总览
  {
    id: 'overview', index: 0, name: '天车', subtitle: '自贡井盐木构井架',
    nameEn: 'Derrick', subtitleEn: 'Timber Headframe of Zigong Well Salt',
    model: 'well', color: 0xB33A2A, position: [0, 0, 0],
    cam: [16, 12, 26], target: [0, 6, 0],
    principle:
      '天车是自贡井盐的标志性木构井架，矗立于盐井之上，用于冲击式顿钻凿井与提汲卤水。其以杉木为骨——但因无足够长度的整木，每根「柱」实为多根杉木并排靠拢、接头彼此错开（错缝搭接）而成的束柱，外面用竹篾一道道密缠成箍，关键节点再套手锻铁箍锁死，全程不用一钉，由低到高逐级收分；顶端置天辊、地面设地辊与大车，构成提卤滑轮组。',
    principleEn:
      'The derrick is Zigong’s iconic timber headframe above the salt well, used for percussion drilling and drawing brine. Because no single fir reaches that height, each "column" is a bundle of trunks stood side-by-side with offset splices, lashed tight by bamboo-cord rings — and at every key joint a hand-forged iron hoop locks the assembly — without a single iron nail. It tapers from a wide base to a narrow top, carrying a sky roller aloft and ground rollers and a draw-cart below.',
    reaction: {
      zh: [
        '束柱：多杉并束、错缝搭接（不是一根整木）',
        '竹篾密缠成箍，间隔以手锻铁箍锁紧节点',
        '四面收分：由低到高渐窄，并束根数递减（6→2）',
        '天辊 → 地辊 → 大车：滑轮组提卤',
        '碓架：踩板蓄能，碓头重力冲击凿井',
        '盐工寮棚 + 井台竹笆，构成井场聚落',
      ],
      en: [
        'Bundle columns: lashed fir trunks with offset splices — not one solid log',
        'Bamboo-cord rings, with hand-forged iron hoops locking the nodes',
        'Four-sided taper: narrower upward, fewer trunks (6→2)',
        'Sky roller → ground roller → cart: a lifting pulley train',
        'Percussion rig: treadle stores energy, hammer falls to drill',
        'Brine-shed + bamboo screen form the well-yard settlement',
      ],
    },
    equipment: ['束柱（多杉并束、竹篾成箍）', '大车（提卤绞盘）', '地辊（转向定滑轮）', '碓架（冲击顿钻）', '风篾（防风拉索）', '汲卤筒（提卤桶）', '铁箍（关键节点锁紧）', '盐工寮棚 + 井台竹笆'],
    equipmentEn: ['Bundle column (lashed fir trunks)', 'Cart (draw-wheel)', 'Ground roller (deflector)', 'Duijia (percussion rig)', 'Wind stays (guy lines)', 'Bailer (draw bucket)', 'Iron hoops (joint lock)', 'Brine-shed + bamboo screen'],
    params: ['天车高约 18 m（燊海井实制）', '束柱 6→2 根渐束', '篾箍 ≈0.7 m/道，铁箍每 3 道', '大车直径约 4.5 m', '风篾 12 根放射拉索'],
    paramsEn: ['Derrick ~18 m (Shenhai Well)', 'Bundle 6→2 trunks', 'Bamboo hoop ~0.7 m, iron every 3rd', 'Cart Ø ~4.5 m', '12 radiating wind stays'],
    output: '提汲卤水（制盐原料）；维系井场工匠的日常',
    outputEn: 'Drawn brine (salt-making feed); the daily life of well-yard craftsmen',
  },

  // 1 —— 束柱
  {
    id: 'column', index: 1, name: '束柱', subtitle: '多杉并束 · 竹篾成箍',
    nameEn: 'Bundle Columns', subtitleEn: 'Lashed Fir Trunks',
    color: 0x8C755A, position: [-0.6, 0, 0.2],
    cam: [8, 9, 17], target: [-0.6, 7, 0.2],
    halo: [-0.6, 7.5, 0.2, 3.6],
    principle:
      '天车没有数十米长的整木。每根「柱」由多根杉木并排靠拢、接头彼此错开（错缝搭接）成束，外缠竹篾一道道密箍；关键节点再套手锻铁箍锁死。越往上并束根数越少、越细，整体截面收缩，形成天车「收分」轮廓 —— 收分不是造型选择，而是「无长木可用」这一约束的自然结果。',
    principleEn:
      'No single fir reaches tens of metres, so each "column" is a bundle of trunks stood side-by-side with offset splices, lashed by bamboo-cord rings; key nodes are locked by hand-forged iron hoops. Higher up, fewer and thinner trunks make the cross-section shrink — producing the derrick’s taper. The taper is not a styling choice but the natural result of having no long timber.',
    reaction: {
      zh: [
        '多根杉木围轴并束，并非单根整木',
        '错缝搭接：短木对接，弱面错开不同高度',
        '竹篾螺旋密缠成箍（≈0.7 m/道）',
        '每 3 道篾箍换 1 道铁箍锁紧节点',
        '并束根数 6→2 递减，越上越细',
        '收分即束柱截面的逐级收缩',
      ],
      en: [
        'Several fir trunks bundled around an axis — not one log',
        'Offset splices: short logs joined, weak faces staggered in height',
        'Bamboo-cord rings wound helically (~0.7 m pitch)',
        'One iron hoop every 3rd bamboo ring locks the node',
        'Trunk count tapers 6→2, thinner upward',
        'The taper is the progressive shrink of the bundle',
      ],
    },
    params: ['主天车 6 根并束', '副天车 4 根并束', '篾箍 ≈0.7 m/道', '铁箍每 3 道', '收分 顶半宽≈底×0.32'],
    paramsEn: ['Main derrick 6 trunks', 'Sub derrick 4 trunks', 'Bamboo hoop ~0.7 m', 'Iron hoop every 3rd', 'Taper top half ≈ 0.32× base'],
  },

  // 2 —— 天辊 · 风篾
  {
    id: 'roller', index: 2, name: '天辊 · 风篾', subtitle: '提卤定滑轮 · 防风拉索',
    nameEn: 'Sky Roller & Stays', subtitleEn: 'Pulley & Guy Lines',
    color: 0xA9AC82, position: [0, 0, 0],
    cam: [9, 15, 18], target: [0, 13, 0],
    halo: [0, 13, 0, 3.8],
    principle:
      '顶端天辊是为提卤绳导向的带槽定滑轮，使绳索在井架顶部平稳转向；风篾是自井架上部向外伞状放射的 12 根竹篾拉索，末端固定于地桩夯土之中，以抵抗江风侧压、稳定高耸井架。二者一柔一刚，共维天车直立。',
    principleEn:
      'The sky roller aloft is a grooved fixed pulley that guides the lifting rope smoothly over the headframe; the wind stays are 12 bamboo-cord guy lines radiating outward and anchored into pegged earth, resisting lateral wind load and stabilising the tall frame. One flexible, one rigid, together they hold the derrick upright.',
    reaction: {
      zh: [
        '天辊带槽，防止提卤绳脱槽',
        '风篾 12 根伞状放射',
        '地桩入土夯固，承拉不承剪',
        '篾绳节点无金属，全靠绞紧',
        '放射角约 45°，决定抗风能力',
        '风篾随高度收紧，越上越密',
      ],
      en: [
        'Grooved sky roller keeps the rope on track',
        '12 wind stays radiate like an umbrella',
        'Earth pegs take tension, not shear',
        'Cord joints are metal-free, held by tension',
        '~45° splay sets the wind resistance',
        'Stays tighten with height, denser above',
      ],
    },
    params: ['天辊 Ø ≈2.4 m', '风篾 12 根', '放射角 ≈45°', '地桩夯土固定', '篾绳无金属节点'],
    paramsEn: ['Sky roller Ø ≈2.4 m', '12 wind stays', 'Splay ≈45°', 'Pegs in earth', 'Cord joints metal-free'],
  },

  // 3 —— 大车
  {
    id: 'cart', index: 3, name: '大车', subtitle: '提卤绞盘 · 畜力/人力',
    nameEn: 'Draw Cart', subtitleEn: 'Draw-wheel',
    color: 0x8C755A, position: [-3.8, 0, 1.4],
    cam: [4, 5, 14], target: [-3.8, 2.2, 1.4],
    halo: [-3.8, 2.0, 1.4, 2.6],
    principle:
      '地面大车是直径约 4.5 m 的木轮绞盘，由畜力或人力推动转动，将绕在轮缘的提卤绳收放，把汲卤筒自数十丈深井中绞起。它是提卤滑轮组的动力端，与天辊、地辊串成完整提卤链路。',
    principleEn:
      'The ground cart is a ~4.5 m timber wheel winch turned by draft animals or workers, paying out and reeling in the lifting rope to draw the bailer from a well tens of metres deep. It is the power end of the pulley train,串联 with the sky and ground rollers.',
    reaction: {
      zh: [
        '大轮低重心，转动稳',
        '轴碗以铁箍加固，承扭矩',
        '立柱以竹篾捆扎，无铁钉',
        '轮缘可加辐条减重',
        '与天辊、地辊构成滑轮组',
        '畜力/人力双驱动',
      ],
      en: [
        'Large low wheel, stable rotation',
        'Iron-hooped hub takes the torque',
        'Posts lashed with bamboo cord, nail-free',
        'Spokes lighten the rim',
        'Forms the pulley train with the rollers',
        'Driven by animal or human power',
      ],
    },
    params: ['直径 ≈4.5 m', '轴碗铁箍加固', '竹篾捆扎立柱', '辐条木轮', '畜力/人力驱动'],
    paramsEn: ['Ø ≈4.5 m', 'Iron-hooped hub', 'Bamboo-lashed posts', 'Spoked wheel', 'Animal / human driven'],
  },

  // 4 —— 地辊
  {
    id: 'ground', index: 4, name: '地辊', subtitle: '转向定滑轮',
    nameEn: 'Ground Roller', subtitleEn: 'Deflector Pulley',
    color: 0x8C755A, position: [-1.9, 0, 2.1],
    cam: [4, 5, 12], target: [-1.9, 2.4, 2.1],
    halo: [-1.9, 1.4, 2.1, 1.5],
    principle:
      '地辊置于地面，是改变提卤绳走向的定滑轮：把竖直井筒与水平绞盘之间的绳路转折连接，使大车的水平收绳能顺畅转化为汲卤筒的竖直升降。',
    principleEn:
      'The ground roller sits at floor level as a deflection pulley: it turns the lifting rope between the vertical well shaft and the horizontal cart, so the cart’s horizontal reeling becomes the bailer’s vertical travel.',
    reaction: {
      zh: [
        '带槽防脱绳',
        '铁箍轴碗，耐磨承拉',
        '低矮贴地，稳定不晃',
        '连接天辊与大车',
        '绳路转折的关键节点',
        '竹篾捆扎基座',
      ],
      en: [
        'Grooved, rope stays seated',
        'Iron-hooped hub, wears well under load',
        'Low and grounded, no wobble',
        'Links sky roller and cart',
        'The key node of the rope turn',
        'Bamboo-lashed base',
      ],
    },
    params: ['定滑轮', '槽宽≈绳径', '铁箍轴碗', '贴地低矮', '连接天辊—大车'],
    paramsEn: ['Fixed pulley', 'Groove ≈ rope', 'Iron-hooped hub', 'Low to ground', 'Links roller—cart'],
  },

  // 5 —— 碓架
  {
    id: 'duijia', index: 5, name: '碓架', subtitle: '冲击顿钻 · 凿井',
    nameEn: 'Percussion Rig', subtitleEn: 'Impact Drilling',
    color: 0x6E5A42, position: [5.6, 0, 1.6],
    cam: [13, 6, 7.5], target: [5.6, 2.5, 1.6],
    halo: [5.6, 2.6, 1.6, 2.3],
    principle:
      '碓架以踩板蓄能、碓头借重力冲击，带动井下钻杆做冲击式顿钻，是凿穿岩层、加深盐井的核心机构。它通常与提卤共用同一井位，凿井与采卤交替进行。',
    principleEn:
      'The percussion rig stores energy in a treadle and lets the hammer-head fall by gravity to drive the drill string — the core mechanism of impact drilling that pierces rock and deepens the brine well. It often shares the shaft with lifting, alternating drilling and drawing.',
    reaction: {
      zh: [
        '踩板蓄能，杠杆放大',
        '碓头以铁箍加固，耐冲击',
        '钻杆入井，冲击凿岩',
        '冲击频率决定凿速',
        '与提卤共用井位',
        '竹篾捆扎机架',
      ],
      en: [
        'Treadle stores energy, lever amplifies',
        'Hammer-head iron-hooped, impact-proof',
        'Drill string enters well, breaks rock',
        'Stroke rate sets drilling speed',
        'Shares the shaft with lifting',
        'Bamboo-lashed frame',
      ],
    },
    params: ['冲击式顿钻', '碓头铁箍', '钻杆木/铁', '畜力踩板', '与提卤同井'],
    paramsEn: ['Percussion drilling', 'Iron-hooped hammer', 'Wood/iron drill', 'Animal treadle', 'Same shaft as lifting'],
  },

  // 6 —— 汲卤筒
  {
    id: 'bailer', index: 6, name: '汲卤筒', subtitle: '提卤桶 · 入井',
    nameEn: 'Bailer', subtitleEn: 'Draw Bucket',
    color: 0x6B6259, position: [0.4, 0, 0],
    cam: [7, 7, 13], target: [0.4, 4, 0],
    halo: [0.4, 3.2, 0, 1.5],
    principle:
      '汲卤筒是入井提卤的木桶：桶口以双道铁箍锁固、桶底收成锥尖便于沉入卤水；由提卤绳经天辊—地辊—大车升降，把井底卤水一筒筒绞上地面。',
    principleEn:
      'The bailer is the wooden bucket that draws brine: a double iron hoop locks the rim and a tapered base eases it into the brine; the lifting rope runs through sky roller, ground roller and cart to winch it up, load by load.',
    reaction: {
      zh: [
        '桶口双道铁箍锁固',
        '桶底锥尖，易沉卤',
        '耳环系绳，随绳升降',
        '升降联动大车转动',
        '木桶防腐，铁箍护口',
        '容积随井深调整',
      ],
      en: [
        'Double iron hoop locks the rim',
        'Tapered base sinks easily',
        'Lug ties the rope, rides up and down',
        'Travel drives the cart in sync',
        'Rot-proof wood, iron-guarded rim',
        'Volume set by well depth',
      ],
    },
    params: ['木桶', '双道铁箍', '锥底', '耳环系绳', '随绳联动大车'],
    paramsEn: ['Timber bucket', 'Double iron hoop', 'Tapered base', 'Rope lug', 'Synced with cart'],
  },

  // 7 —— 盐工寮棚 · 竹笆
  {
    id: 'shed', index: 7, name: '盐工寮棚 · 竹笆', subtitle: '井场聚落 · 遮风',
    nameEn: 'Shed & Screen', subtitleEn: 'Well-yard Shelter',
    color: 0x9A8455, position: [7.6, 0, 4.8],
    cam: [12.5, 5.5, 11.5], target: [7.6, 2.2, 4.8],
    halo: [7.6, 2.2, 4.8, 3.6],
    principle:
      '井台旁设草顶竹笆工棚，供盐工歇息、存放工具与卤缸；井台外缘以竹笆屏风挡风遮泥。寮棚与竹笆让冰冷的工业井架旁长出一处有人烟的「井场聚落」，是天车得以常年运转的生活基底。',
    principleEn:
      'Beside the well stands a thatch-and-bamboo shed for workers to rest, keep tools and store brine jars; bamboo screens ring the yard against wind and mud. Shed and screen grow a lived "well-yard settlement" beside the cold industrial frame — the everyday base that let the derrick run year-round.',
    reaction: {
      zh: [
        '草顶单坡，前高后低',
        '竹笆三面围护，朝井敞开',
        '棚下陶卤缸储卤',
        '铁箍桩帽固定竹笆',
        '竹笆经纬互压编结',
        '与天车同工艺：竹篾捆扎',
      ],
      en: [
        'Single-pitch thatch, higher front',
        'Bamboo screen on three sides, open to well',
        'Earthen brine jars stored inside',
        'Iron-hooped caps fix the screen',
        'Bamboo woven warp-over-weft',
        'Same craft as derrick: bamboo lashing',
      ],
    },
    params: ['草顶竹笆', '陶卤缸', '铁箍桩帽', '单坡屋顶', '井台外缘屏风'],
    paramsEn: ['Thatch & bamboo', 'Earthen jars', 'Iron-hooped pegs', 'Single-pitch roof', 'Yard-edge screen'],
  },
];

// 材料 / 构件图例（颜色 + 中英文名称）
export const LEGEND = [
  { color: 0x8C755A, zh: '杉木（束柱）', en: 'Fir bundle' },
  { color: 0xA9AC82, zh: '竹篾（箍）', en: 'Bamboo' },
  { color: 0x6B6259, zh: '铁箍（节点）', en: 'Iron hoop' },
  { color: 0x9A8455, zh: '茅草（寮棚）', en: 'Thatch' },
];

// UI 多语言文案
export const I18N = {
  zh: {
    title: '天车',
    sub: '木构天车 3D 解构',
    sideTitle: '天车 · 构件导览',
    sideTip: '点击构件聚焦视角 · 拖拽旋转 · 滚轮缩放',
    ctrl: { prev: '上一步', tour: '自动聚焦', next: '下一步', play: '动画', playOff: '已停止', rotate: '自转', rotateOff: '自转关', labels: '标签', labelsOff: '标签关', reset: '总览', touring: '聚焦中', download: '下载' },
    introTitle: '天车',
    introDesc: '自贡井盐的标志——木构天车（井架）。其以多根杉木并束、错缝搭接成柱，外缠竹篾成箍，节点以手锻铁箍锁紧，全程不用一钉；顶端天辊、地面地辊与大车构成提卤滑轮组，碓架以冲击顿钻凿井。井台旁设有盐工寮棚与竹笆屏风。本页为其实时 3D 解构。',
    introSub: '拖拽旋转视角，点击左侧构件聚焦查看；动画展示提卤与顿钻。',
    introBtn: '进入天车 ▸',
    ipIndex: '装置', ipPrinciple: '功能与工艺', ipReaction: '结构 · 营建要点', ipEquip: '主要构件', ipParams: '关键形制', ipOutput: '提卤产出',
    btnOverview: '总览', btnInfo: '关于天车',
  },
  en: {
    title: 'Derrick',
    sub: '3D Deconstruction of the Timber Derrick',
    sideTitle: 'Derrick · Parts',
    sideTip: 'Click a part to focus · Drag to orbit · Scroll to zoom',
    ctrl: { prev: 'Prev', tour: 'Auto Focus', next: 'Next', play: 'Animate', playOff: 'Stopped', rotate: 'Rotate', rotateOff: 'Rotate Off', labels: 'Labels', labelsOff: 'Labels Off', reset: 'Overview', touring: 'Focusing', download: 'Download' },
    introTitle: 'Derrick',
    introDesc: 'The emblem of Zigong well salt — the timber derrick. Each column is a bundle of fir trunks with offset splices, lashed tight by bamboo-cord rings and locked at the nodes by hand-forged iron hoops; not a single iron nail. A sky roller aloft and ground rollers and draw-cart below form the lifting pulley train; the percussion rig drills by impact. A brine-shed and bamboo screen frame the well yard. This page is its live 3D deconstruction.',
    introSub: 'Drag to orbit; click a part at left to focus. Animation shows brine lifting and percussion drilling.',
    introBtn: 'Enter ▸',
    ipIndex: 'Unit', ipPrinciple: 'Function & Craft', ipReaction: 'Structure · Build', ipEquip: 'Components', ipParams: 'Key Specs', ipOutput: 'Output',
    btnOverview: 'Overview', btnInfo: 'About',
  },
};
