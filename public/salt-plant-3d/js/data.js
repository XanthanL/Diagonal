// 自贡井盐 · 真空制盐工艺流程数据（含中英文）
// 每道工序：名称/副标题、站台模型类型、主题色、空间坐标、设备、原理、反应、参数、产物
// 反应式(reaction)为化学通式，中英文通用；其余字段含 zh / en 两套

export const PROCESS = [
  {
    id: 'mining', index: 1, name: '采卤', subtitle: 'Brine Extraction',
    nameEn: 'Brine Extraction', subtitleEn: 'Mining',
    model: 'well', color: 0x2F6F8F, position: [-30, 0, -5],
    equipment: ['采卤井 / 盐井', '采卤泵', '输卤管道', '储卤池'],
    equipmentEn: ['Brine / salt well', 'Brine pump', 'Brine pipeline', 'Brine pond'],
    principle:
      '自贡盐都拥有燊海井等千年盐井。现代采用水溶采矿法：向地下盐岩层注水溶解岩盐，再用深井泵将高浓度卤水抽至地面。卤水主要含 NaCl，并夹带 Ca²⁺、Mg²⁺、SO₄²⁻ 等杂质离子。',
    principleEn:
      'Zigong, the "Salt Capital", is home to ancient wells such as Shenhai Well. Modern solution mining dissolves underground rock salt with injected water; deep-well pumps then bring the concentrated brine to the surface. The brine is mainly NaCl with impurity ions Ca²⁺, Mg²⁺, SO₄²⁻.',
    reaction: ['NaCl(固) → Na⁺ + Cl⁻（水溶）'],
    params: ['卤水浓度 290~310 g/L', '井深 800~1000 m', '采出温度 40~60 ℃'],
    paramsEn: ['Brine conc. 290~310 g/L', 'Well depth 800~1000 m', 'Draw temp. 40~60 ℃'],
    output: '原料卤水（盐饱和）',
    outputEn: 'Raw brine (salt-saturated)',
  },
  {
    id: 'purify', index: 2, name: '卤水净化', subtitle: 'Brine Purification',
    nameEn: 'Brine Purification', subtitleEn: 'Purification',
    model: 'tank', color: 0x4E9D8F, position: [-20, 0, 5],
    equipment: ['反应沉降罐', '加药装置', '搅拌机构', '澄清池'],
    equipmentEn: ['Reaction-settling tank', 'Dosing unit', 'Agitator', 'Clarifier'],
    principle:
      '为防蒸发设备结垢，须去除杂质离子。采用化学净化：加 BaCl₂ 除 SO₄²⁻，加 NaOH 除 Mg²⁺，加 Na₂CO₃ 除 Ca²⁺，生成的沉淀经沉降澄清后分离，得到清卤。',
    principleEn:
      'To prevent scaling in the evaporators, impurity ions must be removed. Chemical purification adds BaCl₂ to remove SO₄²⁻, NaOH for Mg²⁺, and Na₂CO₃ for Ca²⁺. The resulting precipitates are separated by settling and clarification, yielding purified brine.',
    reaction: ['Ba²⁺ + SO₄²⁻ → BaSO₄↓', 'Mg²⁺ + 2OH⁻ → Mg(OH)₂↓', 'Ca²⁺ + CO₃²⁻ → CaCO₃↓'],
    params: ['反应 pH 10~11', '沉降时间 2~4 h', '净化后 Ca²⁺<20 mg/L'],
    paramsEn: ['React pH 10~11', 'Settling 2~4 h', 'Ca²⁺<20 mg/L after'],
    output: '净化清卤',
    outputEn: 'Purified brine',
  },
  {
    id: 'evaporate', index: 3, name: '多效真空蒸发结晶', subtitle: 'Vacuum Evaporation',
    nameEn: 'Vacuum Evaporation', subtitleEn: 'Crystallization',
    model: 'evaporator', color: 0xB33A2A, position: [-10, 0, -5],
    equipment: ['四效蒸发罐', '热泵 / 冷凝器', '二次蒸汽管路', '盐浆泵'],
    equipmentEn: ['4-effect evaporator', 'Heat pump / condenser', 'Secondary steam line', 'Slurry pump'],
    principle:
      '真空制盐核心工序。多效蒸发罐内压力逐级降低、沸点随之下降，前一效产生的二次蒸汽用作后一效加热源，大幅节能。清卤逐级浓缩至过饱和，NaCl 晶体析出形成盐浆（盐晶 + 母液）。',
    principleEn:
      'The core of vacuum salt-making. Pressure drops stepwise across the multi-effect evaporator, lowering the boiling point; the secondary steam from one effect heats the next, saving large amounts of energy. Brine concentrates to supersaturation, and NaCl crystals precipitate as slurry (crystals + mother liquor).',
    reaction: ['NaCl(溶液) → NaCl(晶) + 母液', '真空使沸点 108℃ → 55℃'],
    params: ['四效真空 55~108 ℃', '末效真空度 -0.085 MPa', '蒸发强度高、能耗低'],
    paramsEn: ['4-effect vacuum 55~108 ℃', 'Last-effect -0.085 MPa', 'High rate, low energy'],
    output: '盐浆（盐晶 + 母液）',
    outputEn: 'Salt slurry (crystals + liquor)',
  },
  {
    id: 'separate', index: 4, name: '固液分离', subtitle: 'Solid-Liquid Separation',
    nameEn: 'Solid-Liquid Separation', subtitleEn: 'Separation',
    model: 'centrifuge', color: 0xC99A3F, position: [0, 0, 5],
    equipment: ['卧式离心机', '旋流器', '母液回流槽', '滤盐输送机'],
    equipmentEn: ['Horizontal centrifuge', 'Hydrocyclone', 'Liquor return tank', 'Salt conveyor'],
    principle:
      '盐浆进入离心机高速旋转，借离心力将湿盐（含水 3%~5%）与母液分离。母液回流继续提浓或用于副产回收（如芒硝 Na₂SO₄·10H₂O），盐晶送入干燥工序。',
    principleEn:
      'Slurry enters a high-speed centrifuge; centrifugal force separates wet salt (3%~5% moisture) from mother liquor. The liquor is recycled for further concentration or by-product recovery (e.g. mirabilite Na₂SO₄·10H₂O); the crystals go to drying.',
    reaction: ['盐浆 → 湿盐 + 母液', '离心脱水至 ~4% 水分'],
    params: ['转速 1500~3000 r/min', '湿盐水分 3%~5%', '母液回用'],
    paramsEn: ['Speed 1500~3000 r/min', 'Wet salt 3%~5% H₂O', 'Liquor recycled'],
    output: '湿盐（晶体）',
    outputEn: 'Wet salt (crystals)',
  },
  {
    id: 'dry', index: 5, name: '干燥', subtitle: 'Fluidized Drying',
    nameEn: 'Fluidized Drying', subtitleEn: 'Drying',
    model: 'dryer', color: 0xC9915E, position: [10, 0, -5],
    equipment: ['振动流化床干燥器', '热风炉', '旋风除尘器', '冷却段'],
    equipmentEn: ['Vibrating fluidized bed', 'Hot-air furnace', 'Cyclone collector', 'Cooling section'],
    principle:
      '湿盐进入流化床，被底部热风托起呈沸腾态，快速脱除表面水与结晶水，使水分降至 0.1% 以下，再经冷却段降温，得到干爽洁白盐晶。',
    principleEn:
      'Wet salt enters the fluidized bed and is lifted by hot air into a boiling state, rapidly removing surface and crystal water to below 0.1% moisture. A cooling section then lowers its temperature, yielding dry, white crystals.',
    reaction: ['湿盐 + 热风 → 干盐 + 湿空气', '水分 < 0.1%'],
    params: ['进风 120~160 ℃', '终水分 < 0.1%', '流化风速 1.2~2.0 m/s'],
    paramsEn: ['Air in 120~160 ℃', 'Final H₂O < 0.1%', 'Fluidizing 1.2~2.0 m/s'],
    output: '干燥盐晶',
    outputEn: 'Dried crystals',
  },
  {
    id: 'screen', index: 6, name: '筛分', subtitle: 'Grading / Screening',
    nameEn: 'Grading / Screening', subtitleEn: 'Screening',
    model: 'screen', color: 0x6E7E8C, position: [20, 0, 5],
    equipment: ['振动筛', '粒度分级机', '返料系统', '成品仓'],
    equipmentEn: ['Vibrating screen', 'Size grader', 'Recycle system', 'Product silo'],
    principle:
      '干燥盐经多层振动筛按粒度分级，分出不同规格的工业盐与食用盐。不合格细粉/大颗粒返料回用，合格品进入包装工序。',
    principleEn:
      'Dried salt passes multi-deck vibrating screens for size grading into industrial and edible salt grades. Off-spec fines or oversize are recycled; on-spec product proceeds to packaging.',
    reaction: ['干盐 → 多规格精盐', '粒度 0.2~1.2 mm'],
    params: ['筛网 0.2~1.2 mm', '振幅 2~5 mm', '分级精度高'],
    paramsEn: ['Screen 0.2~1.2 mm', 'Amplitude 2~5 mm', 'High accuracy'],
    output: '分级精盐',
    outputEn: 'Graded refined salt',
  },
  {
    id: 'pack', index: 7, name: '包装', subtitle: 'Packaging',
    nameEn: 'Packaging', subtitleEn: 'Packaging',
    model: 'packer', color: 0x9A8C7A, position: [30, 0, -5],
    equipment: ['自动包装机', '计量秤', '封口机', '码垛机器人'],
    equipmentEn: ['Auto packer', 'Weigher', 'Seamer / sealer', 'Palletizing robot'],
    principle:
      '成品盐由自动包装机计量、灌装、封口，形成 25kg/50kg 工业袋装或小包装食用盐，经输送与码垛成为最终产品——自贡井盐。',
    principleEn:
      'The finished salt is metered, filled and sealed by an automatic packer into 25/50 kg industrial bags or retail packs, then conveyed and palletized into the final product — Zigong well salt.',
    reaction: ['精盐 → 成品包装', '计量精度 ±0.2%'],
    params: ['包装 25/50 kg', '产能 20~40 t/h', '自动码垛'],
    paramsEn: ['Pack 25/50 kg', 'Capacity 20~40 t/h', 'Auto palletizing'],
    output: '自贡井盐成品',
    outputEn: 'Zigong well salt (final)',
  },
];

// 工序之间物流（粒子颜色与图例）
export const FLOW_LINKS = [
  { from: 'mining', to: 'purify', type: '卤水', typeEn: 'Brine', color: 0x3aa0ff },
  { from: 'purify', to: 'evaporate', type: '清卤', typeEn: 'Purified', color: 0x2dd4bf },
  { from: 'evaporate', to: 'separate', type: '盐浆', typeEn: 'Slurry', color: 0x8b5cf6 },
  { from: 'separate', to: 'dry', type: '湿盐', typeEn: 'Wet salt', color: 0xf59e0b },
  { from: 'dry', to: 'screen', type: '干盐', typeEn: 'Dry salt', color: 0xef4444 },
  { from: 'screen', to: 'pack', type: '精盐', typeEn: 'Refined', color: 0x10b981 },
];

// 图例（颜色 + 中英文名称）
export const LEGEND = [
  { color: 0x2F6F8F, zh: '卤水', en: 'Brine' },
  { color: 0x4E9D8F, zh: '清卤', en: 'Purified' },
  { color: 0xB33A2A, zh: '盐浆', en: 'Slurry' },
  { color: 0xC99A3F, zh: '湿盐', en: 'Wet Salt' },
  { color: 0xC9915E, zh: '干盐', en: 'Dry Salt' },
  { color: 0x6E7E8C, zh: '精盐', en: 'Refined' },
];

// UI 多语言文案
export const I18N = {
  zh: {
    title: '自贡井盐 · 真空制盐',
    sub: '真空制盐 3D 工艺流程可视化',
    sideTitle: '工艺流程',
    sideTip: '点击工序聚焦视角 · 拖拽旋转 · 滚轮缩放',
    ctrl: { prev: '上一步', tour: '自动导览', next: '下一步', play: '物流', playOff: '已暂停', rotate: '自转', rotateOff: '自转关', labels: '标签', labelsOff: '标签关', reset: '总览', touring: '导览中', download: '下载' },
    introTitle: '自贡井盐 · 真空制盐',
    introDesc: '以千年盐都自贡的井盐为原料，经真空制盐工艺——采卤、净化、多效真空蒸发结晶、固液分离、干燥、筛分、包装，制成洁白精盐。',
    introSub: '本页为 3D 交互流程展示：拖拽旋转视角，点击左侧工序或底部按钮逐站查看。',
    introBtn: '进入流程 ▸',
    ipIndex: '工序', ipPrinciple: '工艺原理', ipReaction: '主要反应 / 说明', ipEquip: '主要设备', ipParams: '关键参数', ipOutput: '产物',
  },
  en: {
    title: 'Zigong Well Salt · Vacuum Making',
    sub: '3D Vacuum Salt-Making Process',
    sideTitle: 'Process Flow',
    sideTip: 'Click a step to focus · Drag to orbit · Scroll to zoom',
    ctrl: { prev: 'Prev', tour: 'Auto Tour', next: 'Next', play: 'Flow', playOff: 'Paused', rotate: 'Rotate', rotateOff: 'Rotate Off', labels: 'Labels', labelsOff: 'Labels Off', reset: 'Overview', touring: 'Touring', download: 'Download' },
    introTitle: 'Zigong Well Salt · Vacuum Making',
    introDesc: 'Made from well salt of Zigong, the millennial "Salt Capital": brine extraction, purification, multi-effect vacuum evaporation & crystallization, solid-liquid separation, drying, screening and packaging produce pure white refined salt.',
    introSub: 'A 3D interactive process view: drag to orbit, click steps on the left or buttons below to explore each station.',
    introBtn: 'Enter ▸',
    ipIndex: 'Step', ipPrinciple: 'Principle', ipReaction: 'Reactions / Notes', ipEquip: 'Equipment', ipParams: 'Key Parameters', ipOutput: 'Output',
  },
};
