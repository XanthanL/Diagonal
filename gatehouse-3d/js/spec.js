// 魔幻门楼 · The Gatehouse —— 尺寸 / 配色 / 相机锚点 单一数据源
// 世界坐标:米。原点 = 台基上层的几何中心;y 向上;+z 为正面(临水)。
// 判据:docs/STYLE.md(v3 重写版);本文件是唯一魔数来源,生成器内不得另写尺寸。

/** 大局:台基三层收分,楼身三重檐,通高 ≈23 m */
export const WORLD = {
  fog: { color: 0xe9e3d2, near: 70, far: 300 },
  sky: { top: 0xbfd8cd, mid: 0xe4e6d2, bottom: 0xf6f1e2 },   // 玉青→纸暖 渐变穹
  sun: { color: 0xfff1d8, intensity: 2.6, pos: [38, 52, 34] },
  hemi: { sky: 0xdfeadf, ground: 0xb8a98e, intensity: 0.75 },
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
  moss:      0x7fa47a,  // 地衣苔绿
  mossDeep:  0x678b64,  // 地·暗
  pine:      0x3f6b52,  // 松
  pineDeep:  0x33593f,  // 松·暗
  hill1:     0x5e8a6e,  // 近山
  hill2:     0x7fa98b,  // 中山
  hill3:     0xa9c4ad,  // 远山(交给雾)
  water:     0x5fa8a0,  // 碧水
  waterDeep: 0x2e6e6a,  // 潭
  mist:      0xf2efe4,  // 灵雾
  portal:    0x7fe0c8,  // 灵光·玉
  portalGold:0xffe2a0,  // 灵光·金
  spirit:    0xffe9a8,  // 灵火
};

// ============ 台基(三层收分石作) ============
export const TERRACE = {
  L1: { w: 34, d: 24, h: 0.9 },            // 底层台
  L2: { w: 27, d: 19.5, h: 0.9 },          // 二层台
  L3: { w: 22.5, d: 15.5, h: 0.55 },       // 三层台(楼身坐于其上,台面 y=2.35)
  RAIL: { h: 0.72, postGap: 2.6 },         // 望柱栏杆
  STEP: { w: 6.4, rise: 0.15 },            // 正面踏道(每级 0.15 m,逐台而下)
};

// ============ 楼身 ============
export const GATE = {
  podium: { w: 19, d: 12, h: 3.1 },        // 白灰拱墩(拱门穿过它)
  arch: { w: 4.6, h: 4.5 },                // 拱门洞(宽×直壁高,上接半圆)
  hall1: { w: 17, d: 10.5, colH: 4.3, colR: 0.30, colsX: [-7.5, -3.75, 0, 3.75, 7.5], colsZ: [-4.2, 4.2] },
  hall2: { w: 11.5, d: 7.6, colH: 3.4, colR: 0.27, colsX: [-5, 0, 5], colsZ: [-3.3, 3.3] },
  hall3: { w: 7, d: 4.9, colH: 2.7, colR: 0.24, colsX: [-3, 0, 3], colsZ: [-2.2, 2.2] },
  plaque: { w: 3.6, h: 1.5 },              // 无字匾(金框 + 一枚玉印灵光)
};

/**
 * 三重檐:一整片连续曲面(参数化 loft,截断式庑殿——上层楼身坐在顶部的平座上)。
 *   ax/az = 檐口半宽/半深;topRX/topRZ = 顶部平座半宽/半深(承上一重墙身);
 *   h = 屋面矢高;cornerLift = 翘角总抬升;cornerSigma = 翘角沿周长的影响半径;
 *   profile = 举折指数(>1:檐缓脊陡)。
 */
export const TIERS = [
  { id: 'T1', ax: 13.2, az: 8.6, topRX: 6.1, topRZ: 4.0, h: 3.4, cornerLift: 1.5, cornerSigma: 3.0, profile: 1.55, y: 10.05 },
  { id: 'T2', ax: 8.9,  az: 6.1, topRX: 3.75, topRZ: 2.6, h: 2.9, cornerLift: 1.15, cornerSigma: 2.4, profile: 1.55, y: 15.45 },
  { id: 'T3', ax: 5.6,  az: 4.0, topRX: 1.5, topRZ: 1.15, h: 2.3, cornerLift: 0.85, cornerSigma: 1.9, profile: 1.55, y: 19.85 },
];

/** 攒尖收尾:金领 + 葫芦宝珠 + 灵光 */
export const CROWN = { baseY: 22.15, ballR: 0.52, spike: 1.5 };

/** 灯笼:一层檐四角垂挂 + 拱门两侧各一 */
export const LANTERN = { r: 0.42, h: 0.62, drop: 0.9 };

/** 灵光门:拱洞内的玉金漩涡 */
export const PORTAL = { r: 2.15, z: 0 };

// ============ 环境 ============
export const ENV = {
  terrain: { r: 95, seed: 7 },
  water: { cx: 6, cz: 36, rx: 46, rz: 16 },            // 门楼正前的一湾碧水(椭圆,近岸让开石径)
  bridge: { cx: -14, cz: 33, w: 3.4, span: 18 },       // 偏左的石拱桥 = 唯一破对称处
  hills: [
    { z: -78, h: 20, seg: 90, color: 'hill1', amp: 0.9 },
    { z: -118, h: 32, seg: 80, color: 'hill2', amp: 1.15 },
    { z: -160, h: 46, seg: 70, color: 'hill3', amp: 1.3 },
  ],
  sideHills: [
    { x: -62, rot: Math.PI / 2, h: 17, color: 'hill1', amp: 0.8 },
    { x: 58, rot: Math.PI / 2, h: 15, color: 'hill1', amp: 0.75 },
  ],
  mist: { count: 9 },
  fireflies: { count: 70 },
  moon: { pos: [-88, 62, -150], r: 7 },
};
