// 魔幻门楼 · The Gatehouse —— 尺寸 / 配色 / 相机锚点 单一数据源
// 世界坐标:米。原点 = 台基上层的几何中心;y 向上;+z 为正面(临水)。
// 判据:docs/STYLE.md(v3 重写版);本文件是唯一魔数来源,生成器内不得另写尺寸。

/** 大局:台基三层收分,楼身三重檐,通高 ≈23 m */
export const WORLD = {
  fog: { color: 0xe9e3d2, near: 90, far: 420 },
  sky: { top: 0xbfd8cd, mid: 0xe4e6d2, bottom: 0xf6f1e2 },   // 玉青→纸暖 渐变穹
  sun: { color: 0xfff1d8, intensity: 2.6, pos: [46, 40, 26] },
  hemi: { sky: 0xdfeadf, ground: 0xb8a98e, intensity: 0.62 },
};

// ============ 色板(魔幻绿水青山:暖纸天 + 玉青水 + 黛青瓦 + 朱柱 + 点金) ============
export const C = {
  tile:      0x46616a,  // 黛青瓦
  tileDeep:  0x354d56,  // 瓦檐口暗端
  ridge:     0x52707a,  // 正脊亮一线
  gold:      0xc9a13b,  // 点金(脊饰/匾框/翘角末梢)
  goldGlow:  0xffd98a,  // 金的发光端
  red:       0xa63a28,  // 朱红柱
  redLit:    0xbe4b33,  // 朱红受光棱
  plaster:   0xf1ebdc,  // 暖白墙
  chestnut:  0x6b4a32,  // 栗木枋/格扇框
  lattice:   0x2e2a24,  // 格扇芯暗底
  windowLit: 0xffb35c,  // 窗内透出的暖光(魔幻:楼里有人间灯火)
  stone:     0x9b968a,  // 台基砂岩·亮
  stoneDeep: 0x7c776c,  // 台基砂岩·暗
  moss:      0x6f9a6b,  // 地衣苔绿
  mossDeep:  0x577f5c,  // 地·暗
  mossHigh:  0x9cbb92,  // 地·远处提浅(接山)
  pine:      0x3f6b52,  // 松
  pineDeep:  0x33593f,  // 松·暗
  hill1:     0x53826a,  // 近山
  hill2:     0x77a184,  // 中山
  hill3:     0xa2bfa8,  // 远山(交给雾)
  water:     0x4f9c96,  // 碧水
  waterDeep: 0x245f5e,  // 潭
  mist:      0xf2efe4,  // 灵雾
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

// ============ 楼身 ============
export const GATE = {
  podium: { w: 19, d: 12, h: 4.6 },        // 白灰拱墩(拱门穿过它)
  arch: { w: 4.6, h: 3.4 },                // 拱门洞(宽×直壁高,上接半圆)
  hall1: { w: 17, d: 10.5, colH: 4.0, colR: 0.30, colsX: [-7.5, -3.75, 0, 3.75, 7.5], colsZ: [-4.2, 4.2] },
  hall2: { w: 11.5, d: 7.6, colH: 3.0, colR: 0.27, colsX: [-5, 0, 5], colsZ: [-3.3, 3.3] },
  hall3: { w: 7, d: 4.9, colH: 2.4, colR: 0.24, colsX: [-3, 0, 3], colsZ: [-2.2, 2.2] },
  plaque: { w: 3.4, h: 1.2 },              // 无字匾(金框 + 一枚玉印灵光)
};

/**
 * 三重檐:一整片连续曲面(参数化 loft,截断式庑殿——上层楼身坐在顶部的平座上)。
 *   ax/az = 檐口半宽/半深;topRX/topRZ = 顶部平座半宽/半深(承上一重墙身);
 *   h = 屋面矢高;cornerLift = 翘角总抬升;cornerSigma = 翘角沿周长的影响半径;
 *   profile = 举折指数(>1:檐缓脊陡)。
 */
export const TIERS = [
  { id: 'T1', ax: 11.6, az: 7.6, topRX: 6.1, topRZ: 4.0, h: 4.3, cornerLift: 1.05, cornerSigma: 2.2, profile: 1.55, y: 11.6 },
  { id: 'T2', ax: 7.9,  az: 5.4, topRX: 3.75, topRZ: 2.6, h: 3.5, cornerLift: 0.8, cornerSigma: 1.9, profile: 1.55, y: 19.4 },
  { id: 'T3', ax: 5.1,  az: 3.6, topRX: 1.5, topRZ: 1.15, h: 2.5, cornerLift: 0.55, cornerSigma: 1.6, profile: 1.55, y: 25.9 },
];

/** 屋面造型常数:翘角外撇量 / 檐口封边厚(在 build 层统一取用,不得另写魔数) */
export const ROOF = { flare: 0.45, fasciaH: 0.62, eavesBand: 0.5 };

/** 攒尖收尾:金领 + 葫芦宝珠 + 灵光 */
export const CROWN = { baseY: 28.4, ballR: 0.52, spike: 1.5 };

/** 灯笼:一层檐四角垂挂 + 拱门两侧各一 */
export const LANTERN = { r: 0.42, h: 0.62, drop: 0.9 };

/** 灵光门:填满拱洞的一张光膜(半宽 / 直壁高 / 进深位置),底部落在拱洞地面 */
export const PORTAL = { halfW: 2.2, straight: 3.25, z: 2.6 };

// ============ 环境 ============
export const ENV = {
  terrain: { r: 95, seed: 7 },
  water: { cx: 10, cz: 34, rx: 42, rz: 10 },            // 门楼正前的一湾碧水(窄长湾,近岸让开石径)
  bridge: { cx: -18, cz: 34, w: 3.6, span: 14 },        // 偏左的石拱桥(跨湾) = 唯一破对称处
  hills: [
    { z: -70, h: 34, seg: 90, color: 'hill1', amp: 1.0 },
    { z: -106, h: 48, seg: 80, color: 'hill2', amp: 1.15 },
    { z: -146, h: 62, seg: 70, color: 'hill3', amp: 1.25 },
  ],
  sideHills: [
    { x: -62, rot: Math.PI / 2, h: 17, color: 'hill1', amp: 0.8 },
    { x: 58, rot: Math.PI / 2, h: 15, color: 'hill1', amp: 0.75 },
  ],
  mist: { count: 9 },
  fireflies: { count: 70 },
  moon: { pos: [-88, 62, -150], r: 7 },
};
