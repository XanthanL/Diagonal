// 自贡井盐 · 天车（木构井架）3D 解构（中英双语）
// ------------------------------------------------------------
// 结构定稿（2026-09-12 重建）：
//   四棱锥台木塔，四方收分。四根角柱皆为「束柱」——多根杉木并排靠拢、接头错缝
//   搭接，外缠竹篾密箍、关键节点套手锻铁箍，全程无钉。每一级以四面水平箍梁围成
//   方框，层间四面各施一根斜撑并逐层换向。塔顶立天夹板承天辊，井口正压塔心，
//   提卤绳自天辊垂直落入井中；八根风篾自天箍头伞状散出、连地桩。
//   辅机：大车（轮缘绕绳的立式绞盘）、地辊（塔内导辊）、碓架（踩碓顿钻）、
//   汲卤筒（细长竹筒）、盐工寮棚。井台不再铺大石板，只留井口踩实的夯土。
//   整座模型只 buildStation 一次，置于原点；PROCESS 的 8 项仅作构件导览（相机聚焦
//   + 双语详情），不再各自实体化。
// ============================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PROCESS, LEGEND, I18N } from './data.js';

// 自检钩子（仅 ?selftest 时启用）：捕获运行时错误，便于无头浏览器断言验收
const SELFTEST = (typeof location !== 'undefined') && new URLSearchParams(location.search).has('selftest');
window.__errs = [];
function __recordErr(m) {
  window.__errs.push(m);
  const d = document.getElementById('diag');
  if (d) d.textContent = 'ERR:' + m;
}
window.addEventListener('error', (e) => __recordErr(String(e.message || (e.error && e.error.message) || e)));
window.addEventListener('unhandledrejection', (e) => __recordErr('promise:' + (e.reason && e.reason.message ? e.reason.message : e.reason)));

// ---------- 常量与状态 ----------
const BG = 0xFAFAF8;
const GROUND_Y = 0;
const state = { lang: 'zh' };
// 触屏/粗指针设备判定。用于降 pixelRatio 与阴影贴图 —— 这两个是移动端最贵的两项，
// 而它们对「观感」的边际收益在手机屏幕上远小于对帧率的伤害。
// 只降这两个，不动 antialias 与任何材质：这台机器上「质感」优先，但手机得先跑得动。
const IS_MOBILE = (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches)
  || (typeof navigator !== 'undefined' && (navigator.maxTouchPoints || 0) > 1);

// ---------- 确定性随机（全场景共用一个）----------
// 整座场景的「手工感」（每根木头的色差、每束垂草的抖动、每张贴图的纤维）全部来自 RND()。
// 为什么不用 Math.random()（2026-09-14 定案，实测同样代码四次加载四个数）：
//   ① 每次加载构图都不同 —— 用户看到的，和你截图里批准的那一版，可能不是同一版；
//   ② poolMat 随机抽材质变体 -> emit/flushBin 的合并分组随之变化：PART.shed 的子网格数
//      在 31/33/34 之间来回抖（三角面数恒为 54772），于是 __diag.meshes 根本不能当
//      回归断言 —— 只有 triangles 是稳的；
//   ③ 排查「改了 A 结果 B 却变了」时，永远无法排除「只是重新掷了骰子」这一解释。
// 现在固定种子：同样的代码 = 同样的画面。要看别的变体就加 ?seed=123（?seed=rand 每载随机）。
// 注意：本文件的 RND() 全部在**构建期**（纹理生成 + 构件摆放），动画循环里一处随机都没有，
// 所以种子化不会让动画变得重复。将来若要给 animate() 加随机，那里请直接用 Math.random()。
// 远山山脊另有自己的种子（ridgeBand 的 cfg.seed），那是「山各有各的相貌」，与此互不干扰。
function mulberry32(a) {
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = (() => {
  try {
    const m = new URLSearchParams(location.search).get('seed');
    if (m === 'rand') return (Date.now() % 2147483647) | 0;
    if (m) { const nn = parseInt(m, 10); if (Number.isFinite(nn)) return nn; }
  } catch (e) { /* 无 location（被当模块静态分析时）：用默认种子 */ }
  return 20260914;
})();
const RND = mulberry32(SEED);

// 自贡天车古朴木构配色（暖纸底上的陈年杉木 / 竹篾 / 熟铁）
const WOOD = 0x77634C;         // 陈年杉木主色
const WOOD_DARK = 0x4A3B2B;    // 陈年杉木暗部（箍梁·天夹板）
const WOOD_LIGHT = 0x8F7F64;   // 陈年杉木亮部（受光面）
const BAMBOO = 0xC2C49C;       // 竹篾（箍·绳）
const BAMBOO_PALE = 0xA6A283;  // 新篾（竹笆编织面）
const ROPE = 0xC4C29E;         // 竹篾绞绳（自己搓的篾绳比用了多年的篾箍新、略亮）
const CORE_INK = 0x352A1E;     // 束柱芯柱：填在木束中心的暗木，缝里透出的就是它（假 AO）
const IRON = 0x77706A;         // 做旧铁箍（metalness 降下来之后要补一点明度，否则读成黑）
const THATCH = 0x8C7A54;       // 茅草屋面

// 天车形制（全部几何都由这几个数推出来，改一处即整体收分）
const DER = {
  H: 13,            // 塔身净高（角柱顶）
  a0: 2.4,          // 底部半宽
  a1: 0.8,          // 顶部半宽
  topY: 13.9,       // 天辊轴心高
  rollerR: 0.55,    // 天辊半径
  rollerW: 0.40,    // 天辊轮宽（沿 z）
};
const HALF = (y) => DER.a0 + (DER.a1 - DER.a0) * (y / DER.H);
// 箍梁层级（每级围一圈方框）
const RING_Y = [1.7, 3.4, 5.1, 6.8, 8.5, 10.2, 11.9];
// 角柱分段（分段线落在箍梁上，束柱换径处被横梁遮住）
// bindStep 与箍的体量要一起看：箍占柱身的比例 = 箍长 / bindStep。
// 初版 0.30/0.52 ≈ 58%，整根柱读成理发店转灯；现在 0.17/0.62 ≈ 27%。
const STAGE = [
  { y0: 0, y1: 5.1, count: 4, rad: 0.100, spread: 0.135, bindStep: 0.62 },
  { y0: 5.1, y1: 10.2, count: 3, rad: 0.082, spread: 0.105, bindStep: 0.68 },
  { y0: 10.2, y1: DER.H, count: 2, rad: 0.065, spread: 0.075, bindStep: 0.76 },
];
// 风篾：8 根，方位 22.5° + 45°k（与四面、四角都错开，避免正对井场设备）
const STAY_AZ = Array.from({ length: 8 }, (_, k) => Math.PI / 8 + (k * Math.PI) / 4);
const STAY_Y = 12.2;     // 挂点高（天箍头处）
const STAY_R = 9.5;      // 落地半径

// 井场设备布置（同时作为风篾避让与碰撞回归的依据）
const WELL = { x: 0, z: 0 };
const CART = { x: -5.4, z: 0, R: 1.7, axleY: 1.9 };
const ROLLER = { x: -1.6, z: 0, R: 0.30, axleY: 0.95 };   // 绳离辊高 ≈1.25
// 碓架：2026-09-14 迁出塔基旁。旧位置净距只有 2.6 m，而碓梢总长 7.4 m ——
// 斜穿天车束柱是必然的，不是调参能救的。现在它落在 19.5 m 外的**另一口井**上独立成站：
// 顿钻凿井与天车提卤本就是井场的两道工序、两口井，分开反而更贴《自流井图说》。
// 朝向取默认机位（PROCESS[0].cam）视线的**法线方向** —— 这样总览里看到的是碓架正侧面，
// 碓梢的摆动平面正对镜头，杠杆、碓杆、踏板的关系一眼可读；顺视线摆的话会被压缩成一根竖线。
// 方位 270°（正 -z，塔的远侧）是**算出来的**，不是挑的：把 0~350° 每 10° 扫一遍，
// 拿「是否落在画面内 × 与塔的角距（不被塔挡）× 朝向镜头的面是否受光」三个条件筛：
//   142°（原选）→ 受光度 −0.58，背光，且 screen −0.67 贴在画面左缘、被侧栏压掉一半；
//   270°        → screen +0.32（画面内、塔右侧 14°，不被遮挡），受光度 +0.15 ——
//                  与天车自身的 +0.09 相当，所以远站和主塔是同一套光照关系，不会一个亮一个死黑。
// 主光在方位 147°，默认机位在 52°；远处的东西从默认机位看必然带点逆光，
// 关键是别比主体更暗 —— 这一条筛掉了所有 -x 侧的候选。
const CAM_DEFAULT = PROCESS[0].cam;      // 机位只在 data.js 维护一处
const DUIJIA = (() => {
  const AZ = (270 * Math.PI) / 180, R = 19.5;
  const x = Math.cos(AZ) * R, z = Math.sin(AZ) * R;
  const dx = (x - CAM_DEFAULT[0]), dz = (z - CAM_DEFAULT[2]);
  const L = Math.hypot(dx, dz);
  // 局部 +X 经 rotation.y=θ 变到世界 (cosθ, -sinθ)；令它等于视线的法线 (-dz, dx)/L
  return { x, z, rotY: Math.atan2(-dx / L, -dz / L) };
})();
// 铁靴底在「碓梢水平」时（即全行程最低点）的标高。自检读它 —— 必须 > 0，且留在碓窝口里。
let DUIJIA_SHOE_BOTTOM = 0;
// 动画钩子要用到的三个尺寸，与 buildDuijia 里的同源（那里算完就写回这里，
// 免得动画那头再抄一份魔数 —— 旧版就是靠一份抄走的 1.535 把铁靴按进地里的）
let DUIJIA_LEVER_Y = 0, DUIJIA_PARM = 0, DUIJIA_LEVER_T = 0, DUIJIA_HANG = 0;
// 碓杆改成「吊索悬挂 + 导环约束」之后，动画与自检还要用的量（buildDuijia 里同源写回）
let DUIJIA_RING_Y = 0, DUIJIA_HARM = 0, DUIJIA_EYE_DY = 0;
// 自检要按同一套尺寸判「铁靴不越窝口」，所以尺寸也回写一份出来（buildDuijia 填）
const DUIJIA_SIZE = {};
const _djA = new THREE.Vector3(), _djB = new THREE.Vector3();
// 寮棚落在风篾空档方位（315°）——与 -x 侧的大车、+x 侧的碓架都不重叠，
// 且避开默认总览机位（+x+z）的正面视线，不挡塔身
const SHED = { x: 5.23, z: -5.23 };
// 汲卤筒（细长竹筒）：len 筒身长、rTop/rBot 上下半径、valve 筒底阀头长
// minTip/maxTip 为「筒底标高」的升降行程（入井时阀头没入井唇石箍）
const BAILER = { len: 3.0, rTop: 0.15, rBot: 0.14, valve: 0.30, minTip: 0.72, maxTip: 2.2 };

let scene, camera, renderer, controls, clock;
// 聚焦分区：每个导航项对应一组 part，便于「聚焦件保持原色 / 其余压暗」
const PART_ORDER = ['cols', 'top', 'stays', 'well', 'bailer', 'cart', 'ground', 'duijia', 'shed', 'yard'];
const FOCUS_MAP = [
  null,                 // 0 总览
  ['cols'],             // 1 束柱
  ['top', 'stays'],     // 2 天辊 · 风篾
  ['cart'],             // 3 大车
  ['ground'],           // 4 地辊
  ['duijia'],           // 5 碓架
  ['bailer'],           // 6 汲卤筒
  ['shed'],             // 7 盐工寮棚 · 竹笆
  ['yard'],             // 8 灶房 · 盐仓（2026-09-15 新增，含柴棚与竹笕）
];
const PART = {};
const DIM = 0.45;        // 非聚焦构件压暗系数
let tween = null;
let playing = true;
let autoTour = false;
let tourTimer = 0;
let tourIndex = 0;
let currentActive = -1;
let navEls = [];
const TEX = {};

// ---------- 语言辅助 ----------
function lf(step, key) { return state.lang === 'en' ? step[key + 'En'] : step[key]; }

// ============================================================
// 程序化贴图（canvas 生成，离线可用）
// ============================================================
function cv(size) { const c = document.createElement('canvas'); c.width = c.height = size; return c; }

// ---------- 手绘 SVG 矢量层 ----------
// canvas 与 SVG 分工：canvas 管「统计性」内容（噪点、斑驳、大量软边渐变），
// SVG 管「结构性」内容（砾石轮廓、干裂折线、岩层层理）—— 矢量边缘是解析求交，
// 放大后不会像 canvas 描边那样糊成一团，这是「贴图够不够精细」的分水岭。
//
// 时序：canvas 版先同步画好（首帧就能用），SVG 以 data URL 交给 Image，
// 加载完重绘同一张 canvas 并给所有绑它的 texture 置 needsUpdate —— 纹理原地升级，
// init() 全程保持同步，不必改成 async。
//
// 亮度守恒：升级不能改变平均亮度，否则地面与三层山的明度阶梯
// （天 250 > 远山 228 > 中山 215 > 近山 205）会整体漂移。
// 不透明贴图走均值归一化；山体层理是「有意压暗」的，改成把实测均值回填到
// material.color（见 buildBackdrop）。透明贴图（痕迹层）不做归一化。
//
// 本地 RNG：SVG 里的一切随机都用 mulberry32(独立种子)，绝不碰全局 RND()。
// 全局流是种子化场景的底座 —— 贴图多消耗一次，整座天车的随机抖动就整体漂移，
// triangles / meshes / partChildren 这些基准会全部作废。
// ============================================================
const SVG_REG = [];
const SEED_FLOOR_SVG = 7317;
const SEED_YARD_SVG = 4423;
const SEED_RIDGE_SVG = 9151;

const s2lin = (v) => { const t = v / 255; return t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4); };

// 每 4 个像素取一个样本：1024² 也只有 6.5 万样本，足够稳且不卡
function meanSRGB(x, s) {
  const d = x.getImageData(0, 0, s, s).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  return [r / n, g / n, b / n];
}
// 线性域均值：three 的贴图采样后与 material.color 在**线性空间**相乘，
// 所以「贴图把亮度压了几成」要在线性域量，sRGB 域量出来的会差一档。
function meanLinear(x, s) {
  const d = x.getImageData(0, 0, s, s).data;
  let sum = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) { sum += s2lin(d[i]) + s2lin(d[i + 1]) + s2lin(d[i + 2]); n += 3; }
  return sum / n;
}
// 把整幅按同一个系数缩回目标均值。用单一系数而不是逐通道 —— 逐通道会改色相。
function meanMatch(x, s, target) {
  const cur = meanSRGB(x, s);
  const tm = (target[0] + target[1] + target[2]) / 3;
  const cm = (cur[0] + cur[1] + cur[2]) / 3;
  const k = cm > 0.5 ? tm / cm : 1;
  if (!isFinite(k) || Math.abs(k - 1) < 0.005) return 1;
  const img = x.getImageData(0, 0, s, s), d = img.data;
  for (let i = 0; i < d.length; i += 4) { d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; }
  x.putImageData(img, 0, 0);
  return k;
}

// 局部对比度（亮度标准差）。用来回答「SVG 到底给这张贴图加了多少细节」——
// 均值只能证明亮度没漂，证明不了内容变丰富了，sd 才能。
function sdSRGB(x, s) {
  const d = x.getImageData(0, 0, s, s).data;
  let sum = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) { sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++; }
  const m = sum / n;
  let sq = 0;
  for (let i = 0; i < d.length; i += 16) {
    const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    sq += (l - m) * (l - m);
  }
  return Math.sqrt(sq / n);
}

function newSvgCanvas(s, name) {
  const c = cv(s);
  const reg = { canvas: c, ctx: c.getContext('2d'), size: s, name, target: null, onReady: null, texes: [] };
  SVG_REG.push(reg);
  return reg;
}
// 贴图与它的 canvas 关联起来：SVG 光栅化完成后要靠这份名单逐个置 needsUpdate。
// clone() 出来的贴图共享同一个 image（canvas），所以 buildGround 里的两个 clone
// 必须各自登记一次，否则升级后它们还停在 canvas 旧内容上。
function regTex(tex) {
  for (let i = 0; i < SVG_REG.length; i++) {
    if (SVG_REG[i].canvas === tex.image) { SVG_REG[i].texes.push(tex); break; }
  }
  return tex;
}
function applySvgLayer(svg, reg) {
  const s = reg.size;
  const img = new Image();
  img.onload = () => {
    // 升级前的局部对比度：探针拿它和新值比，才能说清「SVG 加了多少细节」。
    // 均值守恒只能证明亮度没漂，证明不了内容变丰富 —— 少这个数就得靠看图，而本机看不了图。
    if (reg.sdBefore === undefined) reg.sdBefore = sdSRGB(reg.ctx, s);
    reg.ctx.drawImage(img, 0, 0, s, s);
    if (reg.target) meanMatch(reg.ctx, s, reg.target);
    // onReady 用 try 包住：它是「顺便做的补偿」，绝不能因为它抛错就吞掉后面两行 ——
    // 实测踩过：onReady 里把 canvas 当 ctx 传，异常把 needsUpdate 一起带走了，
    // 结果贴图永远停在空白画布上，而 svgDone 也没置上，看起来像「SVG 没加载」。
    try { if (reg.onReady) reg.onReady(reg); }
    catch (e) { if (typeof __recordErr === 'function') __recordErr('svgready:' + reg.name + ':' + (e && e.message)); }
    reg.texes.forEach((t) => { t.needsUpdate = true; });
    reg.svgDone = true;          // 探针靠这个确认「SVG 真的贴上去了」，不看图
  };
  // 光栅化失败就静默保留 canvas 版：贴图是装饰，不该把整站拖挂
  img.onerror = () => { if (typeof __recordErr === 'function') __recordErr('svgtex:' + reg.name); };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// 可平铺的「形状清单」。贴图要 RepeatWrapping，落在画布外的形状必须在最外圈
// 补画一份错位副本，否则重复时接缝处会缺半颗石子、断半条裂纹。
// 只有真正越界的形状才补副本（bbox 判定），所以 SVG 体积基本不涨。
function svgSheet(s) {
  const out = [];
  return {
    add(str, x0, y0, x1, y1) {
      if (x0 >= 0 && x1 <= s && y0 >= 0 && y1 <= s) { out.push(str); return; }
      const dxs = [0], dys = [0];
      if (x0 < 0) dxs.push(s); else if (x1 > s) dxs.push(-s);
      if (y0 < 0) dys.push(s); else if (y1 > s) dys.push(-s);
      for (let i = 0; i < dxs.length; i++) for (let j = 0; j < dys.length; j++) {
        const dx = dxs[i], dy = dys[j];
        if (!dx && !dy) out.push(str);
        else out.push('<g transform="translate(' + dx + ',' + dy + ')">' + str + '</g>');
      }
    },
    svg(head) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '">'
        + head + out.join('') + '</svg>';
    },
  };
}

// feTurbulence 是「无限细节」的噪声发生器，正好补 canvas 那几千个手撒点在放大后
// 读成空白的地方。stitchTiles="stitch" 让它自己就是无缝的。
// 用法：RGB 压成一个常数灰（只做压暗或提亮），alpha 由噪声决定 —— 这样一层只有
// 「深浅」，不会把彩色噪声直接泼到贴图上（那会变成电视雪花）。
function grainFilter(id, sz, freq, seed, gray, amp) {
  return '<filter id="' + id + '" x="0" y="0" width="' + sz + '" height="' + sz + '" filterUnits="userSpaceOnUse">'
    + '<feTurbulence type="fractalNoise" baseFrequency="' + freq.toFixed(5) + '" numOctaves="4" stitchTiles="stitch" seed="' + seed + '" result="n"/>'
    + '<feColorMatrix in="n" type="matrix" values="0 0 0 0 ' + gray
    + ' 0 0 0 0 ' + gray + ' 0 0 0 0 ' + gray
    + ' ' + amp + ' ' + amp + ' ' + amp + ' 0 ' + (-amp * 1.45).toFixed(3) + '"/>'
    + '</filter>';
}

// 地面细砂 / 砾石。基准 512 设计，K = s / 512 等比放大。
// 砾石半径按「米」给（每格 10 m），换个贴图边长不用重标。
function floorSvg(s) {
  const K = s / 512;
  const PPM = s / 10;                       // 每米像素
  const rnd = mulberry32(SEED_FLOOR_SVG);
  const sheet = svgSheet(s);
  // ① 细砂：一暗一亮两层（不同种子），分开画才有「砂」的颗粒感；
  //    单画一层只是把底子整体压暗或提亮一次
  const head = grainFilter('fgd', s, 0.62 / K, 23, 0.44, 0.34)
    + grainFilter('fgl', s, 0.78 / K, 71, 1.00, 0.30)
    + '<rect width="' + s + '" height="' + s + '" filter="url(#fgd)"/>'
    + '<rect width="' + s + '" height="' + s + '" filter="url(#fgl)"/>';
  // ② 砾石：12~46 mm 的碎石子。单画一个多边形只会读成一个色块 ——
  //    所以每颗从 5 级明度里随机取一档 + 一圈略深的描边，靠「颗与颗之间的
  //    明度差」堆出碎石地面的体积感
  const GRAVEL = ['#F4F1EA', '#EDE9E1', '#E3DED4', '#D8D2C6', '#CCC5B7'];
  const EDGE = ['#B8AF9F', '#ADA492', '#C3BBAB'];
  const nG = IS_MOBILE ? 420 : 900;
  for (let i = 0; i < nG; i++) {
    const cx = rnd() * s, cy = rnd() * s;
    const r = (0.012 + rnd() * 0.034) * PPM;
    const n = 5 + ((rnd() * 3) | 0);
    const a0 = rnd() * 6.2832;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const pts = [];
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * 6.2832 + (rnd() - 0.5) * 0.42;
      const rr = r * (0.62 + rnd() * 0.66);
      const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      pts.push(px.toFixed(1) + ',' + py.toFixed(1));
      if (px < x0) x0 = px; if (px > x1) x1 = px;
      if (py < y0) y0 = py; if (py > y1) y1 = py;
    }
    sheet.add('<polygon points="' + pts.join(' ') + '" fill="' + GRAVEL[(rnd() * 5) | 0]
      + '" fill-opacity="' + (0.34 + rnd() * 0.46).toFixed(2)
      + '" stroke="' + EDGE[(rnd() * 3) | 0] + '" stroke-opacity="0.26" stroke-width="' + (0.55 * K).toFixed(2) + '"/>',
      x0 - 1, y0 - 1, x1 + 1, y1 + 1);
  }
  // ③ 石英亮点：夯土里翻出来的石英砂，是近场唯一该「发亮」的东西。
  //    只给亮不给暗 —— 暗点由 ① 的暗噪声层负责
  const nQ = IS_MOBILE ? 260 : 560;
  for (let i = 0; i < nQ; i++) {
    const cx = rnd() * s, cy = rnd() * s, r = (0.4 + rnd() * 1.15) * K;
    sheet.add('<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(2)
      + '" fill="#FFFDF7" fill-opacity="' + (0.28 + rnd() * 0.46).toFixed(2) + '"/>',
      cx - r, cy - r, cx + r, cy + r);
  }
  // ④ 微裂纹：夯土收缩的细缝，1~4 段折线。比 canvas 的直线段多一个好处 ——
  //    矢量折角在放大后依然锐利
  const nC = IS_MOBILE ? 44 : 86;
  for (let i = 0; i < nC; i++) {
    let px = rnd() * s, py = rnd() * s;
    const segs = 2 + ((rnd() * 3) | 0);
    const stepM = 0.10 + rnd() * 0.32;
    let d = 'M' + px.toFixed(1) + ' ' + py.toFixed(1);
    let x0 = px, y0 = py, x1 = px, y1 = py;
    let a = rnd() * 6.2832;
    for (let k = 0; k < segs; k++) {
      a += (rnd() - 0.5) * 2.2;
      px += Math.cos(a) * stepM * PPM; py += Math.sin(a) * stepM * PPM;
      d += ' L' + px.toFixed(1) + ' ' + py.toFixed(1);
      if (px < x0) x0 = px; if (px > x1) x1 = px;
      if (py < y0) y0 = py; if (py > y1) y1 = py;
    }
    sheet.add('<path d="' + d + '" fill="none" stroke="#6E6350" stroke-opacity="'
      + (0.09 + rnd() * 0.13).toFixed(2) + '" stroke-width="' + (0.5 * K).toFixed(2) + '" stroke-linecap="round"/>',
      x0 - 1, y0 - 1, x1 + 1, y1 + 1);
  }
  return sheet.svg(head);
}

// 痕迹层的矢量补充：龟裂网 / 拖痕 / 盐壳。
// 这三样都是「结构性」的 —— 裂纹的锐利折角、盐壳的直边，canvas 描边做不到。
// 画布 x ↔ 世界 x、画布 y ↔ 世界 z，井口恒在画布正中。
function yardSvg(s) {
  const K = s / 140;                        // 每米像素（近场 140 m 铺满一张）
  const mid = s / 2;
  const rnd = mulberry32(SEED_YARD_SVG);
  const sheet = svgSheet(s);

  // ① 龟裂网：泥地失水后的干裂是「多边形网格」。原来 canvas 里那 80 条是
  //    放射状单线，放大看是一把撒出去的头发。这里改成撒点 + 连最近邻 ——
  //    得到不规则网格，网格才是干裂的语法。
  const NODE = 84;
  const pts = [];
  for (let i = 0; i < NODE; i++) {
    const a = rnd() * 6.2832;
    const r = (1.6 + Math.pow(rnd(), 0.72) * 27) * K;
    pts.push([mid + Math.cos(a) * r, mid + Math.sin(a) * r]);
  }
  const lim = 9.0 * K;                      // 连边距离上限（超过就不连，留出空地）
  const seen = {};
  for (let i = 0; i < NODE; i++) {
    const A = pts[i];
    const near = [];
    for (let j = 0; j < NODE; j++) {
      if (j === i) continue;
      const dx = pts[j][0] - A[0], dy = pts[j][1] - A[1];
      const d = Math.hypot(dx, dy);
      if (d < lim) near.push([d, j]);
    }
    near.sort((p, q) => p[0] - q[0]);
    for (let m = 0; m < Math.min(3, near.length); m++) {
      const d = near[m][0], j = near[m][1];
      const key = i < j ? i + '_' + j : j + '_' + i;
      if (seen[key]) continue;
      seen[key] = 1;
      const B = pts[j];
      const L = d || 1;
      const nx = -(B[1] - A[1]) / L, ny = (B[0] - A[0]) / L;   // 边法向，用来抖折点
      let dd = 'M' + A[0].toFixed(1) + ' ' + A[1].toFixed(1);
      let x0 = Math.min(A[0], B[0]), x1 = Math.max(A[0], B[0]);
      let y0 = Math.min(A[1], B[1]), y1 = Math.max(A[1], B[1]);
      for (let k = 1; k <= 4; k++) {
        const t = k / 4;
        const o = k === 4 ? 0 : (rnd() - 0.5) * 0.5 * K;
        const qx = A[0] + (B[0] - A[0]) * t + nx * o;
        const qy = A[1] + (B[1] - A[1]) * t + ny * o;
        dd += ' L' + qx.toFixed(1) + ' ' + qy.toFixed(1);
        if (qx < x0) x0 = qx; if (qx > x1) x1 = qx;
        if (qy < y0) y0 = qy; if (qy > y1) y1 = qy;
      }
      sheet.add('<path d="' + dd + '" fill="none" stroke="#6A5F4A" stroke-opacity="'
        + (0.07 + rnd() * 0.11).toFixed(2) + '" stroke-width="' + ((0.07 + rnd() * 0.09) * K).toFixed(2)
        + '" stroke-linecap="round"/>', x0 - 3, y0 - 3, x1 + 3, y1 + 3);
    }
  }

  // ② 拖痕：重物被拖过场院的弧。比直路更像「此处干过活」。
  for (let i = 0; i < 7; i++) {
    const a0 = rnd() * 6.2832;
    const r0 = (2.6 + rnd() * 4.2) * K;
    const A = [mid + Math.cos(a0) * r0, mid + Math.sin(a0) * r0];
    const a1 = a0 + (rnd() - 0.5) * 0.95;
    const r1 = r0 + (5 + rnd() * 9) * K;
    const B = [mid + Math.cos(a1) * r1, mid + Math.sin(a1) * r1];
    const cp = [(A[0] + B[0]) / 2 - Math.sin(a0) * (rnd() - 0.5) * 7 * K,
                (A[1] + B[1]) / 2 + Math.cos(a0) * (rnd() - 0.5) * 7 * K];
    sheet.add('<path d="M' + A[0].toFixed(1) + ' ' + A[1].toFixed(1) + ' Q' + cp[0].toFixed(1) + ' '
      + cp[1].toFixed(1) + ' ' + B[0].toFixed(1) + ' ' + B[1].toFixed(1) + '" fill="none" stroke="#7A6C52" stroke-opacity="'
      + (0.05 + rnd() * 0.07).toFixed(2) + '" stroke-width="' + ((0.09 + rnd() * 0.11) * K).toFixed(2)
      + '" stroke-linecap="round"/>',
      Math.min(A[0], B[0], cp[0]) - 2, Math.min(A[1], B[1], cp[1]) - 2,
      Math.max(A[0], B[0], cp[0]) + 2, Math.max(A[1], B[1], cp[1]) + 2);
  }

  // ③ 盐壳：越靠近井口越密（与 canvas 的盐霜同一分布律，但换成多边形 ——
  //    直边读作「结晶」，软边圆点只能读作「发白的土」）
  const nS = IS_MOBILE ? 96 : 200;
  for (let i = 0; i < nS; i++) {
    const a = rnd() * 6.2832;
    const r = Math.pow(rnd(), 0.6) * 7.5 * K;
    const cx = mid + Math.cos(a) * r, cy = mid + Math.sin(a) * r;
    const rr = (0.10 + rnd() * 0.46) * K;
    const n = 5 + ((rnd() * 4) | 0);
    const poly = [];
    for (let k = 0; k < n; k++) {
      const aa = (k / n) * 6.2832 + (rnd() - 0.5) * 0.34;
      const R = rr * (0.52 + rnd() * 0.78);
      poly.push((cx + Math.cos(aa) * R).toFixed(1) + ',' + (cy + Math.sin(aa) * R).toFixed(1));
    }
    sheet.add('<polygon points="' + poly.join(' ') + '" fill="#FFFEF9" fill-opacity="'
      + (0.09 + rnd() * 0.15).toFixed(2) + '"/>', cx - rr * 2, cy - rr * 2, cx + rr * 2, cy + rr * 2);
  }
  return sheet.svg('');
}

// ============================================================
// 建筑用矢量贴图（2026-09-15）：青砖 / 小青瓦 / 夯土
//
// 这三张的共同点是：内容全是**结构性**的重复单元（砖缝、瓦垄、夯层），
// 正是 SVG 相对 canvas 的优势所在 —— 一条 2 px 的灰缝在斜视 + mipmap 下
// 会被 canvas 糊成一片；矢量是解析求交，缩到多小都还是一条缝。
// 反过来，这三张里没有任何「统计性」内容（噪点、斑驳），那些留给 canvas 底。
//
// ★ 每张都自带「物理尺度」，写在函数名的注释里（BRICK_M / TILE_M / EARTH_M）。
//   使用者必须按构件的真实米数去设 repeat（见 sizedMat）。不这么做的话，
//   同一张图贴到 6.4 m 的山墙和 0.95 m 的烟囱上，砖会一大一小 —— 井场里会
//   出现两种砖，这是最容易被看出来、也最容易被忽略的穿帮。
// ★ 全部用本地 mulberry32，绝不消耗全局 RND（贴图跑在 buildStation 之前）。
// ★ 跨画布边界的图元一律交给 svgSheet：它把同一段字符串原样复制一份平移到
//   另一侧 —— 复制体与本体逐字节相同，所以接缝处两块砖的缺口严丝合缝。
// ============================================================

// 青砖（条砖错缝砌法）。一格 = 1.2 m × 1.2 m：16 皮 × 5 顺砖。
// 皮高 75 mm（含灰缝）、砖长 240 mm —— 都是真砖的尺度，所以「一格叠几皮」
// 不是随手取的：16 × 0.075 = 1.2，5 × 0.24 = 1.2，两个方向都整接。
// 错缝取半砖（顺砖通缝是错的砌法），半砖偏移不破坏周期性：砖列周期是 1 块，
// 偏移半块后仍是同一组位置。
const SEED_BRICK_SVG = 3312;
function brickSvg(s) {
  const K = s / 512;
  const COLS = 5, ROWS = 16;
  const cw = s / COLS, ch = s / ROWS;
  const gap = 2.2 * K;
  const rnd = mulberry32(SEED_BRICK_SVG);
  const sheet = svgSheet(s);
  // 砖面本身的色差。整体都比灰缝（canvas 底）暗一点 —— 青砖配白灰缝，
  // 灰缝是全场最亮的那条线，这个关系反过来的话整面墙会读成「砖是凹的」。
  const FACE = ['#C0C1BC', '#B4B5B0', '#CACBC6', '#A8A9A5', '#9D9E9A', '#D3D4CF'];
  for (let r = 0; r < ROWS; r++) {
    const off = (r % 2) * cw * 0.5;
    for (let c = 0; c < COLS; c++) {
      // 砖心落在 c*cw + off。非错缝时 c=0 的那块骑在 x=0 上（一半在画布外），
      // 由 svgSheet 补一份到右侧 —— 接缝正好穿过一块砖的中间，不会多出一道缝。
      const cx = c * cw + off;
      const x0 = cx - cw / 2 + gap / 2, x1 = cx + cw / 2 - gap / 2;
      const y0 = r * ch + gap / 2, y1 = (r + 1) * ch - gap / 2;
      // 四角微扰：手工脱模的砖边不会是直线。扰动量必须 < 灰缝的一半（gap/2 = 1.1K），
      // 否则相邻两块砖会咬到一起、灰缝断掉。
      const j = () => (rnd() - 0.5) * 2.0 * K;
      const pts = [[x0 + j(), y0 + j()], [x1 + j(), y0 + j()], [x1 + j(), y1 + j()], [x0 + j(), y1 + j()]]
        .map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
      sheet.add('<polygon points="' + pts + '" fill="' + FACE[(rnd() * 6) | 0]
        + '" fill-opacity="' + (0.80 + rnd() * 0.20).toFixed(2) + '"/>', x0, y0, x1, y1);
      // 碱蚀泛霜：砌体受潮后渗出来的白霜，只在少数砖上，压得很淡
      if (rnd() < 0.09) {
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        const rx = (x1 - x0) * (0.20 + rnd() * 0.24), ry = (y1 - y0) * (0.28 + rnd() * 0.30);
        sheet.add('<ellipse cx="' + mx.toFixed(1) + '" cy="' + my.toFixed(1) + '" rx="' + rx.toFixed(1)
          + '" ry="' + ry.toFixed(1) + '" fill="#F6F5F0" fill-opacity="'
          + (0.08 + rnd() * 0.14).toFixed(2) + '"/>', mx - rx, my - ry, mx + rx, my + ry);
      }
      // 缺角：脱模磕掉的一角，露出砖芯（比砖面暗）
      if (rnd() < 0.07) {
        const kx = rnd() < 0.5 ? x0 : x1, ky = rnd() < 0.5 ? y0 : y1;
        const d = (0.20 + rnd() * 0.22) * cw;
        const sx = kx === x0 ? 1 : -1, sy = ky === y0 ? 1 : -1;
        sheet.add('<polygon points="' + kx.toFixed(1) + ',' + ky.toFixed(1) + ' '
          + (kx + sx * d).toFixed(1) + ',' + ky.toFixed(1) + ' '
          + kx.toFixed(1) + ',' + (ky + sy * d * 0.8).toFixed(1)
          + '" fill="#8E8F8B" fill-opacity="' + (0.5 + rnd() * 0.35).toFixed(2) + '"/>',
          Math.min(kx, kx + sx * d), Math.min(ky, ky + sy * d * 0.8),
          Math.max(kx, kx + sx * d), Math.max(ky, ky + sy * d * 0.8));
      }
    }
  }
  // 雨痕：沿墙面往下淌出来的深色竖带。整幅高度 + 横向渐变 → 上下天然无缝。
  const head = '<defs><linearGradient id="bst" x1="0" y1="0" x2="1" y2="0">'
    + '<stop offset="0" stop-color="#6E6F6B" stop-opacity="0"/>'
    + '<stop offset="0.5" stop-color="#6E6F6B" stop-opacity="1"/>'
    + '<stop offset="1" stop-color="#6E6F6B" stop-opacity="0"/></linearGradient></defs>';
  const out = [];
  for (let i = 0; i < 7; i++) {
    const w = (3 + rnd() * 9) * K;
    out.push('<rect x="' + (rnd() * s).toFixed(1) + '" y="0" width="' + w.toFixed(1)
      + '" height="' + s + '" fill="url(#bst)" fill-opacity="'
      + (0.05 + rnd() * 0.09).toFixed(3) + '"/>');
  }
  return sheet.svg(head) .replace('</svg>', out.join('') + '</svg>');
}

// 小青瓦（筒瓦盖、板瓦仰，仰合瓦屋面）。一格 = 0.90 m × 0.90 m：5 垄 × 5 皮。
// u = 沿檐口方向（垄的方向），v = 顺坡向下。
// 真实小青瓦的垄距约 180 mm、外露长度约 180 mm —— 5 × 0.18 = 0.90，两个方向整接。
// 这张图是「矢量贴图」最该赢的一张：瓦垄是一排并列的圆弧，canvas 描边在远处
// 会互相吃掉、糊成一条灰带；矢量圆弧无论缩到多小都还是清清楚楚一道垄。
const SEED_TILE_SVG = 6624;
function tileSvg(s) {
  const K = s / 512;
  const N = 5;
  const cw = s / N, ch = s / N;
  const rnd = mulberry32(SEED_TILE_SVG);
  const sheet = svgSheet(s);
  const wc = cw * 0.60;                 // 筒瓦宽（横向）
  // 筒瓦的圆柱明暗：中间一条高光带、两侧压暗。objectBoundingBox 单位，
  // 一条渐变能用在上位所有的筒瓦矩形上（它们宽度相同）。
  const head = '<defs>'
    + '<linearGradient id="tgc" x1="0" y1="0" x2="1" y2="0">'
    + '<stop offset="0" stop-color="#7C8184"/><stop offset="0.22" stop-color="#A9AEB1"/>'
    + '<stop offset="0.46" stop-color="#D4D8D9"/><stop offset="0.62" stop-color="#C2C6C8"/>'
    + '<stop offset="1" stop-color="#828790"/></linearGradient>'
    + '<linearGradient id="tgp" x1="0" y1="0" x2="1" y2="0">'
    + '<stop offset="0" stop-color="#83888B"/><stop offset="0.5" stop-color="#C6CACB"/>'
    + '<stop offset="1" stop-color="#83888B"/></linearGradient>'
    + '<linearGradient id="tgd" x1="0" y1="0" x2="1" y2="0">'
    + '<stop offset="0" stop-color="#5C6360" stop-opacity="0"/>'
    + '<stop offset="0.5" stop-color="#5C6360" stop-opacity="1"/>'
    + '<stop offset="1" stop-color="#5C6360" stop-opacity="0"/></linearGradient></defs>';
  const out = [];
  // 板瓦（仰瓦）：垄与垄之间的凹槽。槽心落在 cw 的整数倍上，
  // 所以 i=0 那道骑在 x=0 上，靠 svgSheet 补一份到右侧。
  const wd = cw - wc;
  for (let i = 0; i < N; i++) {
    const tcx = i * cw;
    const tx0 = tcx - wd / 2, tx1 = tcx + wd / 2;
    out.push('<rect x="' + tx0.toFixed(1) + '" y="0" width="' + wd.toFixed(1) + '" height="' + s
      + '" fill="url(#tgp)"/>');
    // 仰瓦的搭接缝与筒瓦错开半皮（一半一盖，否则上下缝对齐会漏雨）
    for (let j = 0; j < N; j++) {
      const y = (j + 0.5) * ch;
      out.push('<path d="M' + tx0.toFixed(1) + ' ' + y.toFixed(1) + ' Q' + tcx.toFixed(1) + ' '
        + (y + ch * 0.16).toFixed(1) + ' ' + tx1.toFixed(1) + ' ' + y.toFixed(1)
        + '" fill="none" stroke="#6B7175" stroke-opacity="0.34" stroke-width="'
        + (1.3 * K).toFixed(2) + '"/>');
    }
    const wrap = tx0 < 0;
    if (wrap) out.push('<g transform="translate(' + s + ',0)"><rect x="' + tx0.toFixed(1)
      + '" y="0" width="' + wd.toFixed(1) + '" height="' + s + '" fill="url(#tgp)"/></g>');
  }
  // 筒瓦（盖瓦）：垄心落在 (i+0.5)*cw，全部在画布内，无需补边。
  for (let i = 0; i < N; i++) {
    const bcx = (i + 0.5) * cw;
    const bx0 = bcx - wc / 2, bx1 = bcx + wc / 2;
    out.push('<rect x="' + bx0.toFixed(1) + '" y="0" width="' + wc.toFixed(1) + '" height="' + s
      + '" fill="url(#tgc)"/>');
    for (let j = 0; j < N; j++) {
      const y = j * ch;
      // 搭接：上一块瓦的尾压住下一块的头。暗弧是压口下的阴影，
      // 紧跟着一道亮弧是下一块瓦的前缘受光 —— 一暗一亮才有「叠」的体量。
      out.push('<path d="M' + bx0.toFixed(1) + ' ' + y.toFixed(1) + ' Q' + bcx.toFixed(1) + ' '
        + (y + ch * 0.13).toFixed(1) + ' ' + bx1.toFixed(1) + ' ' + y.toFixed(1)
        + '" fill="none" stroke="#5F6569" stroke-opacity="' + (0.34 + rnd() * 0.16).toFixed(2)
        + '" stroke-width="' + (1.7 * K).toFixed(2) + '"/>');
      out.push('<path d="M' + bx0.toFixed(1) + ' ' + (y + ch * 0.145).toFixed(1) + ' Q'
        + bcx.toFixed(1) + ' ' + (y + ch * 0.27).toFixed(1) + ' ' + bx1.toFixed(1) + ' '
        + (y + ch * 0.145).toFixed(1) + '" fill="none" stroke="#EEF1F1" stroke-opacity="'
        + (0.16 + rnd() * 0.14).toFixed(2) + '" stroke-width="' + (1.2 * K).toFixed(2) + '"/>');
    }
    // 每块瓦的色差：五皮各覆一层极淡的调子，读作「新旧不一」，
    // 而不是一条垄从头到尾一个颜色（那是挤出成型的塑料瓦）。
    for (let j = 0; j < N; j++) {
      out.push('<rect x="' + bx0.toFixed(1) + '" y="' + (j * ch).toFixed(1) + '" width="'
        + wc.toFixed(1) + '" height="' + ch.toFixed(1) + '" fill="'
        + (rnd() > 0.5 ? '#FFFFFF' : '#3E4448') + '" fill-opacity="'
        + (0.03 + rnd() * 0.07).toFixed(3) + '"/>');
    }
  }
  // 水渍与苔痕：整幅高度或整幅宽度的淡斑，天然无缝
  for (let i = 0; i < 6; i++) {
    const w = (7 + rnd() * 30) * K;
    out.push('<rect x="' + (rnd() * s).toFixed(1) + '" y="0" width="' + w.toFixed(1) + '" height="' + s
      + '" fill="url(#tgd)" fill-opacity="' + (0.05 + rnd() * 0.10).toFixed(3) + '"/>');
  }
  return sheet.svg(head).replace('</svg>', out.join('') + '</svg>');
}

// 夯土墙（版筑）。一格 = 1.6 m × 1.6 m：8 层，每层 200 mm —— 真实版筑一层
// 夯 15~25 cm，取 200 mm 正好 8 层整除画布高度，水平层界在上下两端整接。
// 层界用「整数倍谐波」叠加（2 与 5 个周期），x=0 与 x=s 必然同高 ——
// 这是水平线唯一会出错的地方，用非整数频率就会在重复处错开一道台阶。
const SEED_EARTH_SVG = 5580;
function earthSvg(s) {
  const K = s / 512;
  const N = 8;
  const ch = s / N;
  const rnd = mulberry32(SEED_EARTH_SVG);
  const sheet = svgSheet(s);
  const out = [];
  // ① 版筑层界：一道微凹的暗线 + 紧跟一道高光（夯锤压出的棱）。
  //    这是夯土墙上最醒目的东西，也是它区别于「一堵土色墙」的唯一特征。
  for (let r = 1; r < N; r++) {
    const y0 = r * ch;
    const NP = 30;
    let d = '';
    for (let i = 0; i <= NP; i++) {
      const t = i / NP;
      const y = y0 + Math.sin(t * 6.2832 * 2 + r * 0.9) * 1.7 * K
                   + Math.sin(t * 6.2832 * 5 + r * 2.1) * 0.85 * K;
      d += (i ? ' L' : 'M') + (t * s).toFixed(1) + ' ' + y.toFixed(1);
    }
    out.push('<path d="' + d + '" fill="none" stroke="#8A7454" stroke-opacity="0.34" stroke-width="'
      + (1.15 * K).toFixed(2) + '"/>');
    out.push('<path d="' + d + '" fill="none" stroke="#EFE5D0" stroke-opacity="0.30" stroke-width="'
      + (0.95 * K).toFixed(2) + '" transform="translate(0,' + (1.6 * K).toFixed(2) + ')"/>');
  }
  // ② 夯窝：夯锤一下一下砸出来的浅坑，按不规则网格铺满。
  //    每个坑「上缘受光、下缘背光」才读得出是个凹坑，单画一个暗椭圆读作污渍。
  for (let i = 0; i < 88; i++) {
    const cx = rnd() * s, cy = rnd() * s;
    const rx = (2.4 + rnd() * 4.6) * K, ry = rx * (0.5 + rnd() * 0.45);
    sheet.add('<ellipse cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" rx="' + rx.toFixed(1)
      + '" ry="' + ry.toFixed(1) + '" fill="#8E7A58" fill-opacity="'
      + (0.09 + rnd() * 0.10).toFixed(3) + '"/>', cx - rx, cy - ry, cx + rx, cy + ry);
    if (rnd() > 0.42) {
      sheet.add('<path d="M' + (cx - rx).toFixed(1) + ' ' + cy.toFixed(1) + ' A' + rx.toFixed(1) + ' '
        + ry.toFixed(1) + ' 0 0 1 ' + (cx + rx).toFixed(1) + ' ' + cy.toFixed(1)
        + '" fill="none" stroke="#F2E9D6" stroke-opacity="' + (0.10 + rnd() * 0.13).toFixed(3)
        + '" stroke-width="' + (0.9 * K).toFixed(2) + '"/>', cx - rx, cy - ry, cx + rx, cy + ry);
    }
  }
  // ③ 掺料：夯土里混的碎石与瓦砾。土是「复合材料」，没有这些东西就是一块橡皮泥。
  for (let i = 0; i < 52; i++) {
    const cx = rnd() * s, cy = rnd() * s, rr = (1.1 + rnd() * 3.0) * K;
    const n = 4 + ((rnd() * 3) | 0);
    let pts = '', x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * 6.2832 + rnd() * 0.5;
      const px = cx + Math.cos(a) * rr * (0.6 + rnd() * 0.6), py = cy + Math.sin(a) * rr * (0.6 + rnd() * 0.6);
      pts += (k ? ' ' : '') + px.toFixed(1) + ',' + py.toFixed(1);
      if (px < x0) x0 = px; if (px > x1) x1 = px;
      if (py < y0) y0 = py; if (py > y1) y1 = py;
    }
    sheet.add('<polygon points="' + pts + '" fill="' + (rnd() > 0.45 ? '#CFC6B2' : '#9E9077')
      + '" fill-opacity="' + (0.30 + rnd() * 0.40).toFixed(2) + '"/>', x0, y0, x1, y1);
  }
  // ④ 版筑竖缝：两版之间的接缝，直上直下的两条淡线（必须落在画布内部）
  [0.37, 0.72].forEach((t) => {
    out.push('<rect x="' + (t * s).toFixed(1) + '" y="0" width="' + (1.3 * K).toFixed(2) + '" height="' + s
      + '" fill="#7E6A4C" fill-opacity="0.16"/>');
  });
  // ⑤ 雨蚀：檐口下被雨水冲刷出来的竖向流痕。整幅高度 → 上下无缝。
  const head = '<defs><linearGradient id="est" x1="0" y1="0" x2="1" y2="0">'
    + '<stop offset="0" stop-color="#6E5C40" stop-opacity="0"/>'
    + '<stop offset="0.5" stop-color="#6E5C40" stop-opacity="1"/>'
    + '<stop offset="1" stop-color="#6E5C40" stop-opacity="0"/></linearGradient></defs>';
  for (let i = 0; i < 11; i++) {
    const w = (4 + rnd() * 16) * K;
    out.push('<rect x="' + (rnd() * s).toFixed(1) + '" y="0" width="' + w.toFixed(1) + '" height="' + s
      + '" fill="url(#est)" fill-opacity="' + (0.04 + rnd() * 0.08).toFixed(3) + '"/>');
  }
  // ⑥ 细裂：夯土失水后的短裂纹，只走内部，不跨画布边
  for (let i = 0; i < 6; i++) {
    let px = s * (0.10 + rnd() * 0.80), py = s * (0.10 + rnd() * 0.80);
    let d = 'M' + px.toFixed(1) + ' ' + py.toFixed(1);
    for (let k = 0; k < 3 + ((rnd() * 3) | 0); k++) {
      px += (rnd() - 0.5) * 46 * K; py += (rnd() - 0.5) * 62 * K;
      d += ' L' + px.toFixed(1) + ' ' + py.toFixed(1);
    }
    out.push('<path d="' + d + '" fill="none" stroke="#7A6444" stroke-opacity="'
      + (0.10 + rnd() * 0.10).toFixed(3) + '" stroke-width="' + (0.9 * K).toFixed(2) + '"/>');
  }
  return sheet.svg(head).replace('</svg>', out.join('') + '</svg>');
}

// 山体岩层。这一张是给三层环形山脊带做「横向层理」的：
//   u = 环向（贴图 x），v = 山脚→山脊（贴图 y）。
// 水平贯穿线在 u 方向**天然无缝**（左右两端同高即可），所以不需要补副本；
// 摆动的频率取整数倍谐波，保证 x=0 与 x=s 处同高，否则重复处会错开一道台阶。
// 对比度必须压得很低：山是「退到纸面之后」的平涂剪影，±3% 是装饰，±10% 就变成
// 一块石头怼在纸底上，抢主体。
function ridgeLaminarSvg(s) {
  const K = s / 512;
  const rnd = mulberry32(SEED_RIDGE_SVG);
  const head = grainFilter('rw', s, 0.004, 41, 0.74, 0.16)
    + '<rect width="' + s + '" height="' + s + '" filter="url(#rw)"/>';
  let out = '';

  // ① 大尺度岩组：宽而极淡的横向色带，先把「一整片纯色斜坡」打散
  for (let i = 0; i < 9; i++) {
    const y = (i + 0.5) * (s / 9) + (rnd() - 0.5) * (s / 9) * 0.5;
    const h = (0.45 + rnd() * 1.5) * (s / 9);
    out += '<rect x="0" y="' + y.toFixed(1) + '" width="' + s + '" height="' + h.toFixed(1)
      + '" fill="#6E6A63" fill-opacity="' + ((0.022 + rnd() * 0.036) * RIDGE_LAMINAR).toFixed(3) + '"/>';
  }

  // ② 层理：一「层」由 2~6 条近邻细线组成 —— 单线读成划痕，成组才读成沉积层
  const LAYERS = 24;
  for (let i = 0; i < LAYERS; i++) {
    const y0 = (i + 0.5 + (rnd() - 0.5) * 0.7) * (s / LAYERS);
    const a1 = (0.35 + rnd() * 1.5) * K;         // 1 次谐波：整体缓坡
    const a2 = (0.25 + rnd() * 1.0) * K;         // 2 次谐波：让线不那么死平
    const p1 = rnd() * 6.2832, p2 = rnd() * 6.2832;
    const nsub = 2 + ((rnd() * 5) | 0);
    for (let k = 0; k < nsub; k++) {
      const dy = (k - (nsub - 1) / 2) * (0.5 + rnd() * 2.2) * K;
      let d = '';
      let mn = 1e9, mx = -1e9;
      for (let j = 0; j <= 40; j++) {
        const t = j / 40;
        const y = y0 + dy + a1 * Math.sin(t * 6.2832 + p1) + a2 * Math.sin(t * 12.5664 + p2);
        d += (j ? ' L' : 'M') + (t * s).toFixed(1) + ' ' + y.toFixed(1);
        if (y < mn) mn = y; if (y > mx) mx = y;
      }
      out += '<path d="' + d + '" fill="none" stroke="#5F5B55" stroke-opacity="'
        + ((0.04 + rnd() * 0.12) * RIDGE_LAMINAR).toFixed(3) + '" stroke-width="' + (0.35 + rnd() * 0.75).toFixed(2) + '"/>';
      // 层的下缘再压一道，做出「层与层之间有缝」的观感
      if (mx - mn < 1e8 && rnd() > 0.55) {
        out += '<path d="' + d + '" fill="none" stroke="#F7F6F2" stroke-opacity="'
          + ((0.05 + rnd() * 0.10) * RIDGE_LAMINAR).toFixed(3) + '" stroke-width="0.5" transform="translate(0,' + (0.9 * K).toFixed(2) + ')"/>';
      }
    }
  }
  // 必须自己补 <svg> 外壳：这条分支没走 svgSheet（层理没有需要平铺补齐的形状），
  // 漏掉外壳 data URL 就不是合法 SVG，Image 会直接 onerror —— 表现为贴图一直是白的。
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '">'
    + head + out + '</svg>';
}

function makeRidgeLaminarTexture() {
  const s = 512;
  const reg = newSvgCanvas(s, 'ridge');
  const x = reg.ctx;
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, s, s);
  applySvgLayer(ridgeLaminarSvg(s), reg);
  const t = new THREE.CanvasTexture(reg.canvas);
  t.wrapS = THREE.RepeatWrapping;          // 环向重复
  t.wrapT = THREE.ClampToEdgeWrapping;     // 竖向只铺一次，不重复
  t.colorSpace = THREE.SRGBColorSpace;
  return regTex(t);
}

// 井场夯土 / 石屑地面：素色 + 细砂噪点 + 大尺度斑驳（无网格线，避免工业厂房感）
// 2026-09-15 提精度：512 → 1024（移动端仍 512）。近场是一格 10 m，512 时只有
// 51 px/m，而 45° FOV 下 1400 px 宽的屏在 10 m 处约 169 px/m —— 贴图长期欠采样
// 3 倍，这才是「地面一放大就糊」的根源。1024 把差距缩到 1.7 倍，值得那几 MB；
// 移动端画面小、本来也看不出，不付这份显存。
// 另叠一层手绘 SVG（砾石轮廓 / 石英亮点 / 微裂）：矢量边缘是解析求交，放大不糊。
function makeFloorTexture() {
  const s = IS_MOBILE ? 512 : 1024;
  const K = s / 512;
  const reg = newSvgCanvas(s, 'floor');
  const c = reg.canvas, x = reg.ctx;
  x.fillStyle = '#E9E5DB'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 5200; i++) {
    const a = RND() * 0.07;
    x.fillStyle = RND() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(96,90,78,${a})`;
    x.fillRect(RND() * s, RND() * s, 1 + RND() * 2, 1 + RND() * 2);
  }
  // 大尺度色斑：原来 22 个 / 半径 24~82 / alpha 0.045，在原来 ±80 的地面上够用；
  // 地面扩到 ±210 之后，同一块贴图被看到的地方多了，这些斑就暴露成一地圆点。
  // 改成更少、更大、更淡 —— 读作「土地的深浅」，而不是「斑点」。
  // by 2026-09-15：半径按 K 走，边长变了观感不变。
  for (let i = 0; i < 11; i++) {
    const mx = RND() * s, my = RND() * s, mr = (52 + RND() * 120) * K;
    const rg = x.createRadialGradient(mx, my, 0, mx, my, mr);
    rg.addColorStop(0, RND() > 0.5 ? 'rgba(255,255,255,0.030)' : 'rgba(92,84,70,0.026)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
  }
  // 先把 canvas 版的均值记下来当靶子，SVG 升级完按它归一化 —— 升级前后
  // 地面平均亮度必须一模一样，否则「地面 161」这条标定线就废了
  reg.target = meanSRGB(x, s);
  applySvgLayer(floorSvg(s), reg);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(42, 42); t.colorSpace = THREE.SRGBColorSpace;
  return regTex(t);
}

function makeStoneTexture() {
  const s = 512, c = cv(s), x = c.getContext('2d');
  x.fillStyle = '#EFEBE3'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 5200; i++) {
    const a = RND() * 0.12;
    x.fillStyle = RND() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(40,38,34,${a})`;
    x.fillRect(RND() * s, RND() * s, 1 + RND() * 2, 1 + RND() * 2);
  }
  x.strokeStyle = 'rgba(50,47,42,0.45)'; x.lineWidth = 2;
  for (let i = 0; i < 60; i++) {
    let px = RND() * s, py = RND() * s;
    x.beginPath(); x.moveTo(px, py);
    const seg = 2 + Math.floor(RND() * 3);
    for (let k = 0; k < seg; k++) { px += (RND() - 0.5) * 70; py += (RND() - 0.5) * 50; x.lineTo(px, py); }
    x.stroke();
  }
  for (let i = 0; i < 22; i++) {
    const mx = RND() * s, my = RND() * s, mr = 30 + RND() * 90;
    const rg = x.createRadialGradient(mx, my, 0, mx, my, mr);
    rg.addColorStop(0, RND() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 做旧熟铁：暗铁底 + 锈斑 + 麻点腐蚀 + 锻打横纹（天车铁箍多为手工锻打的箍圈）
function makeRustTexture() {
  const s = 256, c = cv(s), x = c.getContext('2d');
  x.fillStyle = '#4c453d'; x.fillRect(0, 0, s, s);
  x.strokeStyle = 'rgba(22,19,16,0.28)'; x.lineWidth = 1;
  for (let i = 0; i < s; i += 8) { x.beginPath(); x.moveTo(0, i + RND() * 3); x.lineTo(s, i + RND() * 3); x.stroke(); }
  for (let i = 0; i < 74; i++) {
    const mx = RND() * s, my = RND() * s, mr = 5 + RND() * 32;
    const rg = x.createRadialGradient(mx, my, 0, mx, my, mr);
    rg.addColorStop(0, `rgba(${(138 + RND() * 62) | 0},${(72 + RND() * 38) | 0},34,${0.16 + RND() * 0.38})`);
    rg.addColorStop(1, 'rgba(122,62,28,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
  }
  for (let i = 0; i < 2400; i++) {
    x.fillStyle = RND() > 0.55 ? `rgba(26,22,18,${RND() * 0.4})` : `rgba(198,156,102,${RND() * 0.16})`;
    x.fillRect(RND() * s, RND() * s, 1 + RND() * 2, 1 + RND() * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 茅草屋面：横向草秆密排 + 压草竹条 + 雨渍霉斑（盐工寮棚顶）
function makeThatchTexture() {
  const s = 512, c = cv(s), x = c.getContext('2d');
  x.fillStyle = '#9a8455'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 2400; i++) {
    const y = RND() * s, sx = RND() * s, len = 18 + RND() * 66;
    x.strokeStyle = (RND() > 0.55 ? 'rgba(72,56,30,' : 'rgba(208,188,142,') + (0.07 + RND() * 0.2) + ')';
    x.lineWidth = 1 + RND() * 2;
    x.beginPath(); x.moveTo(sx, y); x.lineTo(sx + len, y + (RND() - 0.5) * 3); x.stroke();
  }
  x.strokeStyle = 'rgba(58,46,24,0.42)'; x.lineWidth = 5;
  for (let i = 0; i <= s; i += 112) { x.beginPath(); x.moveTo(0, i); x.lineTo(s, i); x.stroke(); }
  for (let i = 0; i < 30; i++) {
    const mx = RND() * s, my = RND() * s, mr = 12 + RND() * 48;
    const rg = x.createRadialGradient(mx, my, 0, mx, my, mr);
    rg.addColorStop(0, RND() > 0.5 ? 'rgba(58,50,28,0.15)' : 'rgba(118,122,86,0.13)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 竹篾绞绳：四股绞合的篾索。
// 这张图是整个「绳」改造的支点，两件事必须同时成立：
//   ① 它必须**斜**。绳之所以是绳，全靠身上那道斜向绞股 —— 顺纹的绳子不是绳，
//      是一根上了木纹的棍子（上一版 ropeS 干脆连贴图都没有，纯色）。
//   ② 它必须能无缝平铺。绞股在圆柱面上是一条螺旋线，展开到 (u,v) 平面就是
//      一条 45° 直线；只要 u 绕绳一周的宽度、v 一个绞距的高度都恰好整除图案周期，
//      u=1 处就能接回 u=0。这里周期取 256·(√2/4)=45.25 px —— 
//      沿 x 或 y 走满 256，相位正好推进 181.02=4×45.25，两个方向都整接。
// 于是「绕绳一周 = 走满一个绞距」，每根绳只要按「绞距 = 3.4×直径」把 UV 的 v
// 折算一次（见 ropeUnitGeo），不管绳有多长，绞股粗细与角度都自动是对的。
function makeRopeTexture() {
  const s = 256, c = cv(s), x = c.getContext('2d');
  // 底色必须浅：poolMat/材质里 map 与 color 相乘，颜色常量才是你看到的颜色。
  x.fillStyle = '#DED4AE'; x.fillRect(0, 0, s, s);
  const E = s * Math.SQRT1_2;              // 45° 后画面在旋转坐标系里的半宽 =181.02
  x.save();
  x.translate(s / 2, s / 2);
  x.rotate(Math.PI / 4);                   // 45°：螺旋的展开就是 45° 直线
  const P = E / 4;                         // 45.25：四个股周期，与两个方向都整接
  const R = Math.ceil(E / P) + 1;
  for (let k = -R; k <= R; k++) {
    const y0 = k * P;
    // 股的一圈：边缘压暗成「股沟」、中间提亮成「股脊」—— 绞绳的起伏就在这条剖面上
    const g = x.createLinearGradient(0, y0 - P / 2, 0, y0 + P / 2);
    g.addColorStop(0.00, 'rgba(122,108,74,0.38)');   // 股沟
    g.addColorStop(0.24, 'rgba(214,203,164,0.06)');
    g.addColorStop(0.50, 'rgba(255,251,230,0.32)');  // 股脊
    g.addColorStop(0.76, 'rgba(214,203,164,0.06)');
    g.addColorStop(1.00, 'rgba(122,108,74,0.38)');
    x.fillStyle = g;
    x.fillRect(-E * 1.2, y0 - P / 2, E * 2.4, P);
  }
  // 篾丝：沿股向的短纤维。旋转后「沿股向」就是水平方向。
  // 画满 ±E（不是 ±s/2）—— 否则旋转回来的四角会缺一块，平铺时露一道淡疤。
  x.lineCap = 'round';
  for (let i = 0; i < 1800; i++) {
    const fx = -E + RND() * E * 2, fy = -E + RND() * E * 2;
    const ln = 3 + RND() * 12;
    x.strokeStyle = (RND() > 0.5 ? 'rgba(96,84,56,' : 'rgba(252,248,226,')
      + (0.05 + RND() * 0.15).toFixed(3) + ')';
    x.lineWidth = 0.6 + RND() * 1.2;
    x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + ln, fy + (RND() - 0.5) * 1.8); x.stroke();
  }
  x.restore();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- 建筑用贴图（2026-09-15 井场附属建筑：灶房 / 盐仓） ----------
// 三张各自带**物理尺度**（一格覆盖多少米），写在常量里，使用者按构件的真实尺寸
// 折算 repeat（见 sizedMat）。这是这套图唯一正确的用法：不折算的话，同一张砖图
// 贴到 6.4 m 的山墙和 0.95 m 的烟囱上会给出两种大小的砖 —— 一眼就穿帮。
const BRICK_M = 1.20;    // 青砖：灰缝 + 砖面 + 碱蚀 + 雨痕
const TILE_M = 0.90;     // 小青瓦：筒瓦垄 + 仰瓦槽 + 搭接弧 + 水渍苔痕
const EARTH_M = 1.60;    // 夯土：版筑层界 + 夯窝 + 掺石 + 抄平缝 + 雨蚀
// 各向异性过滤上限。init() 里从 renderer 读到。存在的理由是**时序**：
// TEX.* 上的那一份是在 init 的循环里统一设的，而 clone 是构建期才出现的，
// 补不上就会出现「近处的地面糊、稍远的清晰」这种反直觉结果 ——
// 墙面全是斜视角，这一项漏掉的话砖缝会先糊掉，整面墙退回成一堵灰墙。
let MAX_ANISO = 1;

// 三张的共同骨架：canvas 只铺「统计性」底（灰缝色 / 瓦背色 / 土色 + 细噪点），
// 结构性内容全部由 SVG 层盖上去，均值守住 canvas 版的靶子（亮度守恒）。
function makeBrickTexture() {
  const s = 512;
  const reg = newSvgCanvas(s, 'brick');
  const c = reg.canvas, x = reg.ctx;
  // 底图与 SVG 层用不同的子种子：两层若共用一条流，SVG 层的第一个随机量
  // 会与底图的第一笔重合，噪点与砖面出现细微的对齐 —— 看着说不清哪里怪。
  const rnd = mulberry32(SEED_BRICK_SVG ^ 0x5A5A);
  x.fillStyle = '#C9CAC6'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 3200; i++) {
    const a = rnd() * 0.10;
    x.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(58,58,54,${a})`;
    x.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  reg.target = meanSRGB(x, s);
  applySvgLayer(brickSvg(s), reg);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  t.userData.tile = BRICK_M;
  return regTex(t);
}
function makeTileTexture() {
  const s = 512;
  const reg = newSvgCanvas(s, 'tile');
  const c = reg.canvas, x = reg.ctx;
  const rnd = mulberry32(SEED_TILE_SVG ^ 0x3C3C);
  x.fillStyle = '#C6C9CA'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 2600; i++) {
    const a = rnd() * 0.11;
    x.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(56,62,66,${a})`;
    x.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  reg.target = meanSRGB(x, s);
  applySvgLayer(tileSvg(s), reg);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  t.userData.tile = TILE_M;
  return regTex(t);
}
function makeEarthTexture() {
  const s = 512;
  const reg = newSvgCanvas(s, 'earth');
  const c = reg.canvas, x = reg.ctx;
  const rnd = mulberry32(SEED_EARTH_SVG ^ 0x1E1E);
  x.fillStyle = '#D3C8B2'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 4200; i++) {
    const a = rnd() * 0.13;
    x.fillStyle = rnd() > 0.5 ? `rgba(255,250,236,${a})` : `rgba(84,68,44,${a})`;
    x.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  for (let i = 0; i < 26; i++) {
    const mx = rnd() * s, my = rnd() * s, mr = 24 + rnd() * 76;
    const rg = x.createRadialGradient(mx, my, 0, mx, my, mr);
    rg.addColorStop(0, rnd() > 0.5 ? 'rgba(255,248,232,0.10)' : 'rgba(96,76,48,0.09)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
  }
  reg.target = meanSRGB(x, s);
  applySvgLayer(earthSvg(s), reg);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  t.userData.tile = EARTH_M;
  return regTex(t);
}

// 按「构件真实米数」折算 repeat 的材质工厂。
// 每个构件拿一份自己的 clone —— 这不只是洁癖：TEX.brick 上那份 repeat 是全局的，
// 用它贴 6.4 m 的山墙与 0.95 m 的烟囱，砖会一大一小。clone 共享同一张 canvas
// （SVG 层升级时由 regTex 一并刷新），只多付一次纹理上传。尺寸相同的构件
// 请**复用同一个材质**（屋顶两坡、两片山墙），否则白白多两次上传。
function sizedMat(tex, w, h, color, rough) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = MAX_ANISO;
  const tile = tex.userData.tile || 1;
  t.repeat.set(w / tile, h / tile);
  regTex(t);
  return new THREE.MeshStandardMaterial({ map: t, color, roughness: rough, metalness: 0.0 });
}
const vBrick = (w, h, color, rough = 0.95) => sizedMat(TEX.brick, w, h, color, rough);
const vTile = (w, h, color, rough = 0.90) => sizedMat(TEX.tile, w, h, color, rough);
const vEarth = (w, h, color, rough = 0.97) => sizedMat(TEX.earth, w, h, color, rough);

// 陈年杉木：深褐灰底 + 波动竖纹 + 雨蚀泛白 + 木节 + 干裂 + 近地青苔
function makeWoodTexture() {
  const s = 512, c = cv(s), x = c.getContext('2d');
  x.fillStyle = '#C9B79B'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 320; i++) {
    const gx = RND() * s, w = 1 + RND() * 3;
    const dark = RND() > 0.5;
    // 竖纹对比原来只有 0.04~0.15：512px 的贴图铺到一根 13 m 的柱身上之后
    // 全被平均掉了，柱子读成一根均匀的棕色管子 —— 这是「塑料管」的一半原因。
    // 提到 0.09~0.29 才看得见木纤维。另一半原因（没有凹凸）由下面的 bumpMap 补。
    x.strokeStyle = (dark ? 'rgba(48,38,26,' : 'rgba(178,163,138,') + (0.09 + RND() * 0.20) + ')';
    x.lineWidth = w;
    x.beginPath(); x.moveTo(gx, 0);
    for (let y = 0; y <= s; y += 14) x.lineTo(gx + Math.sin(y * 0.035 + gx) * 2.4, y);
    x.stroke();
  }
  for (let i = 0; i < 90; i++) {
    const gx = RND() * s;
    x.strokeStyle = `rgba(214,205,186,${0.05 + RND() * 0.08})`;
    x.lineWidth = 1 + RND() * 2;
    x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx + (RND() - 0.5) * 4, s); x.stroke();
  }
  x.strokeStyle = 'rgba(46,30,14,0.22)'; x.lineWidth = 2;
  for (let i = 0; i <= s; i += 128) { x.beginPath(); x.moveTo(0, i); x.lineTo(s, i); x.stroke(); }
  for (let i = 0; i < 16; i++) {
    const kx = RND() * s, ky = RND() * s, r = 4 + RND() * 9;
    for (let rr = r; rr > 1; rr -= 2) {
      const rg = x.createRadialGradient(kx, ky, 0, kx, ky, rr);
      rg.addColorStop(0, 'rgba(58,36,16,0.5)'); rg.addColorStop(1, 'rgba(58,36,16,0)');
      x.fillStyle = rg; x.beginPath(); x.arc(kx, ky, rr, 0, Math.PI * 2); x.fill();
    }
  }
  x.strokeStyle = 'rgba(38,26,14,0.35)'; x.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    let px = RND() * s, py = RND() * s;
    x.beginPath(); x.moveTo(px, py);
    const seg = 3 + Math.floor(RND() * 4);
    for (let k = 0; k < seg; k++) { px += (RND() - 0.5) * 30; py += (RND() - 0.5) * 22; x.lineTo(px, py); }
    x.stroke();
  }
  for (let i = 0; i < 2600; i++) {
    x.fillStyle = `rgba(38,28,16,${RND() * 0.06})`;
    x.fillRect(RND() * s, RND() * s, 1, 1);
  }
  for (let i = 0; i < 1500; i++) {
    x.fillStyle = `rgba(208,199,181,${RND() * 0.05})`;
    x.fillRect(RND() * s, RND() * s, 1, 1);
  }
  for (let i = 0; i < 26; i++) {
    const mx = RND() * s, my = s * (0.55 + RND() * 0.45), mr = 8 + RND() * 26;
    const rg = x.createRadialGradient(mx, my, 0, mx, my, mr);
    rg.addColorStop(0, 'rgba(96,104,78,0.10)'); rg.addColorStop(1, 'rgba(96,104,78,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 2); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 程序生成环境贴图：上白下暖的竖直渐变，供铁箍微弱反射（离线可用，无外部依赖）
function makeEnvTexture(renderer) {
  const c = cv(16), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 16);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#f3efe8'); g.addColorStop(1, '#e2ddd2');
  x.fillStyle = g; x.fillRect(0, 0, 16, 16);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromEquirectangular(tex).texture;
  tex.dispose(); pmrem.dispose();
  return envTex;
}

// ---------- 材质工具 ----------
function woodTex(color, rough = 0.85) {
  return new THREE.MeshStandardMaterial({ map: TEX.wood, color, roughness: rough, metalness: 0.0 });
}
// 逐构件色调/粗糙度扰动（做旧：让每根木构、每块石料略有差异，避免塑料感）
function vTint(map, color, rough) {
  const c = new THREE.Color(color), hsl = {}; c.getHSL(hsl);
  // 明度 ±22%、饱和度 ±18%。原来 ±15% / ±10% 太小 —— 一排柱子并排时颜色
  // 几乎一样，读成同一批注塑件，看不出「每根木头的老化程度各不相同」。
  hsl.l = Math.min(1, Math.max(0.05, hsl.l * (0.78 + RND() * 0.44)));
  hsl.s = Math.min(1, hsl.s * (0.82 + RND() * 0.36));
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return new THREE.MeshStandardMaterial({
    map, color: c,
    // bumpMap 复用同一张程序贴图：木纹石纹本来就有起伏，只上颜色不上凹凸的话，
    // 侧光打过来表面依然是平的 —— 这是「塑料感」的另一半成因。0.012 是
    // 「看得出纤维、但不会变成搓衣板」的量级。
    bumpMap: map, bumpScale: 0.012,
    roughness: Math.min(1, Math.max(0.3, rough + (RND() - 0.5) * 0.14)),
    metalness: 0.0,
  });
}
// 材质池：同类构件复用有限数量的做旧变体，既保留「逐根木头不一样」的手工感，
// 又让几何合并能把成百上千根细木压缩到个位数 draw call。
const _matPool = new Map();
function poolMat(key, map, color, rough, n = 7) {
  let arr = _matPool.get(key);
  if (!arr) { arr = []; for (let i = 0; i < n; i++) arr.push(vTint(map, color, rough)); _matPool.set(key, arr); }
  return arr[(RND() * arr.length) | 0];
}
function vWood(color, rough) { return poolMat(`w${color}_${rough}`, TEX.wood, color, rough); }
function vStone(color, rough) { return poolMat(`s${color}_${rough}`, TEX.stone, color, rough, 5); }
function vBamboo(color = BAMBOO_PALE, rough = 0.9) { return poolMat(`b${color}_${rough}`, TEX.wood, color, rough, 5); }
// 共享材质（铁 / 篾 / 茅草 / 绳）——节点数量大，必须共享才能合并
let _ironM = null, _bambooM = null, _thatchM = null, _thatchRoofM = null, _ropeM = null;
function ironS() {
  // metalness 0.58 → 0.30：铁箍本就该是全场最深的构件（比木暗），但在这种
  // 「纸底 + 弱环境反射」的场景里，高 metalness 会把颜色直接吃掉，读成一颗
  // 黑色橡胶 O 型圈。降下来之后它仍是全场最深的，但看得见锈迹与哑光。
  if (!_ironM) _ironM = new THREE.MeshStandardMaterial({ map: TEX.rust, color: IRON, roughness: 0.80, metalness: 0.30 });
  return _ironM;
}
function bambooS() {
  // 纯色无贴图的篾箍在强侧光下会读成「一圈圈白色塑料扎带」。给它同一张纤维
  // 贴图：底色相乘之后明度自然落到「新篾」该在的位置，还带上细纹与凹凸。
  if (!_bambooM) _bambooM = new THREE.MeshStandardMaterial({
    map: TEX.wood, color: BAMBOO, bumpMap: TEX.wood, bumpScale: 0.010,
    roughness: 0.92, metalness: 0.0,
  });
  return _bambooM;
}
function thatchS() {
  if (!_thatchM) _thatchM = new THREE.MeshStandardMaterial({ map: TEX.thatch, color: THATCH, roughness: 1.0, metalness: 0.0 });
  return _thatchM;
}
// 草顶面专用：茅草贴图的横纹（每 112px 一道）在 repeat 6 下会密成「木板拼缝」，
// 屋面整片就读成木板台面。屋面面积大，单独用一份重复度更低的贴图。
function thatchRoofS() {
  if (!_thatchRoofM) {
    const t = TEX.thatch.clone();
    t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2.0, 1.6);
    _thatchRoofM = new THREE.MeshStandardMaterial({ map: t, color: THATCH, roughness: 1.0, metalness: 0.0 });
  }
  return _thatchRoofM;
}
function ropeS() {
  // 与 bambooS 同一条道理，而且更严重：上一版 ropeS 是**纯色无贴图**，
  // 而 bambooS 早在「白塑料扎带」那一轮就补上了贴图 —— 唯独绳被漏掉。
  // 实测：ropeS 的等效反照率 0.276 与 bambooS 的 0.260 几乎相同，
  // 但绳是方棱柱、篾箍是细圆管，方棱柱整面同值 → 绳在画面上跑到 140~145，
  // 比受光的木（50~63）亮一倍多，成了塔上最亮的东西，读作一根发光的线。
  // 换成圆截面 + 绞股贴图之后，明暗变成沿圆周的连续渐变，峰值自然落回去。
  if (!_ropeM) _ropeM = new THREE.MeshStandardMaterial({
    map: TEX.rope, color: ROPE, bumpMap: TEX.rope, bumpScale: 0.016,
    roughness: 0.96, metalness: 0.0,
  });
  return _ropeM;
}

// ---------- 几何缓存 ----------
const _geoCache = new Map();
const r2 = (v) => Math.round(v * 100) / 100;
function cachedGeo(key, make) {
  let gg = _geoCache.get(key);
  if (!gg) { gg = make(); _geoCache.set(key, gg); }
  return gg;
}
function windGeoC(radius, length, turns, tubeR) {
  return cachedGeo(`w${radius}|${length}|${turns}|${tubeR}`, () => helixWindGeo(radius, length, turns, tubeR));
}
function hoopGeoC(radius, tubeR, seg = 16) {
  return cachedGeo(`h${radius}|${tubeR}|${seg}`, () => new THREE.TorusGeometry(radius, tubeR, 6, seg));
}
function unitCylG() {
  // 7 → 10 段。7 段的「七棱柱」在近景会露出一道道竖向明暗棱（每个侧面一个明度），
  // 这是低模感最顽固的一处 —— 贴图救不了，只能加段数。10 段已经读作圆木，
  // 三角面只多 ~40%（束柱合计约 +900）。保留一点点锥度（0.94/1），原木本就有收分。
  return cachedGeo('unitCyl', () => new THREE.CylinderGeometry(0.94, 1, 1, 10));
}

// ---------- 静态几何合并（自实现，避免额外 vendor 依赖） ----------
// 单根束柱由数根杉木 + 十数道篾箍构成，整塔网格会到上千个。
// 这里把所有静态构件按材质合并成若干大 BufferGeometry，draw call 回落到个位数。
function mergeGeos(list) {
  let vCount = 0, iCount = 0;
  for (const g of list) {
    vCount += g.attributes.position.count;
    iCount += g.index ? g.index.count : g.attributes.position.count;
  }
  const pos = new Float32Array(vCount * 3);
  const nor = new Float32Array(vCount * 3);
  const uv = new Float32Array(vCount * 2);
  const idx = vCount > 65535 ? new Uint32Array(iCount) : new Uint16Array(iCount);
  let vo = 0, io = 0;
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    pos.set(p.array, vo * 3);
    if (n) nor.set(n.array, vo * 3);
    if (u) uv.set(u.array, vo * 2);
    if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx[io + i] = a[i] + vo; io += a.length; }
    else { for (let i = 0; i < p.count; i++) idx[io + i] = vo + i; io += p.count; }
    vo += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  return out;
}
const _bin = new Map();
const _emitM = new THREE.Matrix4();
// 把一棵（未入场的）临时对象树按材质收编进合并桶
function emit(obj, base) {
  obj.updateMatrixWorld(true);
  obj.traverse((o) => {
    if (!o.isMesh) return;
    _emitM.copy(o.matrixWorld);
    if (base) _emitM.premultiply(base);
    let arr = _bin.get(o.material);
    if (!arr) { arr = []; _bin.set(o.material, arr); }
    arr.push(o.geometry.clone().applyMatrix4(_emitM));
  });
}
function flushBin(parent) {
  _bin.forEach((arr, mat) => {
    const merged = mergeGeos(arr);
    arr.forEach((a) => a.dispose());
    const m = new THREE.Mesh(merged, mat);
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m);
  });
  _bin.clear();
}

// 竹篾缠绕：沿螺旋线生成的篾绳管（默认绕 Y 轴）
class HelixCurve extends THREE.Curve {
  constructor(radius, length, turns) { super(); this.radius = radius; this.length = length; this.turns = turns; }
  getPoint(t, target = new THREE.Vector3()) {
    const a = t * this.turns * Math.PI * 2;
    const y = (t - 0.5) * this.length;
    return target.set(Math.cos(a) * this.radius, y, Math.sin(a) * this.radius);
  }
}
function helixWindGeo(radius, length, turns, tubeR) {
  return new THREE.TubeGeometry(new HelixCurve(radius, length, turns), Math.max(10, Math.ceil(turns * 9)), tubeR, 5, false);
}

// ============================================================
// 束柱（自贡天车的核心构造）
// ------------------------------------------------------------
// 天车高十余丈，山里根本找不到那么长的整木——所以每一根「柱」都不是一根树，
// 而是若干根杉木并排靠拢、接头彼此错开（错缝搭接），外面用竹篾一道道密缠成箍，
// 关键节点再套上手工锻打的铁箍锁死，整体受力像一束筷子而非一根筷子。
// 越往高处荷载越小，并束的根数递减、木料也更细，这正是天车「收分」轮廓的由来。
// ============================================================
function trunkMesh(ox, oz, y0, y1, rad, color, rough) {
  const h = Math.max(0.02, y1 - y0);
  const m = new THREE.Mesh(unitCylG(), vWood(color, rough));
  // 每根略呈椭圆：真实杉木没有正圆的。原来一律 scale(rad, h, rad)，一排柱子
  // 并排看过去就是一根根完全一样的圆管。
  const ecc = (RND() - 0.5) * 0.14;
  m.scale.set(rad * (1 + ecc), h, rad * (1 - ecc));   // 共享单位圆柱，靠缩放得到粗细/长短
  m.position.set(ox, (y0 + y1) / 2, oz);
  m.rotation.y = RND() * Math.PI;         // 转一下，木纹不重复
  m.castShadow = true;
  return m;
}

// 一根完整的束柱：整柱一次生成，各根杉木的偏置沿全高固定不变（柱身才读得出「一束」），
// 每根切成若干截、接缝高度逐根错开（错缝搭接）；竹篾箍等距密缠，每 ironEvery 道换一道铁箍。
function bundleColumn(p1, p2, opt = {}) {
  const {
    count = 3, rad = 0.068, spread = 0.125,
    color = WOOD, rough = 0.88,
    bindStep = 0.55, ironEvery = 4, splices = 2,
  } = opt;
  const grp = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  if (len < 1e-3) return grp;

  // 束柱的视觉成立靠两件事，缺一不可：
  //   ① 外层木之间真的留出缝 —— 原来的 rad 0.085 / spread 0.105 会让相邻两根
  //      互相重叠（圆心距 0.148 < 半径和 0.17），整根柱子读起来就是一根实心方柱。
  //      收到 0.068 / 放到 0.125 之后，外缘几乎不变（0.1900 → 0.1930），缝出来了。
  //   ② 柱心有一根暗木 —— 缝里透出的就是它的暗，等于不花一分钱的环境光遮蔽。
  //      原代码只有 count>=5 才有芯柱，塔身 4→3→2 根的段全都没有。
  const phase = RND() * Math.PI * 2;
  const trunks = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + phase;
    const rr = spread * (0.9 + RND() * 0.2);
    trunks.push({ ox: Math.cos(a) * rr, oz: Math.sin(a) * rr, r: rad * (0.86 + RND() * 0.28) });
  }
  if (count >= 2) {
    trunks.push({ ox: 0, oz: 0, r: Math.max(0.018, spread - rad - 0.012), core: true });
  }

  trunks.forEach((t) => {
    const cuts = [0];
    for (let k = 1; k <= splices; k++) cuts.push(k / (splices + 1) + (RND() - 0.5) * 0.22);
    cuts.push(1);
    cuts.sort((a, b) => a - b);
    for (let k = 0; k < cuts.length - 1; k++) {
      const y0 = -len / 2 + len * cuts[k] - (k > 0 ? 0.06 : 0);
      const y1 = -len / 2 + len * cuts[k + 1] + (k < cuts.length - 2 ? 0.06 : 0);
      grp.add(trunkMesh(t.ox, t.oz, y0, y1, t.r, t.core ? CORE_INK : color, rough));
    }
  });

  // 箍环半径取木束实际外缘上限，确保箍套在木外、不切入杉木
  const bindR = (count > 1 ? spread * 1.12 : 0) + rad * 1.2;
  const n = Math.max(2, Math.round(len / bindStep));
  const wg = windGeoC(r2(bindR), 0.17, 2, 0.013);
  const ig = hoopGeoC(r2(bindR + 0.012), 0.030, 14);

  // 疏密节奏：柱脚 / 柱顶 / 每个错缝接头是「密区」（那里才真的需要锁死），
  // 杆身是「疏区」。做法是用密度函数对均匀采样做重映射 —— 箍的总数不变，
  // 只是沿柱身分布不均，于是整根柱读起来有呼吸，而不是一串等距圆环。
  const anchors = [0, 1];
  for (let k = 1; k <= splices; k++) anchors.push(k / (splices + 1));
  // 但箍本来就没几道的短构件（棚柱、门架柱）不能这么拉 —— 只有 4~5 道箍时，
  // 两端成簇、中间空掉，会读成一串珠子。所以聚拢强度随箍数递减。
  const AMP = n >= 9 ? 2.4 : n >= 6 ? 1.2 : 0.0;
  const SIG = 0.06, M = 48;
  const cum = [0];
  for (let i = 1; i <= M; i++) {
    const tt = (i - 0.5) / M;
    let d = 1;
    anchors.forEach((a) => { d += AMP * Math.exp(-((tt - a) * (tt - a)) / (2 * SIG * SIG)); });
    cum.push(cum[i - 1] + d / M);
  }
  const tot = cum[M];
  const ys = [];
  for (let i = 0; i <= n; i++) {
    const target = (i / n) * tot;
    let j = 0; while (j < M - 1 && cum[j + 1] < target) j++;
    const span = Math.max(1e-6, cum[j + 1] - cum[j]);
    const tt = Math.min(1, Math.max(0, (j + (target - cum[j]) / span) / M));
    ys.push(-len / 2 + len * tt);
  }
  // 铁箍落在结构节点上（柱脚 / 柱顶 / 每个错缝接头），而非机械地「每第 N 道」
  const ironAt = new Set();
  if (ironEvery > 0) {
    anchors.forEach((a) => {
      const ya = -len / 2 + len * a;
      let bi = 0, bd = Infinity;
      ys.forEach((y, i) => { const d = Math.abs(y - ya); if (d < bd) { bd = d; bi = i; } });
      ironAt.add(bi);
    });
  }
  ys.forEach((y, i) => {
    if (ironAt.has(i)) {
      const h = new THREE.Mesh(ig, ironS());
      h.rotation.x = Math.PI / 2; h.position.set(0, y, 0);
      h.scale.setScalar(0.97 + RND() * 0.06);
      grp.add(h);
    } else {
      // 同一个几何反复实例化会给出一道道完全等径、等距、同相位的环，读成
      // 「机器缠出来的塑料带」。给每道箍各自的松紧（半径 ±4%）与起始角，
      // 才有手工缠篾的呼吸感 —— 这是近景里最能拉开「制品」与「模型」的东西。
      const w = new THREE.Mesh(wg, bambooS());
      const tight = 0.96 + RND() * 0.085;
      w.scale.set(tight, 1, tight);
      w.position.set(0, y + (RND() - 0.5) * 0.012, 0);
      w.rotation.y = (i * 0.7 + RND() * 0.9) % Math.PI;
      grp.add(w);
    }
  });

  grp.position.set((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
  grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return grp;
}

// 两点之间的木杆 / 斜撑 / 箍梁（按方向自动朝向）
function strut(p1, p2, thickness, mat) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y, dz = p2.z - p1.z;
  const len = Math.hypot(dx, dy, dz);
  // 截面略呈矩形而非正方形：真实方木是锯出来的，不会是正方的
  const t2 = thickness * (0.90 + RND() * 0.20);
  const m = new THREE.Mesh(new THREE.BoxGeometry(thickness, len, t2), mat);
  m.position.set((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
  m.castShadow = true;
  return m;
}

// 圆截面木杆（斜撑 / 吊杆 / 扶手立柱 / 备料原木）。
// 为什么不用 strut()：方截面套 setFromUnitVectors 之后「哪个面朝光」是随机的 ——
// 同一个视平面里并排几根斜撑，会一根读成杆、一根读成板，整组读成乱插的板堆。
// 碓架旧版的四根斜撑就是这么毁掉的。圆截面绕轴的明暗连续，转多少都一样。
const _rsQ = new THREE.Quaternion(), _rsUp = new THREE.Vector3(0, 1, 0), _rsD = new THREE.Vector3();
function roundStrut(p1, p2, r, mat) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y, dz = p2.z - p1.z;
  const len = Math.hypot(dx, dy, dz);
  const geo = cachedGeo('rc' + r, () => new THREE.CylinderGeometry(r, r, 1, 8));
  const m = new THREE.Mesh(geo, mat);
  m.position.set((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
  m.scale.y = len;
  m.quaternion.setFromUnitVectors(_rsUp, _rsD.set(dx, dy, dz).normalize());
  m.castShadow = true;
  return m;
}

// 绳专用：单位圆截面 + 把「绞距」烘进 UV。
// 截面必须是圆的 —— 方棱柱有两个致命问题：
//   ① 四个侧面各自同值，近景读成一条扁带而不是一根绳；
//   ② setFromUnitVectors 给的绕轴自转角是任意的，方棱柱的「哪个面朝着光」
//      因此是随机的 —— 同一批绳的明暗可以差到 2.8 倍（实测 52 → 145）。
//      圆截面的明暗沿圆周连续分布、与自转角无关，绕轴转多少都一样亮。
// 8 段：比 6 段多不出多少面，但正六棱的竖向棱面在近景看得出。
function ropeUnitGeo(r, nominalLen) {
  const geo = new THREE.CylinderGeometry(r, r, 1, 8, 1, false);
  const pitch = Math.max(0.05, 3.4 * r * 2);   // 绞距 ≈ 3.4×直径（普通三/四股绳的捻度）
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * (nominalLen / pitch));
  uv.needsUpdate = true;
  return geo;
}
// 两根点之间的绳：几何按实际长度生成（长度进了 UV，所以不能用缓存几何）
function ropeMesh(p1, p2, r) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y, dz = p2.z - p1.z;
  const len = Math.hypot(dx, dy, dz);
  const m = new THREE.Mesh(ropeUnitGeo(r, len), ropeS());
  m.position.set((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
  m.castShadow = true;
  return m;
}

// ============================================================
// 初始化
// ============================================================
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  // 雾密度 0.0055 → 0.0028：原先靠浓雾把远处地面「化」进纸底来收边，现在地平线
  // 由群山接管，雾只负责大气透视。留在 0.0055 的话 300 m 外的山会被吃掉 75%，
  // 三层山糊成一片白，等于没做。
  scene.fog = new THREE.FogExp2(BG, 0.0028);

  // far 500 → 900：远场地面是 640×640（±320），最外一圈山岭线半径可到 365，
  // 而 controls.maxDistance = 82。相机绕到对角、拉到最远时，到地面远角的距离可达
  // ≈535 > 500 —— 会被远平面直接裁掉，露出一块没有地面的虚空。
  // near 0.1 / far 900 的比值对 24-bit 深度精度没有实质影响，放心放。
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 900);
  // 相机从 14 降到 12：画面上边缘的仰角由 9.6° 抬到 13.5°，三层山的峰才全部
  // 进画（最远的峰仰角 ≈12.9°）。顺带视线略低于塔顶（13.9 m），塔反而更挺拔。
  camera.position.set(20, 12, 26);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 手机上 dpr 常到 3：封到 2 意味着 4 倍于 1x 的填充量，再叠 3072² 阴影贴图就太重。
  // 封到 1.75（=3.06 倍 1x），肉眼几乎无差、开销砍掉约 1/4。
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.75 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('scene-root').appendChild(renderer.domElement);

  // 环境反射：程序生成「上白下暖」渐变环境，让铁箍在白底上有真实金属感
  scene.environment = makeEnvTexture(renderer);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 82;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 6.2, 0);

  // 光照分三层：半球环境（托底）→ 主方向光（塑形）→ 补光（只提暗部）。
  //
  // 旧配比 hemi 1.0 / dir 1.15 / fill 0.42 —— 环境光占了近一半能量，把方向光的
  // 塑形能力稀释殆尽：塔的受光面与背光面几乎同明度，整座塔读成「无光的棚拍
  // 塑料模型」。更致命的是主光方位角 40° 与默认机位视线 52° 只差 12°，等于顺光，
  // 可见面几乎全是受光面，连一条明暗交界线都没有 —— 没有交界线就没有体积。
  //
  // 现在：环境光压到 0.62（只保证暗部不死黑），主光提到 2.0 并挪到侧光位
  // （方位 147°、仰角 38°，与视线差 95°），让明暗交界线落在塔身上，用它刻画形体。
  // 主光色偏暖（0xfff6e8）、环境天光偏冷（0xf4f6fa）—— 冷暖对置，暗部才不会脏。
  const hemi = new THREE.HemisphereLight(0xf4f6fa, 0xe6dcc8, 0.62); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xfff6e8, 2.0);
  dir.position.set(-45, 42, 29); dir.castShadow = true;
  // 阴影相机范围必须 ≥ 接阴影的那块地面（近场 140 → ±70）。原来只到 ±56，
  // 近场有 14 m 宽的一圈落在 shadow map 之外，采样 clamp 到边缘纹素，被整片
  // 误判成处在阴影里 —— 表现就是地面上一圈固定半径的暗环。取 ±72 留余量，
  // 同时把 mapSize 提到 3072，把每纹素从 7 cm 拉回 4.7 cm，阴影边缘才不糊。
  // 阴影贴图 3072 在桌面把每纹素压到 4.7 cm，是「阴影边缘不糊」的关键；
  // 手机降到 2048（7 cm/纹素），画面整体缩小后这个差看不出，但显存与采样都省一半。
  const SM = IS_MOBILE ? 2048 : 3072;
  dir.shadow.mapSize.set(SM, SM);
  dir.shadow.camera.near = 1; dir.shadow.camera.far = 240;
  dir.shadow.camera.left = -72; dir.shadow.camera.right = 72;
  dir.shadow.camera.top = 72; dir.shadow.camera.bottom = -72;
  dir.shadow.bias = -0.0009;
  scene.add(dir);
  // 补光从主光的对侧来，只负责把背光面从死黑里拉回来。旧值 0.42 太强，
  // 等于把明暗交界线又抹平了一次；0.20 是「能看见暗部细节、但暗部依然是暗部」。
  const fill = new THREE.DirectionalLight(0xd8d2c6, 0.20); fill.position.set(30, 16, -26); scene.add(fill);

  TEX.floor = makeFloorTexture();
  TEX.wood = makeWoodTexture();
  TEX.stone = makeStoneTexture();
  TEX.rust = makeRustTexture();
  TEX.thatch = makeThatchTexture();
  TEX.rope = makeRopeTexture();
  // 2026-09-15：井场附属建筑（灶房 / 盐仓）的青砖、小青瓦、夯土
  TEX.brick = makeBrickTexture();
  TEX.tile = makeTileTexture();
  TEX.earth = makeEarthTexture();
  // 2026-09-15：三层环形山脊带的岩层层理。放在这里（anisotropy 循环之前）才能
  // 一起吃到各向异性过滤 —— 山是掠射角看过去的，没有各向异性会糊成一条色带。
  TEX.ridge = makeRidgeLaminarTexture();
  // 各向异性过滤：地面/石材在掠射角下才不会糊成一片、读成一条 mipmap 色带
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  MAX_ANISO = maxAniso;      // 构建期生成的贴图 clone 也要吃到（见 sizedMat）
  Object.keys(TEX).forEach((k) => { if (TEX[k] && TEX[k].isTexture) TEX[k].anisotropy = maxAniso; });

  buildGround();
  buildBackdrop();
  buildStation();
  initParts();
  bindUI();
  buildNav();
  applyLang();
  applyFocus(0);
  if (SELFTEST) runSelfTest();

  clock = new THREE.Clock();
  window.addEventListener('resize', onResize);
  animate();

  // 调试/自动化钩子：无头截图脚本可据此改写相机机位
  window.__sp = { THREE, scene, camera, controls, renderer, PART, PROCESS, focusOn, applyFocus,
    DUIJIA_SIZE, DUIJIA_AMAX, DUIJIA_RING_Y, DUIJIA_HARM,
    // 2026-09-15 SVG 贴图层：SVG_REG 里能读到每张贴图的 canvas、均值靶子、
    // 以及山体补偿系数 gain —— 探针要验「贴图有没有真的换上去、亮度有没有漂」，
    // 就只能靠这几个数，不能再抄一份常量。
    SVG_REG, TEX, RIDGE_MAPS, meanSRGB, meanLinear,
    // 附属建筑的选址与尺寸：探针要验「它在默认机位里到底落在哪一块屏幕」，
    // 而这个结论必须用代码里的同一份坐标算 —— 探针里再抄一份就等于埋第二份真相。
    YARD, KITCHEN, STORE };
  // DUIJIA_SIZE 一并导出：探针/自检都要按同一套尺寸判「铁靴不越窝口、杆不磨导环」，
  // 探针里再抄一份魔数就等于埋第二个真相（2026-09-15 碓杆重做时加的）。

  // 首帧渲染完成后揭幕：纸面同方向右移（与首页转场一致），双 rAF 确保场景已实际绘制一帧
  const loaderEl = document.getElementById('loader');
  if (loaderEl) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const wait = Math.max(0, 1000 - performance.now());
      setTimeout(() => {
        loaderEl.classList.add('revealed');
        const done = () => loaderEl.remove();
        loaderEl.addEventListener('transitionend', done, { once: true });
        setTimeout(done, 900);
      }, wait);
    }));
  }
}

// ============================================================
// 地面：井场夯土 + 一圈极淡的场地界定环（无网格，避免工业厂房感）
// ============================================================
// ============================================================
// 井场痕迹：一张「独一无二、不重复」的贴花，铺在近场地面上。
//
// 天车本体已经很细，脚下一片干净的地反而穿帮 —— 读成「新建的展台」而不是
// 「用了两百年的井场」。这里补的不是构件（加了就是往里堆东西），是**痕迹**：
//   ① 井口周围被反复踩实的土
//   ② 卤水溅出、水分蒸发后析出的盐霜 —— 自贡盐井最标志性的一件事
//   ③ 风篾锚桩四周的脚印（人在那儿站过、拉过绳）
// 全部低对比、只在中近景隐约可辨。贴图只铺一次（repeat 1），所以不会重复，
// 也不与地面那层 repeat 的夯土纹理打架。
// 径向对称，因此平面的 UV 朝向即使反了也看不出。
// ============================================================
function makeYardMarksTexture() {
  // 2026-09-15：1024 → 2048（移动端仍 1024）。这张是「近场 140 m 铺满一张、
  // 不重复」的痕迹层，1024 时只有 7.3 px/m（1 px 合 13.7 cm）—— 干裂纹、
  // 脚印这些「近处才看清」的东西全都卡在亚像素上。2048 翻倍到 14.6 px/m，
  // 这是地面近场观感提升最大的一处。线宽按 MK 缩放，保证观感不变、只变清晰。
  const s = IS_MOBILE ? 1024 : 2048;
  const MK = s / 1024;
  const reg = newSvgCanvas(s, 'yardmarks');
  const c = reg.canvas, x = reg.ctx;
  x.clearRect(0, 0, s, s);
  const K = s / 140;                     // 近场地面 140 m → 每米像素
  const mid = s / 2;

  // ① 井口周围被踩实的土：深浅不一、不闭合的弧
  for (let i = 0; i < 110; i++) {
    const r = (1.4 + RND() * 2.8) * K;
    const a0 = RND() * Math.PI * 2;
    const a1 = a0 + 0.15 + RND() * 0.55;
    x.strokeStyle = 'rgba(118,102,76,' + (0.05 + RND() * 0.07).toFixed(3) + ')';
    x.lineWidth = (2 + RND() * 10) * MK;
    x.beginPath();
    for (let k = 0; k <= 8; k++) {
      const a = a0 + (a1 - a0) * (k / 8);
      const rr = r * (1 + (RND() - 0.5) * 0.06);
      const px = mid + Math.cos(a) * rr, py = mid + Math.sin(a) * rr;
      if (k === 0) x.moveTo(px, py); else x.lineTo(px, py);
    }
    x.stroke();
  }

  // ② 盐霜：越靠近井口越密，向外迅速稀疏
  for (let i = 0; i < 2000; i++) {
    const a = RND() * Math.PI * 2;
    const r = Math.pow(RND(), 0.62) * 6.5 * K;
    const px = mid + Math.cos(a) * r, py = mid + Math.sin(a) * r;
    const rr = K * (0.05 + RND() * 0.3);
    const g = x.createRadialGradient(px, py, 0, px, py, rr);
    g.addColorStop(0, 'rgba(255,254,248,' + (0.10 + RND() * 0.16).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(255,254,248,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(px, py, rr, 0, Math.PI * 2); x.fill();
  }

  // ③ 锚桩四周的脚印：风篾落地半径 9.5 m、方位 22.5° + 45°k（与 STAY_AZ 一致）
  for (let k = 0; k < 8; k++) {
    const a = Math.PI / 8 + (k * Math.PI) / 4;
    const ax = mid + Math.cos(a) * 9.5 * K, az = mid + Math.sin(a) * 9.5 * K;
    for (let i = 0; i < 30; i++) {
      const aa = RND() * Math.PI * 2;
      const rr = K * (0.2 + RND() * 0.9);
      const px = ax + Math.cos(aa) * rr, py = az + Math.sin(aa) * rr;
      x.fillStyle = 'rgba(114,99,76,' + (0.06 + RND() * 0.07).toFixed(3) + ')';
      x.save();
      x.translate(px, py); x.rotate(aa + (RND() - 0.5) * 0.8);
      x.beginPath(); x.ellipse(0, 0, K * 0.075, K * 0.2, 0, 0, Math.PI * 2); x.fill();
      x.restore();
    }
  }

  // ④ 干裂纹：夯土失水后的细裂缝，从井口一侧向外爬（那里踩得最实、最先开裂）
  for (let i = 0; i < 80; i++) {
    const a = RND() * Math.PI * 2;
    let r = (1.5 + RND() * 5.5) * K;
    let px = mid + Math.cos(a) * r, py = mid + Math.sin(a) * r;
    x.strokeStyle = 'rgba(102,90,72,' + (0.05 + RND() * 0.07).toFixed(3) + ')';
    x.lineWidth = (0.8 + RND() * 1.3) * MK;
    x.beginPath(); x.moveTo(px, py);
    const segs = 3 + Math.floor(RND() * 4);
    for (let k = 0; k < segs; k++) {
      r += (0.25 + RND() * 0.7) * K;
      const aa = a + (RND() - 0.5) * 0.45;
      px = mid + Math.cos(aa) * r; py = mid + Math.sin(aa) * r;
      x.lineTo(px, py);
    }
    x.stroke();
  }

  // ⑤ 落地接触阴影（假 AO）：只动这一张贴图，不加任何构件。
  // 阴影贴图给得出「大块投影」，给不出「物体贴身那一圈又紧又深的暗」——
  // 缺了它，础石、地桩、地枕全都像浮在地上 1 cm。这里是补那一圈。
  // 坐标一律由常量推导（CORNER / DER.a0 / CART / DUIJIA / SHED / STAY_AZ / STAY_R），
  // 与几何同源：以后改形制，接触阴影会自己跟着走，不会各说各话。
  // 画布 x ↔ 世界 x、画布 y ↔ 世界 z（与 ③ 的桩位一致）。
  const AOe = (wx, wz, rx, rz, a) => {
    const px = mid + wx * K, py = mid + wz * K;
    x.save();
    x.translate(px, py);
    x.scale(rx * K, rz * K);          // 单位圆拉成椭圆；渐变跟着变换走
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, 'rgba(74,62,46,' + a.toFixed(3) + ')');
    g.addColorStop(0.5, 'rgba(74,62,46,' + (a * 0.5).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(74,62,46,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, 1, 0, Math.PI * 2); x.fill();
    x.restore();
  };

  // 四角础石（0.66 m 见方，落点 ±DER.a0）
  CORNER.forEach(([sx, sz]) => AOe(sx * DER.a0, sz * DER.a0, 0.78, 0.78, 0.22));
  // 8 根风篾地桩（入土只承拉，落点 STAY_R / STAY_AZ）
  for (let k = 0; k < 8; k++) {
    const a = Math.PI / 8 + (k * Math.PI) / 4;
    AOe(Math.cos(a) * STAY_R, Math.sin(a) * STAY_R, 0.55, 0.55, 0.20);
  }
  // 大车：地枕 0.54×2.7（长边沿 z）+ 两根承轴门柱落地点
  AOe(CART.x, CART.z, 0.58, 1.78, 0.20);
  AOe(CART.x, CART.z - 0.95, 0.46, 0.46, 0.22);
  AOe(CART.x, CART.z + 0.95, 0.46, 0.46, 0.22);
  // 碓架（已迁到 19.5 m 外的另一口井）：门柱础石 / 四根斜撑脚 / 碓窝周边 / 扶手立柱脚。
  // AOe 收的是世界坐标，而碓架整体绕 Y 转了 rotY —— 局部偏移必须过同一套变换。
  const djW = (lx, lz) => [
    DUIJIA.x + lx * Math.cos(DUIJIA.rotY) + lz * Math.sin(DUIJIA.rotY),
    DUIJIA.z - lx * Math.sin(DUIJIA.rotY) + lz * Math.cos(DUIJIA.rotY),
  ];
  [-1.45, 1.45].forEach((lx) => { const p = djW(lx, 0); AOe(p[0], p[1], 0.58, 0.58, 0.22); });
  [-1, 1].forEach((s) => [-1, 1].forEach((t) => {
    const p = djW(s * 1.61, t * 1.15); AOe(p[0], p[1], 0.42, 0.42, 0.20);
  }));
  { const p = djW(-2.45, 0); AOe(p[0], p[1], 1.72, 1.72, 0.26); }   // 窝口一圈被凿屑与脚踩乱
  [-1, 1].forEach((s) => { const p = djW(5.50, s * 0.80); AOe(p[0], p[1], 0.44, 0.44, 0.20); });
  // 寮棚：四角础石，按 buildShed 的同一套变换推到世界坐标
  // （s.rotation.y = atan2(SHED.x, SHED.z)，绕 Y 变换 x_w = x·cos+z·sin, z_w = -x·sin+z·cos）
  (() => {
    const th = Math.atan2(SHED.x, SHED.z);
    const cs = Math.cos(th), sn = Math.sin(th);
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => {
      const lx = sx * 1.8, lz = sz * 1.4;          // W/2, D/2
      AOe(SHED.x + lx * cs + lz * sn, SHED.z - lx * sn + lz * cs, 0.46, 0.46, 0.20);
    }));
  })();

  // ⑥ 手绘 SVG 层：龟裂网 / 拖痕 / 盐壳。这一层是后合成的（画在所有 canvas 内容
  //    之上，含 ⑤ 的假 AO）。裂纹是低 alpha 的细线，压在一圈软边 AO 上不会读成
  //    「层级错误」；反过来若把它垫在底下，AO 会把裂纹最锐利的那一段糊掉。
  //    透明贴图不做均值守恒（没有「底色」可归一化）。
  applySvgLayer(yardSvg(s), reg);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return regTex(t);
}

function buildGround() {
  // 地面分两块，只为绕开一个坑：阴影相机（dir.shadow）只覆盖原点 ±56，
  // 范围外的地面落在 shadow map 之外，采样 clamp 到边缘纹素，会被整片误判成
  // 处在阴影里。原来地面只到 ±80，坏区只是贴边的一条；地面一放大到 ±210，
  // 它就变成中远处一大片暗带。所以：近场接阴影、远场不接。
  // 两块各用一份贴图 clone —— repeat 必须各自按自己的米数走，才能保持同样的
  // 每格 10 m，接缝处看不出拼贴尺度跳变。
  const floorInner = TEX.floor.clone();
  floorInner.needsUpdate = true;
  // clone 出来的 texture 不继承 anisotropy：init 里那次统一赋值发生在
  // buildGround 之前，两块地面都是之后才 clone 的。漏掉这一行的后果不是
  // 「糊一点」，而是**近处比远处更糊**（近处掠射角更大），看着像地面贴反了。
  floorInner.anisotropy = MAX_ANISO;
  floorInner.repeat.set(14, 14);                 // 140 m / 10 m
  regTex(floorInner);        // clone 共享同一张 canvas，但各自有独立的 version ——
                             // SVG 升级完必须逐个置 needsUpdate，否则这块还停在旧内容
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 140),
    // dithering 治的是「色阶带」：暖纸底(#FAFAF8)与地面(#E7E3D9)色差很小，雾把
    // 地面沿相机距离逐渐推向纸底时，8-bit 量化会在这条几乎看不见的渐变上切出一圈圈
    // 同心弧形台阶 —— 俯视与拉远机位下最刺眼，读成「地上有水波」。three 的 dithering
    // 在片元输出前加一点点噪声把台阶打碎，是渲染器里的标准解法，代价为零。
    new THREE.MeshStandardMaterial({ map: floorInner, color: 0xE7E3D9, roughness: 0.97, metalness: 0.0, dithering: true })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = GROUND_Y - 0.02;
  plane.receiveShadow = true;
  scene.add(plane);

  // 远场 420 → 640：最外一层山（岭线 335 + 游走 30）与地面的相交半径可达 ≈276 m，
  // 地面必须比它更远，否则山脚落在「既无地面、又无山体」的虚空里，山下会露出
  // 纸底色的空隙。repeat 跟着走才能保持每格 10 m（近场 14 / 远场 64）。
  const floorFar = TEX.floor.clone();
  floorFar.needsUpdate = true;
  floorFar.anisotropy = MAX_ANISO;
  floorFar.repeat.set(64, 64);
  regTex(floorFar);
  const farGround = new THREE.Mesh(
    new THREE.PlaneGeometry(640, 640),
    new THREE.MeshStandardMaterial({ map: floorFar, color: 0xE7E3D9, roughness: 0.97, metalness: 0.0, dithering: true })
  );
  farGround.rotation.x = -Math.PI / 2;
  farGround.position.y = GROUND_Y - 0.06;        // 错开 4 cm，避免与近场共面打架
  farGround.receiveShadow = false;
  scene.add(farGround);

  // 痕迹层压在近场地面之上 8 mm。用 Standard 而非 Basic：它必须跟着吃光照与
  // 阴影 —— 否则塔的投影盖过来时，底下的盐霜兀自发亮，一眼假。
  const marks = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 140),
    new THREE.MeshStandardMaterial({
      map: makeYardMarksTexture(), transparent: true, depthWrite: false,
      roughness: 1.0, metalness: 0.0,
    })
  );
  marks.rotation.x = -Math.PI / 2;
  marks.position.y = GROUND_Y - 0.012;
  marks.receiveShadow = true;
  scene.add(marks);

  // 已删：原有一段 RingGeometry(11.2, 11.55) 的浅色圆环。两个原因：
  // ① 它是全场唯一「贴在地面上却用 MeshBasicMaterial」的东西 —— 不吃光也不吃阴影。
  //    而主光 (-45,42,29) 的仰角是 38.1°，塔高 13.9 m → 影长 13.9/tan(38.1°) ≈ 17.7 m，
  //    塔影必然扫过 r≈11.4。阴影里的地面被压暗、圆环亮度却不变，它反而比周围更亮，
  //    读成阴影里一道发亮的弧 —— 与「底下的盐霜兀自发亮」是同一类假。
  // ② 它想表达的「井周被踩实」已由 makeYardMarksTexture ① 的 110 条踩踏弧、
  //    ③ 的桩位脚印承担，而且那两层是 Standard 材质、跟着吃光吃影。留着只是重复。
}

// ============================================================
// 远景：远处的井场与丘陵
// 自贡的真实天际线是「天车林立、笕管纵横、锅灶密布」—— 一座孤零零的天车
// 读不出这件事。远景只用极淡的平涂剪影：不投影、不接阴影、不进 PART
// （因此不参与聚焦压暗），靠明度差退到纸面之后，只提供场所感，不抢主体。
// ============================================================
function farDerrick(h, a0, mat) {
  const grp = new THREE.Group();
  const a1 = a0 * 0.30;
  const CN = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  // 杆件要够粗：细杆在 40~70 m 外会读成「线框 / 玻璃塔」，粗一点才有体量感
  CN.forEach(([sx, sz]) => {
    grp.add(strut(new THREE.Vector3(sx * a0, 0, sz * a0), new THREE.Vector3(sx * a1, h, sz * a1), 0.30, mat));
  });
  [0.30, 0.58, 0.86].forEach((t) => {
    const y = h * t, a = a0 + (a1 - a0) * t;
    [[0, 1], [1, 2], [2, 3], [3, 0]].forEach(([i, j]) => {
      grp.add(strut(new THREE.Vector3(CN[i][0] * a, y, CN[i][1] * a), new THREE.Vector3(CN[j][0] * a, y, CN[j][1] * a), 0.18, mat));
    });
  });
  grp.add(strut(new THREE.Vector3(-a1 - 0.70, h, 0), new THREE.Vector3(a1 + 0.70, h, 0), 0.22, mat));
  return grp;
}

// ------------------------------------------------------------
// 远景：群山（天车就坐落在被它们围出的谷地里）
//
// 上一版远山是失败的，根因不是颜色也不是高度，而是**形状**：散落在地面上的压扁
// 椭球，从略高机位看下去就是一个个闭合的椭圆边界 —— 只能读成地上一摊浅色水洼，
// 加高变怪、加淡消失，没有出路。山之所以读作山，靠的是「没有底边」：
// 底部沉到地下、彼此连绵，只在地平线上留一条起伏的脊。
//
// 所以这里做**一圈环形山脊带**（不是若干座孤立的山），三层，参数约束有三条：
//   ① 坡脚半径 = ridge − RIDGE_SLOPE·h，必须 > controls.maxDistance(82)，
//      否则相机拉到最远就贴在山脸上、整片糊掉。现三层坡脚 ≈130 / 158 / 190。
//   ② 山脊仰角必须排成阶梯，且都落在默认机位的画面内。默认机位 (20,14,26)
//      视线俯角 12.9°、垂直 FOV 45° → 画面上边缘在仰角 ≈9.6°。
//      现三层 ≈4.9° / 7.4° / 9.3°，层层后退 —— 挤在一起就读不出群山，只是一堵墙。
//   ③ 山脚 y 必须低于地面，让地面边缘和前一层山依次遮住它的下边界。
// 大气透视由 mix（与 BG 混色）与雾共同完成：越远 mix 越大、雾越厚。
// 山脊的「宽高比」是读不读得出山的关键。第一版主频只有 3（每层 3 个峰），
// 近层周长 1181 m → 单峰宽 393 m、高 40 m，宽高比 ≈10:1，而默认机位水平视野
// 只覆盖 285 m 弧长 —— 画面里连一座完整的山都装不下，看到的全是山腰，于是三层
// 退化成三条平行的浅色带。现在把主频提到 7~11（近层单峰宽 ≈117 m、宽高比 ≈3:1），
// 视野内能看到 2~3 座山，峰谷才成立。
// f = 三个谐波（必须整数才能首尾闭合），wf = 脊线在半径方向的游走频率。
// uvRep = 层理贴图在环向的重复次数。三层山的周长不同（2πR = 1288/1665/2105 m），
// 用同一个重复数会让三层的纹理密度差 1.6 倍 —— 越远的那层纹理越被拉伸、越糊。
// 按「一格 ≈60 m」各自取整（22/28/36），三层密度对齐，且都是整数、重复处不错位。
const RIDGES = [
  { seg: 112, ridge: 205, amp: 20, hMin: 24, hMax: 46, mix: 0.50, f: [11, 19, 31], wf: [3, 7], uvRep: 22,
    shade: [0.89, 0.92, 0.96, 1.01, 1.06], seed: 9137 },
  { seg: 120, ridge: 265, amp: 25, hMin: 44, hMax: 70, mix: 0.62, f: [9, 17, 27], wf: [3, 8], uvRep: 28,
    shade: [0.87, 0.91, 0.95, 1.01, 1.07], seed: 2244 },
  { seg: 128, ridge: 335, amp: 30, hMin: 66, hMax: 96, mix: 0.72, f: [7, 13, 23], wf: [2, 5], uvRep: 36,
    shade: [0.85, 0.90, 0.95, 1.01, 1.08], seed: 5521 },
];
// 层理贴图「有意压暗」整座山（贴图最亮只能是 #FFF，只能往下压）。压掉多少必须
// 量出来、再乘回 material.color —— 否则「天 250 > 远山 228 > 中山 215 > 近山 205」
// 这条明度阶梯会整体掉一档，山就退不回纸面之后了。
const RIDGE_MAPS = [];        // 三层山的 material，等贴图光栅化完统一补偿
// 层理强度旋钮（唯一一个「靠观感定」的数，其余都能算）。
// 实测对照（探针 _probe_svgtex.mjs 的 detail = fin.sd − raw.sd，单位是灰阶）：
//   1.0 → +0.67（几乎看不见：山还要被雾淡化 28~58%）
//   2.4 → 见下方实测值，目标是 +1.6~2.0 —— 「看得出岩层，但仍退在纸面之后」
// 敢放心拧大的原因：层理压暗多少都会被 material.color 的均值补偿自动吃掉，
// 明度阶梯（208 / 220 / 230）不受影响 —— 实测漂移 0 / −0.1 / −0.2。
const RIDGE_LAMINAR = 2.4;
const RIDGE_INK = 0x7A7E8A;      // 远山如黛：黛本来是青黑 —— 蓝要高于绿。
// 原 0x77807E 的 G(128) 高于 R(119)、B(126) 垫底，渲染出来是 (199,201,199)：
// 中性偏绿灰，和暖纸底 (#FAFAF8) 放在一起像一块脏灰，不是「如黛」。
// 改成 0x7A7E8A（B 最高）后体感亮度不变（sRGB 加权 125.9 → 126.0），
// 三层山的明度阶梯（天 250 > 远山 228 > 中山 215 > 近山 205）一格都不用重标。
// 烘焙光照参数。RIDGE_LH 是主光位置 (-45,42,29) 的水平分量归一化方向，
// 只用来判「朝阳面 / 背阴面」；RIDGE_AMP 是明暗摆幅（±18%），均值恒为 1.0。
const RIDGE_LH = [-0.84, 0.54];
const RIDGE_AMP = 0.18;
const RIDGE_SLOPE = 1.75;        // 坡的水平/垂直比（≈30°）
const RIDGE_BASE = -24;          // 山脚埋深（务必低于地面，否则露出底部轮廓）
// 垂直分层：0 = 山脚，1 = 山脊。分 4 层时每两层之间是一整片平面，flatShading
// 让它在坡面上显成一道水平的明暗台阶（读起来像等高线）；加到 5 层把折面切细。
const RIDGE_T = [0, 0.28, 0.54, 0.78, 1];

// 山脊高度剖面：多频正弦叠加后取 pow 压低谷、突出峰（pow 越大，山口越深、
// 峰越孤立 —— 1.35 时谷太浅，整条脊线读成一个波，山与山之间没有分界）。
// 频率由 cfg.f 给，必须是整数，否则 θ=0 与 2π 接不上、闭合处会裂一道缝。
function ridgeProfile(t, ph, f) {
  const s = 0.55 * Math.sin(t * 6.2832 * f[0] + ph[0])
          + 0.29 * Math.sin(t * 6.2832 * f[1] + ph[1])
          + 0.16 * Math.sin(t * 6.2832 * f[2] + ph[2]);
  return Math.pow((s + 1) * 0.5, 1.6);
}
// 山脊在半径方向上的游走，让脊线前后错落而不是一个正圆
function ridgeWander(t, ph, wf) {
  return 0.62 * Math.sin(t * 6.2832 * wf[0] + ph[3])
       + 0.38 * Math.sin(t * 6.2832 * wf[1] + ph[4]);
}

function ridgeBand(cfg, mat) {
  const rnd = mulberry32(cfg.seed);
  const ph = [0, 0, 0, 0, 0].map(() => rnd() * 6.2832);
  const pos = [], col = [];
  const base = mat.color;
  const at = (th, h, rr, k) => {
    const t = RIDGE_T[k];
    const y = RIDGE_BASE + (h - RIDGE_BASE) * t;
    // (1−t)^0.85：坡是凹的，山脚摊开、上部收陡 —— 锥体会读成帐篷，凹坡才像丘陵
    const r = rr - RIDGE_SLOPE * h * Math.pow(1 - t, 0.85);
    return [Math.cos(th) * r, y, Math.sin(th) * r];
  };
  // 竖向明暗：山脚压暗、山脊提亮。单靠 flatShading 不够 —— 谷地里看到的
  // 全是朝向相机的内坡，法线方向接近，明暗差摊不出来，山会读成一张平色纸。
  // 顶点色与 material.color 相乘，把这段梯度钉进几何里。
  // 面明暗：这一步是「烘焙光照」。山从 MeshLambertMaterial（吃实时方向光）改成
  // MeshBasicMaterial（不吃光）之后，明暗必须自己算进顶点色 —— 否则三层山会跟着
  // 场景主光一起被照亮，而谷地四周的内坡法线全都朝向圆心（≈朝向光源），结果整环
  // 一起变亮、只剩少数外坡发暗，读成大片折纸，比塔还抢眼。
  // 只用「水平法线」判朝阳/背阴：坡面倾角会把光向的竖直分量带进来，把该有的
  // 明暗差摊平掉。几何是 non-indexed，每个顶点只属于一个三角形，所以按面算、把
  // 同一个值写给该面的三个顶点，正好等价于 flatShading 的效果。
  // 顶点色只写「灰度乘数」（围绕 1.0 的相对明暗），不写颜色本身 —— three 里最终
  // 颜色 = material.color × vertexColor，顶点色里若再乘一遍 base，等于把颜色平方了
  // 一次，整环会塌进暗部（实测近层山因此只有 136~160，与地面 161 撞在一起、
  // 读不出「退到纸面之后」）。颜色交给 material.color 单独承载。
  // 2026-09-15 加 UV，为的是把「横向岩层」贴上去。原本这层几何连 uv 属性都没有，
  // 任何 map 都贴不上。u = 环向（沿山脊走一圈，按 cfg.uvRep 重复，各层按自己的
  // 周长取整，保证三层的纹理密度一致），v = 山脚→山脊。
  // v 收进 [0.02, 0.98]：贴着 0/1 采样会撞上线性过滤的半纹素边缘，山脚会多出
  // 一条极淡的横带 —— 远山本来就淡，这种假带很显眼。
  const uv = [];
  const vOf = (k) => 0.02 + 0.96 * RIDGE_T[k];
  const put = (p, k, lit, u) => {
    pos.push(p[0], p[1], p[2]);
    uv.push(u, vOf(k));
    const s = cfg.shade[k] * lit;
    col.push(s, s, s);
  };
  const nrm = (p, q, r) => {
    const ux = q[0] - p[0], uy = q[1] - p[1], uz = q[2] - p[2];
    const vx = r[0] - p[0], vy = r[1] - p[1], vz = r[2] - p[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    return [nx / l, ny / l, nz / l];
  };
  const litOf = (p, q, r) => {
    const n = nrm(p, q, r);
    // 取内坡：法线翻到朝向谷地（圆心）的那一侧，再看它朝不朝光
    let nx = n[0], nz = n[2];
    const cx = -(p[0] + q[0] + r[0]) / 3, cz = -(p[2] + q[2] + r[2]) / 3;
    if (nx * cx + nz * cz < 0) { nx = -nx; nz = -nz; }
    const nl = Math.hypot(nx, nz) || 1;
    const d = (nx / nl) * RIDGE_LH[0] + (nz / nl) * RIDGE_LH[1];
    // 围绕 1.0 来回摆：朝阳面 +18%、背阴面 −18%。均值因此恒为 1.0，material.color
    // 就能直接当成「山的平均明度」来标定 —— 调 mix 时不必再补偿烘焙的整体压暗。
    return 1 + RIDGE_AMP * d;
  };
  for (let i = 0; i < cfg.seg; i++) {
    const t0 = i / cfg.seg, t1 = (i + 1) / cfg.seg;
    const th0 = t0 * 6.2832, th1 = t1 * 6.2832;
    const h0 = cfg.hMin + (cfg.hMax - cfg.hMin) * ridgeProfile(t0, ph, cfg.f);
    const h1 = cfg.hMin + (cfg.hMax - cfg.hMin) * ridgeProfile(t1, ph, cfg.f);
    const r0 = cfg.ridge + cfg.amp * ridgeWander(t0, ph, cfg.wf);
    const r1 = cfg.ridge + cfg.amp * ridgeWander(t1, ph, cfg.wf);
    const u0 = (i / cfg.seg) * cfg.uvRep, u1 = ((i + 1) / cfg.seg) * cfg.uvRep;
    for (let k = 0; k < RIDGE_T.length - 1; k++) {
      const A = at(th0, h0, r0, k), B = at(th0, h0, r0, k + 1);
      const C = at(th1, h1, r1, k + 1), D = at(th1, h1, r1, k);
      const l1 = litOf(A, B, C);
      put(A, k, l1, u0); put(B, k + 1, l1, u0); put(C, k + 1, l1, u1);
      const l2 = litOf(A, C, D);
      put(A, k, l2, u0); put(C, k + 1, l2, u1); put(D, k, l2, u1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  // non-indexed 上 computeVertexNormals 给每个三角形独立法线，配合 flatShading
  // 得到棱面 —— 坡面在环向上摆动 ±20°，明暗差就是山的体量感来源
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

function buildBackdrop() {
  const g = new THREE.Group();
  const bg = new THREE.Color(BG);

  // 远处的天车：三座，站在山前的平地上说「天车林立」。
  // mix = 与 BG 的混色比例。有山之后这里连着压深过两轮：天车在 40~70 m，比最近
  // 一层山的山脚（≈144 m）近得多，按大气透视必须明显比山深。最初 0.46/0.58/0.68
  // 是「山不存在」时定的，对着山看正好同明度、等于隐形；0.30/0.40/0.48 又比山淡，
  // 读成比山更远的幽灵白架子。现在 0.22/0.30/0.38，稳定落在山之前。
  // 方位刻意错开默认机位（(20,14,26) → 视线方位角 52°，故背景正中是 232°）：
  // 初版有一座正好落在 240°，被主塔整个挡住。现在三座分布在 198/252/305，
  // 任一机位下最多挡住一座，绕一下才能看全 —— 这也正好是「天车林立」的意思。
  const FAR = [
    [40, 198, 10.5, 1.35, 0.22],
    [56, 252, 8.5, 1.15, 0.30],
    [70, 305, 12.0, 1.55, 0.38],
  ];
  FAR.forEach(([RR, deg, h, a0, mix]) => {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(WOOD_DARK).lerp(bg, mix), fog: true });
    const a = (deg * Math.PI) / 180;
    const d = farDerrick(h, a0, mat);
    d.position.set(Math.cos(a) * RR, 0, Math.sin(a) * RR);
    d.rotation.y = a;
    g.add(d);
  });

  // 远景件数不多、材质只有 4 种，合并后只剩 4 个 mesh
  const holder = new THREE.Group();
  emit(g);
  flushBin(holder);

  // 三层山各自独立入场景，不走合并：它们面数本来就少（合计约 1.7k 三角），
  // 而 flatShading 依赖 shader 里的 derivative，合并与否都一样，但独立 mesh
  // 才能单独调 mix / 单独开关来排查「哪一层读不出来」。
  RIDGES.forEach((cfg) => {
    // MeshBasic 而非 Lambert：明暗已经烘进顶点色，材质不再吃场景光。这样山与
    // 「远天车」（本来就是 Basic + mix）说同一套语言，都退到纸面之后；更重要的是
    // 调主光时不会再牵动远景 —— 之前改一次光位，三层山的明度就得重调一遍。
    // by 2026-09-15：加 map = 岩层层理。Basic 不吃光，所以 map 只能当「照度乘数」用，
    // 这正是我们要的：它压在顶点色之下，只提供横向层理，不引入任何新光照。
    const base = new THREE.Color(RIDGE_INK).lerp(bg, cfg.mix);
    const mat = new THREE.MeshBasicMaterial({
      color: base.clone(),
      map: TEX.ridge,
      vertexColors: true,
      dithering: true,            // 淡渐变在 8-bit 下会切出色阶带，同地面
      fog: true,
      side: THREE.DoubleSide,     // 绕序朝外，站在谷地里看到的是内侧，双面省事
    });
    RIDGE_MAPS.push({ mat: mat, base: base });
    holder.add(ridgeBand(cfg, mat));
  });
  // 层理贴图是「只能压暗」的（sRGB 里最亮就是 #FFF）。它把整座山压掉多少，
  // 必须量出来乘回 material.color —— 否则「天 250 > 远山 228 > 中山 215 > 近山 205」
  // 这条明度阶梯会整体掉一档，山就退不回纸面之后了。
  // 在线性域量：贴图采样后是与 color 在**线性空间**相乘的，sRGB 域量出来的差一档。
  const ridgeReg = SVG_REG.find((r) => r.name === 'ridge');
  if (ridgeReg) {
    ridgeReg.onReady = (reg) => {
      const m = meanLinear(reg.ctx, reg.size);
      const gain = m > 0.05 ? 1 / m : 1;
      RIDGE_MAPS.forEach((e) => { e.mat.color.copy(e.base).multiplyScalar(gain); });
      reg.gain = gain;          // 探针读这个数，别让「补偿了多少」变成第二份真相
    };
  }

  holder.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  scene.add(holder);
}

// ============================================================
// 模型构建：整座天车是一套物理模型，只构建一次、置于原点；
// PROCESS 的 8 项只是「构件导览」，仅供相机聚焦与双语详情使用。
// ============================================================
function buildStation() {
  const g = new THREE.Group();
  g.position.set(0, 0, 0);

  PART_ORDER.forEach((name) => { PART[name] = new THREE.Group(); g.add(PART[name]); });

  buildWell();
  buildTower();
  buildSkyRoller();
  buildStays();
  PART.bailerAnim = buildBailer();
  buildCart();
  buildGroundRoller();
  buildDuijia();
  buildShed();
  // 附属建筑放在**最后**：它用本地随机流，但仍然不该有机会影响既有构件的
  // 随机序列 —— 放在末尾 = 就算将来有人给它换成全局 RND() 也不会伤到别人。
  buildYard();

  scene.add(g);
}

// ------------------------------------------------------------
// 井口：石砌井唇 + 井筒暗孔 + 石板井台（四角础石就落在台上）
// 井口即塔心（0,0）——真实天车正是骑在井口之上，提卤绳自天辊垂直落井。
// ------------------------------------------------------------
function buildWell() {
  const { x: X, z: Z } = WELL;
  const part = PART.well;

  // 井口踩踏面：一圈被踩实的夯土（薄、与地面同质——不再是一块突兀的石板）
  const apron = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.8, 0.06, 40),
    new THREE.MeshStandardMaterial({ map: TEX.floor, color: 0xD6CFC1, roughness: 0.99 })
  );
  apron.position.set(X, 0.035, Z); apron.receiveShadow = true; part.add(apron);

  // 石砌井唇：一圈石块箍住井口，防潮固壁
  const ringN = 16;
  for (let i = 0; i < ringN; i++) {
    const a = (i / ringN) * Math.PI * 2;
    // 井唇由 0.72 降到 0.56。0.72 高的石圈会把井口整个围成一根石柱，
    // 从任何接近人眼的高度都看不见井 —— 而「这儿有一口深井」正是这个场景的题眼。
    const blk = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.56, 0.30), vStone(0xA89A82, 0.96));
    blk.position.set(X + Math.cos(a) * 0.84, 0.28, Z + Math.sin(a) * 0.84);
    blk.rotation.y = -a;
    blk.scale.set(1, 0.94 + RND() * 0.12, 1);
    blk.castShadow = true; blk.receiveShadow = true; part.add(blk);
  }
  const cap = new THREE.Mesh(hoopGeoC(0.97, 0.1, 32), vStone(0x9C8F78, 0.95));
  cap.rotation.x = Math.PI / 2; cap.position.set(X, 0.58, Z); cap.castShadow = true; part.add(cap);
  const band = new THREE.Mesh(hoopGeoC(1.01, 0.035, 32), ironS());
  band.rotation.x = Math.PI / 2; band.position.set(X, 0.38, Z); part.add(band);

  // 井筒暗孔：汲卤筒下探时没入此孔
  // 顶面抬到 0.50（井唇口 0.56 之下）：略高的机位能看进这个暗孔，才读得出是井。
  // 原来顶面在 0.62、井唇顶在 0.72 —— 洞口永远藏在石圈里，从外面看就是一块石墩。
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 1.4, 28),
    new THREE.MeshStandardMaterial({ color: 0x1C1814, roughness: 1.0, metalness: 0.0 })
  );
  shaft.position.set(X, -0.20, Z); part.add(shaft);
}

// ------------------------------------------------------------
// 塔身：四根角柱（束柱）+ 每级四面箍梁 + 层间四面斜撑（逐层换向）
// ------------------------------------------------------------
const CORNER = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
// 第 i 个面的两个角序号（面法线依次为 -z、+x、+z、-x）
const FACE = [[0, 1], [1, 2], [2, 3], [3, 0]];

function buildTower() {
  const part = PART.cols;

  // 角柱分三段（束根数 4→3→2 递减），分段线正好落在箍梁上
  STAGE.forEach((st) => {
    CORNER.forEach(([sx, sz]) => {
      emit(bundleColumn(
        new THREE.Vector3(sx * HALF(st.y0), st.y0, sz * HALF(st.y0)),
        new THREE.Vector3(sx * HALF(st.y1), st.y1, sz * HALF(st.y1)),
        { count: st.count, rad: st.rad, spread: st.spread, color: WOOD, rough: 0.86, bindStep: st.bindStep, ironEvery: 4 }
      ));
    });
  });
  flushBin(part);

  // 每级四面水平箍梁（端部收进束身，不出头）
  const beamMat = vWood(WOOD_DARK, 0.9);
  RING_Y.forEach((y) => {
    const a = HALF(y) - 0.07;
    FACE.forEach(([i, j]) => {
      const dir = CORNER[j].map((v, k) => v - CORNER[i][k]);
      const p1 = new THREE.Vector3(CORNER[i][0] * a, y, CORNER[i][1] * a);
      const p2 = new THREE.Vector3(CORNER[j][0] * a, y, CORNER[j][1] * a);
      part.add(strut(p1, p2, 0.17, beamMat));
    });
  });

  // 层间斜撑：每层每面一根，方向逐层换向（读起来是连续之字，而非乱麻）
  const braceMat = vWood(WOOD, 0.9);
  for (let k = 0; k < RING_Y.length - 1; k++) {
    const y0 = RING_Y[k], y1 = RING_Y[k + 1];
    const a0 = HALF(y0) - 0.07, a1 = HALF(y1) - 0.07;
    FACE.forEach(([i, j], fi) => {
      const flip = (k + fi) % 2 === 0;
      const A = flip ? CORNER[i] : CORNER[j];
      const B = flip ? CORNER[j] : CORNER[i];
      part.add(strut(
        new THREE.Vector3(A[0] * a0, y0, A[1] * a0),
        new THREE.Vector3(B[0] * a1, y1, B[1] * a1),
        0.10, braceMat
      ));
    });
  }

  // 础石：四角角柱落地处
  CORNER.forEach(([sx, sz]) => {
    // 原来 y=0.28、高 0.38 → 底面在 +0.09，整块础石浮在地面上方 9 cm
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.38, 0.66), vStone(0xA5977E, 0.96));
    pl.position.set(sx * DER.a0, 0.17, sz * DER.a0);
    pl.rotation.y = (RND() - 0.5) * 0.24;
    pl.castShadow = true; pl.receiveShadow = true; part.add(pl);
  });
}

// ------------------------------------------------------------
// 塔顶：天箍头 → 天夹板 → 天辊（带槽扁平木轮，架于轴座）
// 依据历史构造（《自流井图说》）：天辊置于「天夹板」中，含辊把子(轴)、座子(轴座)、轴瓦；
// 风篾系于「天箍头」（角柱顶端束箍），四面斜牵。
// ------------------------------------------------------------
function buildSkyRoller() {
  const part = PART.top;
  const H = DER.H, aT = HALF(H), { topY, rollerR: RR, rollerW: wheelW } = DER;

  // 天箍头：四角柱顶端的加宽短箍（风篾系于此）
  CORNER.forEach(([sx, sz]) => {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.30, 0.42), vWood(WOOD_DARK, 0.9));
    cap.position.set(sx * aT, H - 0.14, sz * aT);
    cap.castShadow = true; part.add(cap);
  });
  // 顶部方框（连接四根天箍头，同时是风篾的挂点环）
  FACE.forEach(([i, j]) => {
    part.add(strut(
      new THREE.Vector3(CORNER[i][0] * aT, H - 0.14, CORNER[i][1] * aT),
      new THREE.Vector3(CORNER[j][0] * aT, H - 0.14, CORNER[j][1] * aT),
      0.17, vWood(WOOD_DARK, 0.9)
    ));
  });

  // 天夹板：自天箍头收拢上升到轴座的两块夹板（轴沿 z）
  const yokeZ = 0.30, yokeTop = topY - 0.06;
  [-1, 1].forEach((s) => {
    part.add(bundleColumn(
      new THREE.Vector3(0, H - 0.05, s * (aT - 0.06)),
      new THREE.Vector3(0, yokeTop, s * yokeZ),
      { count: 2, rad: 0.07, spread: 0.055, color: WOOD, rough: 0.88, bindStep: 0.42, ironEvery: 3, splices: 1 }
    ));
  });
  // 轴座横梁（天夹板顶联系梁）
  const yokeBeam = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.17, yokeZ * 2 + 0.26), vWood(WOOD_DARK, 0.9));
  yokeBeam.position.set(0, topY - 0.02, 0); yokeBeam.castShadow = true; part.add(yokeBeam);

  // 天辊（轴沿 z，轮面在 XY 平面）
  const wheelGrp = new THREE.Group();
  wheelGrp.position.set(0, topY, 0);
  part.add(wheelGrp);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(RR, 0.062, 8, 30), woodTex(WOOD_DARK, 0.9));
  rim.castShadow = true; wheelGrp.add(rim);
  const groove = new THREE.Mesh(hoopGeoC(RR, 0.024, 30), bambooS());
  wheelGrp.add(groove);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, wheelW + 0.12, 12), woodTex(0x473A2B, 0.9));
  hub.rotation.x = Math.PI / 2; wheelGrp.add(hub);
  const spokeN = 6;
  for (let k = 0; k < spokeN; k++) {
    const ang = (k / spokeN) * Math.PI * 2;
    const sp = new THREE.Mesh(new THREE.BoxGeometry(RR - 0.1, 0.05, 0.05), woodTex(WOOD, 0.85));
    sp.position.set(Math.cos(ang) * (0.1 + RR) / 2, Math.sin(ang) * (0.1 + RR) / 2, 0);
    sp.rotation.z = ang; sp.castShadow = true; wheelGrp.add(sp);
  }
  // 辊把子（轴）+ 座子/轴瓦（铁轴承端盖）
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, wheelW + 0.5, 10), woodTex(0x473A2B, 0.92));
  axle.rotation.x = Math.PI / 2; axle.position.set(0, topY, 0); part.add(axle);
  [-1, 1].forEach((s) => {
    const seat = new THREE.Mesh(hoopGeoC(0.085, 0.028, 12), ironS());
    seat.rotation.x = Math.PI / 2; seat.position.set(0, topY, s * (wheelW / 2 + 0.09)); part.add(seat);
  });

  PART.skyWheel = wheelGrp;
}

// ------------------------------------------------------------
// 风篾：自天箍头伞状散出的 8 根篾索 + 地桩
// 挂点取「天箍头环在各自方位上的外缘」，篾索因此贴在塔身上、不像凭空悬挂。
// ------------------------------------------------------------
function staySegments() {
  const a = HALF(STAY_Y);
  return STAY_AZ.map((az) => {
    const m = Math.max(Math.abs(Math.cos(az)), Math.abs(Math.sin(az)));
    const r0 = a / m;
    return {
      az,
      p1: [Math.cos(az) * r0, STAY_Y, Math.sin(az) * r0],
      p2: [Math.cos(az) * STAY_R, 0.30, Math.sin(az) * STAY_R],
    };
  });
}

function buildStays() {
  const part = PART.stays;
  const woodDark = woodTex(WOOD_DARK, 0.9);
  staySegments().forEach(({ p1, p2 }) => {
    // 0.035 是原先方截面的边长；等视觉重量换算到圆截面取 r=0.021
    part.add(ropeMesh(new THREE.Vector3(...p1), new THREE.Vector3(...p2), 0.021));
    // 地桩（入土夯固，只承拉）+ 桩头铁箍
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.9, 8), woodDark);
    peg.position.set(p2[0], 0.28, p2[2]); peg.castShadow = true; part.add(peg);
    const pc = new THREE.Mesh(hoopGeoC(0.14, 0.028, 12), ironS());
    pc.rotation.x = Math.PI / 2; pc.position.set(p2[0], 0.62, p2[2]); part.add(pc);
  });
}

// ------------------------------------------------------------
// 汲卤筒：楠竹/木身 + 双道铁箍 + 锥底 + 耳环；提卤绳自天辊垂直落至筒顶
// ------------------------------------------------------------
function buildBailer() {
  const part = PART.bailer;
  const { len, rTop, rBot, valve } = BAILER;
  const bucket = new THREE.Group();

  // 筒身：一整截楠竹（上稍粗下稍细），不是拼接木桶
  const body = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, 16), vBamboo(0xA8926C, 0.92));
  body.position.y = len / 2; body.castShadow = true; bucket.add(body);

  // 篾箍：沿筒身均布（井场筒箍全靠篾扎，不钉不铆）
  const nBind = Math.max(3, Math.round(len / 0.72));
  for (let i = 1; i < nBind; i++) {
    const y = (i / nBind) * len;
    const b = new THREE.Mesh(hoopGeoC(rTop + 0.012, 0.026, 14), bambooS());
    b.rotation.x = Math.PI / 2; b.position.y = y; bucket.add(b);
  }
  // 筒口两道铁箍（提环受力处必须熟铁）
  [0.20, 0.58].forEach((dy) => {
    const ir = new THREE.Mesh(hoopGeoC(rTop + 0.022, 0.030, 14), ironS());
    ir.rotation.x = Math.PI / 2; ir.position.y = len - dy; bucket.add(ir);
  });
  // 提环：铁环自筒顶起吊
  const ear = new THREE.Mesh(hoopGeoC(0.15, 0.034, 16), ironS());
  ear.position.y = len + 0.16; bucket.add(ear);
  const earPin = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.34, 8), ironS());
  earPin.position.y = len + 0.06; bucket.add(earPin);

  // 阀头：筒底收成一段短钝锥口 + 底口铁圈（单向阀的木舌藏在筒内，不外露成「鱼雷头」）
  const head = new THREE.Mesh(new THREE.CylinderGeometry(rBot + 0.016, rBot * 0.74, valve * 0.62, 14), woodTex(0x6E5A42, 0.94));
  head.position.y = -valve * 0.31; head.castShadow = true; bucket.add(head);
  const mouth = new THREE.Mesh(hoopGeoC(rBot * 0.76, 0.028, 14), ironS());
  mouth.rotation.x = Math.PI / 2; mouth.position.y = -valve * 0.62; bucket.add(mouth);
  const tongue = new THREE.Mesh(new THREE.ConeGeometry(rBot * 0.74, valve * 0.42, 12), woodTex(0x574730, 0.9));
  tongue.position.y = -valve * 0.62 - valve * 0.21; tongue.rotation.x = Math.PI; bucket.add(tongue);

  bucket.position.set(0, BAILER.minTip, 0);   // 每帧改写 position.y
  part.add(bucket);

  // 提卤绳：每帧由 orientCylinder 改写 position/scale/quaternion。
  // 上一版这里是唯一用圆柱的绳（6 段、无贴图）—— 全场最粗的绳反而最不像绳。
  // 统一到 ropeUnitGeo：8 段 + 绞股。UV 按名义长度 8.5 m 预铺（实际行程
  // 7.8~9.3 m，绞距偏差 ±10%，肉眼不可辨），所以每帧改缩放也不会把绞股拉变形。
  const rope = new THREE.Mesh(ropeUnitGeo(0.042, 8.5), ropeS());
  part.add(rope);

  return { bucket, rope, prevY: BAILER.minTip };
}

// ------------------------------------------------------------
// 大车（提卤绞盘）：立式大木轮，轴沿 z，绳自轮缘 +x 侧切向引出
// ------------------------------------------------------------
function buildCart() {
  const part = PART.cart;
  const { x, z, R, axleY } = CART;

  const wheelGrp = new THREE.Group();
  wheelGrp.position.set(x, axleY, z);
  part.add(wheelGrp);

  // 轮缘：车削出的带槽木环 —— 大车之所以做得这么巨大，
  // 正因为提卤绳是直接绕在轮缘槽里的（不是绕在中央小鼓上）。
  // 断面：两侧法兰高起、中间一道平底绳槽；槽底半径取 R-0.055，
  // 于是绳心正好落在 R 上 —— 绳与槽才真的咬合，而不是浮在轮外。
  // 第一版把法兰做得很高、槽挖得很深，结果斜看时绳被法兰整条挡住 —— 等于没做。
  // 轮缘得薄、槽得浅、盘上去的绳要露在外面，才读得出「绳绕在轮缘槽里」。
  const rimProf = [
    [R - 0.10, -0.17], [R + 0.02, -0.17], [R + 0.02, -0.115],
    [R - 0.05, -0.095], [R - 0.05, 0.095], [R + 0.02, 0.115],
    [R + 0.02, 0.17], [R - 0.10, 0.17], [R - 0.10, -0.17],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const rim = new THREE.Mesh(new THREE.LatheGeometry(rimProf, 40), woodTex(WOOD, 0.9));
  rim.rotation.x = Math.PI / 2;              // 车削轴 Y → 轮轴 Z
  rim.castShadow = true; wheelGrp.add(rim);
  // 槽里盘着的两圈绳：槽底 R-0.05 + 绳半径 0.058 → 绳心 R+0.008，
  // 绳外缘 R+0.066，比轮缘肩 R+0.02 高出 4.6 cm，斜看时是一道浅色的宽带。
  // 用竹篾色（与篾箍同材质）—— 提卤绳本来就是竹篾绞的，正好也和暗木轮缘拉开明度。
  [-0.058, 0.058].forEach((zz) => {
    const turn = new THREE.Mesh(new THREE.TorusGeometry(R + 0.008, 0.058, 6, 36), bambooS());
    turn.position.z = zz; wheelGrp.add(turn);
  });
  // 两道铁箍落在轮缘两肩，把木缘箍住（原来是按旧粗轮缘定的半径，已不在肩上）
  [-0.145, 0.145].forEach((zz) => {
    const band = new THREE.Mesh(hoopGeoC(R + 0.016, 0.020, 34), ironS());
    band.position.z = zz; wheelGrp.add(band);
  });

  // 辐：12 根，敞口透光（不设中央大鼓，免得整只轮读成一块实心圆盘）
  for (let i = 0; i < 12; i++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.105, (R - 0.08) * 2, 0.115), woodTex(WOOD_LIGHT, 0.88));
    sp.rotation.z = (i / 12) * Math.PI * 2; sp.castShadow = true; wheelGrp.add(sp);
  }
  // 毂：短木鼓 + 两端铁箍；轴另用一根长木穿出，落在门架上
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 1.05, 12), woodTex(WOOD_DARK, 0.92));
  hub.rotation.x = Math.PI / 2; wheelGrp.add(hub);
  [-0.53, 0.53].forEach((zz) => {
    const hb = new THREE.Mesh(hoopGeoC(0.215, 0.028, 14), ironS());
    hb.rotation.x = Math.PI / 2; hb.position.z = zz; wheelGrp.add(hb);
  });
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 2.4, 10), woodTex(0x574730, 0.92));
  axle.rotation.x = Math.PI / 2; wheelGrp.add(axle);

  // 承轴门架：两根束柱 + 轴座铁箍 + 地枕
  [-1, 1].forEach((s) => {
    part.add(bundleColumn(
      new THREE.Vector3(x, 0, z + s * 0.95),
      new THREE.Vector3(x, axleY + 0.20, z + s * 0.80),
      { count: 3, rad: 0.11, spread: 0.11, color: WOOD, rough: 0.9, bindStep: 0.5, ironEvery: 4, splices: 1 }
    ));
    const seat = new THREE.Mesh(hoopGeoC(0.135, 0.028, 12), ironS());
    seat.position.set(x, axleY, z + s * 0.66); part.add(seat);
  });
  const sill = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.22, 2.7), vWood(WOOD_DARK, 0.92));
  sill.position.set(x, 0.12, z); sill.castShadow = true; sill.receiveShadow = true; part.add(sill);

  PART.cartWheel = wheelGrp;

  // 绳路第一段：天辊底 → 地辊（在塔身内部垂直下走，不斜穿塔架）
  part.add(ropeMesh(
    new THREE.Vector3(0, DER.topY - 0.62, 0),
    new THREE.Vector3(ROLLER.x, ROLLER.axleY + ROLLER.R, ROLLER.z),
    0.030
  ));
}

// 地辊（地面转向定滑轮）：把竖直绳路转为水平引向大车
function buildGroundRoller() {
  const part = PART.ground;
  const { x, z, R, axleY } = ROLLER;

  const wheelGrp = new THREE.Group();
  wheelGrp.position.set(x, axleY, z);
  part.add(wheelGrp);

  // 立式导辊：轮面在 XY 平面（轴沿 z），绳自上而下绕过、转为水平引向大车
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.085, 8, 26), woodTex(WOOD_LIGHT, 0.86));
  rim.castShadow = true; wheelGrp.add(rim);
  wheelGrp.add(new THREE.Mesh(hoopGeoC(R, 0.03, 26), bambooS()));
  for (let i = 0; i < 6; i++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.055, R * 1.7, 0.055), woodTex(WOOD_DARK, 0.9));
    sp.rotation.z = (i / 6) * Math.PI * 2; wheelGrp.add(sp);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.06, 10), woodTex(WOOD_DARK, 0.9));
  hub.rotation.x = Math.PI / 2; wheelGrp.add(hub);
  PART.groundWheel = wheelGrp;

  // 承轴木架：两根方柱夹住辊轴，柱顶铁座，底部连一根地枕（整体压低，读作「贴地的辊」）
  [-1, 1].forEach((s) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, axleY + 0.12, 0.20), vWood(WOOD_DARK, 0.9));
    post.position.set(x, (axleY + 0.12) / 2, z + s * 0.44); post.castShadow = true; part.add(post);
    const seat = new THREE.Mesh(hoopGeoC(0.10, 0.028, 12), ironS());
    seat.position.set(x, axleY, z + s * 0.38); part.add(seat);
  });
  const sill = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 1.24), vWood(WOOD_DARK, 0.9));
  sill.position.set(x, 0.08, z); sill.receiveShadow = true; part.add(sill);

  // 绳路第二段：地辊 → 大车轮缘（同高水平引出，读作绳绕上轮）。
  // 终点必须解轮圆求出同高度处的轮缘点，否则绳会浮在轮子外侧、根本没搭上。
  const ropeY = axleY + R;
  const dy = ropeY - CART.axleY;
  const dx = Math.sqrt(Math.max(0.04, CART.R * CART.R - dy * dy));
  part.add(ropeMesh(
    new THREE.Vector3(x, ropeY, z),
    new THREE.Vector3(CART.x + dx, ropeY, CART.z),
    0.030
  ));
}

// ------------------------------------------------------------
// 碓架（踩架）：冲击式顿钻 —— 门形木架 + 花辊轴 + 碓梢杠杆 + 吊索 + 碓杆·碓头·铁靴
//                                 + 导环 + 踏板 + 碓窝
//
// 2026-09-14 重建，2026-09-15 修「铁靴横扫进碓窝」。
//   ① 挤在塔基旁 → 碓梢斜穿束柱（迁站解决，见 DUIJIA 常量的注释）；
//   ② 杠杆比 1:1.1，等于没有杠杆 → 现在碓头臂:踏板臂 = 1:2。这是机器的全部意义：
//      碓工以体重压长臂，短臂那头才能把几十斤的碓头提起来；
//   ③ 碓杆长度是写死的，铁靴扎进地面以下 0.19 m → 现在 ROD_L 由
//      「碓梢水平时铁靴底恰好停在碓窝口」反解，改门柱高或碓头尺寸都不用重算；
//   ④ 花辊轴与碓梢轴心重合，读成「碓梢被一根辊子穿过去」→ 轴在碓梢**之下**，
//      碓梢压在轴上，才是花辊该有的样子；
//   ⑤ 【2026-09-15】碓杆硬接在矮臂端点上 —— 那个端点离铰点 3.21 m 且几乎在**正下方**，
//      于是抬 1 m 就横漂 1.31 m；窝口净口半宽 0.38、铁靴半径 0.26，只允许漂 0.12 m，
//      实测铁靴左侧越界 **0.384 m**，是「横扫」进条石的，不是落进去的。
//      改成顿钻本来的做法：碓杆由**吊索**吊在碓梢末端、由**导环**箍着保持铅直 ——
//      横漂归零，行程一点不变（矮臂端点的**竖直**位移 = HARM·sin角 = 0.49 m）。
//
// 全部尺寸由这几个常量推，函数体里不再出现魔数：
//   POST 门柱半距 / TOP 门柱高 / HARM·PARM 两条臂 / MOUTH 碓窝净口半宽 / HANG 吊杆长
//   SLING 吊索长 / RING_Y 抱箍标高 / ROD_L 碓杆长 / GUIDE_Y 导环标高 / GX 导架立柱位置
// 碓窝是**真开口**（四块条石围成方框），不是拿暗色贴出来的洞 —— 铁靴落进去只留
// 0.10 m 净距；碓杆铅直之后这个净距在**全程**都成立，且自检里有断言盯着（见 runSelfTest）。
// ------------------------------------------------------------
function buildDuijia() {
  const part = PART.duijia;
  const X = DUIJIA.x, Z = DUIJIA.z;

  const POST = 1.45;                   // 门柱半距
  // 门架高度是**倒推**出来的，不是随手给的：碓杆长度 = 门架高 − 铁靴落点。
  // 3.30 m 时碓杆 2.43 m、截面半径 0.135 —— 长径比 9:1，近看像钓竿挑着一把小锤。
  // 降到 2.95 m 后碓杆 2.08 m、长径比 7:1，配上放大的碓头才读得出「一根钻杆」的分量。
  const TOP = 2.95;                    // 门柱高（= 门梁中心高）
  const BEAM_H = 0.24;                 // 门梁厚
  const AXLE_R = 0.145;                // 花辊轴半径
  const LEVER_T = 0.34, LEVER_D = 0.28; // 碓梢截面（竖向承弯，所以高 > 厚）
  const HARM = 2.45, PARM = 4.90;      // 碓头臂 / 踏板臂 → 1:2
  const LEVER_L = HARM + PARM;
  const AXLE_Y = TOP + BEAM_H / 2 + AXLE_R;          // 花辊轴压在门梁上
  const LEVER_Y = AXLE_Y + AXLE_R + LEVER_T / 2;     // 碓梢压在花辊轴上
  const SHAFT_R = 0.16, HEAD_H = 0.62, HEAD_R = 0.32; // 碓杆半径 / 碓头高 / 碓头半径
  const SHOE_H = 0.34, SHOE_R = 0.26;                 // 熟铁靴
  const MOUTH = 0.38, RIM_H = 0.42, RIM_W = 0.30;    // 碓窝净口半宽 / 石箍高 / 条石宽
  const HANG = 2.00;                                 // 踏板吊杆长
  // —— 碓杆：吊索悬挂 + 导环约束（见文件头 ⑤）——
  const SLING = 0.44;                                // 吊索长（碓梢末端铁环 → 碓杆抱箍）
  const ROD_EXT = 0.30;                              // 碓杆伸出抱箍之上的长度（绳绑在杆身上，不是绑在杆顶）
  const EYE_DY = LEVER_T / 2 + 0.02;                 // 碓梢末端铁环中心，在梁底再往下 0.02
  const RING_Y = LEVER_Y - EYE_DY - SLING;           // 抱箍标高（本位）
  DUIJIA_SHOE_BOTTOM = RIM_H - 0.10;                 // 铁靴底停在窝口下 0.10 —— 窝口是真开口，进去不碰实体
  const ROD_L = RING_Y + ROD_EXT - (DUIJIA_SHOE_BOTTOM + HEAD_H + SHOE_H);
  // 导环标高必须落在「碓杆本体在全程都覆盖」的高度带内，否则杆顶或碓头会闯进环里。
  // 全程覆盖带 = [本位杆底 + 行程, 本位杆顶] = [1.28+0.49, 3.20] → 取 2.20。
  const GUIDE_Y = 2.20;
  // 导架立柱要站在窝口之外（窝底暗面外沿 −3.17），否则柱础插进那块暗面。
  // 为什么是单柱悬臂而不是两根对夹：默认机位从局部 +z 看过来，沿 ±z 摆的两根柱在屏幕上
  // 会重叠成一根；只有沿 ±x 摆才读得出「这是个架子」，而 +x 侧只剩 0.10 m 空地
  // （窝口条石 −1.77 … 门柱础 −1.67），塞不下第二根。
  const GX = -3.42;
  const RING_R = 0.215, RING_T = 0.026;              // 导环内径 = 0.189 > 杆在环高处的最大半径 0.155
  // 写回模块级：动画与自检要按同一套尺寸算
  DUIJIA_LEVER_Y = LEVER_Y; DUIJIA_PARM = PARM; DUIJIA_LEVER_T = LEVER_T; DUIJIA_HANG = HANG;
  DUIJIA_RING_Y = RING_Y; DUIJIA_HARM = HARM; DUIJIA_EYE_DY = EYE_DY;
  DUIJIA_SIZE.MOUTH = MOUTH; DUIJIA_SIZE.HARM = HARM; DUIJIA_SIZE.SHOE_R = SHOE_R;
  DUIJIA_SIZE.RIM_H = RIM_H; DUIJIA_SIZE.RING_Y = RING_Y; DUIJIA_SIZE.GUIDE_Y = GUIDE_Y;

  // G 收静态件（会被 emit 烘成世界坐标后合并）、M 收运动件（必须留在场景图里逐帧改）
  const mk = () => {
    const g = new THREE.Group();
    g.position.set(X, 0, Z);
    g.rotation.y = DUIJIA.rotY;
    return g;
  };
  const G = mk(), M = mk();

  // ---- 门形架 ----
  [-POST, POST].forEach((sx) => {
    G.add(bundleColumn(
      new THREE.Vector3(sx, 0.05, 0),
      new THREE.Vector3(sx, TOP, 0),
      { count: 3, rad: 0.095, spread: 0.095, color: WOOD, rough: 0.9, bindStep: 0.52, ironEvery: 4, splices: 1 }
    ));
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.44), vStone(0xA5977E, 0.96));
    pl.position.set(sx, 0.11, 0); pl.receiveShadow = true; G.add(pl);
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2 * POST + 0.46, BEAM_H, 0.28), vWood(WOOD_DARK, 0.9));
  beam.position.set(0, TOP, 0); beam.castShadow = true; G.add(beam);
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(AXLE_R, AXLE_R, 2 * POST + 0.66, 12), woodTex(WOOD_DARK, 0.92));
  axle.rotation.z = Math.PI / 2; axle.position.set(0, AXLE_Y, 0); axle.castShadow = true; G.add(axle);
  [-1, 1].forEach((s) => {
    const seat = new THREE.Mesh(hoopGeoC(AXLE_R + 0.012, 0.026, 12), ironS());
    seat.rotation.y = Math.PI / 2; seat.position.set(s * (POST + 0.2), AXLE_Y, 0); G.add(seat);
  });

  // ---- 落地斜撑：只做在 YZ 平面（±z 各两根）----
  // 旧版在 XY 平面也做了两根，而碓梢正是在 XY 平面里摆 —— 同平面里交叉，读成一把乱 X。
  [-1, 1].forEach((s) => {
    [-1, 1].forEach((t) => {
      G.add(roundStrut(
        new THREE.Vector3(s * POST, TOP - 0.18, 0),
        new THREE.Vector3(s * (POST + 0.16), 0, t * 1.15),
        0.070, vWood(WOOD, 0.9)
      ));
    });
  });

  // ---- 碓窝：四块条石围出的真开口（铁靴落进来不会碰任何实体）----
  const darkMeshes = [];
  const darkM = new THREE.MeshStandardMaterial({ color: 0x241E16, roughness: 1.0, metalness: 0.0 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * (MOUTH + RIM_W) + 0.08, 2 * (MOUTH + RIM_W) + 0.08), darkM);
  floor.rotation.x = -Math.PI / 2; floor.position.set(-HARM, 0.02, 0); darkMeshes.push(floor);
  [-1, 1].forEach((s) => {
    // 窝壁内衬：让开口看起来有壁厚与深度，四片薄板
    const lx = new THREE.Mesh(new THREE.BoxGeometry(0.03, RIM_H - 0.06, 2 * MOUTH), darkM);
    lx.position.set(-HARM + s * (MOUTH - 0.015), (RIM_H - 0.06) / 2 + 0.02, 0); darkMeshes.push(lx);
    const lz = new THREE.Mesh(new THREE.BoxGeometry(2 * MOUTH, RIM_H - 0.06, 0.03), darkM);
    lz.position.set(-HARM, (RIM_H - 0.06) / 2 + 0.02, s * (MOUTH - 0.015)); darkMeshes.push(lz);
    // 条石：沿 X 的两块 + 沿 Z 的两块，围成方框
    const bx = new THREE.Mesh(new THREE.BoxGeometry(2 * (MOUTH + RIM_W), RIM_H, RIM_W), vStone(0x9C9080, 0.96));
    bx.position.set(-HARM, RIM_H / 2, s * (MOUTH + RIM_W / 2));
    bx.castShadow = true; bx.receiveShadow = true; G.add(bx);
    const bz = new THREE.Mesh(new THREE.BoxGeometry(RIM_W, RIM_H, 2 * MOUTH), vStone(0x9C9080, 0.96));
    bz.position.set(-HARM + s * (MOUTH + RIM_W / 2), RIM_H / 2, 0);
    bz.castShadow = true; bz.receiveShadow = true; G.add(bz);
  });
  darkMeshes.forEach((m) => G.add(m));

  // ---- 导架：让碓杆保持铅直的那副架子（见文件头 ⑤）----
  // 单柱 + 悬臂横木 + 铁导环，碓杆从环里穿过。环内径 0.189，杆在环高处最粗 0.155，
  // 留 0.034 净距 —— 碓杆铅直升降，这个净距全程不变。
  // 立柱用「单根圆木 + 三道铁箍」，**不用 bundleColumn**：后者的每道箍是一条螺旋管
  // （windGeoC），一根 2.2 m 的副柱要花 ~3.6k 三角面 —— 占整座塔的 6%，而它只是
  // 19.5 m 外一个副架的一根柱子。改成 8 段圆木 + 3 道圆环，约 540 面，是同族里
  // 扶手立柱 / 吊杆一直在用的那套写法。
  G.add(roundStrut(new THREE.Vector3(GX, 0.05, 0), new THREE.Vector3(GX, GUIDE_Y, 0), 0.085, vWood(WOOD, 0.9)));
  [0.34, 1.12, 1.90].forEach((hy) => {
    const hb = new THREE.Mesh(hoopGeoC(0.112, 0.022, 14), ironS());
    hb.rotation.x = Math.PI / 2; hb.position.set(GX, 0.05 + hy, 0); G.add(hb);
  });
  const gpl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.20, 0.36), vStone(0xA5977E, 0.96));
  gpl.position.set(GX, 0.10, 0); gpl.receiveShadow = true; G.add(gpl);
  const armEnd = -HARM - (RING_R + RING_T);          // 横木停在导环外缘（相切 = 读成焊在一起）
  G.add(roundStrut(new THREE.Vector3(GX, GUIDE_Y, 0), new THREE.Vector3(armEnd, GUIDE_Y, 0), 0.052, vWood(WOOD, 0.9)));
  G.add(roundStrut(new THREE.Vector3(GX, GUIDE_Y - 0.92, 0), new THREE.Vector3(-HARM - 0.54, GUIDE_Y - 0.06, 0), 0.042, vWood(WOOD, 0.9)));
  const gring = new THREE.Mesh(hoopGeoC(RING_R, RING_T, 18), ironS());
  gring.rotation.x = Math.PI / 2;                    // Torus 默认在 XY 面，转 90° 成水平环（轴竖直）
  gring.position.set(-HARM, GUIDE_Y, 0); G.add(gring);

  // ---- 扶手：碓工踩着踏板，手得有地方抓 ----
  // 没有它，读者只看到「一块悬空的板」；有了它，才会有人站上去。
  [-1, 1].forEach((s) => {
    G.add(roundStrut(new THREE.Vector3(PARM + 0.60, 0, s * 0.80),
                     new THREE.Vector3(PARM + 0.60, 2.10, s * 0.80), 0.055, vWood(WOOD, 0.9)));
    const ft = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.34), vStone(0xA5977E, 0.96));
    ft.position.set(PARM + 0.60, 0.09, s * 0.80); ft.receiveShadow = true; G.add(ft);
    G.add(roundStrut(new THREE.Vector3(PARM + 0.60, 2.04, s * 0.80),
                     new THREE.Vector3(PARM - 0.12, 1.74, s * 0.80), 0.045, vWood(WOOD, 0.9)));
  });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 1.72), vWood(WOOD, 0.9));
  rail.position.set(PARM + 0.60, 2.10, 0); rail.castShadow = true; G.add(rail);

  // ---- 备料：两根躺着待用的原木 + 一盘篾绳 ----
  [[PARM + 0.20, 1.58, 0.16], [PARM + 1.30, 1.34, 0.13]].forEach(([lx, lz, r]) => {
    G.add(roundStrut(new THREE.Vector3(lx - 1.6, r, lz), new THREE.Vector3(lx + 1.6, r, lz), r, vWood(WOOD, 0.9)));
  });
  for (let i = 0; i < 3; i++) {
    const coil = new THREE.Mesh(hoopGeoC(r2(0.30 - i * 0.05), 0.048, 16), ropeS());
    coil.rotation.x = Math.PI / 2; coil.position.set(-HARM - 0.60, 0.06 + i * 0.08, -1.30); G.add(coil);
  }

  // 静态件：emit 会把 G 的位姿一并烘进顶点，所以 G 自己**不要**再 add 进 part
  emit(G);
  flushBin(part);

  // ---- 运动件 1：碓梢。**只剩杠杆本身**了 —— 碓杆不再挂在它下面（见文件头 ⑤）----
  const pivot = new THREE.Group();
  pivot.position.set(0, LEVER_Y, 0);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(LEVER_L, LEVER_T, LEVER_D), woodTex(WOOD, 0.9));
  lever.position.set((PARM - HARM) / 2, 0, 0);   // 支点不在杠杆中点
  lever.castShadow = true; pivot.add(lever);
  // 碓梢末端的铁吊环：吊索从它下面出去。环顶与梁底相切（环心再往下一个半径）。
  const eye = new THREE.Mesh(hoopGeoC(0.055, 0.014, 12), ironS());
  eye.position.set(-HARM, -EYE_DY, 0);           // Torus 在 XY 面 = 立起来的环，正对 ±z
  pivot.add(eye);

  // ---- 运动件 2：碓杆总成。原点定在**抱箍中心**，几何都相对它摆：
  //      动画每帧只改 rodGrp.position.y —— 它铅直升降，横向一动不动。
  const rodGrp = new THREE.Group();
  rodGrp.position.set(-HARM, RING_Y, 0);
  const rodBot = -(ROD_L - ROD_EXT);             // 杆底（相对抱箍）
  // 碓杆：上细下粗（真家伙是一根整杉，受力端更粗）。10 段 → 12 段，半径上去之后
  // 八棱柱的竖向明暗棱在近景会露出来（与篾箍那处同因）。
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(SHAFT_R * 0.86, SHAFT_R, ROD_L, 12), woodTex(0x574730, 0.92));
  rod.position.set(0, (ROD_EXT + rodBot) / 2, 0); rod.castShadow = true; rodGrp.add(rod);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(HEAD_R * 0.94, HEAD_R, HEAD_H, 16), woodTex(WOOD_DARK, 0.92));
  head.position.set(0, rodBot - HEAD_H / 2, 0); head.castShadow = true; rodGrp.add(head);
  [-1, 1].forEach((s) => {
    const hb = new THREE.Mesh(hoopGeoC(HEAD_R * 1.015, 0.034, 16), ironS());
    hb.rotation.x = Math.PI / 2;
    hb.position.set(0, rodBot - HEAD_H * (s > 0 ? 0.20 : 0.80), 0);
    rodGrp.add(hb);
  });
  const shoe = new THREE.Mesh(new THREE.CylinderGeometry(SHOE_R, SHOE_R * 0.70, SHOE_H, 14), ironS());
  shoe.position.set(0, rodBot - HEAD_H - SHOE_H / 2, 0);
  shoe.castShadow = true; rodGrp.add(shoe);
  // 抱箍：两根吊索系在它两侧。它箍着**杆身**，所以绳不会钻进杆里。
  const collar = new THREE.Mesh(hoopGeoC(0.185, 0.018, 14), ironS());
  collar.rotation.x = Math.PI / 2; collar.position.set(0, 0, 0); rodGrp.add(collar);

  // ---- 运动件 3：吊索。两根，沿 ±x 分叉（默认机位从局部 +z 看，分叉才看得见）。
  //      用绳不用铁杆：顿钻的碓杆就是绳吊着的 —— 绳只受拉，下击时杆自由落体。
  //      每帧按两端点重新定向。实测吊索长度全程在 0.475~0.485 m 之间（差约 1 cm ——
  //      吊环随碓梢摆动时水平位置也在变），48 cm 的绳上差 1 cm，肉眼看不出来。
  const slings = [-1, 1].map((s) => {
    const m = new THREE.Mesh(ropeUnitGeo(0.024, 0.48), ropeS());
    m.castShadow = true;
    m.userData.sx = s * 0.185;                   // 系在抱箍的哪一侧
    M.add(m);
    return m;
  });

  // ---- 运动件 4：踏板。真家伙是铁钩吊在长臂下，所以它只上下平移、不跟着碓梢转 ----
  // （跟转的话吊杆会斜，读成一根焊死的斜撑）
  const pedalGrp = new THREE.Group();
  pedalGrp.position.set(PARM, LEVER_Y - LEVER_T / 2 - HANG, 0);
  [-1, 1].forEach((s) => {
    pedalGrp.add(roundStrut(new THREE.Vector3(s * 0.20, HANG, 0), new THREE.Vector3(s * 0.20, 0, 0),
                            0.032, vWood(WOOD_DARK, 0.9)));
    const hook = new THREE.Mesh(hoopGeoC(0.045, 0.016, 10), ironS());
    hook.rotation.x = Math.PI / 2; hook.position.set(s * 0.20, HANG - 0.015, 0); pedalGrp.add(hook);
  });
  const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.10, 0.62), vWood(WOOD_LIGHT, 0.85));
  pedal.position.set(0, -0.05, 0); pedal.castShadow = true; pedalGrp.add(pedal);
  const toe = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.22, 0.62), vWood(WOOD_LIGHT, 0.85));
  toe.position.set(0.40, -0.06, 0); pedalGrp.add(toe);

  M.add(pivot); M.add(rodGrp); M.add(pedalGrp);
  part.add(M);
  PART.duijiaPivot = pivot;
  PART.duijiaRod = rodGrp;
  PART.duijiaSling = slings;
  PART.duijiaShoe = shoe;
  PART.duijiaPedal = pedalGrp;
}

// ============================================================
// 竹笆：竹条编织的席面（寮棚墙、井台屏都用它）
// 竖篾一前一后错开摆放，模拟经纬互压的编织关系
// ============================================================
function bambooPanel(w, h) {
  const p = new THREE.Group();
  const nV = Math.max(4, Math.round(w / 0.112));
  for (let i = 0; i < nV; i++) {
    const px = -w / 2 + (w / nV) * (i + 0.5);
    const sl = new THREE.Mesh(new THREE.BoxGeometry(0.082, h * (0.93 + RND() * 0.11), 0.028), vBamboo(BAMBOO_PALE, 0.9));
    sl.position.set(px, h / 2, i % 2 ? 0.026 : -0.026);
    sl.rotation.z = (RND() - 0.5) * 0.022;
    sl.castShadow = true; p.add(sl);
  }
  const nH = Math.max(2, Math.round(h / 0.52));
  for (let j = 0; j <= nH; j++) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.045, 0.064), vBamboo(BAMBOO, 0.92));
    rail.position.set(0, 0.07 + (h - 0.14) * (j / nH), 0); p.add(rail);
  }
  return p;
}

// ============================================================
// 盐工寮棚：井台旁的草顶竹笆工棚（单坡草顶前高后低，三面竹笆一面敞开朝井）
// ============================================================
function buildShed() {
  const part = PART.shed;
  const s = new THREE.Group();
  s.position.set(SHED.x, 0, SHED.z);
  s.rotation.y = Math.atan2(SHED.x, SHED.z);   // 敞开的一面（局部 -z）朝井口
  const W = 3.6, D = 2.8, Hf = 2.5, Hb = 1.95;

  // 角柱：同样是小束柱（竹篾捆扎），呼应天车的营造逻辑
  [[-1, -1, Hf], [1, -1, Hf], [1, 1, Hb], [-1, 1, Hb]].forEach(([sx, sz, h]) => {
    s.add(bundleColumn(
      new THREE.Vector3(sx * W / 2, 0, sz * D / 2),
      new THREE.Vector3(sx * W / 2, h, sz * D / 2),
      { count: 3, rad: 0.055, spread: 0.055, color: WOOD_DARK, rough: 0.9, bindStep: 0.56, ironEvery: 0, splices: 1 }
    ));
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.34), vStone(0xA2967F, 0.96));
    pl.position.set(sx * W / 2, 0.09, sz * D / 2); pl.receiveShadow = true; s.add(pl);
  });

  [[-1, Hf], [1, Hb]].forEach(([sz, h]) => {
    const purlin = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.12, 0.12), vWood(WOOD, 0.9));
    purlin.position.set(0, h, sz * D / 2); s.add(purlin);
  });

  // 单坡草顶。第一版没做对：芯板只有 10 cm 厚 + 五道比它更宽的竹条压在上面，
  // 于是整片读成一块木板台面。草顶的体量来自「厚」，边缘的软来自「垂」——
  // 所以芯层加厚到 26 cm，竹条减到三道、改细，出挑的一圈改成一圈垂下来的草把。
  const slope = Math.atan2(Hf - Hb, D);
  const ec = Math.cos(slope), es = Math.sin(slope);
  const roofLen = D / ec + 0.9;
  const yc = (Hf + Hb) / 2 + 0.12;
  const RW = W + 0.7;

  const roofGrp = new THREE.Group();
  roofGrp.position.set(0, yc, 0);
  roofGrp.rotation.x = slope;
  const core = new THREE.Mesh(new THREE.BoxGeometry(RW - 0.10, 0.26, roofLen - 0.34), thatchRoofS());
  core.castShadow = true; core.receiveShadow = true; roofGrp.add(core);

  // 压草竹条：三道细的 —— 是「绑」，不是「铺板」
  for (let i = -1; i <= 1; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(RW - 0.02, 0.032, 0.042), vBamboo(BAMBOO_PALE, 0.9));
    b.position.set(0, 0.155, i * (roofLen / 4.0)); roofGrp.add(b);
  }
  // 脊木 + 脊草垄：高檐收口
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(RW + 0.06, 0.09, 0.13), vWood(WOOD_DARK, 0.9));
  ridge.position.set(0, 0.160, -roofLen / 2 + 0.26); roofGrp.add(ridge);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, RW + 0.12, 10), thatchS());
  roll.rotation.z = Math.PI / 2; roll.position.set(0, 0.210, -roofLen / 2 + 0.22);
  roll.castShadow = true; roofGrp.add(roll);
  s.add(roofGrp);

  // 檐口垂草：沿四条檐线往下挂，长短参差。关键是要挂在「棚体」坐标系里
  // （不是屋顶坐标系）—— 屋顶是斜的，挂在斜坐标系里的草束会顺着坡长出去，
  // 只有挂在棚体坐标系里才是真的受重力垂下来。
  const eaveY = (z1) => yc - z1 * es;
  const eaveZ = (z1) => z1 * ec;
  const tuftG = [];
  // 草把做细做密 + 落点抖动。粗而等距的草把（初版 0.105 宽 / 0.115 间距）之间会露缝，
  // 整圈读成栅栏；细密且错落的才叠成一片「草裙」。
  const hang = (px, py, pz, ln, ry) => {
    const g = new THREE.BoxGeometry(0.052, ln, 0.046);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      (RND() - 0.5) * 0.36, ry + (RND() - 0.5) * 0.44, (RND() - 0.5) * 0.36));
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(
        px + (RND() - 0.5) * 0.045,
        py - ln / 2 + 0.07 + (RND() - 0.5) * 0.035,
        pz + (RND() - 0.5) * 0.03),
      q, new THREE.Vector3(1, 1, 1));
    tuftG.push(g.applyMatrix4(m));
  };
  const nx = Math.max(16, Math.round(RW / 0.036));
  for (let i = 0; i < nx; i++) {
    const px = -RW / 2 + (RW / nx) * (i + 0.5);
    const zl = roofLen / 2 - 0.05 + RND() * 0.06;      // 低檐：滴水边，留长
    hang(px, eaveY(zl), eaveZ(zl), 0.30 + RND() * 0.26, 0);
    const zh = -roofLen / 2 + 0.12;                            // 高檐：贴着脊，短
    hang(px, eaveY(zh), eaveZ(zh), 0.17 + RND() * 0.14, 0);
  }
  const nz = Math.max(14, Math.round(roofLen / 0.040));
  for (let i = 0; i < nz; i++) {
    const z1 = -roofLen / 2 + (roofLen / nz) * (i + 0.5);
    const y = eaveY(z1), z2 = eaveZ(z1);
    const ln = (0.22 + RND() * 0.18) * (0.72 + 0.5 * (z1 / roofLen + 0.5));
    hang(-RW / 2 - 0.035, y, z2, ln, Math.PI / 2);
    hang(RW / 2 + 0.035, y, z2, ln, Math.PI / 2);
  }
  const fringe = new THREE.Mesh(mergeGeos(tuftG), thatchS());
  fringe.castShadow = true; s.add(fringe);

  // 三面竹笆围护（朝井的一面敞开）
  const back = bambooPanel(W - 0.12, Hb - 0.14);
  back.position.set(0, 0.04, D / 2 - 0.05); s.add(back);
  [-1, 1].forEach((sx) => {
    const side = bambooPanel(D - 0.12, Hb - 0.3);
    side.position.set(sx * (W / 2 - 0.05), 0.04, 0);
    side.rotation.y = Math.PI / 2; s.add(side);
  });

  // 棚下：陶卤缸（盛卤）+ 矮凳 + 盘起的篾绳
  const vat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.76, 16), vStone(0x6E6257, 0.9));
  vat.position.set(-0.95, 0.38, 0.4); vat.castShadow = true; s.add(vat);
  const rim = new THREE.Mesh(hoopGeoC(0.43, 0.05, 16), vStone(0x655A50, 0.9));
  rim.rotation.x = Math.PI / 2; rim.position.set(-0.95, 0.74, 0.4); s.add(rim);
  const brine = new THREE.Mesh(new THREE.CircleGeometry(0.39, 18),
    new THREE.MeshStandardMaterial({ color: 0x2F6F8F, roughness: 0.22, metalness: 0.05 }));
  brine.rotation.x = -Math.PI / 2; brine.position.set(-0.95, 0.7, 0.4); s.add(brine);

  const stool = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.34), vWood(WOOD_LIGHT, 0.9));
  stool.position.set(0.9, 0.42, 0.55); stool.castShadow = true; s.add(stool);
  [[-0.2, -0.12], [0.2, -0.12], [-0.2, 0.12], [0.2, 0.12]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.042, 0.42, 6), vWood(WOOD_DARK, 0.9));
    leg.position.set(0.9 + lx, 0.21, 0.55 + lz); s.add(leg);
  });
  for (let i = 0; i < 3; i++) {
    const coil = new THREE.Mesh(hoopGeoC(r2(0.3 - i * 0.05), 0.05, 16), bambooS());
    coil.rotation.x = Math.PI / 2; coil.position.set(0.95, 0.06 + i * 0.09, -0.55); s.add(coil);
  }

  emit(s);
  flushBin(part);
}
// ============================================================
// 井场附属建筑（2026-09-15）：灶房 · 盐仓 · 柴棚 · 竹笕
//
// 为什么要加：远景那三座天车只说了「天车林立」，但一座井场真正的天际线是
// 「天车林立、笕管纵横、锅灶密布」。卤水从井里提上来之后必须**有地方去** ——
// 灶房熬盐、盐仓存盐、竹笕把卤水从井口引到灶房。加上这三栋之后，
// 场景从「一台机器」变成「一处生产场所」，这是叙事上的补齐，不是堆元素。
//
// 选址是**算出来的**（`~/.workbuddy/verify/_solve_yard.mjs`）：把 0~355° ×
// R=12~25 的候选逐个投影到默认机位，按「完整在画内 / 不被塔与碓架挡 /
// 与大车·寮棚·风篾桩保持净距 / 明暗差够大（有体积感）」四项筛，
// 只有两个方位同时过筛：
//   灶房组 az 353° R 14.5 → 屏幕 X∈[0.44,0.88]（右侧三分之一），29 m 中景，
//          与主塔（33.4 m）几乎同深，读作「井场这边还有一片房」；避开 az 315°
//          的寮棚、az 0/270° 的净空，竹笕因此能沿 az≈355° 一条直线过去。
//   盐仓   az 202° R 15.5 → 屏幕 X∈[-0.42,-0.20]（左侧三分之一），44 m 远景，
//          给「右重左轻」的构图配一个对位，同时把场地往塔后延伸。
// 朝向：局部 +z 转向相机（rotation.y = atan2(dx,dz)），敞开的长边正对镜头 ——
// 灶房要看见一排盐锅，盐仓要看见门。
// ============================================================
const YARD = (() => {
  const cam = CAM_DEFAULT;
  const put = (az, R) => {
    const a = (az * Math.PI) / 180;
    const x = Math.cos(a) * R, z = Math.sin(a) * R;
    return { x, z, rotY: Math.atan2(cam[0] - x, cam[2] - z) };
  };
  return { kitchen: put(353, 14.5), store: put(202, 15.5) };
})();
// 井场附属的尺寸（改一处整体收放）
const KITCHEN = { W: 6.4, D: 4.4, base: 0.44, eave: 3.10, ridge: 4.30, wall: 0.32 };
const STORE = { W: 3.95, D: 3.30, base: 0.34, eave: 2.60, ridge: 3.62, wall: 0.36 };
// 附属建筑用**本地**随机流。理由不是洁癖：把 buildYard 挪进 buildStation 中间
// （比如让它先于 buildShed 执行）时，本地流保证别的构件一个随机数都不会被抢走，
// triByPart 因此可以一直当「既有分区逐位不变」的回归断言。
const RNDY = mulberry32(0x20260915);
// 少量无贴图的共享材质：卤水 / 灶眼黑 / 盐晶。共享是为了少两个 draw call，
// 也因为它们本来就该是全井场同一份（同一个盐灶的锅、同一个仓的盐）。
let _brineM = null, _darkM = null, _saltM = null;
function brineS() {
  if (!_brineM) _brineM = new THREE.MeshStandardMaterial({ color: 0xBECFD2, roughness: 0.30, metalness: 0.02 });
  return _brineM;
}
function darkS() {
  if (!_darkM) _darkM = new THREE.MeshStandardMaterial({ color: 0x241F1A, roughness: 1.0, metalness: 0.0 });
  return _darkM;
}
function saltS() {
  if (!_saltM) _saltM = new THREE.MeshStandardMaterial({ color: 0xF2F0E8, roughness: 0.92, metalness: 0.0 });
  return _saltM;
}

// 山尖：只有这个形状不能用 Box。ExtrudeGeometry 的默认 UV 是「按世界坐标的米数」
// 生成的，与 Box 的「每面 0..1」不是一套约定 —— 直接交给 sizedMat 会得到
// repeat×米 的错误密度（砖缝宽窄全错）。这里把 UV 归一化到三角形自身的包围盒，
// 从此与 Box 一致，sizedMat 可以照用。
function gableGeo(baseW, h, thick) {
  const shp = new THREE.Shape();
  shp.moveTo(-baseW / 2, 0); shp.lineTo(baseW / 2, 0); shp.lineTo(0, h); shp.closePath();
  const g = new THREE.ExtrudeGeometry(shp, { depth: thick, bevelEnabled: false });
  const uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + baseW / 2) / baseW, pos.getY(i) / h);
  uv.needsUpdate = true;
  return g;
}
// 檐檩 / 脊木这类方木：不用 strut() —— 它带随机截面偏心率（服务于天车那种
// 「每根木料都不一样」的语境），附属建筑不需要这个自由度，Box 更干净。
function beam(x1, y1, z1, x2, y2, z2, tx, tz, mat) {
  const len = Math.hypot(x2 - x1, y2 - y1, z2 - z1);
  const m = new THREE.Mesh(new THREE.BoxGeometry(tx, len, tz), mat);
  m.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1).normalize());
  return m;
}

// ------------------------------------------------------------
// 灶房：熬卤成盐的盐灶房。
// 形制要点（都是有依据的，不是造型选择）：
//   · 两端砖砌山墙 + 长边全敞开 —— 灶房要散热、要出烟，不能四面围合；
//   · 屋面用瓦不用茅草 —— 灶火在下面，草顶等于烧自己；
//   · 烟囱砌在山墙**外侧** —— 砖囱穿瓦垄在做法上不顺（要另做泛水）；
//   · 台基用石不用砖 —— 卤水外溢，砖脚会被盐蚀烂，石脚是必须的。
// ------------------------------------------------------------
function buildKitchen() {
  const K = KITCHEN;
  const s = new THREE.Group();
  const P = YARD.kitchen;
  s.position.set(P.x, 0, P.z);
  s.rotation.y = P.rotY;
  const W2 = K.W / 2, D2 = K.D / 2;
  const bz = K.base, eaveH = K.eave - bz, gh = K.ridge - K.eave;
  const slope = Math.atan2(gh, D2);
  const oh = 0.45, ohE = 0.50;
  const RL = Math.hypot(D2, gh) + ohE;                 // 顺坡板长（含出檐）
  const RW = K.W + oh * 2;                             // 屋面宽
  const cs = Math.cos(slope), sn = Math.sin(slope);
  const BRICK_C = 0xB4AFA6;

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(K.W + 0.60, bz, K.D + 0.60), vStone(0x9E937C, 0.95));
  plinth.position.y = bz / 2; s.add(plinth);

  // 两端山墙（砖）+ 四角壁柱。壁柱除了是砖墙的常规做法，在这里还解决一个
  // 具体问题：BoxGeometry 六个面各自 0..1 的 UV，山墙 0.32 m 厚的端面会被
  // 挤出十几倍的砖 —— 0.50 m 见方的壁柱正好把这两个薄面盖住。
  const pierMat = vBrick(0.50, eaveH, BRICK_C);
  const wallMat = vBrick(K.D, eaveH, BRICK_C);
  const postMat = vWood(WOOD, 0.88);
  [-1, 1].forEach((sx) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(K.wall, eaveH, K.D), wallMat);
    w.position.set(sx * (W2 - K.wall / 2), bz + eaveH / 2, 0); s.add(w);
    [-1, 1].forEach((sz) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.50, eaveH, 0.50), pierMat);
      p.position.set(sx * (W2 - K.wall / 2), bz + eaveH / 2, sz * D2); s.add(p);
    });
    const gb = new THREE.Mesh(gableGeo(K.D, gh, K.wall), vBrick(K.D, gh, BRICK_C));
    gb.rotation.y = -Math.PI / 2;
    gb.position.set(sx * W2, K.eave, 0); s.add(gb);
  });

  // 长边檐柱（敞开面得有人撑着）+ 竹篾箍，与天车同一套「无钉捆扎」的做法
  const hoopMat = bambooS();
  [-1, 1].forEach((sz) => {
    [-2.0, 2.0].forEach((px) => {
      const zc = sz * (D2 - 0.16);
      s.add(roundStrut(new THREE.Vector3(px, bz, zc), new THREE.Vector3(px, K.eave, zc), 0.105, postMat));
      [0.55, 1.35, 2.15].forEach((hy) => {
        const h = new THREE.Mesh(hoopGeoC(0.118, 0.020, 12), hoopMat);
        h.rotation.x = Math.PI / 2; h.position.set(px, bz + hy, zc); s.add(h);
      });
    });
    s.add(beam(-W2 - 0.10, K.eave, sz * (D2 - 0.16), W2 + 0.10, K.eave, sz * (D2 - 0.16),
      0.11, 0.11, vWood(WOOD_DARK, 0.9)));
  });

  // 两坡小青瓦屋面。每坡就是一整块板 + 一层瓦贴图（瓦垄、搭接、水渍全在贴图里）——
  // 这正是手绘矢量贴图在这里的价值：40 道瓦垄不必是 40 个几何体。
  const roofMat = vTile(RW, RL, 0xB2B6BA);
  const ridgeMat = vTile(Math.PI * 0.25, K.W + 0.40, 0xA8ACB0);
  const roofG = new THREE.Group();
  roofG.position.set(0, K.ridge, 0); s.add(roofG);
  [[1, slope], [-1, -slope]].forEach(([sgn, th]) => {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(RW, 0.12, RL), roofMat);
    slab.rotation.x = th;
    slab.position.set(0, -(RL / 2) * sn + 0.06, sgn * (RL / 2) * cs);
    roofG.add(slab);
  });
  const ridgeB = new THREE.Mesh(new THREE.BoxGeometry(K.W + 0.24, 0.10, 0.13), vWood(WOOD_DARK, 0.9));
  ridgeB.position.set(0, 0.05, 0); roofG.add(ridgeB);
  // 脊瓦垄：一根半圆筒压住脊。贴图的 u 绕圆周、v 顺长度 —— 而瓦垄正好沿 v 走，
  // 所以 repeat 要按「周长 / 管长」折算，不能沿用屋面板那份（会糊成一团）。
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, K.W + 0.40, 10), ridgeMat);
  roll.rotation.z = Math.PI / 2;
  roll.position.set(0, 0.16, 0); roofG.add(roll);

  // 烟囱：砌在山墙外侧。四段 —— 囱身 / 出檐带 / 烟口（熏黑）/ 压顶。
  // 烟口做成夹在压顶下面的深色一段：仰视看到的就是「压顶的阴影 + 一圈黑」，
  // 这正是真烟囱的样子（压顶是挡雨的，出烟口在它下面）。
  const chX = W2 + 0.62;
  const chMat = vBrick(0.92, 6.00, 0xADA79E);
  const flue = new THREE.Mesh(new THREE.BoxGeometry(0.92, 6.00, 0.92), chMat);
  flue.position.set(chX, 3.00, 0); s.add(flue);
  const corb = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.10, 1.24), chMat);
  corb.position.set(chX, 5.10, 0); s.add(corb);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.26, 0.88), darkS());
  mouth.position.set(chX, 6.13, 0); s.add(mouth);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.15, 1.28), chMat);
  cap.position.set(chX, 6.33, 0); s.add(cap);
  const duct = new THREE.Mesh(new THREE.BoxGeometry(1.00, 0.62, 0.62), chMat);   // 山墙 → 烟囱
  duct.position.set(W2 + 0.34, bz + 1.30, 0); s.add(duct);

  // 灶台 + 五口盐锅 + 灶眼。锅是一排五个 —— 盐灶的锅位数就是产量，
  // 「一灶五锅」是自流井一带的常见形制。
  const hearth = new THREE.Mesh(new THREE.BoxGeometry(5.40, 0.92, 1.60), vBrick(5.40, 0.92, 0x9A9186));
  hearth.position.set(0.20, bz + 0.46, 0); s.add(hearth);
  const potMat = ironS(), brM = brineS();
  const PAN = [-2.20, -1.10, 0, 1.10, 2.20];
  PAN.forEach((px) => {
    const cx = px + 0.20;
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.33, 0.20, 16), potMat);
    bowl.position.set(cx, bz + 0.86, 0); s.add(bowl);
    const rim = new THREE.Mesh(hoopGeoC(0.40, 0.030, 16), potMat);
    rim.rotation.x = Math.PI / 2; rim.position.set(cx, bz + 0.96, 0); s.add(rim);
    const br = new THREE.Mesh(new THREE.CircleGeometry(0.345, 16), brM);
    br.rotation.x = -Math.PI / 2; br.position.set(cx, bz + 0.89, 0); s.add(br);
    const fm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.14), darkS());
    fm.position.set(cx, bz + 0.30, 0.78); s.add(fm);
  });
  // 锅边扒出来的盐堆
  [-2.00, 2.40].forEach((px) => {
    const pile = new THREE.Mesh(new THREE.ConeGeometry(0.30, 0.26, 12), saltS());
    pile.position.set(px, bz + 1.05, 0.50); s.add(pile);
  });
  // 盐铲靠在灶台上（人的痕迹）
  s.add(roundStrut(new THREE.Vector3(2.95, bz, 1.00), new THREE.Vector3(2.58, bz + 1.42, 0.62),
    0.026, vWood(WOOD_LIGHT, 0.9)));
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.30), vWood(WOOD_LIGHT, 0.9));
  blade.position.set(2.55, bz + 1.40, 0.58); blade.rotation.x = -0.5; s.add(blade);

  // 官盆：接竹笕来的卤水。敞口陶缸垫在木架上 —— 缸底离地才不被地面积卤泡烂
  const potG = new THREE.Group();
  potG.position.set(-W2 - 0.78, 0, 1.15); s.add(potG);
  const vat = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.42, 0.92, 16), vStone(0x6E6257, 0.9));
  vat.position.y = 0.46; potG.add(vat);
  const vrim = new THREE.Mesh(hoopGeoC(0.55, 0.055, 16), vStone(0x655A50, 0.9));
  vrim.rotation.x = Math.PI / 2; vrim.position.y = 0.90; potG.add(vrim);
  const vb = new THREE.Mesh(new THREE.CircleGeometry(0.50, 18), brM);
  vb.rotation.x = -Math.PI / 2; vb.position.y = 0.84; potG.add(vb);
  [[-0.34, -0.34], [0.34, -0.34], [-0.34, 0.34], [0.34, 0.34]].forEach(([lx, lz]) => {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.09), vWood(WOOD_DARK, 0.9));
    st.position.set(lx, 0.08, lz); potG.add(st);
  });

  // 柴棚挂在灶房组里 —— 它本来就是灶房的附属，共用同一套朝向
  const fuel = buildFuelShed();
  fuel.position.set(-1.90, 0, -3.70);
  fuel.rotation.y = -0.34;
  s.add(fuel);
  return s;
}

// ------------------------------------------------------------
// 柴棚：熬盐要烧的柴草。四面透风的敞棚 + 一垛劈柴。
// 不做围护是**故意的** —— 柴要通风晾干，围起来就霉了；也顺手与「盐工寮棚」
// （三面竹笆）在观感上区分开，两座不撞形。
// ------------------------------------------------------------
function buildFuelShed() {
  const s = new THREE.Group();
  const W = 3.00, D = 2.35, Hf = 2.30, Hb = 1.98;
  const postMat = vWood(WOOD, 0.9);
  [[-1, -1, Hf], [1, -1, Hf], [1, 1, Hb], [-1, 1, Hb]].forEach(([sx, sz, h]) => {
    const px = sx * W / 2, pz = sz * D / 2;
    s.add(roundStrut(new THREE.Vector3(px, 0, pz), new THREE.Vector3(px, h, pz), 0.078, postMat));
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.26), vStone(0xA2967F, 0.96));
    pl.position.set(px, 0.07, pz); s.add(pl);
  });
  [[-1, Hf], [1, Hb]].forEach(([sz, h]) => {
    const purlin = new THREE.Mesh(new THREE.BoxGeometry(W + 0.44, 0.11, 0.11), vWood(WOOD, 0.9));
    purlin.position.set(0, h, sz * D / 2); s.add(purlin);
  });
  // 单坡茅草顶（与寮棚同一套做法，尺度收小一档）
  const slope = Math.atan2(Hf - Hb, D), ec = Math.cos(slope), es = Math.sin(slope);
  const roofLen = D / ec + 0.72, yc = (Hf + Hb) / 2 + 0.10, RW = W + 0.56;
  const roofG = new THREE.Group();
  roofG.position.set(0, yc, 0); roofG.rotation.x = slope;
  roofG.add(new THREE.Mesh(new THREE.BoxGeometry(RW - 0.08, 0.22, roofLen - 0.28), thatchRoofS()));
  for (let i = -1; i <= 1; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(RW - 0.02, 0.030, 0.040), vBamboo(BAMBOO_PALE, 0.9));
    b.position.set(0, 0.132, i * (roofLen / 4.0)); roofG.add(b);
  }
  const rdg = new THREE.Mesh(new THREE.BoxGeometry(RW + 0.05, 0.08, 0.12), vWood(WOOD_DARK, 0.9));
  rdg.position.set(0, 0.138, -roofLen / 2 + 0.22); roofG.add(rdg);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, RW + 0.10, 10), thatchS());
  roll.rotation.z = Math.PI / 2; roll.position.set(0, 0.180, -roofLen / 2 + 0.19); roofG.add(roll);
  s.add(roofG);
  // 檐口垂草：必须挂在「棚体」坐标系里（不是屋顶坐标系）才是真的受重力垂下来
  const eaveY = (z1) => yc - z1 * es, eaveZ = (z1) => z1 * ec;
  const tuftG = [];
  const hang = (px, py, pz, ln, ry) => {
    const g = new THREE.BoxGeometry(0.048, ln, 0.042);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      (RNDY() - 0.5) * 0.36, ry + (RNDY() - 0.5) * 0.44, (RNDY() - 0.5) * 0.36));
    tuftG.push(g.applyMatrix4(new THREE.Matrix4().compose(
      new THREE.Vector3(px + (RNDY() - 0.5) * 0.04, py - ln / 2 + 0.06 + (RNDY() - 0.5) * 0.03,
        pz + (RNDY() - 0.5) * 0.03), q, new THREE.Vector3(1, 1, 1))));
  };
  const nx = Math.max(14, Math.round(RW / 0.038));
  for (let i = 0; i < nx; i++) {
    const px = -RW / 2 + (RW / nx) * (i + 0.5);
    hang(px, eaveY(roofLen / 2 - 0.04), eaveZ(roofLen / 2 - 0.04), 0.26 + RNDY() * 0.22, 0);
    hang(px, eaveY(-roofLen / 2 + 0.10), eaveZ(-roofLen / 2 + 0.10), 0.15 + RNDY() * 0.12, 0);
  }
  const nz = Math.max(12, Math.round(roofLen / 0.042));
  for (let i = 0; i < nz; i++) {
    const z1 = -roofLen / 2 + (roofLen / nz) * (i + 0.5);
    const ln = (0.20 + RNDY() * 0.16) * (0.72 + 0.5 * (z1 / roofLen + 0.5));
    hang(-RW / 2 - 0.03, eaveY(z1), eaveZ(z1), ln, Math.PI / 2);
    hang(RW / 2 + 0.03, eaveY(z1), eaveZ(z1), ln, Math.PI / 2);
  }
  s.add(new THREE.Mesh(mergeGeos(tuftG), thatchS()));
  // 柴垛：三层码放的劈柴。长度与半径逐根微差 —— 整齐划一的柴垛反而不像柴垛。
  const logMat = vWood(WOOD_LIGHT, 0.94);
  [[3, 0.17], [2, 0.44], [1, 0.71]].forEach(([n, y]) => {
    for (let i = 0; i < n; i++) {
      const r = 0.085 + RNDY() * 0.035;
      const m = new THREE.Mesh(cachedGeo('log' + Math.round(r * 1000), () => new THREE.CylinderGeometry(r, r, 1, 8)), logMat);
      m.scale.y = 1.02 + RNDY() * 0.26;
      m.position.set((i - (n - 1) / 2) * 0.40 + (RNDY() - 0.5) * 0.05, y, 0.10 + (RNDY() - 0.5) * 0.06);
      m.rotation.set(Math.PI / 2, 0, (RNDY() - 0.5) * 0.10);
      s.add(m);
    }
  });
  s.add(roundStrut(new THREE.Vector3(-0.30, 0.02, -0.90), new THREE.Vector3(0.62, 1.70, 0.34), 0.085,
    vWood(WOOD, 0.94)));
  s.add(roundStrut(new THREE.Vector3(0.10, 0.02, -0.95), new THREE.Vector3(0.95, 1.62, 0.20), 0.075,
    vWood(WOOD, 0.94)));
  return s;
}

// ------------------------------------------------------------
// 盐仓：存盐的仓房。夯土墙 + 石脚 + 小青瓦顶 + 板门 + 门外盐包垛。
// 夯土墙为什么必要：它是「版筑」的直接载体，用它那张 SVG 才有的放矢 ——
// 8 层夯层界、夯窝、掺石、雨蚀流痕全在贴图里，几何就只是一堵规规矩矩的墙。
// ------------------------------------------------------------
function buildStore() {
  const K = STORE;
  const s = new THREE.Group();
  const P = YARD.store;
  s.position.set(P.x, 0, P.z);
  s.rotation.y = P.rotY;
  const W2 = K.W / 2, D2 = K.D / 2;
  const bz = K.base, eaveH = K.eave - bz, gh = K.ridge - K.eave;
  const slope = Math.atan2(gh, D2);
  const oh = 0.40, ohE = 0.45;
  const RL = Math.hypot(D2, gh) + ohE, RW = K.W + oh * 2;
  const cs = Math.cos(slope), sn = Math.sin(slope);
  const EARTH_C = 0xD2BA94, t = K.wall;

  // 石脚：夯土墙最怕脚部返潮 —— 土墙必须坐在石砌基础上，这不是装饰
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(K.W + 0.40, bz, K.D + 0.40), vStone(0xA0937A, 0.95));
  plinth.position.y = bz / 2; s.add(plinth);

  const pierMat = vEarth(0.52, eaveH, 0xCBB28C);
  const wallL = vEarth(K.W, eaveH, EARTH_C);
  const wallS = vEarth(K.D, eaveH, EARTH_C);
  [-1, 1].forEach((sz) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(K.W - t * 2, eaveH, t), wallL);
    w.position.set(0, bz + eaveH / 2, sz * (D2 - t / 2)); s.add(w);
  });
  [-1, 1].forEach((sx) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(t, eaveH, K.D), wallS);
    w.position.set(sx * (W2 - t / 2), bz + eaveH / 2, 0); s.add(w);
    const gb = new THREE.Mesh(gableGeo(K.D, gh, t), vEarth(K.D, gh, EARTH_C));   // 山尖在短边
    gb.rotation.y = -Math.PI / 2;
    gb.position.set(sx * W2, K.eave, 0); s.add(gb);
  });
  // 四角壁柱：夯土墙的墙角最先被雨淋坏，做法上要拍实加厚；顺带盖住每面墙
  // Box 的两个薄端面（0.36 m，不盖住的话会被挤出十几倍的夯层）。
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.52, eaveH, 0.52), pierMat);
    p.position.set(sx * (W2 - t / 2), bz + eaveH / 2, sz * (D2 - t / 2)); s.add(p);
  });

  const roofMat = vTile(RW, RL, 0xB2B6BA);
  const ridgeMat = vTile(Math.PI * 0.23, K.W + 0.34, 0xA8ACB0);
  const roofG = new THREE.Group();
  roofG.position.set(0, K.ridge, 0); s.add(roofG);
  [[1, slope], [-1, -slope]].forEach(([sgn, th]) => {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(RW, 0.11, RL), roofMat);
    slab.rotation.x = th;
    slab.position.set(0, -(RL / 2) * sn + 0.055, sgn * (RL / 2) * cs);
    roofG.add(slab);
  });
  const ridgeB = new THREE.Mesh(new THREE.BoxGeometry(K.W + 0.20, 0.09, 0.12), vWood(WOOD_DARK, 0.9));
  ridgeB.position.set(0, 0.045, 0); roofG.add(ridgeB);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, K.W + 0.34, 10), ridgeMat);
  roll.rotation.z = Math.PI / 2; roll.position.set(0, 0.14, 0); roofG.add(roll);

  // 板门：门框凸出墙面、门扇凹进门框半档 —— 门才读作「开在墙上」而不是
  // 贴在墙上的画。合缝的两扇板门是盐仓的做法（要能上锁、要挡潮）。
  const dW = 1.34, dH = 2.02, dz = D2 - t / 2;
  const frameMat = vWood(WOOD_DARK, 0.9);
  [-1, 1].forEach((sx) => {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.13, dH + 0.22, 0.16), frameMat);
    jamb.position.set(sx * (dW / 2 + 0.065), bz + (dH + 0.22) / 2, dz + 0.05); s.add(jamb);
  });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(dW + 0.42, 0.15, 0.16), frameMat);
  lintel.position.set(0, bz + dH + 0.145, dz + 0.05); s.add(lintel);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(dW + 0.42, 0.13, 0.30), vStone(0xA89A82, 0.95));
  sill.position.set(0, bz + 0.065, dz + 0.08); s.add(sill);
  [-1, 1].forEach((sx) => {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(dW / 2 - 0.02, dH, 0.075), vWood(WOOD, 0.92));
    leaf.position.set(sx * dW / 4, bz + dH / 2 + 0.06, dz + 0.01); s.add(leaf);
    [0.42, 0.78].forEach((f) => {                     // 板门的两道横枨
      const bt = new THREE.Mesh(new THREE.BoxGeometry(dW / 2 - 0.06, 0.10, 0.026), frameMat);
      bt.position.set(sx * dW / 4, bz + dH * f, dz + 0.05); s.add(bt);
    });
    const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 10), ironS());
    lp.rotation.x = Math.PI / 2;
    lp.position.set(sx * 0.10, bz + 1.02, dz + 0.06); s.add(lp);   // 门钹（要上锁）
  });

  // 门外：盐包垛 + 一小堆散盐。
  // 袋子拿「绳」那张 45° 绞股贴图当粗麻布 —— 绞股远看就是织物的斜纹，
  // 为几袋盐另开一张「麻布」贴图不值当。
  const sackMat = sizedMat(TEX.rope, 2.2, 2.2, 0xDCD4B8, 0.95);
  const pallet = new THREE.Mesh(new THREE.BoxGeometry(2.30, 0.10, 1.05), vWood(WOOD_DARK, 0.94));
  pallet.position.set(-1.55, bz + 0.05, D2 + 0.92); s.add(pallet);
  [[-0.68, 0.30], [0, 0.30], [0.68, 0.30], [-0.34, 0.74], [0.34, 0.74], [0, 1.16]].forEach(([lx, ly]) => {
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.34, 9, 7), sackMat);
    sack.scale.set(1.0, 0.74 + RNDY() * 0.12, 0.86);
    sack.position.set(-1.55 + lx + (RNDY() - 0.5) * 0.05, bz + ly + (RNDY() - 0.5) * 0.03,
      D2 + 0.92 + (RNDY() - 0.5) * 0.06);
    sack.rotation.set((RNDY() - 0.5) * 0.16, (RNDY() - 0.5) * 0.9, (RNDY() - 0.5) * 0.16);
    s.add(sack);
  });
  const heap = new THREE.Mesh(new THREE.ConeGeometry(0.60, 0.44, 14), saltS());
  heap.position.set(0.95, bz + 0.22, D2 + 0.86); s.add(heap);
  return s;
}

// ------------------------------------------------------------
// 竹笕：把卤水从井口引到灶房的竹管（架在 A 字形木马上）。
// 这是「笕管纵横」的实体，也是让新增建筑**成立**的那根线 —— 没有它，
// 灶房就是凭空多出来的一栋房子；有了它，卤水才有去处。
// 走位是净空算过的：井口 → 官盆沿 az≈355°，全程走在 az 0 与 337.5 两道
// 风篾之间的空档，与大车（az 180）、寮棚（az 315）、碓架（az 270）都不相干。
// ------------------------------------------------------------
function buildConduit() {
  const s = new THREE.Group();
  const K = KITCHEN;
  const A = new THREE.Vector3(1.90, 2.05, -0.78);
  // 官盆在世界里的位置（灶房局部坐标经它自己的 rotation 变换出来）
  const B = new THREE.Vector3(-K.W / 2 - 0.78, 0, 1.15)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), YARD.kitchen.rotY)
    .add(new THREE.Vector3(YARD.kitchen.x, 0, YARD.kitchen.z));
  B.y = 2.05;
  const run = new THREE.Vector3(B.x - A.x, 0, B.z - A.z);
  const runL = run.length();
  const u = run.clone().normalize();
  const v = new THREE.Vector3(-u.z, 0, u.x);           // 水平法向（A 字架的横向）

  const pipeMat = sizedMat(TEX.wood, Math.PI * 2 * 0.085, runL, 0xC8C29C, 0.92);
  s.add(roundStrut(A, B, 0.085, pipeMat));
  for (let d = 1.4; d < runL - 0.5; d += 1.4) {        // 篾箍/铁箍
    const m = new THREE.Mesh(cachedGeo('cc10', () => new THREE.CylinderGeometry(0.100, 0.100, 1, 10)), ironS());
    orientCylinder(m, A.clone().addScaledVector(u, d), A.clone().addScaledVector(u, d + 0.055));
    s.add(m);
  }
  [0.36, 0.70].forEach((f) => {                        // 两处接头承口
    const m = new THREE.Mesh(cachedGeo('cc12', () => new THREE.CylinderGeometry(0.112, 0.112, 1, 10)),
      vBamboo(BAMBOO, 0.9));
    orientCylinder(m, A.clone().addScaledVector(u, runL * f - 0.16),
      A.clone().addScaledVector(u, runL * f + 0.16));
    s.add(m);
  });
  // A 字木马：两腿外撇 + 横撑 + 两根斜撑 + 一块垫板
  const legMat = vWood(WOOD, 0.9);
  for (let f = 0.14; f <= 0.901; f += 0.25) {
    const c = A.clone().addScaledVector(u, runL * f);
    const top = new THREE.Vector3(c.x, 2.03, c.z);
    [-1, 1].forEach((sg) => {
      const foot = c.clone().addScaledVector(v, sg * 0.34); foot.y = 0;
      s.add(roundStrut(foot, top, 0.052, legMat));
      s.add(roundStrut(foot.clone().lerp(top, 0.55), c.clone().setY(1.71).addScaledVector(v, sg * 0.30), 0.034, legMat));
    });
    const b1 = c.clone().addScaledVector(v, -0.30).setY(1.71);
    const b2 = c.clone().addScaledVector(v, 0.30).setY(1.71);
    s.add(roundStrut(b1, b2, 0.040, legMat));
    const pad = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.12, 0.20), vStone(0xA2967F, 0.96));
    pad.position.set(c.x, 0.06, c.z);
    pad.rotation.y = Math.atan2(u.z, u.x);
    s.add(pad);
  }
  // 落水口：到官盆上头拐下来一段
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.082, 1, 10), pipeMat);
  orientCylinder(spout, B.clone(), B.clone().add(new THREE.Vector3(0.16, -0.52, 0)));
  s.add(spout);
  // 井口那端的承台：一段收分石墩，管口从它肩上出去
  const abut = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 2.05, 10), vStone(0xA89A82, 0.95));
  abut.position.set(A.x - 0.10, 1.025, A.z);
  s.add(abut);
  return s;
}

// 井场附属建筑总装
function buildYard() {
  const part = PART.yard;
  const g = new THREE.Group();
  g.add(buildKitchen());
  g.add(buildStore());
  g.add(buildConduit());
  emit(g);
  flushBin(part);
}

// 把单位高度(沿 Y)的圆柱网格摆放为连接 p1→p2 的杆（供提卤绳随桶伸缩）
const _cylQ = new THREE.Quaternion(), _cylUp = new THREE.Vector3(0, 1, 0), _cylDir = new THREE.Vector3();
function orientCylinder(mesh, p1, p2) {
  _cylDir.subVectors(p2, p1);
  const len = _cylDir.length();
  mesh.position.set((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
  mesh.scale.set(1, len, 1);
  _cylDir.normalize();
  _cylQ.setFromUnitVectors(_cylUp, _cylDir);
  mesh.quaternion.copy(_cylQ);
}

// ============================================================
function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

// 碓梢最大摆角（rad）。**唯一来源**：duijiaAngle 与自检的行程上限都读它 ——
// 改了它，铁靴行程与自检断言同时跟着走，不会一个改一个漏。
const DUIJIA_AMAX = 0.20;

// 碓架冲击节奏：缓慢抬起到顶，再快速落下（冲击）。绕花辊轴的回转角。
// 0 = 碓梢水平、铁靴停在碓窝口（本位，也是全行程最低点）；
// 负角 = 碓工把长臂（踏板端）压下去、短臂那头的碓头抬起蓄能。
// 旧版是 -0.30…-0.62，两个端位都在负区 —— 等于把「本位」整个搬到抬高状态，
// 铁靴因此从来没落到过碓窝口，写死的碓杆长度也就一直把鞋子按在地里。
function duijiaAngle(t) {
  const period = 2.6;
  const p = (t % period) / period;
  if (p < 0.7) return -DUIJIA_AMAX * easeInOut(p / 0.7);           // 缓慢抬起
  return -DUIJIA_AMAX * (1 - easeInOut((p - 0.7) / 0.3));          // 快速落下
}

function focusOn(index) {
  const step = PROCESS[index];
  let toPos, toTarget;
  if (step.cam && step.target) {
    toPos = new THREE.Vector3(step.cam[0], step.cam[1], step.cam[2]);
    toTarget = new THREE.Vector3(step.target[0], step.target[1], step.target[2]);
  } else {
    const p = new THREE.Vector3(step.position[0], 0, step.position[2]);
    toPos = p.clone().add(new THREE.Vector3(0, 10, 24));
    toTarget = p.clone().add(new THREE.Vector3(0, 6, 0));
  }
  tween = { fromPos: camera.position.clone(), toPos, fromTarget: controls.target.clone(), toTarget, t: 0, dur: 1.1 };
  setActive(index);
}

// ============================================================
// UI 与 i18n
// ============================================================
// 聚焦系统：每个 part 独立材质，记录基色；
// 聚焦时聚焦件保持原色、其余轻微压暗——干净、无描边错位。
function initParts() {
  PART_ORDER.forEach((name) => {
    PART[name].traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      o.material.userData.baseColor = o.material.color.clone();
    });
  });
}

// 焦点即所得：聚焦构件保持原色，其余轻微压暗。井口/井台恒常参与（它是场地本身，不参与压暗）。
function applyFocus(index) {
  const focused = (index >= 1 && FOCUS_MAP[index]) ? FOCUS_MAP[index] : [];
  const dimAll = index >= 1 && focused.length > 0;
  PART_ORDER.forEach((name) => {
    if (name === 'well') return;   // 井口与井台常亮
    const isFocus = focused.includes(name);
    const dim = dimAll && !isFocus;
    PART[name].traverse((o) => {
      if (!o.isMesh) return;
      const mat = o.material, base = mat.userData.baseColor;
      if (!base) return;
      mat.color.copy(base);
      if (dim) mat.color.multiplyScalar(DIM);
    });
  });
}

function setActive(index) {
  currentActive = index;
  document.querySelectorAll('.nav-item').forEach((el, i) => el.classList.toggle('active', i === index));
  applyFocus(index);
  if (index >= 0) showInfo(PROCESS[index]);
}

// 自检：分区/压暗/碰撞回归（?selftest 时使用，供无头浏览器断言）
function runSelfTest() {
  const countDimmed = (grp, expectDim) => {
    let n = 0;
    grp.traverse((o) => {
      if (!o.isMesh || !o.material.userData.baseColor) return;
      const base = o.material.userData.baseColor;
      const eq = Math.abs(o.material.color.r - base.r) < 1e-4
              && Math.abs(o.material.color.g - base.g) < 1e-4
              && Math.abs(o.material.color.b - base.b) < 1e-4;
      if (expectDim ? !eq : eq) n++;
    });
    return n;
  };
  applyFocus(0);
  const resetDrift = countDimmed(scene, true);        // 总览：全部 = 基色
  applyFocus(2);                                      // 聚焦「天辊·风篾」
  const topDrift = countDimmed(PART.top, true);       // 聚焦件应保持原色（drift=0）
  const otherDrift = countDimmed(PART.cols, false);   // 其余应被压暗（drift>0）
  applyFocus(0);

  // —— 碰撞回归断言：关键线段不得命中「不应相交」的构件分区 ——
  // 必须先刷新世界矩阵：runSelfTest 跑在首帧渲染之前，射线检测依赖 matrixWorld。
  scene.updateMatrixWorld(true);
  const collisionErrors = [];
  const objectParts = new Map();
  const segmentHits = (p1, p2, targets, label, near = 0.05) => {
    const a = new THREE.Vector3(...p1), b = new THREE.Vector3(...p2);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    if (len < 1e-6) return [];
    dir.normalize();
    const objs = [];
    objectParts.clear();
    targets.forEach((partName) => {
      if (!PART[partName]) return;
      PART[partName].traverse((o) => { if (o.isMesh) { objectParts.set(o, partName); objs.push(o); } });
    });
    const ray = new THREE.Raycaster(a, dir, near, len * 0.995);
    return ray.intersectObjects(objs, false).map((h) => {
      const bb = new THREE.Box3().setFromObject(h.object);
      const f = (v) => Math.round(v * 100) / 100;
      return {
        label,
        part: objectParts.get(h.object) ?? '?',
        point: [f(h.point.x), f(h.point.y), f(h.point.z)],
        box: [f(bb.min.x), f(bb.min.y), f(bb.min.z), f(bb.max.x), f(bb.max.y), f(bb.max.z)],
        tris: Math.round((h.object.geometry.index ? h.object.geometry.index.count : h.object.geometry.attributes.position.count) / 3),
      };
    });
  };

  let checked = 0;
  // 风篾不得刺穿井场设备（风篾本就系于塔身，故不检 cols）
  staySegments().forEach((seg) => {
    checked += 1;
    const hits = segmentHits(seg.p1, seg.p2, ['cart', 'ground', 'duijia', 'shed', 'well', 'yard'], `wind@${Math.round(seg.az * 180 / Math.PI)}deg`);
    if (hits.length) collisionErrors.push(...hits);
  });
  // 提卤绳（天辊底 → 汲卤筒顶）不得穿塔身箍梁与斜撑
  const w = PART.bailerAnim;
  const anchor = [0, DER.topY - 0.62, 0];
  [[BAILER.maxTip, 'lift-top'], [BAILER.minTip, 'lift-bottom']].forEach(([yy, label]) => {
    checked += 1;
    const hits = segmentHits(anchor, [0, yy + BAILER.len + 0.30, 0], ['cols', 'top'], label);
    if (hits.length) collisionErrors.push(...hits);
  });
  // 碓架：铁靴全程不得越出碓窝净口（2026-09-15 加）。
  // 旧版碓杆硬接矮臂端点，铁靴横漂 0.59 m、左侧越界 0.384 m 切进条石。
  // 现在碓杆铅直、横漂由结构归零，这里把它变成断言 —— 改摆角/臂长/窝口尺寸都会撞到它。
  let duijiaClear = null;
  if (PART.duijiaRod && PART.duijiaShoe && PART.duijiaPivot) {
    checked += 1;
    const S = DUIJIA_SIZE;
    const mouthL = -S.HARM - S.MOUTH, mouthR = -S.HARM + S.MOUTH;
    const prevA = PART.duijiaPivot.rotation.z, prevY = PART.duijiaRod.position.y;
    const inv = new THREE.Matrix4().copy(PART.duijiaRod.parent.matrixWorld).invert();
    const v = new THREE.Vector3(), vp = PART.duijiaShoe.geometry.attributes.position;
    let lo = 1e9, hi = -1e9, botY = 1e9;
    [0, -DUIJIA_AMAX].forEach((a) => {            // 本位 与 抬到顶 两个端位
      PART.duijiaPivot.rotation.z = a;
      PART.duijiaRod.position.y = S.RING_Y - S.HARM * Math.sin(a);
      scene.updateMatrixWorld(true);
      for (let i = 0; i < vp.count; i++) {
        v.fromBufferAttribute(vp, i).applyMatrix4(PART.duijiaShoe.matrixWorld).applyMatrix4(inv);
        lo = Math.min(lo, v.x); hi = Math.max(hi, v.x); botY = Math.min(botY, v.y);
      }
    });
    PART.duijiaPivot.rotation.z = prevA; PART.duijiaRod.position.y = prevY;
    scene.updateMatrixWorld(true);
    duijiaClear = {
      shoeX: [+lo.toFixed(3), +hi.toFixed(3)], mouthX: [+mouthL.toFixed(3), +mouthR.toFixed(3)],
      clearL: +(lo - mouthL).toFixed(3), clearR: +(mouthR - hi).toFixed(3), shoeBottom: +botY.toFixed(3),
    };
    if (duijiaClear.clearL < 0) collisionErrors.push({ label: 'duijia-shoe-left', detail: `over=${(-duijiaClear.clearL).toFixed(3)}m` });
    if (duijiaClear.clearR < 0) collisionErrors.push({ label: 'duijia-shoe-right', detail: `over=${(-duijiaClear.clearR).toFixed(3)}m` });
    if (botY < 0.02) collisionErrors.push({ label: 'duijia-shoe-floor', detail: `y=${botY.toFixed(3)}` });
  }

  // 汲卤筒最低行程：筒体必须仍在井口之上、不埋进石板井台
  const prevY = w.bucket.position.y;
  w.bucket.position.y = BAILER.minTip;
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3();
  w.bucket.traverse((o) => { if (o.isMesh) box.expandByObject(o); });
  const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
  const maxR = Math.max(
    Math.abs(box.min.x - cx), Math.abs(box.max.x - cx),
    Math.abs(box.min.z - cz), Math.abs(box.max.z - cz)
  );
  if (box.min.y < 0.15) collisionErrors.push({ label: 'bailer-bottom', detail: `tipY=${box.min.y.toFixed(2)}` });
  if (maxR > 0.34) collisionErrors.push({ label: 'bailer-radius', detail: `r=${maxR.toFixed(2)}` });
  w.bucket.position.y = prevY;
  scene.updateMatrixWorld(true);

  collisionErrors.forEach((e) => window.__errs.push(`collision:${e.label}`));
  const diag = {
    errs: window.__errs,
    parts: PART_ORDER.length,
    partChildren: PART_ORDER.map((n) => PART[n].children.length),
    triangles: (() => { let tri = 0; scene.traverse((o) => { if (o.isMesh) tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); return Math.round(tri); })(),
    meshes: (() => { let n = 0; scene.traverse((o) => { if (o.isMesh) n++; }); return n; })(),
    // 逐分区三角面（2026-09-15 加）。加一批新构件时，triangles 总数必然变，
    // 于是「有没有顺手改动到既有构件」就无从判断 —— 而改动贴图/材质/摆放顺序
    // 最容易误伤的就是这个。把每个 PART 单独数出来，改完只需对照旧值：
    // 既有分区的数**逐位相同**，就证明新代码只做了加法。
    // 注意：只数 PART_ORDER 里的分区；远景（buildBackdrop）与地面在 PART 之外，
    // 它们各自另有断言（地面亮度 161.9、三层山明度阶梯），数在这里是为了让
    // 「范围覆盖到哪」这件事在自检里是显式的。
    triByPart: PART_ORDER.map((n) => {
      let tri = 0;
      PART[n].traverse((o) => { if (o.isMesh) tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
      return Math.round(tri);
    }),
    seed: SEED,          // 已种子化：meshes 现在也同 seed 必同值，可作断言
    // 碓架铁靴底在最低位的标高：必须 > 0（不得入地）。改门柱高/碓头尺寸后先看它。
    duijiaShoeBottom: +DUIJIA_SHOE_BOTTOM.toFixed(3),
    resetDrift, topDrift, otherDrift,
    collision: { checked, hits: collisionErrors.length, clear: collisionErrors.length === 0, errors: collisionErrors },
    duijiaClear,
    selftest: collisionErrors.length === 0 ? 'ok' : 'fail',
  };
  window.__diag = diag;
  const d = document.getElementById('diag');
  if (d) d.textContent = JSON.stringify(diag);
}

function showInfo(step) {
  const panel = document.getElementById('infopanel');
  const I = I18N[state.lang];
  panel.classList.add('show');
  panel.scrollTop = 0;
  document.getElementById('ip-index').textContent = `${I.ipIndex} ${String(step.index).padStart(2, '0')} / ${String(PROCESS.length).padStart(2, '0')}`;
  document.getElementById('ip-name').textContent = lf(step, 'name');
  document.getElementById('ip-sub').textContent = lf(step, 'subtitle');
  document.getElementById('ip-principle').textContent = lf(step, 'principle');
  const rx = (step.reaction && step.reaction.en) ? (state.lang === 'en' ? step.reaction.en : step.reaction.zh) : step.reaction;
  document.getElementById('ip-reaction').innerHTML = rx.map((r) => `<code>${r}</code>`).join('');
  const eq = lf(step, 'equipment');
  const eqBlock = document.getElementById('ip-equip-block');
  if (eq && eq.length) { eqBlock.style.display = ''; document.getElementById('ip-equip').innerHTML = eq.map((e) => `<li>${e}</li>`).join(''); }
  else eqBlock.style.display = 'none';
  document.getElementById('ip-params').innerHTML = lf(step, 'params').map((p) => `<span>${p}</span>`).join('');
  const op = lf(step, 'output');
  const opBlock = document.getElementById('ip-output-block');
  if (op) { opBlock.style.display = ''; document.getElementById('ip-output').textContent = op; }
  else opBlock.style.display = 'none';
  document.getElementById('ip-color').style.background = '#' + step.color.toString(16).padStart(6, '0');
  document.getElementById('ip-title').textContent = I.ipPrinciple;
  document.getElementById('ip-reaction-title').textContent = I.ipReaction;
  document.getElementById('ip-equip-title').textContent = I.ipEquip;
  document.getElementById('ip-params-title').textContent = I.ipParams;
  document.getElementById('ip-output-title').textContent = I.ipOutput;
}
function buildNav() {
  const nav = document.getElementById('nav-list');
  PROCESS.forEach((step, i) => {
    const item = document.createElement('button');
    item.className = 'nav-item';
    item.onclick = () => { stopTour(); focusOn(i); };
    nav.appendChild(item); navEls.push(item);
  });
  applyNavText();
}
function applyNavText() {
  PROCESS.forEach((step, i) => {
    const col = '#' + step.color.toString(16).padStart(6, '0');
    navEls[i].innerHTML = `<span class="nav-dot" style="background:${col}"></span>
      <span class="nav-idx">${String(step.index).padStart(2, '0')}</span>
      <span class="nav-name">${lf(step, 'name')}</span>`;
  });
}
function refreshControlsText() {
  const I = I18N[state.lang].ctrl;
  const playBtn = document.getElementById('btn-play');
  if (playBtn) playBtn.textContent = playing ? I.pause : I.play;
  const tourBtn = document.getElementById('btn-tour');
  if (tourBtn) {
    tourBtn.textContent = autoTour ? I.touring : I.tour;
    tourBtn.classList.toggle('active', autoTour);
  }
}
function applyLang() {
  const I = I18N[state.lang];
  document.getElementById('side-title').textContent = I.sideTitle;
  document.getElementById('side-tip').textContent = I.sideTip;
  const legend = document.getElementById('legend');
  if (legend) legend.innerHTML = LEGEND.map((l) => `<span><i style="background:#${l.color.toString(16).padStart(6, '0')}"></i>${state.lang === 'en' ? l.en : l.zh}</span>`).join('');
  const langBtn = document.getElementById('btn-lang');
  if (langBtn) { langBtn.dataset.lang = state.lang; langBtn.querySelector('.ct').textContent = state.lang === 'zh' ? 'EN' : '中'; }
  const ovBtn = document.getElementById('btn-overview');
  if (ovBtn) ovBtn.textContent = I.btnOverview;
  applyNavText();
  refreshControlsText();
  if (currentActive >= 0) showInfo(PROCESS[currentActive]);
}
function stopTour() {
  autoTour = false; tourTimer = 0;
  const b = document.getElementById('btn-tour');
  if (b) b.classList.remove('active');
  refreshControlsText();
}

function bindUI() {
  const langBtn = document.getElementById('btn-lang');
  if (langBtn) langBtn.onclick = () => { state.lang = state.lang === 'zh' ? 'en' : 'zh'; applyLang(); };
  const ovBtn = document.getElementById('btn-overview');
  if (ovBtn) ovBtn.onclick = () => { stopTour(); focusOn(0); };
  const playBtn = document.getElementById('btn-play');
  if (playBtn) playBtn.onclick = () => { playing = !playing; refreshControlsText(); };
  const tourBtn = document.getElementById('btn-tour');
  if (tourBtn) tourBtn.onclick = () => {
    if (autoTour) { stopTour(); return; }
    autoTour = true; tourTimer = 0;
    tourIndex = currentActive >= 0 ? currentActive : 0;
    refreshControlsText();
  };
  bindInfoDrawer();
}

// 详情面板：点击『详情』按钮 / 头部文字都触发折叠切换；竖屏支持拖拽头部收起。
function bindInfoDrawer() {
  const panel = document.getElementById('infopanel');
  if (!panel) return;
  const head = panel.querySelector('.ip-head');
  const toggle = panel.querySelector('.ip-toggle');
  const setOpen = (open) => {
    panel.classList.toggle('expanded', open);
    head.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '收起详情' : '展开详情');
  };

  head.addEventListener('click', (e) => {
    if (e.target.closest('.ip-toggle')) return;
    setOpen(!panel.classList.contains('expanded'));
  });
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!panel.classList.contains('expanded'));
  });
  head.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!panel.classList.contains('expanded')); }
  });

  let dragStartY = 0, dragPointerId = -1, dragMoved = false;
  const isNarrow = () => window.matchMedia('(max-width: 860px)').matches;
  head.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.ip-toggle')) return;
    if (!isNarrow()) return;
    dragStartY = e.clientY; dragPointerId = e.pointerId; dragMoved = false;
  });
  head.addEventListener('pointermove', (e) => {
    if (e.pointerId !== dragPointerId) return;
    const dy = e.clientY - dragStartY;
    if (!dragMoved && Math.abs(dy) < 6) return;
    dragMoved = true;
    panel.classList.add('dragging');
  });
  head.addEventListener('pointerup', (e) => {
    if (e.pointerId !== dragPointerId) return;
    const dy = e.clientY - dragStartY;
    const wasDragging = dragMoved;
    dragStartY = 0; dragPointerId = -1; dragMoved = false;
    panel.classList.remove('dragging');
    if (!wasDragging) return;
    const wasExpanded = panel.classList.contains('expanded');
    if (wasExpanded && dy > 60) setOpen(false);
    else if (!wasExpanded && dy < -60) setOpen(true);
  });
  head.addEventListener('pointercancel', () => {
    dragStartY = 0; dragPointerId = -1; dragMoved = false;
    panel.classList.remove('dragging');
  });
}

// ============================================================
// 主循环
// ============================================================
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (tween) {
    tween.t += dt / tween.dur;
    const k = easeInOut(Math.min(tween.t, 1));
    camera.position.lerpVectors(tween.fromPos, tween.toPos, k);
    controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k);
    if (tween.t >= 1) tween = null;
  }

  if (playing) {
    // 碓架冲击：碓梢绕花辊轴摆，踏板吊在长臂下只跟着上下平移
    if (PART.duijiaPivot) {
      const da = duijiaAngle(t);
      PART.duijiaPivot.rotation.z = da;
      // 碓杆：吊索吊着 + 导环箍着 → 只随矮臂端点**竖直**升降，横向一动不动。
      // 竖直位移 = HARM·sin(角)（不是 1−cos —— 那个是端点的横向分量，正是旧版的病灶）。
      const rodY = DUIJIA_RING_Y - DUIJIA_HARM * Math.sin(da);
      if (PART.duijiaRod) PART.duijiaRod.position.y = rodY;
      if (PART.duijiaSling) {
        // 吊索两端都在碓架局部坐标里解析求值，不依赖矩阵更新顺序
        const c = Math.cos(da), s = Math.sin(da);
        _djA.set(-DUIJIA_HARM * c + DUIJIA_EYE_DY * s,
                 DUIJIA_LEVER_Y - DUIJIA_HARM * s - DUIJIA_EYE_DY * c, 0);
        PART.duijiaSling.forEach((mm) => {
          _djB.set(-DUIJIA_HARM + mm.userData.sx, rodY, 0);
          orientCylinder(mm, _djA, _djB);
        });
      }
      if (PART.duijiaPedal) {
        // 踏板吊点在长臂末端的下方：局部高度 = 碓梢轴高 + PARM·sin(角) − 半梁厚 − 吊杆长
        PART.duijiaPedal.position.y = DUIJIA_LEVER_Y + DUIJIA_PARM * Math.sin(da)
          - DUIJIA_LEVER_T / 2 - DUIJIA_HANG;
      }
    }

    // 提卤叙事：汲卤筒升降 + 提卤绳联动天辊 / 地辊 / 大车
    const w = PART.bailerAnim;
    const p = (t % 9.0) / 9.0;
    const yy = BAILER.minTip + (BAILER.maxTip - BAILER.minTip) * (0.5 - 0.5 * Math.cos(p * Math.PI * 2));
    w.bucket.position.y = yy;
    orientCylinder(w.rope, new THREE.Vector3(0, DER.topY - 0.62, 0), new THREE.Vector3(0, yy + BAILER.len + 0.30, 0));
    const vel = (yy - w.prevY) / Math.max(dt, 1e-3);
    w.prevY = yy;
    const dW = -vel * 0.22 * dt;   // 桶升→收绳：三只轮同向转
    if (PART.cartWheel) PART.cartWheel.rotation.z += dW;
    if (PART.skyWheel) PART.skyWheel.rotation.z += dW;
    if (PART.groundWheel) PART.groundWheel.rotation.z += dW;
  }

  if (autoTour && playing) {
    tourTimer += dt;
    if (tourTimer > 4.5) { tourTimer = 0; tourIndex = (tourIndex + 1) % PROCESS.length; focusOn(tourIndex); }
  }

  controls.update();
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

try {
  init();
} catch (e) {
  __recordErr('init:' + (e && e.stack ? e.stack : e));
  throw e;
}
