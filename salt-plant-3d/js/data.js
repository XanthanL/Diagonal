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
    cam: [21, 15, 27], target: [0, 6.6, 0],
    principle:
      '天车是自贡井盐的标志性木构井架，矗立于盐井之上，用于冲击式顿钻凿井与提汲卤水。其以杉木为骨——但因无足够长度的整木，每根「柱」实为多根杉木并排靠拢、接头彼此错开（错缝搭接）而成的束柱，外面用竹篾一道道密缠成箍，关键节点再套手锻铁箍锁死，全程不用一钉，由低到高逐级收分；顶端置天辊、地面设地辊与大车，构成提卤滑轮组。',
    principleEn:
      'The derrick is Zigong’s iconic timber headframe above the salt well, used for percussion drilling and drawing brine. Because no single fir reaches that height, each "column" is a bundle of trunks stood side-by-side with offset splices, lashed tight by bamboo-cord rings — and at every key joint a hand-forged iron hoop locks the assembly — without a single iron nail. It tapers from a wide base to a narrow top, carrying a sky roller aloft and ground rollers and a draw-cart below.',
    reaction: {
      zh: [
        '束柱：多杉并束、错缝搭接（不是一根整木）',
        '竹篾密缠成箍，间隔以手锻铁箍锁紧节点',
        '四面收分：由低到高渐窄，并束根数递减（4→3→2）',
        '天辊 → 地辊 → 大车：滑轮组提卤',
        '碓架：踩板蓄能，碓头重力冲击凿井',
        '盐工寮棚：井场旁唯一的建筑',
      ],
      en: [
        'Bundle columns: lashed fir trunks with offset splices — not one solid log',
        'Bamboo-cord rings, with hand-forged iron hoops locking the nodes',
        'Four-sided taper: narrower upward, fewer trunks (4→3→2)',
        'Sky roller → ground roller → cart: a lifting pulley train',
        'Percussion rig: treadle stores energy, hammer falls to drill',
        'Brine-shed: the only building in the well-yard',
      ],
    },
    equipment: ['束柱（多杉并束、竹篾成箍）', '大车（提卤绞盘）', '地辊（转向定滑轮）', '碓架（冲击顿钻）', '风篾（防风拉索）', '汲卤筒（提卤桶）', '铁箍（关键节点锁紧）', '盐工寮棚'],
    equipmentEn: ['Bundle column (lashed fir trunks)', 'Cart (draw-wheel)', 'Ground roller (deflector)', 'Duijia (percussion rig)', 'Wind stays (guy lines)', 'Bailer (draw bucket)', 'Iron hoops (joint lock)', 'Brine-shed'],
    params: ['塔高约 13 m（四棱锥台形制）', '束柱 4→3→2 根递减', '篾箍 ≈0.5 m/道，铁箍每 4 道', '大车 Ø ≈3.4 m（绳绕轮缘）', '风篾 8 根伞状放射'],
    paramsEn: ['Tower ~13 m (four-sided taper)', 'Bundle 4→3→2 trunks', 'Bamboo hoop ~0.5 m, iron every 4th', 'Cart Ø ~3.4 m (rope on rim)', '8 radiating wind stays'],
    output: '提汲卤水（制盐原料）；维系井场工匠的日常',
    outputEn: 'Drawn brine (salt-making feed); the daily life of well-yard craftsmen',
  },

  // 1 —— 束柱
  {
    id: 'column', index: 1, name: '束柱', subtitle: '多杉并束 · 竹篾成箍',
    nameEn: 'Bundle Columns', subtitleEn: 'Lashed Fir Trunks',
    color: 0x77634C, position: [-0.6, 0, 0.2],
    cam: [7.5, 7, 10.5], target: [1.5, 6.2, 1.5],
    principle:
      '天车没有数十米长的整木。每根「柱」由多根杉木并排靠拢、接头彼此错开（错缝搭接）成束，外缠竹篾一道道密箍；关键节点再套手锻铁箍锁死。越往上并束根数越少、越细，整体截面收缩，形成天车「收分」轮廓 —— 收分不是造型选择，而是「无长木可用」这一约束的自然结果。四根角柱自下而上分三段换径（4→3→2 根），换径处正好落在箍梁上。',
    principleEn:
      'No single fir reaches tens of metres, so each "column" is a bundle of trunks stood side-by-side with offset splices, lashed by bamboo-cord rings; key nodes are locked by hand-forged iron hoops. Higher up, fewer and thinner trunks make the cross-section shrink — producing the derrick’s taper. The taper is not a styling choice but the natural result of having no long timber.',
    reaction: {
      zh: [
        '多根杉木围轴并束，并非单根整木',
        '错缝搭接：短木对接，弱面错开不同高度',
        '竹篾螺旋密缠成箍（≈0.5 m/道）',
        '每 4 道篾箍换 1 道铁箍锁紧节点',
        '并束根数 4→3→2 递减，越上越细',
        '收分即束柱截面的逐级收缩',
      ],
      en: [
        'Several fir trunks bundled around an axis — not one log',
        'Offset splices: short logs joined, weak faces staggered in height',
        'Bamboo-cord rings wound helically (~0.5 m pitch)',
        'One iron hoop every 4th bamboo ring locks the node',
        'Trunk count tapers 4→3→2, thinner upward',
        'The taper is the progressive shrink of the bundle',
      ],
    },
    params: ['角柱底段 4 根并束', '中段 3 根 · 顶段 2 根', '篾箍 ≈0.5 m/道，铁箍每 4 道', '换径处落在箍梁上', '收分 顶半宽 ≈ 底×0.33'],
    paramsEn: ['Base stage 4 trunks', 'Mid 3 · Top 2 trunks', 'Bamboo hoop ~0.5 m, iron every 4th', 'Stepped at the ring beams', 'Taper top half-width ≈ 0.33× base'],
  },

  // 2 —— 天辊 · 风篾
  {
    id: 'roller', index: 2, name: '天辊 · 风篾', subtitle: '提卤定滑轮 · 防风拉索',
    nameEn: 'Sky Roller & Stays', subtitleEn: 'Pulley & Guy Lines',
    color: 0xA9AC82, position: [0, 0, 0],
    cam: [16, 16, 20], target: [0, 10.5, 0],
    principle:
      '顶端天辊是为提卤绳导向的带槽定滑轮，使绳索在井架顶部平稳转向；风篾是自天箍头向外伞状散出的 8 根竹篾拉索，末端固定于地桩夯土之中，以抵抗江风侧压、稳定高耸井架。二者一柔一刚，共维天车直立。',
    principleEn:
      'The sky roller aloft is a grooved fixed pulley that guides the lifting rope smoothly over the headframe; the wind stays are 8 bamboo-cord guy lines radiating outward from the top collar and anchored into pegged earth, resisting lateral wind load and stabilising the tall frame. One flexible, one rigid, together they hold the derrick upright.',
    reaction: {
      zh: [
        '天辊带槽，防止提卤绳脱槽',
        '风篾 8 根伞状放射（避让井场设备）',
        '地桩入土夯固，承拉不承剪',
        '篾绳节点无金属，全靠绞紧',
        '挂点 ≈0.94 塔高，伞面开阔',
        '风篾随高度收紧，越上越密',
      ],
      en: [
        'Grooved sky roller keeps the rope on track',
        '8 wind stays radiate like an umbrella',
        'Earth pegs take tension, not shear',
        'Cord joints are metal-free, held by tension',
        'Attach at ~0.94 H opens the umbrella',
        'Stays tighten with height, denser above',
      ],
    },
    params: ['天辊 Ø ≈1.1 m', '风篾 8 根（45° 均布）', '挂点 ≈0.94 塔高', '地桩夯土固定', '篾绳无金属节点'],
    paramsEn: ['Sky roller Ø ≈1.1 m', '8 wind stays (45° apart)', 'Attach ≈0.94 H', 'Pegs in earth', 'Cord joints metal-free'],
  },

  // 3 —— 大车
  {
    id: 'cart', index: 3, name: '大车', subtitle: '提卤绞盘 · 畜力/人力',
    nameEn: 'Draw Cart', subtitleEn: 'Draw-wheel',
    color: 0x8C755A, position: [-3.8, 0, 1.4],
    cam: [-10, 4.5, 10], target: [-5.4, 2.0, 0],
    principle:
      '地面大车是直径约 3.4 m 的木轮绞盘，由畜力或人力推动转动，将绕在轮缘的提卤绳收放，把汲卤筒自数十丈深井中绞起。它是提卤滑轮组的动力端，与天辊、地辊串成完整提卤链路。',
    principleEn:
      'The ground cart is a ~3.4 m timber wheel winch turned by draft animals or workers, paying out and reeling in the lifting rope to draw the bailer from a well tens of metres deep. It is the power end of the pulley train,串联 with the sky and ground rollers.',
    reaction: {
      zh: [
        '大轮低重心，转动稳',
        '轴碗以铁箍加固，承扭矩',
        '立柱以竹篾捆扎，无铁钉',
        '敞口辐条轮，轮缘即卷筒',
        '与天辊、地辊构成滑轮组',
        '畜力/人力双驱动',
      ],
      en: [
        'Large low wheel, stable rotation',
        'Iron-hooped hub takes the torque',
        'Posts lashed with bamboo cord, nail-free',
        'Open spoked wheel; the rim is the drum',
        'Forms the pulley train with the rollers',
        'Driven by animal or human power',
      ],
    },
    params: ['轮径 ≈3.4 m', '绳绕轮缘绳槽', '敞口 12 辐', '轴碗铁箍加固', '竹篾捆扎立柱'],
    paramsEn: ['Wheel Ø ≈3.4 m', 'Rope winds on the rim groove', '12 open spokes', 'Iron-hooped hub', 'Bamboo-lashed posts'],
  },

  // 4 —— 地辊
  {
    id: 'ground', index: 4, name: '地辊', subtitle: '转向定滑轮',
    nameEn: 'Ground Roller', subtitleEn: 'Deflector Pulley',
    color: 0x8C755A, position: [-1.9, 0, 2.1],
    cam: [-3.6, 2.0, 4.4], target: [-1.6, 1.0, 0],
    principle:
      '地辊是改变提卤绳走向的定滑轮，架在塔身内低矮的木承轴架上：提卤绳自天辊沿塔身中轴垂直落下，经地辊转为水平，引向塔外的大车。竖直的汲卤升降与水平的绞盘收绳，就在这一只辊上完成转折。',
    principleEn:
      'The ground roller is the deflection pulley that turns the rope: the lifting line drops vertically along the tower axis from the sky roller, passes over the ground roller and runs out horizontally to the cart outside. Vertical bailer travel and horizontal reeling meet at this one roller.',
    reaction: {
      zh: [
        '带槽防脱绳',
        '铁箍轴碗，耐磨承拉',
        '承轴木架低矮，稳定不晃',
        '塔内垂直落绳，转水平引出',
        '绳路转折的关键节点',
        '竹篾捆扎基座',
      ],
      en: [
        'Grooved, rope stays seated',
        'Iron-hooped hub, wears well under load',
        'Low timber axle frame, no wobble',
        'Vertical drop in, horizontal out',
        'The key node of the rope turn',
        'Bamboo-lashed base',
      ],
    },
    params: ['立式导辊', '轮缘绳槽', '六辐木轮', '铁箍轴座', '辊心高 ≈1.9 m'],
    paramsEn: ['Vertical deflector', 'Rim groove', '6-spoke wheel', 'Iron axle seats', 'Break-out ≈1.9 m'],
  },

  // 5 —— 碓架
  {
    id: 'duijia', index: 5, name: '碓架', subtitle: '冲击顿钻 · 凿井',
    nameEn: 'Percussion Rig', subtitleEn: 'Impact Drilling',
    color: 0x6E5A42, position: [6.4, 0, 1.8],
    cam: [9.8, 3.0, 7.2], target: [4.9, 1.0, 0],
    principle:
      '碓架是冲击式顿钻的蓄能—落锤机构：花辊轴上架一根碓梢，前端硬接碓杆与碓头，后端设踏板。盐工站上踏板、以体重把碓梢后端压下，前端碓头随之抬起蓄能；松脚，重力令碓头跌落，在砧石上砸出一下冲击。如此反复，正是凿穿岩层、加深盐井的原理 —— 「自贡井盐深钻汲制技艺」列国家级非遗。',
    principleEn:
      'The percussion rig is a store-and-drop mechanism: a lever (the duishao) rides on a roller fulcrum, carrying the hammer shaft at its front end and a treadle at its back. Standing on the treadle, the worker presses the back end down and the hammer at the front rises, storing energy; releasing it lets gravity drop the hammer onto the anvil — one blow. Repeated without end, this is how rock is pierced and the well deepened: Zigong deep-drilling brine technology, a national intangible heritage.',
    reaction: {
      zh: [
        '踏板蓄能，碓梢杠杆放大',
        '碓头铁箍加固，熟铁靴耐冲击',
        '松脚落锤，砧石承击',
        '冲击频率决定凿速',
        '花辊轴为铰，全程无钉',
        '竹篾捆扎机架',
      ],
      en: [
        'Treadle stores energy, lever amplifies',
        'Iron-hooped head with a forged-iron shoe',
        'Release drops the hammer onto the anvil',
        'Stroke rate sets drilling speed',
        'Roller-fulcrum joint, nail-free',
        'Bamboo-lashed frame',
      ],
    },
    params: ['冲击式顿钻', '碓梢杠杆 ≈3.4 m', '碓头 + 熟铁靴', '踏板 ≈0.3–0.8 m 行程', '砧石承击'],
    paramsEn: ['Percussion drilling', 'Lever ≈3.4 m', 'Hammer + forged shoe', 'Treadle travel ≈0.3–0.8 m', 'Stone anvil'],
  },

  // 6 —— 汲卤筒
  {
    id: 'bailer', index: 6, name: '汲卤筒', subtitle: '细长竹筒 · 入井提卤',
    nameEn: 'Bailer', subtitleEn: 'Slender Bamboo Tube',
    color: 0x6B6259, position: [-0.6, 0, 0.2],
    cam: [6.6, 4.2, 7.6], target: [0, 2.7, 0],
    principle:
      '汲卤筒是入井提卤的细长楠竹筒（长约 5 m）：筒身以竹篾一道道箍住，筒口两道铁箍承受提环的拉力，筒底设单向阀（木舌）。下放时卤水顶开阀口灌入筒内；提升时筒内水压令阀口自闭，一筒卤水随之升上地面。绳自天辊垂直落至筒顶提环，筒身沿塔身中轴在井口石箍中进出。',
    principleEn:
      'The bailer is a slender bamboo tube about 5 m long: the shaft is ringed with bamboo cord, two iron hoops at the mouth take the strain of the lifting lug, and a one-way valve (a wooden tongue) sits at the base. Lowered, brine forces the valve open and fills the tube; raised, the water pressure seals it, so one full tube comes up. The rope drops vertically from the sky roller to the lug, and the tube travels the tower axis in and out of the well collar.',
    reaction: {
      zh: [
        '筒身细长，一筒一满',
        '筒底单向阀：下开上闭',
        '筒口双道铁箍承提环拉力',
        '升降联动大车转动',
        '竹篾箍身，竹材耐卤',
        '容积随井深调整',
      ],
      en: [
        'Slender shaft, one full tube per lift',
        'One-way valve: opens down, seals up',
        'Two iron hoops carry the lifting lug',
        'Travel drives the cart in sync',
        'Bamboo cord rings; bamboo resists brine',
        'Volume set by well depth',
      ],
    },
    params: ['细长竹筒 ≈5.2 m', '筒径 ≈0.34 m', '筒底单向阀', '提环系绳', '随绳联动大车'],
    paramsEn: ['Bamboo tube ≈5.2 m', 'Ø ≈0.34 m', 'One-way base valve', 'Lifting lug', 'Synced with cart'],
  },

  // 7 —— 盐工寮棚 · 竹笆
  {
    id: 'shed', index: 7, name: '盐工寮棚', subtitle: '井场聚落 · 竹笆围护',
    nameEn: 'Brine-shed', subtitleEn: 'Well-yard Shelter',
    color: 0x9A8455, position: [7.6, 0, 4.8],
    cam: [11.5, 3.8, -11.5], target: [5.23, 1.4, -5.23],
    principle:
      '井场旁设一座草顶竹笆工棚：单坡草顶前高后低，三面以竹笆围护、朝井的一面敞开，棚下放卤缸、矮凳与盘起的篾绳。它是整座井场唯一的建筑，也是冰冷的木构井架旁那一点人烟 —— 天车得以常年运转的生活基底。',
    principleEn:
      'Beside the yard stands a thatch-and-bamboo shed: a single-pitch roof higher at the front, bamboo panels on three sides and the side facing the well left open, with brine jars, a low stool and coiled cord beneath. It is the only building in the whole well-yard — the one touch of habitation beside the cold timber frame, and the everyday base that let the derrick run year-round.',
    reaction: {
      zh: [
        '草顶单坡，前高后低',
        '竹笆三面围护，朝井一面敞开',
        '棚下陶卤缸储卤',
        '与天车同工艺：竹篾捆扎',
        '竹笆经纬互压编结',
        '与天车同工艺：竹篾捆扎',
      ],
      en: [
        'Single-pitch thatch, higher front',
        'Bamboo screen on three sides, open to well',
        'Earthen brine jars stored inside',
        'Same craft as derrick: bamboo lashing',
        'Bamboo woven warp-over-weft',
        'Same craft as derrick: bamboo lashing',
      ],
    },
    params: ['单坡草顶', '三面竹笆围护', '陶卤缸储卤', '小束柱角柱', '井场唯一建筑'],
    paramsEn: ['Single-pitch thatch', 'Bamboo on three sides', 'Earthen brine jars', 'Small bundle posts', 'Sole building in the yard'],
  },
];

// 材料 / 构件图例（颜色 + 中英文名称）
export const LEGEND = [
  { color: 0x77634C, zh: '杉木（束柱）', en: 'Fir bundle' },
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
    ctrl: { prev: '上一步', tour: '自动聚焦', next: '下一步', play: '动画', pause: '暂停', playOff: '已停止', rotate: '自转', rotateOff: '自转关', labels: '标签', labelsOff: '标签关', reset: '总览', touring: '聚焦中', download: '下载' },
    ipIndex: '装置', ipPrinciple: '功能与工艺', ipReaction: '结构 · 营建要点', ipEquip: '主要构件', ipParams: '关键形制', ipOutput: '提卤产出',
    btnOverview: '总览',
  },
  en: {
    title: 'Derrick',
    sub: '3D Deconstruction of the Timber Derrick',
    sideTitle: 'Derrick · Parts',
    sideTip: 'Click a part to focus · Drag to orbit · Scroll to zoom',
    ctrl: { prev: 'Prev', tour: 'Auto Focus', next: 'Next', play: 'Animate', pause: 'Pause', playOff: 'Stopped', rotate: 'Rotate', rotateOff: 'Rotate Off', labels: 'Labels', labelsOff: 'Labels Off', reset: 'Overview', touring: 'Focusing', download: 'Download' },
    ipIndex: 'Unit', ipPrinciple: 'Function & Craft', ipReaction: 'Structure · Build', ipEquip: 'Components', ipParams: 'Key Specs', ipOutput: 'Output',
    btnOverview: 'Overview',
  },
};
