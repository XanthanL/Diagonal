// 魔幻门楼 · The Gatehouse —— 尺寸 / 配色 / 相机锚点 单一数据源
// 世界坐标:米。原点 = 台基上层的几何中心;y 向上;+z 为正面(临水)。
// 判据:docs/STYLE.md(v3 重写版);本文件是唯一魔数来源,生成器内不得另写尺寸。

/** 大局:台基三层收分,楼身三重檐,通高 ≈31 m */
export const WORLD = {
  // 阳光明媚 · 晴空:天顶蔚蓝 → 中段天蓝 → 地平暖白雾。fog 改为淡青白,给出"远山如黛"的空气透视
  fog: { color: 0xd9ecf2, near: 72, far: 360 },
  sky: { top: 0x3f8ed6, mid: 0x8fc9ec, bottom: 0xf8f0dc },   // 蔚蓝 → 天蓝 → 地平暖白
  sun: { color: 0xfff7e6, intensity: 3.3, pos: [46, 40, 26] },
  // 半球光:天空蓝(把暗面补成冷蓝而不是脏灰) + 草地黄(暗面补暖)—— 晴天 outdoor 的关键
  hemi: { sky: 0xd4e9ff, ground: 0xc9dc9c, intensity: 1.0 },
};

// ============ 色板(阳光绿水青山:晴空蓝 + 苍翠绿 + 碧水 + 黛青瓦 + 朱柱 + 点金) ============
export const C = {
  tile:      0x4c7080,  // 黛青瓦(抬亮,晴天下读作青蓝而非墨黑)
  tileDeep:  0x3b5967,  // 瓦檐口暗端
  ridge:     0x5f8797,  // 正脊亮一线
  gold:      0xd6b04a,  // 点金(脊饰/匾框/翘角末梢)
  goldGlow:  0xffeaa8,  // 金的发光端
  red:       0xb0452e,  // 朱红柱
  redLit:    0xc95c3e,  // 朱红受光棱
  plaster:   0xf8f3e8,  // 暖白墙
  chestnut:  0x8a6647,  // 栗木枋/格扇框(提亮,晴天下不再发闷)
  lattice:   0x6f5a42,  // 格扇芯:暖透光底(比窗内灯火暗,保留"窗里亮着人间灯火"的层次)
  windowLit: 0xffb35c,  // 窗内透出的暖光(魔幻:楼里有人间灯火)
  stone:     0xb2ab98,  // 台基砂岩·亮
  stoneDeep: 0x918a77,  // 台基砂岩·暗
  moss:      0x6cbb5b,  // 地衣苔绿(鲜亮草绿)
  mossDeep:  0x3e7d45,  // 地·暗(苍翠)
  mossHigh:  0xa6d886,  // 地·远处提浅(接山,向阳黄绿)
  pine:      0x2f7a44,  // 松(翠)
  pineDeep:  0x1e5b33,  // 松·暗
  hill1:     0x3f8f56,  // 近山(苍翠,加深:要经得起雾)
  hill2:     0x5aa878,  // 中山
  hill3:     0x8abf9f,  // 远山(交给雾,仍读作青绿)
  water:     0x3ab3a3,  // 碧水(清亮玉绿)
  waterDeep: 0x146a6b,  // 潭
  mist:      0xf7fdf6,  // 灵雾(近白,晴天里只是薄薄一层)
  portal:    0x7fe0c8,  // 灵光·玉
  portalGold:0xffe2a0,  // 灵光·金
  spirit:    0xffe9a8,  // 灵火
};

// ============ 台基(三层收分石作) ============
export const TERRACE = {
  L1: { w: 31, d: 22, h: 0.9 },            // 底层台
  L2: { w: 25.5, d: 18, h: 0.9 },          // 二层台
  L3: { w: 21.5, d: 14.5, h: 0.55 },       // 三层台(楼身坐于其上,台面 y=2.35)
  RAIL: { h: 0.72, postGap: 2.6 },         // 望柱栏杆
  STEP: { w: 6.4, rise: 0.15 },            // 正面踏道(每级 0.15 m,逐台而下)
};

/** 台面高度 = 三层台基累加。一切"自台面起算"的高度都由此推,不得重算。 */
export const DECK_Y = TERRACE.L1.h + TERRACE.L2.h + TERRACE.L3.h;   // 2.35

// ============ 楼身 ============
/**
 * ⚠ 拱门约束(曾出过 bug):拱洞总高 = arch.h + arch.w/2,
 * 必须小于 podium.h,否则 ExtrudeGeometry 的洞会溢出外形轮廓,
 * 拱券冠部被墩顶切平 → 退化几何。券石(ring)按 arch 各边 +0.34 放大,
 * 所以真正的下限是:arch.h + arch.w/2 + 0.68 < podium.h。
 *   现值:2.4 + 2.3 + 0.68 = 5.38 < 5.6 ✓(墩顶留 0.22 石边)
 */
export const GATE = {
  podium: { w: 19, d: 12, h: 5.6 },        // 白灰拱墩(拱门穿过它)
  arch: { w: 4.6, h: 2.4 },                // 拱门洞(宽×直壁高,上接半圆)
  hall1: { w: 17, d: 10.5, colH: 4.0, colR: 0.30, colsX: [-7.5, -3.75, 0, 3.75, 7.5], colsZ: [-4.2, 4.2] },
  hall2: { w: 11.5, d: 7.6, colH: 3.0, colR: 0.27, colsX: [-5, 0, 5], colsZ: [-3.3, 3.3] },
  hall3: { w: 7, d: 4.9, colH: 2.4, colR: 0.24, colsX: [-3, 0, 3], colsZ: [-2.2, 2.2] },
  plaque: { w: 3.4, h: 1.2 },              // 无字匾(金框 + 一枚玉印灵光)
};

/** 匾额位置:挂在一层楼身正面的中格(该格不排格扇窗),不是塞在拱洞里 */
export const PLAQUE_Y = DECK_Y + GATE.podium.h + GATE.hall1.colH * 0.62;
export const PLAQUE_Z = GATE.hall1.colsZ[1] + 0.1;

/**
 * 三重檐:一整片连续曲面(参数化 loft,截断式庑殿——上层楼身坐在顶部的平座上)。
 *   ax/az = 檐口半宽/半深;topRX/topRZ = 顶部平座半宽/半深(承上一重墙身);
 *   h = 屋面矢高;cornerLift = 翘角总抬升;cornerSigma = 翘角沿周长的影响半径;
 *   profile = 举折指数(>1:檐缓脊陡)。
 * y 是绝对值,与 GATE.podium.h 联动:改墩高时三层檐 + CROWN.baseY 须同步平移,
 * 以保持 hall(由墩顶推导)与各重檐之间的 0.5~0.65 檐下光缝不变。
 */
export const TIERS = [
  { id: 'T1', ax: 11.6, az: 7.6, topRX: 6.1, topRZ: 4.0, h: 4.3, cornerLift: 1.05, cornerSigma: 2.2, profile: 1.55, y: 12.6 },
  { id: 'T2', ax: 7.9,  az: 5.4, topRX: 3.75, topRZ: 2.6, h: 3.5, cornerLift: 0.8, cornerSigma: 1.9, profile: 1.55, y: 20.4 },
  { id: 'T3', ax: 5.1,  az: 3.6, topRX: 1.5, topRZ: 1.15, h: 2.5, cornerLift: 0.55, cornerSigma: 1.6, profile: 1.55, y: 26.9 },
];

/** 屋面造型常数:翘角外撇量 / 檐口封边厚(在 build 层统一取用,不得另写魔数) */
export const ROOF = { flare: 0.45, fasciaH: 0.62, eavesBand: 0.5 };

/** 攒尖收尾:金领 + 葫芦宝珠 + 灵光 */
export const CROWN = { baseY: 29.4, ballR: 0.52, spike: 1.5 };

/** 灯笼:一层檐四角垂挂 + 拱门两侧各一 */
export const LANTERN = { r: 0.42, h: 0.62, drop: 0.9 };

/**
 * 灵光门:填满拱洞的一张光膜(半宽 / 直壁高 / 进深位置),底部落在拱洞地面。
 * halfW / straight 必须跟随 GATE.arch(膜四周比洞内收 0.06,由 build 层做)。
 */
export const PORTAL = { halfW: 2.3, straight: 2.4, z: 2.6 };

// ============ 环境 ============
export const ENV = {
  terrain: { r: 95, seed: 7 },
  water: { cx: 10, cz: 34, rx: 42, rz: 10 },            // 门楼正前的一湾碧水(窄长湾,近岸让开石径)
  bridge: { cx: -18, cz: 34, w: 3.6, span: 14 },        // 偏左的石拱桥(跨湾) = 唯一破对称处
  hills: [
    { z: -70, h: 34, seg: 90, color: 'hill1', amp: 1.3 },
    { z: -106, h: 48, seg: 80, color: 'hill2', amp: 1.45 },
    { z: -146, h: 62, seg: 70, color: 'hill3', amp: 1.55 },
  ],
  sideHills: [
    { x: -62, rot: Math.PI / 2, h: 17, color: 'hill1', amp: 0.95 },
    { x: 58, rot: Math.PI / 2, h: 15, color: 'hill1', amp: 0.9 },
  ],
  mist: { count: 9 },
  fireflies: { count: 70 },
  // 日轮:暖白金圆 + 晕,藏在远山之后,作晴空的太阳(而非夜月)
  sun: { pos: [-128, 84, -150], r: 7 },
};
