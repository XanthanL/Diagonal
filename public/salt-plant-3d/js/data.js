// 自贡井盐 · 天车（木构井架）3D 解构数据（含中英文）
// 单一装置：天车（井盐木构井架）及其构件。UI 字段沿用旧结构以最小改动驱动界面：
//   principle 工艺原理 / reaction 结构·营建要点 / equipment 主要构件 / params 关键形制 / output 提卤产出

export const PROCESS = [
  {
    id: 'derrick', index: 1, name: '天车', subtitle: '',
    nameEn: 'Derrick', subtitleEn: '',
    model: 'well', color: 0x8C755A, position: [0, 0, 0],
    equipment: ['束柱（多杉并束、竹篾成箍）', '大车（提卤绞盘）', '地辊（转向定滑轮）', '碓架（冲击顿钻）', '风篾（防风拉索）', '汲卤筒（提卤桶）', '铁箍（关键节点锁紧）', '盐工寮棚 + 井台竹笆'],
    equipmentEn: ['Bundle column (lashed fir trunks)', 'Cart (draw-wheel)', 'Ground roller (deflector)', 'Duijia (percussion rig)', 'Wind stays (guy lines)', 'Bailer (draw bucket)', 'Iron hoops (joint lock)', 'Brine-shed + bamboo screen'],
    principle:
      '天车是自贡井盐的标志性木构井架，矗立于盐井之上，用于冲击式顿钻凿井与提汲卤水。其以杉木为骨——但因无足够长度的整木，每根「柱」实为多根杉木并排靠拢、接头彼此错开（错缝搭接）而成的束柱，外面用竹篾一道道密缠成箍，关键节点再套手锻铁箍锁死，全程不用一钉，由低到高逐级收分；顶端置天辊、地面设地辊与大车，构成提卤滑轮组。',
    principleEn:
      'The derrick is Zigong’s iconic timber headframe above the salt well, used for percussion drilling and drawing brine. Because no single fir reaches that height, each "column" is a bundle of trunks stood side-by-side with offset splices, lashed tight by bamboo-cord rings — and at every key joint a hand-forged iron hoop locks the assembly — without a single iron nail. It tapers from a wide base to a narrow top, carrying a sky roller aloft and ground rollers and a draw-cart below.',
    reaction: [
      '束柱：多杉并束、错缝搭接（不是一根整木）',
      '竹篾密缠成箍，间隔以手锻铁箍锁紧节点',
      '四面收分：由低到高渐窄，并束根数递减（6→2）',
      '天辊 → 地辊 → 大车：滑轮组提卤',
      '碓架：踩板蓄能，碓头重力冲击凿井',
      '盐工寮棚 + 井台竹笆，构成井场聚落',
    ],
    params: ['天车高约 18 m（燊海井实制）', '束柱 6→2 根渐束', '篾箍 ≈0.7 m/道，铁箍每 3 道', '大车直径约 4.5 m', '风篾 12 根放射拉索'],
    paramsEn: ['Derrick ~18 m (Shenhai Well)', 'Draw-cart Ø ~4.5 m', '12 radiating wind stays', 'Fir + bamboo cord, nail-free'],
    output: '提汲卤水（制盐原料）；维系井场工匠的日常',
    outputEn: 'Drawn brine (salt-making feed); the daily life of well-yard craftsmen',
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
    sideTitle: '天车装置',
    sideTip: '点击聚焦视角 · 拖拽旋转 · 滚轮缩放',
    ctrl: { prev: '上一步', tour: '自动聚焦', next: '下一步', play: '动画', playOff: '已停止', rotate: '自转', rotateOff: '自转关', labels: '标签', labelsOff: '标签关', reset: '总览', touring: '聚焦中', download: '下载' },
    introTitle: '天车',
    introDesc: '自贡井盐的标志——木构天车（井架）。其以多根杉木并束、错缝搭接成柱，外缠竹篾成箍，节点以手锻铁箍锁紧，全程不用一钉；顶端天辊、地面地辊与大车构成提卤滑轮组，碓架以冲击顿钻凿井。井台旁设有盐工寮棚与竹笆屏风。本页为其实时 3D 解构。',
    introSub: '拖拽旋转视角，点击左侧装置聚焦查看；动画展示提卤与顿钻。',
    introBtn: '进入天车 ▸',
    ipIndex: '装置', ipPrinciple: '工艺原理', ipReaction: '结构 · 营建要点', ipEquip: '主要构件', ipParams: '关键形制', ipOutput: '提卤产出',
  },
  en: {
    title: 'Derrick',
    sub: '3D Deconstruction of the Timber Derrick',
    sideTitle: 'The Derrick',
    sideTip: 'Click to focus · Drag to orbit · Scroll to zoom',
    ctrl: { prev: 'Prev', tour: 'Auto Focus', next: 'Next', play: 'Animate', playOff: 'Stopped', rotate: 'Rotate', rotateOff: 'Rotate Off', labels: 'Labels', labelsOff: 'Labels Off', reset: 'Overview', touring: 'Focusing', download: 'Download' },
    introTitle: 'Derrick',
    introDesc: 'The emblem of Zigong well salt — the timber derrick. Each column is a bundle of fir trunks with offset splices, lashed tight by bamboo-cord rings and locked at the nodes by hand-forged iron hoops; not a single iron nail. A sky roller aloft and ground rollers and draw-cart below form the lifting pulley train; the percussion rig drills by impact. A brine-shed and bamboo screen frame the well yard. This page is its live 3D deconstruction.',
    introSub: 'Drag to orbit; click the unit at left to focus. Animation shows brine lifting and percussion drilling.',
    introBtn: 'Enter ▸',
    ipIndex: 'Unit', ipPrinciple: 'Principle', ipReaction: 'Structure · Build', ipEquip: 'Components', ipParams: 'Key Specs', ipOutput: 'Output',
  },
};
