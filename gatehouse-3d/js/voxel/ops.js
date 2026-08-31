// 造型算子（体素词汇）—— 门楼（架空）
// 只对着 docs/STYLE.md 写：轴对齐长方体堆叠、横向长条为基本笔触、纯追加可链式、同输入两次一致。
// 镜像轴 x → 117 - x（CX=59）。翘角语汇见 STYLE §四，是本文唯一不可改动的造型公式。
import { ops } from './builder.js';
import { MIRROR, CROWN, SCULPT, LION } from '../spec.js';

const box = ops.box;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** 左半区间 [a, a+w-1] 及其镜像区间（一对，均按左右升序） */
export function sym(a, w) {
  return [[a, a + w - 1], [MIRROR(a + w - 1), MIRROR(a)]];
}

/**
 * 控制点逐列线性插值：pts = [[x, v1, v2, …], …]（按 x 升序，间距不限）。
 * 少数人工控制点 → 逐列取整的 1 格微台阶：远看是一条连续曲线，近看仍是轴对齐长方体。
 * 岸线、山脊线、桥拱、屋面举折共用此法（STYLE §二.3 横向长条 + §五 单层薄幕）。
 */
export function interpolateCols(pts) {
  const x0 = pts[0][0];
  const x1 = pts[pts.length - 1][0];
  const nVal = pts[0].length - 1;
  const cols = new Array(x1 - x0 + 1);
  let seg = 1;
  for (let i = 0; i < cols.length; i++) {
    const x = x0 + i;
    while (seg < pts.length - 1 && x > pts[seg][0]) seg++;
    const a = pts[seg - 1];
    const b = pts[seg];
    const t = b[0] === a[0] ? 0 : (x - a[0]) / (b[0] - a[0]);
    const row = new Array(nVal);
    for (let k = 0; k < nVal; k++) row[k] = Math.round(a[k + 1] + (b[k + 1] - a[k + 1]) * t);
    cols[i] = row;
  }
  return { x0, x1, cols };
}

// ---------------------------------------------------------------- 屋面
/**
 * 一整片坡屋面（高度场）：四面屋檐在周圈、正脊平台在中央，逐格成坡。
 *   · 一个点的高度由「它所属的那一坡走完自己进深的比例」决定 → r = min(周距x/平台进深x, 周距z/平台进深z)。
 *     等 r 线是一圈相似矩形：r=0 是整个檐口周圈（通长同高，只有角端被起翘抬起），r=100 是正脊平台。
 *     取 max 会让前檐沿 x 一路爬到脊高 —— 檐口就读不出那条弧线了。
 *   · 顶 = yTop + 举折(r) + 起翘×(1 − 周距z/平台进深z)，底皮恒在檐下皮 yb → 檐口通长等厚、角端整条上翘。
 *   · 平台只比上一重墙身大一圈：平台一大，屋面就退化成一块灰平板（§七）。
 *   · 最外一圈的底行压一道 椽望暗层 = 檐口暗线；大面保持干净（§三 大面优先）。
 */
export function roofSlab(w, p) {
  const { cx, halfW, flat, yTop, h, rise, z0, z1, plateau, roof } = p;
  const yb = yTop - h + 1;
  const xL = cx - halfW, xR = cx + halfW - 1;
  const sx = Math.max(1, plateau.x[0] - xL);
  const sz = Math.max(1, plateau.z[0] - z0);
  const denom = halfW - 0.5 - flat;
  const { x0: r0, cols } = interpolateCols(roof);
  const extraAt = (r) => cols[clamp(r - r0, 0, cols.length - 1)][0];
  for (let i = 0; i < 2 * halfW; i++) {
    const x = xL + i;
    const u = denom > 0 ? clamp((Math.abs(x - cx + 0.5) - flat) / denom, 0, 1) : 0;
    const lift = Math.round(rise * u * u);
    const dx = Math.min(x - xL, xR - x);
    for (let z = z0; z <= z1; z++) {
      const dz = Math.min(z - z0, z1 - z);
      const r = Math.min(100, Math.round(100 * Math.min(dx / sx, dz / sz)));
      const lf = Math.round(lift * clamp(1 - dz / sz, 0, 1));
      const y0c = yb + lf;
      box(w, x, y0c, z, 1, h + extraAt(r), 1, '瓦·亮垄');
      if (dx === 0 || dz === 0) box(w, x, y0c, z, 1, 1, 1, '椽望暗层');
    }
  }
  return w;
}

/**
 * 长牛角翘角（STYLE §四）：自角端向外 N 段挑出，轨迹取 round(hornRise·k²) 的累计增量，
 * 相邻段高差夹在 [1, hornH-1] —— 必共享整行才 6-连通接地（高差 ≥ 段高即悬空）。
 * 先缓后陡，深度 3→2→1 收尖，末段金身、顶端一枚灵光冠尖。
 * 金只留给末段：多段金身读作金梯子。
 */
export function eaveTip(w, p) {
  const { cx, halfW, yTop, rise, dir, z1 } = p;
  const sign = dir === 'L' ? -1 : 1;
  const cornerX = dir === 'L' ? cx - halfW : cx + halfW - 1;
  // 角端顶缘 = yTop + rise；基准再降一格，使第 1 段与该顶缘共享整行（否则全角按 6-连通判悬空）
  const baseY = yTop + rise - 1;
  const N = p.horn;
  const H = SCULPT.hornH;
  const raw = (k) => Math.round(SCULPT.hornRise * k * k);
  let lastX = cornerX, lastTop = baseY + H - 1, y = baseY;
  for (let k = 1; k <= N; k++) {
    if (k > 1) {
      const dy = raw(k) - raw(k - 1);
      y += clamp(dy, 1, H - 1);
    }
    const x = cornerX + sign * k;
    const D = Math.max(1, SCULPT.hornD0 - Math.floor(((k - 1) * SCULPT.hornD0) / N));
    const zs = z1 - D + 1;                       // 各段同贴檐口前皮 → 平面收成一枚楔尖
    if (k === N) box(w, x, y, zs, 1, H, D, '金·主体');
    else {
      box(w, x, y, zs, 1, H, D, '瓦·亮垄');
      box(w, x, y, zs, 1, 1, D, '椽望暗层');
    }
    lastX = x; lastTop = y + H - 1;
  }
  box(w, lastX + sign, lastTop, z1, 1, 2, 1, '灵光');   // 冠尖与末段同行起，保 6-连通
  return w;
}

/** 一整重檐 = 连续坡屋面 + 两端翘角 */
export function eaveTier(w, p) {
  roofSlab(w, p);
  eaveTip(w, { ...p, dir: 'L' });
  eaveTip(w, { ...p, dir: 'R' });
  return w;
}

// ---------------------------------------------------------------- 墙 / 柱 / 门
/**
 * 带洞口的墙身：整块实砌，再挖掉洞口。开口 = [ox0,ox1]×[oy0,oy1]×z。
 * 分成"左 / 右 / 上"三块实砌拼出，天然零重叠、无缝可漏。
 */
export function wallWithOpening(w, p) {
  const { x0, x1, y0, y1, z0, z1, color } = p;
  const { ox0, ox1, oy0, oy1 } = p.opening;
  if (ox0 > x0) box(w, x0, y0, z0, ox0 - x0, y1 - y0 + 1, z1 - z0 + 1, color);
  if (ox1 < x1) box(w, ox1 + 1, y0, z0, x1 - ox1, y1 - y0 + 1, z1 - z0 + 1, color);
  if (oy1 < y1) box(w, ox0, oy1 + 1, z0, ox1 - ox0 + 1, y1 - oy1, z1 - z0 + 1, color);
  return w;
}

/** 檐廊柱列：左缘数组 + 自动镜像；柱头石础、柱身朱红（受光面靠 +x 一条） */
export function colonnade(w, p) {
  const { edges, width = 3, y0, y1, z0, z1 } = p;
  for (const e of edges) {
    for (const [a, b] of [sym(e, width)[0], sym(e, width)[1]]) {
      box(w, a, y0, z0, b - a + 1, y1 - y0 + 1, z1 - z0 + 1, '朱红·柱');
      box(w, b, y0, z0, 1, y1 - y0 + 1, z1 - z0 + 1, '朱红·受光');   // 一列受光棱，柱读作圆而非方
      box(w, a - 1, y0, z0, width + 2, 2, z1 - z0 + 1, '砂岩·亮');   // 柱础
    }
  }
  return w;
}

/** 匾留白：黑漆地 + 四周金框，不题一字（架空之物无名可题） */
export function blankPlaque(w, p) {
  const { x0, x1, y0, y1, z0, z1 } = p;
  const dz = z1 - z0 + 1;
  box(w, x0, y0, z0, x1 - x0 + 1, y1 - y0 + 1, dz, '黑漆·主体');
  box(w, x0, y0, z0, x1 - x0 + 1, 1, dz, '金·高光');
  box(w, x0, y1, z0, x1 - x0 + 1, 1, dz, '金·高光');
  box(w, x0, y0, z0, 1, y1 - y0 + 1, dz, '金·高光');
  box(w, x1, y0, z0, 1, y1 - y0 + 1, dz, '金·高光');
  return w;
}

/** 格栅：底 栗木格栅 + 稀疏棂条（栗木·受光），横竖各按 pitch */
export function lattice(w, p) {
  const { x0, y0, z0, w: lw, h: lh, dz = 1, pitchX = 3, pitchY = 4 } = p;
  box(w, x0, y0, z0, lw, lh, dz, '栗木格栅');
  for (let x = x0 + pitchX; x < x0 + lw; x += pitchX) box(w, x, y0, z0, 1, lh, dz, '栗木·受光');
  for (let y = y0 + pitchY; y < y0 + lh; y += pitchY) box(w, x0, y, z0, lw, 1, dz, '栗木·受光');
  return w;
}

// ---------------------------------------------------------------- 顶
/** 攒尖式顶：三级收分 → 金领 → 一枚灵光（顶收成一个尖，不是一摞白盒） */
export function crownTop(w) {
  const { CAP1, CAP2, COLLAR, SPIKE, KISS } = CROWN;
  const put = (b, c) => box(w, b.x[0], b.y[0], b.z[0],
    b.x[1] - b.x[0] + 1, b.y[1] - b.y[0] + 1, b.z[1] - b.z[0] + 1, c);
  put(CAP1, '瓦·亮垄');
  // 脊端吻饰：CAP1 两端顶上一枚上翻收头（左半区间 + 镜像），正脊线在端部微微翘起收住
  const kw = KISS.x[1] - KISS.x[0] + 1;
  for (const [a, b] of sym(KISS.x[0], kw)) {
    box(w, a, KISS.y[0], KISS.z[0], b - a + 1, KISS.y[1] - KISS.y[0] + 1,
        KISS.z[1] - KISS.z[0] + 1, '灰塑·亮');
  }
  put(CAP2, '瓦·暗垄');
  put(COLLAR, '金·主体');
  put(SPIKE, '灵光');
  return w;
}

/**
 * 石狮（抽象蹲踞）：按 spec.LION 部件清单逐块砌；mirror 时 x 区间逐体素 MIRROR。
 * 底坐 y=0 接地（6-连通）；砂岩两阶分体量，面门一枚暗点、背上一卷尾 —— 守门洞的一对。
 */
export function stoneLion(w, p = {}) {
  const mirror = !!p.mirror;
  for (const q of LION.parts) {
    const a = mirror ? MIRROR(q.x[1]) : q.x[0];
    const b = mirror ? MIRROR(q.x[0]) : q.x[1];
    box(w, a, q.y[0], q.z[0], b - a + 1, q.y[1] - q.y[0] + 1, q.z[1] - q.z[0] + 1, q.c);
  }
  return w;
}

// ---------------------------------------------------------------- 山水
/**
 * 山脊幕：单层纸幕（一格进深），顶缘由 ridge 控制点逐列插值 → 起伏是一条连续的脊线。
 * 颜色只按高度两分（山脚 low 深、其上 high 浅），顶部不另换色 → 永不"戴帽"（STYLE §三、§七）。
 */
export function mountainScreen(w, p) {
  const { z, foot, ridge, low, high } = p;
  const { x0, cols } = interpolateCols(ridge);
  for (let i = 0; i < cols.length; i++) {
    const yTop = cols[i][0];
    if (yTop < 1) continue;
    const yFoot = Math.max(1, Math.min(yTop, Math.round(yTop * foot)));
    box(w, x0 + i, 0, z, 1, yFoot, 1, low);
    if (yTop > yFoot) box(w, x0 + i, yFoot, z, 1, yTop - yFoot + 1, 1, high);
  }
  return w;
}

export default {
  sym, interpolateCols, roofSlab, eaveTip, eaveTier,
  wallWithOpening, colonnade, blankPlaque, lattice,
  crownTop, stoneLion, mountainScreen,
};
