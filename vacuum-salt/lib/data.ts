import type { StageData, ReferenceItem, KpiItem } from "./types";

/**
 * 自贡井卤真空制盐工艺数据
 *
 * 科学严谨性说明：
 * - 所有数值均为工业参考值，实际工艺随矿床、设备、产品标准而异。
 * - 数值取自公开的行业资料/标准/文献，已在 source 字段标注出处类型。
 * - 真空制盐工艺在我国推广近 60 年，自贡所在的四川盆地是世界级井矿盐产区。
 */

// 自贡井卤地质起源（引言用）
export const zigongGeology = {
  title: "自贡井卤：千年盐都的地质馈赠",
  titleEn: "Zigong Well Brine: A Millennia-old Salt City's Geological Gift",
  paragraphs: [
    "四川盆地历经亿万年的地质作用，将大量岩盐矿床与天然卤水深埋于地下，形成巨大的盐类聚宝盆。自贡所在的川南地区，盐卤资源尤为富集。",
    "自贡盐矿主要赋存于三叠系嘉陵江组—雷口坡组。海相碳酸盐岩与蒸发岩沉积经成岩改造，形成岩盐层与富含 NaCl 的地下卤水（黑卤、黄卤），并伴生钾、溴、碘、锂等微量元素。",
    "早在 1835 年，自贡燊海井采用冲击式顿钻凿井技术（被誉为中国古代“第五大发明”）钻达 1001.4 米，成为世界上第一口超千米深井，标志着古代钻井工艺的成熟。",
    "如今全国食盐产品结构中，井矿盐约占 87%，已成为我国居民食用盐的主体；真空制盐工艺则是井矿盐现代化生产的核心。",
  ],
  paragraphsEn: [
    "Over hundreds of millions of years, geological processes in the Sichuan Basin buried vast rock-salt deposits and natural brines deep underground, forming a giant treasure house of salts. The southern-Sichuan region around Zigong is especially rich in salt-brine resources.",
    "Zigong's salt deposits are mainly hosted in the Lower–Middle Triassic Jialingjiang–Leikoupo formations. Marine carbonate and evaporite sediments were diagenetically altered into rock-salt beds and NaCl-rich subsurface brines (black brine, yellow brine), accompanied by trace elements such as potassium, bromine, iodine and lithium.",
    "As early as 1835, Zigong's Shenhai Well adopted percussion (impact) drilling — hailed as the 'fifth great invention' of ancient China — reaching 1,001.4 m, the world's first ultra-deep well beyond one kilometer, marking the maturity of ancient drilling craft.",
    "Today, well/mineral salt accounts for about 87% of China's edible-salt structure and has become the mainstay of the nation's table salt; vacuum salt-making is the core of modern well/mineral-salt production.",
  ],
  refs: [
    "浅说自贡盐矿地质成因",
    "四川盆地自贡地区下-中三叠统卤水富锂成因初探",
    "燊海井：世界第一口超千米深井（1835，冲击式顿钻）",
    "雪天盐业：井矿盐约占我国食盐 87%",
  ],
  refsEn: [
    "A brief account of the geological genesis of Zigong salt deposits",
    "Preliminary study on the lithium-rich origin of Lower–Middle Triassic brines in the Zigong area, Sichuan Basin",
    "Shenhai Well: the world's first ultra-deep well beyond 1 km (1835, percussion drilling)",
    "Xuetian Salt: well/mineral salt ≈ 87% of China's edible salt",
  ],
};

// 五大工艺环节
export const stages: StageData[] = [
  // 1. 井卤开采与预处理
  {
    id: "brine",
    index: 0,
    name: "井卤开采与净化",
    nameEn: "Well Brine Mining & Purification",
    tagline: "深井汲卤，石灰—纯碱法除钙镁，为蒸发结晶护航",
    taglineEn:
      "Deep-well brine extraction; lime–soda ash method removes Ca²⁺/Mg²⁺ to protect evaporation & crystallization",
    input: "地下岩盐矿床 / 天然卤水",
    inputEn: "Subsurface rock-salt deposit / natural brine",
    output: "精卤（NaCl 295~310 g/L，Ca²⁺≤10 ppm，Mg²⁺≤5 ppm）",
    outputEn: "Purified brine (NaCl 295–310 g/L, Ca²⁺≤10 ppm, Mg²⁺≤5 ppm)",
    tour: "我们从千米深井汲取天然卤水，先以石灰—纯碱法净化除钙镁，为后续蒸发结晶护航。",
    tourEn: "We draw natural brine from a kilometer-deep well, then purify it with the lime–soda ash method to remove Ca²⁺/Mg²⁺, protecting the evaporation & crystallization ahead.",
    coreHighlight: "石灰—纯碱法净化：先除镁、再除钙，给蒸发器“洗澡”防结垢。",
    coreHighlightEn:
      "Lime–soda ash purification removes Mg²⁺ then Ca²⁺, keeping the evaporator scale-free.",
    accent: "steel",
    principle: [
      "自贡井卤分黑卤、黄卤两类，均来自三叠系深层蒸发岩系，主要成分为 NaCl 水溶液，伴生 Ca²⁺、Mg²⁺、SO₄²⁻ 及钾、溴、碘、锂等。",
      "卤水净化（预处理）的核心目的：在进入蒸发器加热室前去除 Ca²⁺、Mg²⁺ 等杂质，防止其在加热列管中结垢，影响传热并堵塞设备。",
      "主流方法为石灰—纯碱法：先加石灰乳 Ca(OH)₂ 除 Mg²⁺（生成 Mg(OH)₂ 沉淀），再加纯碱 Na₂CO₃ 除 Ca²⁺（生成 CaCO₃ 沉淀），澄清过滤后得精卤。",
      "节能措施：利用末效二次蒸汽余热预热卤水，降低新鲜蒸汽消耗。",
    ],
    principleEn: [
      "Zigong well brines fall into two types — black and yellow — both from deep Triassic evaporite systems, mainly NaCl solutions, with Ca²⁺, Mg²⁺, SO₄²⁻ and trace K, Br, I, Li.",
      "The core purpose of brine purification (pretreatment): remove Ca²⁺, Mg²⁺ before the brine enters the evaporator heating chamber, preventing scale on the heating tubes that impairs heat transfer and fouls equipment.",
      "The mainstream method is the lime–soda ash process: add lime milk Ca(OH)₂ to remove Mg²⁺ (precipitates as Mg(OH)₂), then add soda ash Na₂CO₃ to remove Ca²⁺ (precipitates as CaCO₃); after clarification and filtration, purified brine is obtained.",
      "Energy saving: use waste heat from the last-effect secondary steam to preheat the brine, lowering fresh-steam consumption.",
    ],
    params: [
      { name: "原卤 NaCl 浓度", nameEn: "Raw brine NaCl", value: "约 280~310", unit: "g/L", source: "井矿盐卤行业资料", indicative: true },
      { name: "精卤 NaCl 浓度", nameEn: "Purified NaCl", value: "295~310", unit: "g/L", source: "真空制盐-卤水净化资料", indicative: true },
      { name: "精卤 Ca²⁺", nameEn: "Purified Ca²⁺", value: "≤10", unit: "ppm", source: "真空制盐-卤水净化资料", indicative: true },
      { name: "精卤 Mg²⁺", nameEn: "Purified Mg²⁺", value: "≤5", unit: "ppm", source: "真空制盐-卤水净化资料", indicative: true },
      { name: "精卤 pH", nameEn: "Purified pH", value: "10±0.5", source: "石灰—纯碱法工艺", indicative: true },
      { name: "精卤透射比", nameEn: "Transmittance", value: "≥98", unit: "%", source: "真空制盐-卤水净化资料", indicative: true },
      { name: "燊海井井深", nameEn: "Shenhai well depth", value: "1001.4", unit: "m", source: "1835 年，世界首口超千米深井", indicative: false },
    ],
    parts: [
      { id: "well", name: "深井与汲卤管柱", nameEn: "Deep well & tubing", desc: "钻达三叠系嘉陵江组含盐层，汲取天然卤水或注水溶采岩盐得到的卤水。", descEn: "Drilled into the Triassic Jialingjiang salt-bearing bed to draw natural brine, or dissolves rock salt by water injection to obtain brine.", material: "套管：钢级 + 防腐涂层" },
      { id: "reactor", name: "净化反应槽", nameEn: "Purification reactor", desc: "依次投加石灰乳与纯碱，控制 pH 与反应时间，使 Ca²⁺、Mg²⁺ 沉淀。", descEn: "Sequentially doses lime milk and soda ash, controlling pH and reaction time so Ca²⁺ and Mg²⁺ precipitate.", material: "钢衬胶 / 搪玻璃" },
      { id: "clarifier", name: "道尔澄清槽", nameEn: "Dorr clarifier", desc: "重力沉降分离沉淀（钙镁泥）与上清液，钙镁泥可进一步回收利用。", descEn: "Gravity settling separates the precipitate (Ca/Mg mud) from the supernatant; the Ca/Mg mud can be further recovered.", material: "钢筋混凝土 + 防腐" },
      { id: "filter", name: "砂滤 / 叶滤器", nameEn: "Sand / leaf filter", desc: "精滤除去残余悬浮物，保证进入蒸发器的卤水清澈。", descEn: "Polishes the brine to remove residual suspended solids, ensuring a clear feed to the evaporator.", material: "多层石英砂 / 滤布" },
    ],
    reactions: [
      { id: "r1", title: "除镁", titleEn: "Mg removal", equation: "Mg²⁺ + Ca(OH)₂ → Mg(OH)₂↓ + Ca²⁺", note: "石灰乳调 pH 至约 10，Mg(OH)₂ 沉淀析出；同时引入的 Ca²⁺ 待下一步去除。", noteEn: "Lime milk raises pH to ~10; Mg(OH)₂ precipitates. The Ca²⁺ introduced is removed in the next step." },
      { id: "r2", title: "除钙", titleEn: "Ca removal", equation: "Ca²⁺ + Na₂CO₃ → CaCO₃↓ + 2Na⁺", note: "加入纯碱使 Ca²⁺ 以 CaCO₃ 形式沉淀，钠离子留存于卤水。", noteEn: "Soda ash precipitates Ca²⁺ as CaCO₃; the sodium remains in the brine." },
    ],
  },

  // 2. 蒸发结晶
  {
    id: "evaporate",
    index: 1,
    name: "多效蒸发结晶",
    nameEn: "Multi-effect Evaporation & Crystallization",
    tagline: "真空降压沸点降低，二次蒸汽逐效回用，节能结晶",
    taglineEn:
      "Vacuum lowers the boiling point; secondary steam is reused effect-by-effect for energy-saving crystallization",
    input: "精卤（NaCl 295~310 g/L）",
    inputEn: "Purified brine (NaCl 295–310 g/L)",
    output: "盐浆（固液混合，含固率约 20%~30%）",
    outputEn: "Salt slurry (solid–liquid mix, solids ~20–30%)",
    tour: "真空泵抽走末效空气形成低压，沸点骤降；二次蒸汽逐效回用，卤水在末效高真空下低温沸腾结晶。",
    tourEn: "A vacuum pump draws air from the last effect, lowering the boiling point; secondary steam is reused effect-by-effect, and brine crystallizes at low temperature under high vacuum in the last effect.",
    coreHighlight: "真空让卤水在低温下沸腾：抽走末效空气、沸点骤降，二次蒸汽逐效回用节能结晶。",
    coreHighlightEn:
      "Vacuum lets brine boil at low temperature: pumping out last-effect air drops the boiling point; reused secondary steam saves energy.",
    accent: "steel",
    principle: [
      "真空制盐的核心物理原理：液体在低压环境下沸点显著降低。用真空泵抽出末效蒸发罐内空气形成低压，使卤水在低温下即可沸腾蒸发。",
      "多效蒸发：前一效蒸发产生的二次蒸汽，作为下一效加热室的加热源，反复利用汽化潜热，显著降低单位蒸发量的新鲜蒸汽消耗。四效蒸发每吨水蒸发约仅需 0.3~0.4 吨新鲜蒸汽（参考值）。",
      "温度与压力梯度：首效温度高、压力高；逐效降低；末效温度最低、处于高真空。蒸汽与卤水通常采用顺流（并流）布置，与压力梯度方向一致。",
      "结晶原理：卤水蒸发浓缩至过饱和，NaCl 结晶析出；盐浆在蒸发结晶室内循环，晶核不断生成、晶体逐步长大，达到一定粒度后排出。",
      "操作原则——“五稳定、一畅通”：首效蒸汽压强稳定、末效真空度稳定、液面稳定、罐内晶种/消沫稳定、系统畅通，是稳定运行的关键。",
    ],
    principleEn: [
      "Core physics of vacuum salt-making: a liquid's boiling point drops markedly at low pressure. A vacuum pump extracts air from the last-effect vessel to form a low-pressure space, letting brine boil and evaporate at low temperature.",
      "Multi-effect evaporation: the secondary steam generated in one effect heats the next effect's heating chamber, reusing the latent heat of vaporization and sharply cutting fresh-steam consumption per unit of evaporation. A four-effect system needs only ~0.3–0.4 t fresh steam per t water evaporated (reference).",
      "Temperature & pressure gradient: the first effect is hottest and highest-pressure; each subsequent effect is lower; the last effect is coolest under high vacuum. Steam and brine usually run co-current (forward feed), aligned with the pressure gradient.",
      "Crystallization: as brine concentrates past supersaturation, NaCl crystallizes out; the slurry circulates in the crystallization chamber, nuclei form continuously and crystals grow until discharged at a target size.",
      "Operating principle — 'five stabilities, one unobstructed': stable first-effect steam pressure, stable last-effect vacuum, stable liquid level, stable seeding/antifoam in the vessel, and an unobstructed system are key to stable operation.",
    ],
    params: [
      { name: "效数", nameEn: "Effects", value: "四效（Ⅰ/Ⅱ/Ⅲ/Ⅳ）", source: "主流真空制盐配置", indicative: true },
      { name: "首效加热蒸汽温度", nameEn: "1st effect steam temp", value: "约 120~140", unit: "℃", source: "多效蒸发工艺资料", indicative: true },
      { name: "末效料温", nameEn: "Last effect temp", value: "约 40~55", unit: "℃", source: "真空降压沸点降低原理", indicative: true },
      { name: "末效绝对压力", nameEn: "Last effect abs. pressure", value: "约 0.01~0.03", unit: "MPa", source: "真空制盐蒸发资料", indicative: true },
      { name: "蒸发强度", nameEn: "Evaporation intensity", value: "参考值，随设备而异", source: "工程手册", indicative: true },
      { name: "蒸汽消耗（四效）", nameEn: "Steam consumption", value: "约 0.3~0.4", unit: "t蒸汽/t水", source: "多效蒸发节能资料", indicative: true },
    ],
    parts: [
      { id: "effect1", name: "Ⅰ效蒸发器（首效）", nameEn: "1st effect", desc: "温度压力最高，通入新鲜蒸汽加热卤水，产生二次蒸汽供Ⅱ效。", descEn: "Highest temperature/pressure; fresh steam heats the brine and produces secondary steam for effect II.", material: "壳体：不锈钢/钛复合" },
      { id: "effect2", name: "Ⅱ效蒸发器", nameEn: "2nd effect", desc: "以Ⅰ效二次蒸汽为热源，压力温度依次降低。", descEn: "Heated by effect I's secondary steam; pressure and temperature step down.", material: "不锈钢" },
      { id: "effect3", name: "Ⅲ效蒸发器", nameEn: "3rd effect", desc: "继续回收上游二次蒸汽，进一步浓缩卤水。", descEn: "Continues recovering upstream secondary steam, further concentrating the brine.", material: "不锈钢" },
      { id: "effect4", name: "Ⅳ效蒸发器（末效）", nameEn: "4th effect", desc: "处于高真空低温状态，末效二次蒸汽进入冷凝器。", descEn: "Under high vacuum and low temperature; its secondary steam enters the condenser.", material: "不锈钢" },
      { id: "heater", name: "加热室（列管）", nameEn: "Tube heater", desc: "蒸汽在壳程冷凝放热，卤水在管程受热沸腾，是传热与结垢控制的关键部位。", descEn: "Steam condenses in the shell releasing heat; brine boils in the tubes — the key site for heat transfer and scale control.", material: "铜合金/钛/不锈钢列管" },
      { id: "crystal", name: "蒸发结晶室", nameEn: "Crystallization chamber", desc: "卤水过饱和后 NaCl 结晶析出，盐浆循环使晶体长大。", descEn: "After supersaturation, NaCl crystallizes out; the slurry circulates so crystals grow.", material: "不锈钢" },
      { id: "condenser", name: "混合冷凝器 + 真空泵", nameEn: "Condenser & vacuum pump", desc: "冷凝末效二次蒸汽并抽除不凝气，维持末效真空度。", descEn: "Condenses the last-effect secondary steam and removes non-condensables, maintaining last-effect vacuum.", material: "防腐" },
    ],
  },

  // 3. 离心脱水
  {
    id: "centrifuge",
    index: 2,
    name: "离心脱水",
    nameEn: "Centrifugal Dewatering",
    tagline: "离心力固液分离，湿盐含水率降至 3%~5%",
    taglineEn: "Centrifugal solid–liquid separation; wet-salt moisture down to 3–5%",
    input: "盐浆（含固率约 20%~30%）",
    inputEn: "Salt slurry (solids ~20–30%)",
    output: "湿盐（含水率约 3%~5%）",
    outputEn: "Wet salt (moisture ~3–5%)",
    tour: "离心力将盐浆固液分离，湿盐含水率降至 3%~5%，为干燥环节减负。",
    tourEn: "Centrifugal force separates the slurry into solids and liquid; wet-salt moisture falls to 3–5%, easing the drying step.",
    coreHighlight: "离心力把盐“甩”出来：转鼓高速旋转，盐贴壁、母液穿网而走，湿盐含水率降到 3~5%。",
    coreHighlightEn:
      "Centrifugal force throws the salt out: the spinning bowl holds solids on the wall while mother liquor passes through, dropping moisture to 3–5%.",
    accent: "steel",
    principle: [
      "蒸发结晶排出的盐浆为固液混合物，需先经水力旋流器增浓，再进入离心机脱水。",
      "离心脱水原理：转鼓高速旋转产生离心力，在离心力场下固体颗粒被甩向转鼓壁，滤液穿过滤网排出，实现固液分离。",
      "常用设备为推料离心机或刮刀卸料离心机：盐浆在转鼓内形成滤饼，经洗涤（用清水或精卤置换母液以提升纯度）后卸出湿盐。",
    ],
    principleEn: [
      "Salt slurry from evaporation is a solid–liquid mixture; first a hydrocyclone thickens it, then a centrifuge dewaters it.",
      "Centrifugal dewatering: the bowl spins at high speed generating centrifugal force; in the centrifugal field solids are thrown to the bowl wall while the filtrate passes through the screen and drains — solid–liquid separation.",
      "Common equipment: pusher or scraper-discharge centrifuge. The slurry forms a cake in the bowl, is washed (fresh water or purified brine displaces mother liquor to raise purity), then the wet salt is discharged.",
    ],
    params: [
      { name: "盐浆含固率", nameEn: "Slurry solids", value: "约 20~30", unit: "%", source: "制盐工艺资料", indicative: true },
      { name: "湿盐含水率", nameEn: "Wet salt moisture", value: "约 3~5", unit: "%", source: "离心脱水后参考值", indicative: true },
      { name: "转鼓转速", nameEn: "Bowl speed", value: "参考值，随机型", source: "离心机工程参数", indicative: true },
      { name: "分离因数", nameEn: "Separation factor", value: "参考值，随机型", source: "离心机工程参数", indicative: true },
    ],
    parts: [
      { id: "hydrocyclone", name: "水力旋流器", nameEn: "Hydrocyclone", desc: "预增浓盐浆，提高进离心机浓度。", descEn: "Pre-thickens the slurry, raising the concentration fed to the centrifuge.", material: "耐磨衬里" },
      { id: "bowl", name: "转鼓", nameEn: "Rotating bowl", desc: "高速旋转产生离心力场，是分离的核心部件。", descEn: "High-speed rotation generates the centrifugal field — the core separating component.", material: "不锈钢" },
      { id: "screen", name: "滤网", nameEn: "Screen", desc: "截留盐晶体，滤液（母液）穿过回流至系统。", descEn: "Retains salt crystals; the filtrate (mother liquor) passes through and returns to the system.", material: "耐蚀合金网" },
      { id: "pusher", name: "推料/刮刀机构", nameEn: "Pusher / scraper", desc: "将脱水后的湿盐连续排出。", descEn: "Continuously discharges the dewatered wet salt.", material: "不锈钢" },
    ],
  },

  // 4. 干燥筛分
  {
    id: "dry",
    index: 3,
    name: "干燥与筛分",
    nameEn: "Drying & Screening",
    tagline: "沸腾流化床低温干燥，振动筛按粒度分级",
    taglineEn: "Fluidized-bed low-temperature drying; vibrating screen grades by particle size",
    input: "湿盐（含水率约 3%~5%）",
    inputEn: "Wet salt (moisture ~3–5%)",
    output: "成品干盐（含水率 <0.3%）",
    outputEn: "Finished dry salt (moisture <0.3%)",
    tour: "沸腾流化床低温干燥保留晶体形态，振动筛按粒度分级出成品干盐。",
    tourEn: "A fluidized bed dries at low temperature, preserving crystal shape; a vibrating screen grades the dry salt by particle size.",
    coreHighlight: "流化床低温干燥保形：热风托起盐粒悬浮沸腾，高效脱水且晶体不碎。",
    coreHighlightEn:
      "Fluidized-bed low-temperature drying preserves shape: hot air suspends the grains, drying fast without breaking crystals.",
    accent: "ember",
    principle: [
      "干燥原理——流态化技术：热空气自下而上穿过分布板，使湿盐颗粒悬浮呈流化状态，气固接触面积大、传热传质强烈，可在较低温度下快速干燥，并较好保持晶体形态。",
      "干燥介质为经加热的洁净空气，干燥后含水率可达 0.3% 以下（食用盐要求更低）。尾气经除尘后排放。",
      "筛分：振动筛按粒度将干盐分级（粗盐/中盐/细盐/粉盐等），不同粒度对应不同产品规格。",
    ],
    principleEn: [
      "Drying principle — fluidization: heated air rises through a distributor, suspending wet salt particles in a fluidized state. Large gas–solid contact area and strong heat/mass transfer allow fast low-temperature drying while preserving crystal shape.",
      "The drying medium is heated clean air; after drying, moisture can fall below 0.3% (edible salt demands even lower). Tail gas is dedusted before release.",
      "Screening: a vibrating screen grades dry salt by size (coarse/medium/fine/powder), each size corresponding to a product spec.",
    ],
    params: [
      { name: "湿盐进料含水率", nameEn: "Feed moisture", value: "约 3~5", unit: "%", source: "离心脱水后", indicative: true },
      { name: "干盐含水率", nameEn: "Dried salt moisture", value: "<0.3", unit: "%", source: "干燥工艺/食用盐要求", indicative: true },
      { name: "热风温度", nameEn: "Hot air temp", value: "参考值（低温）", source: "流化床干燥资料", indicative: true },
      { name: "流化床类型", nameEn: "Bed type", value: "振动/卧式沸腾流化床", source: "制盐干燥设备", indicative: true },
      { name: "筛分粒级", nameEn: "Size grades", value: "粗/中/细/粉", source: "产品规格", indicative: true },
    ],
    parts: [
      { id: "fan", name: "鼓风机 + 加热器", nameEn: "Blower & heater", desc: "提供洁净热空气作为干燥介质。", descEn: "Supplies clean heated air as the drying medium.", material: "钢" },
      { id: "bed", name: "沸腾流化床", nameEn: "Fluidized bed", desc: "湿盐颗粒在热气流中悬浮流化，强化传热传质。", descEn: "Wet salt particles fluidize in the hot air stream, intensifying heat/mass transfer.", material: "不锈钢" },
      { id: "distributor", name: "气体分布板", nameEn: "Distributor plate", desc: "均匀布气，保证颗粒稳定流化。", descEn: "Even air distribution, keeping particles stably fluidized.", material: "多孔板/烧结板" },
      { id: "screen", name: "振动筛", nameEn: "Vibrating screen", desc: "按粒度对干盐进行分级。", descEn: "Grades dry salt by particle size.", material: "不锈钢筛网" },
      { id: "cyclone", name: "旋风除尘器", nameEn: "Cyclone", desc: "回收尾气夹带的细盐，净化尾气。", descEn: "Recovers fine salt carried by tail gas, cleaning the exhaust.", material: "不锈钢" },
    ],
  },

  // 5. 包装仓储
  {
    id: "pack",
    index: 4,
    name: "包装与仓储",
    nameEn: "Packaging & Storage",
    tagline: "定量包装自动码垛，分区仓储保品质",
    taglineEn: "Metered packaging and auto-palletizing; zoned storage preserves quality",
    input: "成品干盐（含水率 <0.3%）",
    inputEn: "Finished dry salt (moisture <0.3%)",
    output: "食用盐 / 工业盐成品（入库）",
    outputEn: "Edible / industrial salt product (into storage)",
    tour: "定量包装、自动码垛，分区仓储守护每一粒盐的品质与安全。",
    tourEn: "Metered packaging and auto-palletizing, with zoned storage guarding the quality and safety of every grain of salt.",
    coreHighlight: "定量包装 + 自动码垛：每袋精准称量，机械臂整齐码放，分区仓储防结块。",
    coreHighlightEn:
      "Metered packaging and auto-palletizing: precise dosing per bag, robot stacks neatly, zoned storage prevents caking.",
    accent: "ok",
    principle: [
      "干燥筛分后的成品盐经输送（皮带/气力）进入包装线，按规格进行自动定量包装（如 400g/500g/1kg 小包装，或 25kg/50kg/吨袋大包装）。",
      "包装后经检测（纯度、粒度、含水率、碘含量等食用盐指标）合格，由码垛机械臂码垛入库。",
      "仓储按食用盐/工业盐分区，控制温湿度防结块；食用盐须符合食品安全与碘强化标准。",
    ],
    principleEn: [
      "After drying & screening, the product salt is conveyed (belt/pneumatic) to the packaging line and automatically metered into specs (e.g. 400 g/500 g/1 kg retail, or 25 kg/50 kg/FIBC bulk).",
      "After packaging it is inspected (purity, particle size, moisture, iodine content and other edible-salt metrics); on passing, a palletizing robot stacks it into storage.",
      "Storage is zoned by edible/industrial salt, with temperature/humidity control to prevent caking; edible salt must meet food-safety and iodine-fortification standards.",
    ],
    params: [
      { name: "产品纯度 NaCl", nameEn: "NaCl purity", value: "≥99.1", unit: "%", source: "精制盐/井矿盐参考值", indicative: true },
      { name: "干盐含水率", nameEn: "Moisture", value: "<0.3", unit: "%", source: "成品指标", indicative: true },
      { name: "包装规格", nameEn: "Pack specs", value: "400g~吨袋", source: "食用盐/工业盐", indicative: true },
      { name: "食盐结构占比", nameEn: "Well salt share", value: "井矿盐约 87", unit: "%", source: "全国食盐结构", indicative: true },
    ],
    parts: [
      { id: "conveyor", name: "输送系统", nameEn: "Conveyor", desc: "将干盐送入包装线，可选皮带或气力输送。", descEn: "Feeds dry salt into the packaging line; belt or pneumatic.", material: "不锈钢食品级" },
      { id: "packer", name: "定量包装机", nameEn: "Packaging machine", desc: "自动称量装袋，控制定量精度。", descEn: "Auto-weighs and bags, controlling dosing accuracy.", material: "食品级不锈钢" },
      { id: "robot", name: "码垛机械臂", nameEn: "Palletizing robot", desc: "将包装成品整齐码放于托盘。", descEn: "Neatly stacks packaged product on pallets.", material: "工业机器人" },
      { id: "warehouse", name: "立体仓储", nameEn: "Warehouse", desc: "分区存放食用盐/工业盐，控制环境防结块。", descEn: "Zoned storage of edible/industrial salt, environment-controlled against caking.", material: "钢货架" },
    ],
  },
];

// 全产线概览指标（概览态左下角展示，数值均来自上方环节数据/行业资料）
export const plantKpi: KpiItem[] = [
  { label: "产品 NaCl 纯度", labelEn: "NaCl purity", value: "≥99.1", unit: "%", note: "三次洗涤精制", noteEn: "Triple-washed refining" },
  { label: "末效真空度", labelEn: "Last-effect vacuum", value: "≈88", unit: "%", note: "高真空低温结晶", noteEn: "High-vacuum low-temp crystallization" },
  { label: "四效蒸汽耗", labelEn: "4-effect steam use", value: "0.3~0.4", unit: "t/t", note: "二次蒸汽逐效回用", noteEn: "Reused secondary steam" },
  { label: "井矿盐占比", labelEn: "Well-salt share", value: "≈87", unit: "%", note: "全国食盐结构", noteEn: "China edible-salt mix" },
];

// 参考资料
export const references: ReferenceItem[] = [
  { title: "真空蒸发制盐法原理（低压下沸点降低）", titleEn: "Principles of vacuum evaporation salt-making (boiling point drops at low pressure)", note: "现代制盐核心物理原理", noteEn: "Core physics of modern salt-making" },
  { title: "盐溶液多效蒸发结晶器操作原则——“五稳定、一畅通”", titleEn: "Operating principles of the multi-effect evaporator–crystallizer for salt solutions — 'five stabilities, one unobstructed'", note: "首效蒸汽压强、末效真空度等稳定运行要点", noteEn: "Stable-operation points: first-effect steam pressure, last-effect vacuum, etc." },
  { title: "真空制盐-卤水净化（石灰—纯碱法，精卤指标 Ca²⁺/Mg²⁺/NaCl/pH/透射比）", titleEn: "Vacuum salt-making — brine purification (lime–soda ash method; purified-brine specs Ca²⁺/Mg²⁺/NaCl/pH/transmittance)", note: "精卤参考指标来源", noteEn: "Source of purified-brine reference specs" },
  { title: "盐田饱和卤水直接进蒸发罐真空制盐工艺（三次洗涤，纯度 ≥99.1%）", titleEn: "Process using direct saturated brine into the evaporator for vacuum salt-making (triple washing, purity ≥99.1%)", note: "产品纯度参考", noteEn: "Product-purity reference" },
  { title: "硫酸钙型卤水真空制盐工艺（卤水净化与颗粒度）", titleEn: "Vacuum salt-making from gypsum-type brine (brine purification and particle size)", note: "卤水净化必要性、结垢控制", noteEn: "Necessity of brine purification, scale control" },
  { title: "氯化钠沸腾流化床干燥原理（流态化技术）", titleEn: "NaCl fluidized-bed drying principle (fluidization technology)", note: "干燥环节原理", noteEn: "Drying-stage principle" },
  { title: "现代制盐工艺：真空蒸发、离心脱水、沸腾床干燥、机械包装", titleEn: "Modern salt-making process: vacuum evaporation, centrifugal dewatering, fluidized-bed drying, mechanical packaging", note: "全流程设备构成", noteEn: "Full-process equipment composition" },
  { title: "DB5109/T 8-2023 地理标志产品 卓筒井盐加工技术规范", titleEn: "DB5109/T 8-2023 Geographical-indication product — Zhuotongjing salt processing technical specification", note: "沸腾床/包装设备等地方标准参考", noteEn: "Local-standard reference for fluidized bed/packaging equipment" },
  { title: "浅说自贡盐矿地质成因 / 四川盆地三叠系嘉陵江组—雷口坡组", titleEn: "A brief account of Zigong salt-deposit geology / Sichuan Basin Triassic Jialingjiang–Leikoupo formations", note: "自贡盐矿地质背景", noteEn: "Zigong salt-deposit geological background" },
  { title: "燊海井：1835 年世界首口超千米深井（冲击式顿钻技术）", titleEn: "Shenhai Well: world's first ultra-deep well beyond 1 km (1835, percussion drilling)", note: "自贡深井汲卤历史", noteEn: "Zigong deep-well brine-extraction history" },
  { title: "井矿盐约占我国食盐 87%（雪天盐业生态井矿盐）", titleEn: "Well/mineral salt ≈ 87% of China's edible salt (Xuetian Salt eco well/mineral salt)", note: "井矿盐在我国食盐结构中的主体地位", noteEn: "Dominant position of well/mineral salt in China's salt structure" },
];
