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
    cam: [21, 12, 27], target: [0, 6.6, 0],
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
        '灶房熬卤 · 盐仓储盐 · 竹笕输卤：卤水的去处',
      ],
      en: [
        'Bundle columns: lashed fir trunks with offset splices — not one solid log',
        'Bamboo-cord rings, with hand-forged iron hoops locking the nodes',
        'Four-sided taper: narrower upward, fewer trunks (4→3→2)',
        'Sky roller → ground roller → cart: a lifting pulley train',
        'Percussion rig: treadle stores energy, hammer falls to drill',
        'Boiling-house, godown, conduit: where the brine goes',
      ],
    },
    equipment: ['束柱（多杉并束、竹篾成箍）', '大车（提卤绞盘）', '地辊（转向定滑轮）', '碓架（冲击顿钻）', '风篾（防风拉索）', '汲卤筒（提卤桶）', '铁箍（关键节点锁紧）', '盐工寮棚', '灶房（一灶五锅）', '盐仓（夯土墙）', '竹笕（输卤竹管）'],
    equipmentEn: ['Bundle column (lashed fir trunks)', 'Cart (draw-wheel)', 'Ground roller (deflector)', 'Duijia (percussion rig)', 'Wind stays (guy lines)', 'Bailer (draw bucket)', 'Iron hoops (joint lock)', 'Brine-shed', 'Boiling-house (5 pans)', 'Salt godown (rammed earth)', 'Bamboo brine conduit'],
    params: ['塔高约 13 m（四棱锥台形制）', '束柱 4→3→2 根递减', '篾箍 ≈0.5 m/道，铁箍每 4 道', '大车 Ø ≈3.4 m（绳绕轮缘）', '风篾 8 根伞状放射', '灶房一灶五锅 · 烟囱 6.4 m'],
    paramsEn: ['Tower ~13 m (four-sided taper)', 'Bundle 4→3→2 trunks', 'Bamboo hoop ~0.5 m, iron every 4th', 'Cart Ø ~3.4 m (rope on rim)', '8 radiating wind stays', 'Boiling-house: 5 pans, 6.4 m stack'],
    output: '提汲卤水（制盐原料）→ 竹笕送灶房熬成盐 → 入仓待运',
    outputEn: 'Brine drawn → piped to the boiling-house → boiled to salt → stored in the godown',
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
    color: 0x6E5A42, position: [0, 0, -19.5],
    // 碓架已迁到距天车 19.5 m 的另一口井（方位见 main.js 的 DUIJIA 常量）。
    // 机位偏正侧面 30°：既保住「碓梢摆动平面」的可读性（压缩 13%），
    // 又把主光夹角从 90° 拉到 51°（受光度 0.62）—— 站正侧面的话整台机器会半边死黑。
    cam: [-1.29, 3.40, -6.56], target: [0, 1.90, -19.5],
    principle:
      '碓架是冲击式顿钻的蓄能—落锤机构：花辊轴上架一根碓梢，前端硬接碓杆与碓头，后端设踏板。盐工站上踏板、以体重把碓梢后端压下，前端碓头随之抬起蓄能；松脚，重力令碓头跌落，在碓窝里砸出一下冲击。如此反复，正是凿穿岩层、加深盐井的原理 —— 「自贡井盐深钻汲制技艺」列国家级非遗。它并不架在天车之下：顿钻凿井与天车提卤是井场的两道工序、两口井，所以此处让它单独立在约 20 m 外的另一口井上。',
    principleEn:
      'The percussion rig is a store-and-drop mechanism: a lever (the duishao) rides on a roller fulcrum, carrying the hammer shaft at its front end and a treadle at its back. Standing on the treadle, the worker presses the back end down and the hammer at the front rises, storing energy; releasing it lets gravity drop the hammer into the stone socket — one blow. Repeated without end, this is how rock is pierced and the well deepened: Zigong deep-drilling brine technology, a national intangible heritage. It does not stand under the derrick: percussion drilling and brine drawing were two operations at two separate wells, so here it stands alone on its own well about 20 m away.',
    reaction: {
      zh: [
        '踏板蓄能，碓梢杠杆放大（1:2）',
        '碓头铁箍加固，熟铁靴耐冲击',
        '松脚落锤，碓窝承击',
        '冲击频率决定凿速',
        '花辊轴为铰，全程无钉',
        '竹篾捆扎机架',
      ],
      en: [
        'Treadle stores energy, lever amplifies (1:2)',
        'Iron-hooped head with a forged-iron shoe',
        'Release drops the hammer into the socket',
        'Stroke rate sets drilling speed',
        'Roller-fulcrum joint, nail-free',
        'Bamboo-lashed frame',
      ],
    },
    params: ['冲击式顿钻', '碓梢杠杆 ≈7.4 m（碓头臂 : 踏板臂 = 1:2）', '碓头 + 熟铁靴', '碓头行程 ≈0.55 m / 踏板行程 ≈0.97 m', '碓窝石箍方口承击'],
    paramsEn: ['Percussion drilling', 'Lever ≈7.4 m (arms 1:2)', 'Hammer + forged shoe', 'Hammer stroke ≈0.55 m / treadle ≈0.97 m', 'Stone socket mouth'],
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
      '井场旁设一座草顶竹笆工棚：单坡草顶前高后低，三面以竹笆围护、朝井的一面敞开，棚下放卤缸、矮凳与盘起的篾绳。它是井场聚落里最靠井的那一座 —— 熬卤的灶房与存盐的仓房在场地另一头（见「灶房 · 盐仓」），而它是冰冷的木构井架旁那一点人烟，天车得以常年运转的生活基底。',
    principleEn:
      'Beside the yard stands a thatch-and-bamboo shed: a single-pitch roof higher at the front, bamboo panels on three sides and the side facing the well left open, with brine jars, a low stool and coiled cord beneath. It is the building nearest the well; the boiling-house and the salt godown stand across the yard (see “Boiling-house & Godown”). It remains the one touch of habitation beside the cold timber frame, and the everyday base that let the derrick run year-round.',
    reaction: {
      zh: [
        '草顶单坡，前高后低',
        '竹笆三面围护，朝井一面敞开',
        '棚下陶卤缸储卤',
        '与天车同工艺：竹篾捆扎',
        '竹笆经纬互压编结',
        '棚下卤缸 · 矮凳 · 篾绳：井场的生活角',
      ],
      en: [
        'Single-pitch thatch, higher front',
        'Bamboo screen on three sides, open to well',
        'Earthen brine jars stored inside',
        'Same craft as derrick: bamboo lashing',
        'Bamboo woven warp-over-weft',
        'Jars, stool and coiled cord: the living corner of the yard',
      ],
    },
    params: ['单坡草顶', '三面竹笆围护', '陶卤缸储卤', '小束柱角柱', '井场聚落最靠井的一座'],
    paramsEn: ['Single-pitch thatch', 'Bamboo on three sides', 'Earthen brine jars', 'Small bundle posts', 'Nearest building to the well'],
  },

  // 8 —— 灶房 · 盐仓（2026-09-15 新增）
  {
    id: 'yard', index: 8, name: '灶房 · 盐仓', subtitle: '熬卤成盐 · 井场聚落',
    nameEn: 'Boiling-house & Godown', subtitleEn: 'The Salt-works Cluster',
    color: 0xB0A99E, position: [14.4, 0, -1.8],
    // 机位从井口一侧斜看灶房的敞开面：一排盐锅、烟囱、以及进屋的竹笕要同框。
    // 正对敞开面会看不进棚里（屋面挡住锅），偏 40° 才能同时读到「锅在棚下」与
    // 「笕从井那边来」这一对关系。
    cam: [23.6, 4.6, 5.4], target: [14.4, 1.5, -1.7],
    principle:
      // 注意：JS 不像 Python 那样把相邻字符串字面量隐式拼接，多行必须显式 +
      '卤水提上井口之后不能就那么放着 —— 它要熬成盐。竹笕把卤水从井口引到灶房：一根根竹管接起来，'
      + '架在 A 字形木马上，一头接着井边的石墩、一头把卤水滴进官盆。灶房里砌一列砖灶台，一排五口盐锅，'
      + '锅下烧火，卤水在锅里收干成盐。灶房的屋面用瓦不用草 —— 灶火就在下面，草顶等于烧自己；'
      + '两端砌砖山墙、长边全敞开，是为了散热与出烟；烟囱砌在山墙外侧，高出屋脊。'
      + '台基用石砌而不用砖：卤水外溢，砖脚会被盐蚀烂，石脚是必须的。'
      + '盐出锅后送进盐仓 —— 夯土墙的仓房，墙脚垫石防潮，板门上锁。天车、灶房、盐仓、竹笕，'
      + '这才是一条完整的生产线：提卤 → 输卤 → 熬盐 → 储盐。',
    principleEn:
      'Brine drawn from the well cannot simply sit there — it must be boiled down to salt. A bamboo conduit '
      + 'carries it from the well-head to the boiling-house: bamboo tubes joined end to end on A-frame trestles, '
      + 'running from a stone pier by the well to a receiving vat at the house. Inside stands a brick furnace '
      + 'with a row of five shallow iron pans; fire beneath, brine above, and the water boils away into salt. '
      + 'The roof is tiled, never thatched — the fire is right below it. Brick gable walls close the two ends, '
      + 'the long sides stay open for heat and smoke, and the chimney is built outside the gable, rising past '
      + 'the ridge. The plinth is stone, not brick: spilt brine eats brickwork away. Salt then goes into the '
      + 'godown — a rammed-earth store on a stone footing, with a plank door that locks. Derrick, boiling-house, '
      + 'godown and conduit together form one production line: draw, pipe, boil, store.',
    reaction: {
      zh: [
        '竹笕：竹管接续、A 字木马架起，全程自流',
        '一灶五锅：锅位数就是产量',
        '灶房长边敞开：散热、出烟、看得见锅',
        '屋面用瓦 —— 灶火在下，草顶即烧自己',
        '烟囱砌在山墙外侧，高出屋脊',
        '盐仓：夯土版筑墙 + 石脚防潮 + 板门上锁',
      ],
      en: [
        'Bamboo conduit on A-frames, gravity-fed end to end',
        'Five pans to a furnace: pan count is output',
        'Long sides left open: heat out, smoke out, pans visible',
        'Tiled roof — fire below makes thatch suicide',
        'Chimney outside the gable, rising past the ridge',
        'Godown: rammed earth, stone footing, locking plank door',
      ],
    },
    params: ['灶房 6.4 m × 4.4 m，檐高 3.1 m / 脊高 4.3 m', '砖砌烟囱 6.4 m（全场次高）',
      '一灶五锅 · 锅径 ≈0.8 m', '竹笕 ≈9 m · 架高 2.05 m', '盐仓 3.95 m × 3.3 m（夯土墙 0.36 m）',
      '青砖 1.2 m/格 · 小青瓦 0.9 m/格（贴图物理尺度）'],
    paramsEn: ['Boiling-house 6.4 × 4.4 m, eave 3.1 / ridge 4.3 m', 'Brick stack 6.4 m (second tallest)',
      'Five pans to a furnace, pan Ø ≈0.8 m', 'Conduit ≈9 m, carried at 2.05 m',
      'Godown 3.95 × 3.3 m (rammed wall 0.36 m)', 'Brick 1.2 m/tile · tile 0.9 m/tile (physical scale)'],
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
