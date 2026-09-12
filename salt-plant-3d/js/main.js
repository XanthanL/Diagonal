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

// 自贡天车古朴木构配色（暖纸底上的陈年杉木 / 竹篾 / 熟铁）
const WOOD = 0x77634C;         // 陈年杉木主色
const WOOD_DARK = 0x4A3B2B;    // 陈年杉木暗部（箍梁·天夹板）
const WOOD_LIGHT = 0x8F7F64;   // 陈年杉木亮部（受光面）
const BAMBOO = 0xC2C49C;       // 竹篾（箍·绳）
const BAMBOO_PALE = 0xA6A283;  // 新篾（竹笆编织面）
const IRON = 0x6B6259;         // 做旧铁箍
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
const STAGE = [
  { y0: 0, y1: 5.1, count: 4, rad: 0.100, spread: 0.135, bindStep: 0.52 },
  { y0: 5.1, y1: 10.2, count: 3, rad: 0.082, spread: 0.105, bindStep: 0.56 },
  { y0: 10.2, y1: DER.H, count: 2, rad: 0.065, spread: 0.075, bindStep: 0.62 },
];
// 风篾：8 根，方位 22.5° + 45°k（与四面、四角都错开，避免正对井场设备）
const STAY_AZ = Array.from({ length: 8 }, (_, k) => Math.PI / 8 + (k * Math.PI) / 4);
const STAY_Y = 12.2;     // 挂点高（天箍头处）
const STAY_R = 9.5;      // 落地半径

// 井场设备布置（同时作为风篾避让与碰撞回归的依据）
const WELL = { x: 0, z: 0 };
const CART = { x: -5.4, z: 0, R: 1.7, axleY: 1.9 };
const ROLLER = { x: -1.6, z: 0, R: 0.30, axleY: 0.95 };   // 绳离辊高 ≈1.25
const DUIJIA = { x: 5.0, z: 0 };
// 寮棚落在风篾空档方位（315°）——与 -x 侧的大车、+x 侧的碓架都不重叠，
// 且避开默认总览机位（+x+z）的正面视线，不挡塔身
const SHED = { x: 5.23, z: -5.23 };
// 汲卤筒（细长竹筒）：len 筒身长、rTop/rBot 上下半径、valve 筒底阀头长
// minTip/maxTip 为「筒底标高」的升降行程（入井时阀头没入井唇石箍）
const BAILER = { len: 3.0, rTop: 0.15, rBot: 0.14, valve: 0.30, minTip: 0.72, maxTip: 2.2 };

let scene, camera, renderer, controls, clock;
// 聚焦分区：每个导航项对应一组 part，便于「聚焦件保持原色 / 其余压暗」
const PART_ORDER = ['cols', 'top', 'stays', 'well', 'bailer', 'cart', 'ground', 'duijia', 'shed'];
const FOCUS_MAP = [
  null,                 // 0 总览
  ['cols'],             // 1 束柱
  ['top', 'stays'],     // 2 天辊 · 风篾
  ['cart'],             // 3 大车
  ['ground'],           // 4 地辊
  ['duijia'],           // 5 碓架
  ['bailer'],           // 6 汲卤筒
  ['shed'],             // 7 盐工寮棚 · 竹笆
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

// 井场夯土 / 石屑地面：素色 + 细砂噪点 + 大尺度斑驳（无网格线，避免工业厂房感）
function makeFloorTexture() {
  const s = 512, c = cv(s), x = c.getContext('2d');
  x.fillStyle = '#E9E5DB'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 5200; i++) {
    const a = Math.random() * 0.07;
    x.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(96,90,78,${a})`;
    x.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  for (let i = 0; i < 22; i++) {
    const mx = Math.random() * s, my = Math.random() * s, mr = 24 + Math.random() * 58;
    const rg = x.createRadialGradient(mx, my, 0, mx, my, mr);
    rg.addColorStop(0, Math.random() > 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(92,84,70,0.045)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(16, 16); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeStoneTexture() {
  const s = 512, c = cv(s), x = c.getContext('2d');
  x.fillStyle = '#EFEBE3'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 5200; i++) {
    const a = Math.random() * 0.12;
    x.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(40,38,34,${a})`;
    x.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  x.strokeStyle = 'rgba(50,47,42,0.45)'; x.lineWidth = 2;
  for (let i = 0; i < 60; i++) {
    let px = Math.random() * s, py = Math.random() * s;
    x.beginPath(); x.moveTo(px, py);
    const seg = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < seg; k++) { px += (Math.random() - 0.5) * 70; py += (Math.random() - 0.5) * 50; x.lineTo(px, py); }
    x.stroke();
  }
  for (let i = 0; i < 22; i++) {
    const mx = Math.random() * s, my = Math.random() * s, mr = 30 + Math.random() * 90;
    const rg = x.createRadialGradient(mx, my, 0, mx, my, mr);
    rg.addColorStop(0, Math.random() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)');
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
  for (let i = 0; i < s; i += 8) { x.beginPath(); x.moveTo(0, i + Math.random() * 3); x.lineTo(s, i + Math.random() * 3); x.stroke(); }
  for (let i = 0; i < 74; i++) {
    const mx = Math.random() * s, my = Math.random() * s, mr = 5 + Math.random() * 32;
    const rg = x.createRadialGradient(mx, my, 0, mx, my, mr);
    rg.addColorStop(0, `rgba(${(138 + Math.random() * 62) | 0},${(72 + Math.random() * 38) | 0},34,${0.16 + Math.random() * 0.38})`);
    rg.addColorStop(1, 'rgba(122,62,28,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
  }
  for (let i = 0; i < 2400; i++) {
    x.fillStyle = Math.random() > 0.55 ? `rgba(26,22,18,${Math.random() * 0.4})` : `rgba(198,156,102,${Math.random() * 0.16})`;
    x.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2);
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
    const y = Math.random() * s, sx = Math.random() * s, len = 18 + Math.random() * 66;
    x.strokeStyle = (Math.random() > 0.55 ? 'rgba(72,56,30,' : 'rgba(208,188,142,') + (0.07 + Math.random() * 0.2) + ')';
    x.lineWidth = 1 + Math.random() * 2;
    x.beginPath(); x.moveTo(sx, y); x.lineTo(sx + len, y + (Math.random() - 0.5) * 3); x.stroke();
  }
  x.strokeStyle = 'rgba(58,46,24,0.42)'; x.lineWidth = 5;
  for (let i = 0; i <= s; i += 112) { x.beginPath(); x.moveTo(0, i); x.lineTo(s, i); x.stroke(); }
  for (let i = 0; i < 30; i++) {
    const mx = Math.random() * s, my = Math.random() * s, mr = 12 + Math.random() * 48;
    const rg = x.createRadialGradient(mx, my, 0, mx, my, mr);
    rg.addColorStop(0, Math.random() > 0.5 ? 'rgba(58,50,28,0.15)' : 'rgba(118,122,86,0.13)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 陈年杉木：深褐灰底 + 波动竖纹 + 雨蚀泛白 + 木节 + 干裂 + 近地青苔
function makeWoodTexture() {
  const s = 512, c = cv(s), x = c.getContext('2d');
  x.fillStyle = '#C9B79B'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 320; i++) {
    const gx = Math.random() * s, w = 1 + Math.random() * 3;
    const dark = Math.random() > 0.5;
    x.strokeStyle = (dark ? 'rgba(48,38,26,' : 'rgba(178,163,138,') + (0.04 + Math.random() * 0.11) + ')';
    x.lineWidth = w;
    x.beginPath(); x.moveTo(gx, 0);
    for (let y = 0; y <= s; y += 14) x.lineTo(gx + Math.sin(y * 0.035 + gx) * 2.4, y);
    x.stroke();
  }
  for (let i = 0; i < 90; i++) {
    const gx = Math.random() * s;
    x.strokeStyle = `rgba(214,205,186,${0.03 + Math.random() * 0.05})`;
    x.lineWidth = 1 + Math.random() * 2;
    x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx + (Math.random() - 0.5) * 4, s); x.stroke();
  }
  x.strokeStyle = 'rgba(46,30,14,0.22)'; x.lineWidth = 2;
  for (let i = 0; i <= s; i += 128) { x.beginPath(); x.moveTo(0, i); x.lineTo(s, i); x.stroke(); }
  for (let i = 0; i < 16; i++) {
    const kx = Math.random() * s, ky = Math.random() * s, r = 4 + Math.random() * 9;
    for (let rr = r; rr > 1; rr -= 2) {
      const rg = x.createRadialGradient(kx, ky, 0, kx, ky, rr);
      rg.addColorStop(0, 'rgba(58,36,16,0.5)'); rg.addColorStop(1, 'rgba(58,36,16,0)');
      x.fillStyle = rg; x.beginPath(); x.arc(kx, ky, rr, 0, Math.PI * 2); x.fill();
    }
  }
  x.strokeStyle = 'rgba(38,26,14,0.35)'; x.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    let px = Math.random() * s, py = Math.random() * s;
    x.beginPath(); x.moveTo(px, py);
    const seg = 3 + Math.floor(Math.random() * 4);
    for (let k = 0; k < seg; k++) { px += (Math.random() - 0.5) * 30; py += (Math.random() - 0.5) * 22; x.lineTo(px, py); }
    x.stroke();
  }
  for (let i = 0; i < 2600; i++) {
    x.fillStyle = `rgba(38,28,16,${Math.random() * 0.06})`;
    x.fillRect(Math.random() * s, Math.random() * s, 1, 1);
  }
  for (let i = 0; i < 1500; i++) {
    x.fillStyle = `rgba(208,199,181,${Math.random() * 0.05})`;
    x.fillRect(Math.random() * s, Math.random() * s, 1, 1);
  }
  for (let i = 0; i < 26; i++) {
    const mx = Math.random() * s, my = s * (0.55 + Math.random() * 0.45), mr = 8 + Math.random() * 26;
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
  hsl.l = Math.min(1, Math.max(0.05, hsl.l * (0.85 + Math.random() * 0.3)));
  hsl.s = Math.min(1, hsl.s * (0.9 + Math.random() * 0.2));
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return new THREE.MeshStandardMaterial({
    map, color: c,
    roughness: Math.min(1, Math.max(0.3, rough + (Math.random() - 0.5) * 0.14)),
    metalness: 0.0,
  });
}
// 材质池：同类构件复用有限数量的做旧变体，既保留「逐根木头不一样」的手工感，
// 又让几何合并能把成百上千根细木压缩到个位数 draw call。
const _matPool = new Map();
function poolMat(key, map, color, rough, n = 7) {
  let arr = _matPool.get(key);
  if (!arr) { arr = []; for (let i = 0; i < n; i++) arr.push(vTint(map, color, rough)); _matPool.set(key, arr); }
  return arr[(Math.random() * arr.length) | 0];
}
function vWood(color, rough) { return poolMat(`w${color}_${rough}`, TEX.wood, color, rough); }
function vStone(color, rough) { return poolMat(`s${color}_${rough}`, TEX.stone, color, rough, 5); }
function vBamboo(color = BAMBOO_PALE, rough = 0.9) { return poolMat(`b${color}_${rough}`, TEX.wood, color, rough, 5); }
// 共享材质（铁 / 篾 / 茅草 / 绳）——节点数量大，必须共享才能合并
let _ironM = null, _bambooM = null, _thatchM = null, _ropeM = null;
function ironS() {
  if (!_ironM) _ironM = new THREE.MeshStandardMaterial({ map: TEX.rust, color: IRON, roughness: 0.72, metalness: 0.58 });
  return _ironM;
}
function bambooS() {
  if (!_bambooM) _bambooM = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 0.95, metalness: 0.0 });
  return _bambooM;
}
function thatchS() {
  if (!_thatchM) _thatchM = new THREE.MeshStandardMaterial({ map: TEX.thatch, color: THATCH, roughness: 1.0, metalness: 0.0 });
  return _thatchM;
}
function ropeS() {
  if (!_ropeM) _ropeM = new THREE.MeshStandardMaterial({ color: 0x9A8F6B, roughness: 1.0, metalness: 0.0 });
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
  return cachedGeo('unitCyl', () => new THREE.CylinderGeometry(0.94, 1, 1, 7));
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
  m.scale.set(rad, h, rad);                       // 共享单位圆柱，靠缩放得到粗细/长短
  m.position.set(ox, (y0 + y1) / 2, oz);
  m.rotation.y = Math.random() * Math.PI;         // 转一下，木纹不重复
  m.castShadow = true;
  return m;
}

// 一根完整的束柱：整柱一次生成，各根杉木的偏置沿全高固定不变（柱身才读得出「一束」），
// 每根切成若干截、接缝高度逐根错开（错缝搭接）；竹篾箍等距密缠，每 ironEvery 道换一道铁箍。
function bundleColumn(p1, p2, opt = {}) {
  const {
    count = 3, rad = 0.085, spread = 0.105,
    color = WOOD, rough = 0.88,
    bindStep = 0.55, ironEvery = 4, splices = 2,
  } = opt;
  const grp = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  if (len < 1e-3) return grp;

  const hasCore = count >= 5;
  const ringN = hasCore ? count - 1 : count;
  const phase = Math.random() * Math.PI * 2;
  const trunks = [];
  for (let i = 0; i < count; i++) {
    let ox = 0, oz = 0;
    if (!(hasCore && i === 0)) {
      const k = hasCore ? i - 1 : i;
      const a = (k / Math.max(1, ringN)) * Math.PI * 2 + phase;
      const rr = spread * (0.9 + Math.random() * 0.2);
      ox = Math.cos(a) * rr; oz = Math.sin(a) * rr;
    }
    trunks.push({ ox, oz, r: rad * (0.86 + Math.random() * 0.28) });
  }

  trunks.forEach((t) => {
    const cuts = [0];
    for (let k = 1; k <= splices; k++) cuts.push(k / (splices + 1) + (Math.random() - 0.5) * 0.22);
    cuts.push(1);
    cuts.sort((a, b) => a - b);
    for (let k = 0; k < cuts.length - 1; k++) {
      const y0 = -len / 2 + len * cuts[k] - (k > 0 ? 0.06 : 0);
      const y1 = -len / 2 + len * cuts[k + 1] + (k < cuts.length - 2 ? 0.06 : 0);
      grp.add(trunkMesh(t.ox, t.oz, y0, y1, t.r, color, rough));
    }
  });

  // 箍环半径取木束实际外缘上限，确保箍套在木外、不切入杉木
  const bindR = (count > 1 ? spread * 1.12 : 0) + rad * 1.2;
  const n = Math.max(2, Math.round(len / bindStep));
  const wg = windGeoC(r2(bindR), 0.3, 2, 0.022);
  const ig = hoopGeoC(r2(bindR + 0.02), 0.046, 14);
  for (let i = 0; i <= n; i++) {
    const y = -len / 2 + (len / n) * i;
    if (ironEvery > 0 && i % ironEvery === 0) {
      const h = new THREE.Mesh(ig, ironS());
      h.rotation.x = Math.PI / 2; h.position.set(0, y, 0);
      grp.add(h);
    } else {
      const w = new THREE.Mesh(wg, bambooS());
      w.position.set(0, y, 0);
      w.rotation.y = (i * 0.7) % Math.PI;
      grp.add(w);
    }
  }

  grp.position.set((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
  grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return grp;
}

// 两点之间的木杆 / 斜撑 / 箍梁（按方向自动朝向）
function strut(p1, p2, thickness, mat) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y, dz = p2.z - p1.z;
  const len = Math.hypot(dx, dy, dz);
  const m = new THREE.Mesh(new THREE.BoxGeometry(thickness, len, thickness), mat);
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
  scene.fog = new THREE.FogExp2(BG, 0.0072);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(20, 14, 26);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('scene-root').appendChild(renderer.domElement);

  // 环境反射：程序生成「上白下暖」渐变环境，让铁箍在白底上有真实金属感
  scene.environment = makeEnvTexture(renderer);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 120;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 6.2, 0);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xece8df, 1.0); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 1.15);
  dir.position.set(26, 44, 22); dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.near = 1; dir.shadow.camera.far = 240;
  dir.shadow.camera.left = -56; dir.shadow.camera.right = 56;
  dir.shadow.camera.top = 56; dir.shadow.camera.bottom = -56;
  dir.shadow.bias = -0.0009;
  scene.add(dir);
  const fill = new THREE.DirectionalLight(0xcfc7ba, 0.42); fill.position.set(-28, 18, -22); scene.add(fill);

  TEX.floor = makeFloorTexture();
  TEX.wood = makeWoodTexture();
  TEX.stone = makeStoneTexture();
  TEX.rust = makeRustTexture();
  TEX.thatch = makeThatchTexture();
  // 各向异性过滤：地面/石材在掠射角下才不会糊成一片、读成一条 mipmap 色带
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  Object.keys(TEX).forEach((k) => { if (TEX[k] && TEX[k].isTexture) TEX[k].anisotropy = maxAniso; });

  buildGround();
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
  window.__sp = { THREE, scene, camera, controls, renderer, PART, PROCESS, focusOn, applyFocus };

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
function buildGround() {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160),
    new THREE.MeshStandardMaterial({ map: TEX.floor, color: 0xE7E3D9, roughness: 0.97, metalness: 0.0 })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = GROUND_Y - 0.02;
  plane.receiveShadow = true;
  scene.add(plane);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(11.2, 11.55, 128),
    new THREE.MeshBasicMaterial({ color: 0xC9C2B2, transparent: true, opacity: 0.55, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = GROUND_Y - 0.005;
  scene.add(ring);
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
    const blk = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.72, 0.30), vStone(0x948F85, 0.96));
    blk.position.set(X + Math.cos(a) * 0.84, 0.36, Z + Math.sin(a) * 0.84);
    blk.rotation.y = -a;
    blk.scale.set(1, 0.94 + Math.random() * 0.12, 1);
    blk.castShadow = true; blk.receiveShadow = true; part.add(blk);
  }
  const cap = new THREE.Mesh(hoopGeoC(0.97, 0.1, 32), vStone(0x8B867D, 0.95));
  cap.rotation.x = Math.PI / 2; cap.position.set(X, 0.74, Z); cap.castShadow = true; part.add(cap);
  const band = new THREE.Mesh(hoopGeoC(1.01, 0.035, 32), ironS());
  band.rotation.x = Math.PI / 2; band.position.set(X, 0.44, Z); part.add(band);

  // 井筒暗孔：汲卤筒下探时没入此孔
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 1.4, 28),
    new THREE.MeshStandardMaterial({ color: 0x241F1B, roughness: 0.98, metalness: 0.0 })
  );
  shaft.position.set(X, -0.08, Z); part.add(shaft);
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
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.38, 0.66), vStone(0x928D84, 0.96));
    pl.position.set(sx * DER.a0, 0.28, sz * DER.a0);
    pl.rotation.y = (Math.random() - 0.5) * 0.24;
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
    part.add(strut(new THREE.Vector3(...p1), new THREE.Vector3(...p2), 0.035, ropeS()));
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

  // 提卤绳：每帧由 orientCylinder 改写 position/scale/quaternion
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 1, 6), ropeS());
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

  // 轮缘：厚木环，自带绳槽 —— 大车之所以做得这么巨大，
  // 正因为提卤绳是直接绕在轮缘槽里的（不是绕在中央小鼓上）
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.15, 10, 34), woodTex(WOOD, 0.9));
  rim.castShadow = true; wheelGrp.add(rim);
  wheelGrp.add(new THREE.Mesh(hoopGeoC(R, 0.035, 34), bambooS()));
  [-0.19, 0.19].forEach((zz) => {
    const band = new THREE.Mesh(hoopGeoC(R, 0.026, 34), ironS());
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
  part.add(strut(
    new THREE.Vector3(0, DER.topY - 0.62, 0),
    new THREE.Vector3(ROLLER.x, ROLLER.axleY + ROLLER.R, ROLLER.z),
    0.05, ropeS()
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

  // 绳路第二段：地辊 → 大车轮缘（同高水平引出，读作绳绕上轮）
  const ropeY = axleY + R;
  part.add(strut(
    new THREE.Vector3(x, ropeY, z),
    new THREE.Vector3(CART.x + CART.R + 0.16, ropeY, CART.z),
    0.05, ropeS()
  ));
}

// ------------------------------------------------------------
// 碓架（踩架）：冲击式顿钻。门形木架 + 花辊轴 + 杠杆 + 碓头铁靴 + 踏板
// ------------------------------------------------------------
function buildDuijia() {
  const part = PART.duijia;
  const X = DUIJIA.x, Z = DUIJIA.z;
  const POST = 1.25, TOP = 1.45;
  const axleY = TOP + 0.17;

  // 两根门柱（小束柱，呼应天车营造逻辑）+ 础石
  [-POST, POST].forEach((sx) => {
    part.add(bundleColumn(
      new THREE.Vector3(X + sx, 0.05, Z),
      new THREE.Vector3(X + sx, TOP, Z),
      { count: 3, rad: 0.095, spread: 0.095, color: WOOD, rough: 0.9, bindStep: 0.52, ironEvery: 4, splices: 1 }
    ));
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.48), vStone(0x928D84, 0.96));
    pl.position.set(X + sx, 0.15, Z); pl.receiveShadow = true; part.add(pl);
  });
  // 门梁 + 花辊轴（铰轴，两端出挑）
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2 * POST + 0.5, 0.24, 0.28), vWood(WOOD_DARK, 0.9));
  beam.position.set(X, TOP, Z); beam.castShadow = true; part.add(beam);
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 2 * POST + 0.66, 10), woodTex(WOOD_DARK, 0.92));
  spindle.rotation.z = Math.PI / 2; spindle.position.set(X, axleY, Z); part.add(spindle);
  [-1, 1].forEach((s) => {
    const seat = new THREE.Mesh(hoopGeoC(0.13, 0.024, 12), ironS());
    seat.rotation.y = Math.PI / 2; seat.position.set(X + s * (POST + 0.2), axleY, Z); part.add(seat);
  });
  // 落地斜撑做在 YZ 平面（左右前后各一根）——刻意避开碓梢的 XY 摆动平面，
  // 否则几根杆在同一个视平面里交叉，读成一把乱 X
  [-1, 1].forEach((s) => {
    [-1, 1].forEach((t) => {
      part.add(strut(
        new THREE.Vector3(X + s * POST, TOP - 0.14, Z),
        new THREE.Vector3(X + s * (POST + 0.14), 0, Z + t * 1.05),
        0.075, vWood(WOOD, 0.9)
      ));
    });
  });

  // 碓梢杠杆（绕花辊轴摆动）：前段挑碓杆、后段设踏板
  const pivot = new THREE.Group();
  pivot.position.set(X, axleY, Z);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 0.28), woodTex(WOOD, 0.9));
  lever.castShadow = true; pivot.add(lever);

  // 碓杆 + 碓头 + 熟铁靴（硬连接在杠杆前端，随梢摆动起落）
  const headX = -1.45;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.115, 1.15, 10), woodTex(0x574730, 0.92));
  shaft.position.set(headX, -0.77, 0); shaft.castShadow = true; pivot.add(shaft);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.245, 0.38, 14), woodTex(WOOD_DARK, 0.92));
  head.position.set(headX, -1.535, 0); head.castShadow = true; pivot.add(head);
  [-1.36, -1.72].forEach((yy) => {
    const hb = new THREE.Mesh(hoopGeoC(0.255, 0.030, 16), ironS());
    hb.rotation.x = Math.PI / 2; hb.position.set(headX, yy, 0); pivot.add(hb);
  });
  const shoe = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.135, 0.20, 12), ironS());
  shoe.position.set(headX, -1.814, 0); shoe.castShadow = true; pivot.add(shoe);

  // 踏板：以两根吊杆挂在碓梢后端之下 —— 是「吊起来的踏凳板」，不是一根加宽的杆
  const pedalX = 1.58;
  [-0.17, 0.17].forEach((zz) => {
    const hang = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.36, 0.055), woodTex(WOOD_DARK, 0.9));
    hang.position.set(pedalX + 0.22 * (zz > 0 ? 1 : -1), -0.30, zz); pivot.add(hang);
  });
  const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.13, 0.46), woodTex(WOOD_LIGHT, 0.85));
  pedal.position.set(pedalX, -0.54, 0); pedal.castShadow = true; pivot.add(pedal);
  const toe = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.24, 0.46), woodTex(WOOD_LIGHT, 0.85));
  toe.position.set(pedalX + 0.36, -0.38, 0); pivot.add(toe);
  part.add(pivot);

  // 砧石：碓头落点处的硬石（模型展示顿钻起落，不再是插地的长杆）
  const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.18, 0.60), vStone(0x847F76, 0.96));
  anvil.position.set(X + headX - 0.50, 0.09, Z);
  anvil.castShadow = true; anvil.receiveShadow = true; part.add(anvil);

  PART.duijiaPivot = pivot;
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
    const sl = new THREE.Mesh(new THREE.BoxGeometry(0.082, h * (0.93 + Math.random() * 0.11), 0.028), vBamboo(BAMBOO_PALE, 0.9));
    sl.position.set(px, h / 2, i % 2 ? 0.026 : -0.026);
    sl.rotation.z = (Math.random() - 0.5) * 0.022;
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
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.34), vStone(0x8F8A80, 0.96));
    pl.position.set(sx * W / 2, 0.09, sz * D / 2); pl.receiveShadow = true; s.add(pl);
  });

  [[-1, Hf], [1, Hb]].forEach(([sz, h]) => {
    const purlin = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.12, 0.12), vWood(WOOD, 0.9));
    purlin.position.set(0, h, sz * D / 2); s.add(purlin);
  });

  // 单坡草顶 + 压草竹条 + 脊木
  const slope = Math.atan2(Hf - Hb, D);
  const roofLen = D / Math.cos(slope) + 0.9;
  const roofGrp = new THREE.Group();
  roofGrp.position.set(0, (Hf + Hb) / 2 + 0.12, 0);
  roofGrp.rotation.x = slope;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(W + 0.7, 0.16, roofLen), thatchS());
  roof.castShadow = true; roof.receiveShadow = true; roofGrp.add(roof);
  for (let i = -2; i <= 2; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(W + 0.78, 0.055, 0.07), vBamboo(BAMBOO_PALE, 0.9));
    b.position.set(0, 0.1, i * (roofLen / 5.4)); roofGrp.add(b);
  }
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(W + 0.82, 0.11, 0.15), vWood(WOOD_DARK, 0.9));
  ridge.position.set(0, 0.13, -roofLen / 2 + 0.2); roofGrp.add(ridge);
  s.add(roofGrp);

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

// 碓架冲击节奏：缓慢抬起到顶，再快速落下（冲击）。绕花辊轴的旋转角。
function duijiaAngle(t) {
  const period = 2.6;
  const p = (t % period) / period;
  if (p < 0.7) return -0.30 - 0.32 * easeInOut(p / 0.7);
  return -0.62 + 0.32 * easeInOut((p - 0.7) / 0.3);
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
    const hits = segmentHits(seg.p1, seg.p2, ['cart', 'ground', 'duijia', 'shed', 'well'], `wind@${Math.round(seg.az * 180 / Math.PI)}deg`);
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
    resetDrift, topDrift, otherDrift,
    collision: { checked, hits: collisionErrors.length, clear: collisionErrors.length === 0, errors: collisionErrors },
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
    // 碓架冲击
    if (PART.duijiaPivot) PART.duijiaPivot.rotation.z = duijiaAngle(t);

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
