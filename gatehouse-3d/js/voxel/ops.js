// 领域造型算子 —— 门楼（魔幻架空）的"体素词汇"，设定见 docs/DESIGN.md
// 翘角、花板、匾额、脊饰等造型算子集中于此。
// 本文件补齐契约里的全部领域算子，算法**忠实移植**自 docs/tools/gen-samples.ps1
// （VxRoof / VxCurvedEave / VxEaveTip / VxEaveBand / VxPanelSym / VxLion），并 3D 化（沿 Z 拉伸）。
//
// 约定：所有算子签名 (world, params) => world，纯追加、可链式。
// 镜像轴：x → (W-1) - x = 159 - x（区间 [a,b] 对称 ⟺ a+b===159）
import { ops } from './builder.js';
import { GRID, TILE } from '../spec.js';

const box = ops.box;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------- 镜像
/** 绕立面中轴整体镜像（x → 159-x），返回新世界；用于"画左半边再镜像出右半边" */
export function mirror(src) {
  const out = new src.constructor();
  for (const [x, y, z, idx] of src.entries()) out.set(GRID.W - 1 - x, y, z, idx);
  return out;
}

// ---------------------------------------------------------------- 屋面 / 瓦垄
/**
 * 屋面块：底色 瓦·暗垄 + 对齐全局网格的瓦垄亮条（周期 4，前 2 格亮）
 * 移植自 ps1 VxRoof。
 */
export function roofBox(w, x0, y0, z0, sx, sy, sz) {
  box(w, x0, y0, z0, sx, sy, sz, '瓦·暗垄');
  const start = Math.ceil(x0 / TILE.PERIOD) * TILE.PERIOD;
  for (let xx = start; xx < x0 + sx; xx += TILE.PERIOD) {
    const a = Math.max(xx, x0);
    const b = Math.min(xx + TILE.LIT, x0 + sx);
    if (b > a) box(w, a, y0, z0, b - a, sy, sz, '瓦·亮垄');
  }
  return w;
}

// ---------------------------------------------------------------- 檐（核心）
/**
 * 弧线檐带：中央平、两端按 u² 幂函数平滑升起；厚度沿 u 由 h 连续收分到 1。
 * 移植自 ps1 VxEaveBand / VxCurvedEave（两者算法相同，仅厚度参数不同）。
 * 对称处理：2*halfW 列，中心取 x=cx-0.5，使左右完全镜像（ps1 用 2*halfW+1 列，存在 1 格不对称）。
 * 上升段强制与前一列行区间相交，保证 4-连通（ps1 同款保护；其 prevTop=-999 的首列越界 bug 已修）。
 *
 * @param {object} p {cx, halfW, flat, yTop, h, rise, z0, z1}
 */
export function eaveBand(w, p) {
  const { cx, halfW, flat, yTop, h, rise, z0, z1 } = p;
  const dz = z1 - z0 + 1;
  const denom = halfW - 0.5 - flat;
  const n = 2 * halfW;

  // Pass 1：顶缘曲线（u² 幂函数）+ 名义厚度（沿 u 由 h 收分到 1）
  const tops = new Array(n);
  const nom = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = cx - halfW + i;
    const dx = Math.abs(x - cx + 0.5);
    const u = denom > 0 ? clamp((dx - flat) / denom, 0, 1) : 0;
    tops[i] = yTop + Math.round(rise * u * u);
    nom[i] = Math.max(1, Math.round(h * (1 - u)));
  }

  // Pass 2：双向 6-连通保护 —— 令每列厚度足以与左右邻列各共享至少一行。
  // ps1 只兜了「升段」(topY > prevTop)，降段（左半边）1 格厚的檐尾沿曲线走会退化成
  // 对角相接 → 整只左角 + 檐尾与主体断开（#11 断言实测悬空 840 格，样本即 (24,51,*)）。
  const hh = new Array(n);
  for (let i = 0; i < n; i++) {
    let v = nom[i];
    if (i > 0) v = Math.max(v, Math.abs(tops[i] - tops[i - 1]) + 1);
    if (i < n - 1) v = Math.max(v, Math.abs(tops[i + 1] - tops[i]) + 1);
    hh[i] = v;
  }

  for (let i = 0; i < n; i++) {
    const x = cx - halfW + i;
    const dx = Math.abs(x - cx + 0.5);
    const u = denom > 0 ? clamp((dx - flat) / denom, 0, 1) : 0;
    // 牛角铁律：角部深度随 u 向中轴收拢（平段全深，越出挑越窄，末端成尖）
    const D = Math.max(2, Math.round(dz * Math.pow(1 - u, 1.15)));
    const zs = Math.round((z0 + z1) / 2 - (D - 1) / 2);
    roofBox(w, x, tops[i] - hh[i] + 1, zs, 1, hh[i], D);
  }
  return w;
}

/**
 * 魔幻长牛角翘角：自檐带角端向外 10 段挑出，坡度先缓后陡（y=baseY+⌊0.12k²⌉），
 * 深度 3→2→1 渐收，末两格金身、顶端一格灵光冠尖——夸张上扬的架空魔幻感。
 * 每段高 3 格，与相邻段及檐带角部共享整行，保 6-连通接地（#11 守护）。
 * dir: 'L' 左角 / 'R' 右角。
 */
export function eaveTip(w, p) {
  const { cx, halfW, yTop, rise, dir, z0, z1 } = p;
  const sign = dir === 'L' ? -1 : 1;
  const cornerX = dir === 'L' ? cx - halfW : cx + halfW - 1;
  const baseY = yTop + rise;
  const cz = Math.round((z0 + z1) / 2);
  const col = (x, y, h, D, c) => {
    const zs = Math.round(cz - (D - 1) / 2);
    if (c) box(w, x, y, zs, 1, h, D, c); else roofBox(w, x, y, zs, 1, h, D);
  };
  const N = p.horn ?? 10;
  let lastX = cornerX, lastTopY = baseY;
  for (let k = 1; k <= N; k++) {
    const x = cornerX + sign * k;
    const y = baseY + Math.round(0.12 * k * k);
    const D = Math.max(1, 3 - Math.floor((k - 1) / 4));   // 3→2→1 收尖
    col(x, y, 3, D, k >= N - 1 ? '金·主体' : null);
    lastX = x; lastTopY = y + 2;
  }
  box(w, lastX + sign, lastTopY, cz, 1, 2, 1, '灵光');      // 灵光冠尖
  return w;
}

/** 一整重檐 = 檐带 + 两端翘角 */
export function eaveTier(w, p) {
  eaveBand(w, p);
  eaveTip(w, { ...p, dir: 'L' });
  eaveTip(w, { ...p, dir: 'R' });
  return w;
}

// ---------------------------------------------------------------- 带（斗栱 / 彩画）
/**
 * 横向装饰带：底色 base，沿 X 每 unitEvery 格放一个 unitW 宽的金点（unitColor）。
 * 用于斗栱带（黑漆底 + 2×2 金点）与石青彩画带。
 * @param {object} p {x0, x1, y0, y1, z0, z1, base, unitEvery, unitW, unitColor}
 */
export function band(w, p) {
  const { x0, x1, y0, y1, z0, z1, base, unitEvery = 0, unitW = 2, unitColor = '金·主体' } = p;
  let unitStart = p.unitStart;
  box(w, x0, y0, z0, x1 - x0 + 1, y1 - y0 + 1, z1 - z0 + 1, base);
  if (unitEvery > 0) {
    if (unitStart === undefined) unitStart = Math.ceil(x0 / unitEvery) * unitEvery;
    for (let x = unitStart; x <= x1 - unitW + 1; x += unitEvery) {
      box(w, x, y0, z0, unitW, y1 - y0 + 1, z1 - z0 + 1, unitColor);
    }
  }
  return w;
}

// ---------------------------------------------------------------- 团窠花板
/**
 * 中心对称团窠花板（D4 对称）：黑漆地 → 外金框 → 内金高光框 → 中心菱形 → 5 瓣花心 → 四角回纹钩。
 * 移植自 ps1 VxPanelSym。任意 w×h（正方/竖矩/横矩由调用方决定）。
 * @param {object} p {cx, cy, w:宽度, h:高度, z0, z1}
 */
export function panelSym(w, p) {
  const { cx, cy, z0, z1 } = p;
  const pw = p.w, ph = p.h;
  const dz = z1 - z0 + 1;
  const x0 = cx - Math.floor(pw / 2), x1 = x0 + pw - 1;
  const y0 = cy - Math.floor(ph / 2), y1 = y0 + ph - 1;
  const z = z0, sz = dz;

  box(w, x0, y0, z, pw, ph, sz, '黑漆·主体');                            // 黑漆地

  // 外金框（金·主体）
  box(w, x0, y0, z, pw, 1, sz, '金·主体');
  box(w, x0, y1, z, pw, 1, sz, '金·主体');
  if (ph > 2) {
    box(w, x0, y0 + 1, z, 1, ph - 2, sz, '金·主体');
    box(w, x1, y0 + 1, z, 1, ph - 2, sz, '金·主体');
  }

  // 内金框（金·高光，内缩 2）
  const ix0 = x0 + 2, ix1 = x1 - 2, iy0 = y0 + 2, iy1 = y1 - 2;
  if (ix1 >= ix0 && iy1 >= iy0) {
    box(w, ix0, iy0, z, ix1 - ix0 + 1, 1, sz, '金·高光');
    box(w, ix0, iy1, z, ix1 - ix0 + 1, 1, sz, '金·高光');
    if (iy1 - iy0 - 1 > 0) {
      box(w, ix0, iy0 + 1, z, 1, iy1 - iy0 - 1, sz, '金·高光');
      box(w, ix1, iy0 + 1, z, 1, iy1 - iy0 - 1, sz, '金·高光');
    }
  }

  // 中心菱形（金·主体，内缩 3；逐行按 1-ry 收分）
  const ax0 = x0 + 3, ax1 = x1 - 3, ay0 = y0 + 3, ay1 = y1 - 3;
  const dhw = Math.floor((ax1 - ax0) / 2), dhh = Math.floor((ay1 - ay0) / 2);
  if (dhw >= 0 && dhh >= 0) {
    for (let y = ay0; y <= ay1; y++) {
      const ry = dhh > 0 ? Math.abs((y - cy) / dhh) : 0;
      if (ry > 1) continue;
      const rowHalf = Math.floor(dhw * (1 - ry));
      if (rowHalf >= 0) box(w, cx - rowHalf, y, z, 2 * rowHalf + 1, 1, sz, '金·主体');
    }
  }

  // 5 瓣花心（金·高光，十字 5 格）
  box(w, cx, cy, z, 1, 1, sz, '金·高光');
  box(w, cx - 1, cy, z, 1, 1, sz, '金·高光');
  box(w, cx + 1, cy, z, 1, 1, sz, '金·高光');
  box(w, cx, cy - 1, z, 1, 1, sz, '金·高光');
  box(w, cx, cy + 1, z, 1, 1, sz, '金·高光');

  // 四角回纹钩（金·主体，hc=2，点对称 L 形）
  const hc = 2;
  box(w, x0 + 1, y0 + 1, z, hc, 1, sz, '金·主体');
  box(w, x0 + 1, y0 + 1, z, 1, hc, sz, '金·主体');
  box(w, x1 - hc + 1, y0 + 1, z, hc, 1, sz, '金·主体');
  box(w, x1, y0 + 1, z, 1, hc, sz, '金·主体');
  box(w, x0 + 1, y1 - hc + 1, z, 1, hc, sz, '金·主体');
  box(w, x0 + 1, y1, z, hc, 1, sz, '金·主体');
  box(w, x1, y1 - hc + 1, z, 1, hc, sz, '金·主体');
  box(w, x1 - hc + 1, y1, z, hc, 1, sz, '金·主体');
  return w;
}

// ---------------------------------------------------------------- 格栅 / 匾额
/**
 * 木格栅（格栅门 / 窗）：底 栗木格栅，棂条 栗木·受光，pitchX/pitchY 为棂条间距。
 */
export function lattice(w, p) {
  const { x0, y0, z0, w: lw, h: lh, dz = 1, pitchX = 3, pitchY = 4 } = p;
  box(w, x0, y0, z0, lw, lh, dz, '栗木格栅');
  const startX = Math.ceil(x0 / pitchX) * pitchX;
  for (let x = startX; x < x0 + lw; x += pitchX) box(w, x, y0, z0, 1, lh, dz, '栗木·受光');
  const startY = Math.ceil(y0 / pitchY) * pitchY;
  for (let y = startY; y < y0 + lh; y += pitchY) box(w, x0, y, z0, lw, 1, dz, '栗木·受光');
  return w;
}

/**
 * 黑漆匾额：黑漆底 + 上下金线 + chars 个金字节奏块（不做真字，用短划模拟笔画节奏）。
 */
export function plaque(w, p) {
  const { x0, y0, z0, w: pw, h: ph, dz = 1, chars = 9, charW = 3, charH = null } = p;
  box(w, x0, y0, z0, pw, ph, dz, '黑漆·主体');
  box(w, x0, y0, z0, pw, 1, dz, '金·高光');
  box(w, x0, y0 + ph - 1, z0, pw, 1, dz, '金·高光');
  const ch = charH ?? Math.max(1, ph - 4);
  const cy = y0 + 2;                                  // ps1：匾 y0 起，字位内缩 2（一层 y30 / 二层 y54）
  const usable = pw - 4;
  const pitch = chars > 1 ? Math.max(charW, Math.floor(usable / chars)) : charW;
  for (let i = 0; i < chars; i++) {
    const cxx = x0 + 2 + i * pitch;
    if (cxx + charW <= x0 + pw - 1) box(w, cxx, cy, z0, charW, ch, dz, '金·主体');
  }
  return w;
}

// ---------------------------------------------------------------- 石狮
/**
 * 石狮（六段法）：须弥座 → 座上枋 → 蹲身 → 大头高位凸出 → 卷毛凸点 → 尾。
 * 头置 +x 端——左狮镜像后，双狮头相向、朝模型中心（T8 DoD）。
 * 单狮 10 宽 × 12 高 × dz 深（≤14×12×16 预算，宽高深皆满足两种解读）。
 * @param {object} p {xLeft, y0, z0, dz}  左狮左缘 x=xLeft；右狮由 mirror 得到
 */
export function lion(w, p) {
  const { xLeft, y0 = 4, z0, dz = 6 } = p;
  box(w, xLeft, y0, z0, 10, 3, dz, '砂岩·暗');                      // 须弥座
  box(w, xLeft + 1, y0 + 3, z0, 8, 1, dz, '砂岩·亮');                // 座上枋
  box(w, xLeft + 2, y0 + 4, z0, 6, 4, dz, '砂岩·亮');                // 蹲身（宽体低伏）
  box(w, xLeft + 2, y0 + 4, z0, 2, 2, dz, '砂岩·暗');                // 前腿暗面
  box(w, xLeft + 6, y0 + 8, z0, 4, 4, dz, '砂岩·亮');                // 大头：高位、前突朝中轴
  box(w, xLeft + 9, y0 + 9, z0, 1, 2, dz, '砂岩·暗');                // 口眼内陷
  box(w, xLeft + 6, y0 + 11, z0, 1, 1, dz, '砂岩·暗');               // 卷毛镶嵌（头顶行）
  box(w, xLeft + 8, y0 + 11, z0, 1, 1, dz, '砂岩·暗');               // 卷毛镶嵌（头顶行）
  box(w, xLeft + 1, y0 + 5, z0, 1, 2, dz, '砂岩·暗');                // 尾（搭接蹲身）
  return w;
}

// ---------------------------------------------------------------- 脊饰
/**
 * 灰塑正脊 + 鸱吻 + 立体宝顶（三段阶梯收分）。数据取自 spec.CROWN。
 */
export function ridgeSet(w, CROWN, z0, z1) {
  const dz = z1 - z0 + 1;
  box(w, CROWN.POST.x[0], CROWN.POST.y[0], z0,
      CROWN.POST.x[1] - CROWN.POST.x[0] + 1, CROWN.POST.y[1] - CROWN.POST.y[0] + 1, dz, '黑漆·主体');
  box(w, CROWN.RIDGE.x[0], CROWN.RIDGE.y[0], z0,
      CROWN.RIDGE.x[1] - CROWN.RIDGE.x[0] + 1, CROWN.RIDGE.y[1] - CROWN.RIDGE.y[0] + 1, dz, '灰塑·亮');
  for (const o of CROWN.OWL) box(w, o.x[0], o.y[0], z0, o.x[1] - o.x[0] + 1, o.y[1] - o.y[0] + 1, dz, '灰塑·亮');
  box(w, CROWN.FINIAL_BASE.x[0], CROWN.FINIAL_BASE.y[0], z0,
      CROWN.FINIAL_BASE.x[1] - CROWN.FINIAL_BASE.x[0] + 1,
      CROWN.FINIAL_BASE.y[1] - CROWN.FINIAL_BASE.y[0] + 1, dz, '黑漆·主体');
  for (const gx of CROWN.FINIAL_BASE_GILT_X) box(w, gx, CROWN.FINIAL_BASE.y[0], z0, 2, 1, dz, '金·高光');
  for (const f of CROWN.FINIAL) {
    const x0 = 80 - Math.floor(f.w / 2);
    box(w, x0, f.y, z0, f.w, 1, dz, '灰塑·亮');
  }
  return w;
}

// ---------------------------------------------------------------- 阶梯
/**
 * 中央踏步：count 级实填楔形体，自台基前缘向外向下渐降（3D 等宽，非立面图的 2D 收窄）。
 */
export function stairs(w, p) {
  const { cx, width, count, zFrom, yTop } = p;
  const x0 = cx - Math.floor(width / 2);
  for (let i = 0; i < count; i++) {
    // 第 i 级（自顶向下）：y = yTop-1-i，深度 = i+1（自台基前缘向外）
    box(w, x0, yTop - 1 - i, zFrom, width, 1, i + 1, '砂岩·亮');
  }
  return w;
}

export default {
  mirror, roofBox, eaveBand, eaveTip, eaveTier, band,
  panelSym, lattice, plaque, lion, ridgeSet, stairs,
};
