// 自贡井盐 · 天车（木构井架）3D 解构数据（含中英文）
// 单一装置：天车（井盐木构井架）及其构件。UI 字段沿用旧结构以最小改动驱动界面：
//   principle 工艺原理 / reaction 结构·营建要点 / equipment 主要构件 / params 关键形制 / output 提卤产出

export const PROCESS = [
  {
    id: 'derrick', index: 1, name: '天车', subtitle: '井盐木构井架',
    nameEn: 'Derrick', subtitleEn: 'Timber Headframe',
    model: 'well', color: 0x8C755A, position: [0, 0, 0],
    equipment: ['天车（收分木井架）', '大车（提卤绞盘）', '地辊（转向定滑轮）', '碓架（冲击顿钻）', '风篾（防风拉索）', '汲卤筒（提卤桶）'],
    equipmentEn: ['Derrick (tapered timber frame)', 'Cart (draw-wheel)', 'Ground roller (deflector)', 'Duijia (percussion rig)', 'Wind stays (guy lines)', 'Bailer (draw bucket)'],
    principle:
      '天车是自贡井盐的标志性木构井架，矗立于盐井之上，用于冲击式顿钻凿井与提汲卤水。其以杉木为骨、竹篾绳捆扎，全程不用一钉，由低到高逐级收分；顶端置天辊、地面设地辊与大车，构成提卤滑轮组。',
    principleEn:
      'The derrick is Zigong’s iconic timber headframe above the salt well, used for percussion drilling and drawing brine. Built of fir with bamboo-cord lashings and not a single iron nail, it tapers from a wide base to a narrow top, carrying a sky roller aloft and ground rollers and a draw-cart below — a pulley train for lifting brine.',
    reaction: [
      '杉木立柱 + 竹篾绳捆扎，全程无铁钉',
      '四面收分：由低到高渐窄（顶半宽 ≈ 底半宽 ×0.32）',
      '天辊 → 地辊 → 大车：滑轮组提卤',
      '碓架：踩板蓄能，碓头重力冲击凿井',
    ],
    params: ['天车高约 18 m（燊海井实制）', '大车直径约 4.5 m', '风篾 12 根放射拉索', '杉木 + 竹篾，无铁钉'],
    paramsEn: ['Derrick ~18 m (Shenhai Well)', 'Draw-cart Ø ~4.5 m', '12 radiating wind stays', 'Fir + bamboo cord, nail-free'],
    output: '提汲卤水（制盐原料）',
    outputEn: 'Drawn brine (salt-making feed)',
  },
];

// 材料 / 构件图例（颜色 + 中英文名称）
export const LEGEND = [
  { color: 0x8C755A, zh: '杉木', en: 'Fir' },
  { color: 0xA9AC82, zh: '竹篾', en: 'Bamboo' },
  { color: 0x2F6F8F, zh: '卤水', en: 'Brine' },
  { color: 0x8A8478, zh: '铁箍', en: 'Iron' },
];

// UI 多语言文案
export const I18N = {
  zh: {
    title: '自贡井盐 · 天车',
    sub: '自贡井盐 木构天车 3D 解构',
    sideTitle: '天车装置',
    sideTip: '点击聚焦视角 · 拖拽旋转 · 滚轮缩放',
    ctrl: { prev: '上一步', tour: '自动聚焦', next: '下一步', play: '动画', playOff: '已停止', rotate: '自转', rotateOff: '自转关', labels: '标签', labelsOff: '标签关', reset: '总览', touring: '聚焦中', download: '下载' },
    introTitle: '自贡井盐 · 天车',
    introDesc: '自贡井盐的标志——木构天车（井架）。以杉木为骨、竹篾绳捆扎，全程无铁钉；顶端天辊、地面地辊与大车构成提卤滑轮组，碓架以冲击顿钻凿井。本页为其实时 3D 解构。',
    introSub: '拖拽旋转视角，点击左侧装置或底部按钮聚焦查看；动画展示提卤与顿钻。',
    introBtn: '进入天车 ▸',
    ipIndex: '装置', ipPrinciple: '工艺原理', ipReaction: '结构 · 营建要点', ipEquip: '主要构件', ipParams: '关键形制', ipOutput: '提卤产出',
  },
  en: {
    title: 'Zigong Well Salt · Derrick',
    sub: '3D Deconstruction of the Timber Headframe',
    sideTitle: 'The Derrick',
    sideTip: 'Click to focus · Drag to orbit · Scroll to zoom',
    ctrl: { prev: 'Prev', tour: 'Auto Focus', next: 'Next', play: 'Animate', playOff: 'Stopped', rotate: 'Rotate', rotateOff: 'Rotate Off', labels: 'Labels', labelsOff: 'Labels Off', reset: 'Overview', touring: 'Focusing', download: 'Download' },
    introTitle: 'Zigong Well Salt · Derrick',
    introDesc: 'The emblem of Zigong well salt — the timber derrick. Fir framed and bamboo-lashed with no iron nails; a sky roller aloft and ground rollers and draw-cart below form the lifting pulley train, while the percussion rig drills by impact. This page is its live 3D deconstruction.',
    introSub: 'Drag to orbit; click the unit at left or the buttons below to focus. Animation shows brine lifting and percussion drilling.',
    introBtn: 'Enter ▸',
    ipIndex: 'Unit', ipPrinciple: 'Principle', ipReaction: 'Structure · Build', ipEquip: 'Components', ipParams: 'Key Specs', ipOutput: 'Output',
  },
};
