// 自贡井盐 · 天车（木构井架）3D 解构（中英双语）
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
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

// diagonal 设计系统配色（暖纸 + 墨 + 品牌红 + 暖灰金属设备）
const ALLOY = 0xB9B2A6;        // 设备主色（暖灰金属）
const ALLOY_DARK = 0x8A8478;   // 设备暗部
const ALLOY_LIGHT = 0xC9C4BA;  // 设备亮部
const BRAND_RED = 0xB33A2A;    // diagonal 品牌红
// 自贡天车·古朴木构（陈年杉木灰调，区别于工业暖灰金属，承载井盐遗产质感）
// T7 对照照片调色：木身加深一档、篾箍提亮一档 —— 深木浅篾，让密缠绑扎环在剪影中读出节奏。
const WOOD = 0x77634C;         // 陈年杉木主色（深褐灰，做旧加深）
const WOOD_DARK = 0x4A3B2B;    // 陈年杉木暗部（阴影 / 老木）
const WOOD_LIGHT = 0x8F7F64;   // 陈年杉木亮部（受光面）
const BAMBOO = 0xC2C49C;       // 竹篾色（提亮后的浅草黄灰）：绳索与捆绑环，与深木身拉开明暗
const BAMBOO_PALE = 0xBFBD98;  // 新篾（略亮）：竹笆编织面，与陈年篾箍拉开层次
const IRON = 0x6B6259;         // 做旧铁箍（暗铁灰）：关键节点锁紧
const THATCH = 0x9A8455;       // 茅草屋面（盐工寮棚）

let scene, camera, renderer, labelRenderer, controls, clock;
let stationGroups = [];
// 聚焦分区：每个 PROCESS 构件对应一个 part group，便于「聚焦加描边+提亮 / 其余压暗」
const PART_ORDER = ['cols', 'top', 'cart', 'ground', 'duijia', 'well', 'bailer', 'shed'];
const FOCUS_MAP = [null, ['cols'], ['top'], ['cart'], ['ground'], ['duijia'], ['bailer'], ['shed']];
const PART = {};
const PART_OUTLINES = {};
let outlineMat = null;   // 聚焦描边：清晰金边
let haloMat = null;      // 聚焦光晕：更宽、半透明的淡金，营造“发光”感
const OUTLINE_GOLD = 0xE3C57E; // 淡金（浅色发光边），取代原品牌红描边
const DIM = 0.6;        // 非聚焦构件压暗系数（轻微压暗）
let tween = null;
let playing = true;
let autoTour = false;
let tourTimer = 0;
let tourIndex = 0;
let currentActive = -1;
let navEls = [];
let TEX = {};

const tmpV = new THREE.Vector3();
const tmpM = new THREE.Matrix4();

// ---------- 语言辅助 ----------
function lf(step, key) { return state.lang === 'en' ? step[key + 'En'] : step[key]; }

// ============================================================
// 程序化贴图（canvas 生成，离线可用）
// ============================================================
function cv(size) { const c = document.createElement('canvas'); c.width = c.height = size; return c; }

function makeMetalTexture() {
  const s = 512, c = cv(s), x = c.getContext('2d');
  x.fillStyle = '#C9C4BA'; x.fillRect(0, 0, s, s);
  const g = x.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(0.5, 'rgba(0,0,0,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.18)');
  x.fillStyle = g; x.fillRect(0, 0, s, s);
  // 面板缝
  x.strokeStyle = 'rgba(60,56,48,0.5)'; x.lineWidth = 3;
  for (let i = 0; i <= s; i += 96) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, s); x.stroke(); }
  x.lineWidth = 2;
  for (let i = 0; i <= s; i += 64) { x.beginPath(); x.moveTo(0, i); x.lineTo(s, i); x.stroke(); }
  // 铆钉
  for (let i = 0; i <= s; i += 96) for (let j = 0; j <= s; j += 64) {
    const rg = x.createRadialGradient(i, j, 0, i, j, 5);
    rg.addColorStop(0, 'rgba(255,255,255,0.9)'); rg.addColorStop(1, 'rgba(70,66,58,0.5)');
    x.fillStyle = rg; x.beginPath(); x.arc(i, j, 4, 0, Math.PI * 2); x.fill();
  }
  // 噪点
  for (let i = 0; i < 1200; i++) {
    x.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    x.fillRect(Math.random() * s, Math.random() * s, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function makeFloorTexture() {
  const s = 512, c = cv(s), x = c.getContext('2d');
  x.fillStyle = '#ECEAE3'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 4000; i++) {
    const a = Math.random() * 0.08;
    x.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    x.fillRect(Math.random() * s, Math.random() * s, 2, 2);
  }
  x.strokeStyle = 'rgba(120,115,105,0.4)'; x.lineWidth = 2;
  for (let i = 0; i <= s; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, s); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(s, i); x.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(22, 12); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function makeStoneTexture() {
  const s = 512, c = cv(s), x = c.getContext('2d');
  x.fillStyle = '#9b968c'; x.fillRect(0, 0, s, s);
  // 石材颗粒（深浅斑点）
  for (let i = 0; i < 5200; i++) {
    const a = Math.random() * 0.12;
    x.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(40,38,34,${a})`;
    x.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  // 石缝（暗色不规则裂纹）
  x.strokeStyle = 'rgba(50,47,42,0.45)'; x.lineWidth = 2;
  for (let i = 0; i < 60; i++) {
    let px = Math.random() * s, py = Math.random() * s;
    x.beginPath(); x.moveTo(px, py);
    const seg = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < seg; k++) { px += (Math.random() - 0.5) * 70; py += (Math.random() - 0.5) * 50; x.lineTo(px, py); }
    x.stroke();
  }
  // 石面起伏（大块明暗）
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
  // 锻打横纹
  x.strokeStyle = 'rgba(22,19,16,0.28)'; x.lineWidth = 1;
  for (let i = 0; i < s; i += 8) { x.beginPath(); x.moveTo(0, i + Math.random() * 3); x.lineTo(s, i + Math.random() * 3); x.stroke(); }
  // 锈斑（橙褐团块）
  for (let i = 0; i < 74; i++) {
    const mx = Math.random() * s, my = Math.random() * s, mr = 5 + Math.random() * 32;
    const rg = x.createRadialGradient(mx, my, 0, mx, my, mr);
    rg.addColorStop(0, `rgba(${(138 + Math.random() * 62) | 0},${(72 + Math.random() * 38) | 0},34,${0.16 + Math.random() * 0.38})`);
    rg.addColorStop(1, 'rgba(122,62,28,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
  }
  // 麻点腐蚀 + 高光棱
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
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeWoodTexture() {
  const s = 512, c = cv(s), x = c.getContext('2d');
  // 陈年杉木底色（深褐灰、低饱和，与 WOOD 主色一致）
  x.fillStyle = '#77634c'; x.fillRect(0, 0, s, s);
  // 竖向木纹（带波动，灰调，深浅交错）
  for (let i = 0; i < 320; i++) {
    const gx = Math.random() * s, w = 1 + Math.random() * 3;
    const dark = Math.random() > 0.5;
    x.strokeStyle = (dark ? 'rgba(48,38,26,' : 'rgba(178,163,138,') + (0.04 + Math.random() * 0.11) + ')';
    x.lineWidth = w;
    x.beginPath(); x.moveTo(gx, 0);
    for (let y = 0; y <= s; y += 14) x.lineTo(gx + Math.sin(y * 0.035 + gx) * 2.4, y);
    x.stroke();
  }
  // 雨蚀竖向浅纹（风日吹晒后泛白）
  for (let i = 0; i < 90; i++) {
    const gx = Math.random() * s;
    x.strokeStyle = `rgba(214,205,186,${0.03 + Math.random() * 0.05})`;
    x.lineWidth = 1 + Math.random() * 2;
    x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx + (Math.random() - 0.5) * 4, s); x.stroke();
  }
  // 木板接缝（横向）
  x.strokeStyle = 'rgba(46,30,14,0.5)'; x.lineWidth = 3;
  for (let i = 0; i <= s; i += 128) { x.beginPath(); x.moveTo(0, i); x.lineTo(s, i); x.stroke(); }
  // 木节（同心年轮）
  for (let i = 0; i < 16; i++) {
    const kx = Math.random() * s, ky = Math.random() * s, r = 4 + Math.random() * 9;
    for (let rr = r; rr > 1; rr -= 2) {
      const rg = x.createRadialGradient(kx, ky, 0, kx, ky, rr);
      rg.addColorStop(0, 'rgba(58,36,16,0.5)'); rg.addColorStop(1, 'rgba(58,36,16,0)');
      x.fillStyle = rg; x.beginPath(); x.arc(kx, ky, rr, 0, Math.PI * 2); x.fill();
    }
  }
  // 干裂纹（细黑折线）
  x.strokeStyle = 'rgba(38,26,14,0.35)'; x.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    let px = Math.random() * s, py = Math.random() * s;
    x.beginPath(); x.moveTo(px, py);
    const seg = 3 + Math.floor(Math.random() * 4);
    for (let k = 0; k < seg; k++) { px += (Math.random() - 0.5) * 30; py += (Math.random() - 0.5) * 22; x.lineTo(px, py); }
    x.stroke();
  }
  // 风化噪点：霉斑（深）+ 泛白（浅），陈年杉木银灰质感
  for (let i = 0; i < 2600; i++) {
    x.fillStyle = `rgba(38,28,16,${Math.random() * 0.06})`;
    x.fillRect(Math.random() * s, Math.random() * s, 1, 1);
  }
  for (let i = 0; i < 1500; i++) {
    x.fillStyle = `rgba(208,199,181,${Math.random() * 0.05})`;
    x.fillRect(Math.random() * s, Math.random() * s, 1, 1);
  }
  // 近地潮气青苔斑（绿灰，自贡盐场近井湿润）
  for (let i = 0; i < 26; i++) {
    const mx = Math.random() * s, my = s * (0.55 + Math.random() * 0.45), mr = 8 + Math.random() * 26;
    const rg = x.createRadialGradient(mx, my, 0, mx, my, mr);
    rg.addColorStop(0, 'rgba(96,104,78,0.10)'); rg.addColorStop(1, 'rgba(96,104,78,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 程序生成环境贴图：上白下暖的竖直渐变，供金属反射（无需 RoomEnvironment 等外部模块）
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
function metalTex(color, rough = 0.5, met = 0.7) {
  return new THREE.MeshStandardMaterial({ map: TEX.metal, color, roughness: rough, metalness: met });
}
function woodTex(color, rough = 0.85) {
  return new THREE.MeshStandardMaterial({ map: TEX.wood, color, roughness: rough, metalness: 0.0 });
}
// 逐构件色调/粗糙度扰动（做旧：让每根木构、每块石料略有差異，避免塑料感）
function vTint(map, color, rough) {
  const c = new THREE.Color(color), hsl = {}; c.getHSL(hsl);
  hsl.l = Math.min(1, Math.max(0.05, hsl.l * (0.85 + Math.random() * 0.3)));
  hsl.s = Math.min(1, hsl.s * (0.9 + Math.random() * 0.2));
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return new THREE.MeshStandardMaterial({
    map,
    color: c,
    roughness: Math.min(1, Math.max(0.3, rough + (Math.random() - 0.5) * 0.14)),
    metalness: 0.0,
  });
}
// 材质池：同类构件复用有限数量的做旧变体，既保留「逐根木头不一样」的手工感，
// 又让后续几何合并能把成百上千根细木压缩到个位数 draw call。
const _matPool = new Map();
function poolMat(key, map, color, rough, n = 7) {
  let arr = _matPool.get(key);
  if (!arr) { arr = []; for (let i = 0; i < n; i++) arr.push(vTint(map, color, rough)); _matPool.set(key, arr); }
  return arr[(Math.random() * arr.length) | 0];
}
function vWood(color, rough) { return poolMat(`w${color}_${rough}`, TEX.wood, color, rough); }
function vStone(color, rough) { return poolMat(`s${color}_${rough}`, TEX.stone, color, rough); }
function vBamboo(color = BAMBOO_PALE, rough = 0.9) { return poolMat(`b${color}_${rough}`, TEX.wood, color, rough, 5); }
function stoneTex(color, rough = 0.95) {
  return new THREE.MeshStandardMaterial({ map: TEX.stone, color, roughness: rough, metalness: 0.0 });
}
// 共享材质（铁 / 篾 / 茅草）——节点数量大，必须共享才能合并
let _ironM = null, _bambooM = null, _thatchM = null;
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
// 天车改成「束柱」之后，单根柱子由数根杉木 + 十数道篾箍构成，网格数量会暴涨到上千。
// 这里把所有静态构件按材质合并成一个个大 BufferGeometry，draw call 回落到个位数。
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
// 竹篾缠绕：沿螺旋线生成的篾绳管（默认绕 Y 轴），用于木构节点的藤篾捆扎
class HelixCurve extends THREE.Curve {
  constructor(radius, length, turns) { super(); this.radius = radius; this.length = length; this.turns = turns; }
  getPoint(t, target = new THREE.Vector3()) {
    const a = t * this.turns * Math.PI * 2;
    const y = (t - 0.5) * this.length;
    return target.set(Math.cos(a) * this.radius, y, Math.sin(a) * this.radius);
  }
}
function helixWindGeo(radius, length, turns, tubeR) {
  return new THREE.TubeGeometry(new HelixCurve(radius, length, turns), Math.max(12, Math.ceil(turns * 12)), tubeR, 5, false);
}
function addWind(parent, pos, axis, geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  else if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.position.copy(pos);
  m.castShadow = true;
  parent.add(m);
  return m;
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
  const h = y1 - y0;
  const m = new THREE.Mesh(unitCylG(), vWood(color, rough));
  m.scale.set(rad, h, rad);                       // 共享单位圆柱，靠缩放得到粗细/长短
  m.position.set(ox, (y0 + y1) / 2, oz);
  m.rotation.y = Math.random() * Math.PI;         // 转一下，木纹不重复
  m.castShadow = true;
  return m;
}

function bundleStrut(p1, p2, opt = {}) {
  const {
    count = 4,          // 并束根数
    rad = 0.08,         // 单根杉木半径
    spread = 0.1,       // 并束半径（各根离轴心的距离）
    color = WOOD,
    rough = 0.86,
    bindStep = 0.55,    // 竹篾箍间距（对照实景照片：密缠剪影 ≈0.45~0.55 m/道）
    ironEvery = 4,      // 每隔几道箍换成铁箍（0 = 全竹篾，无铁）
    splice = true,      // 是否错缝搭接
  } = opt;

  const grp = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  if (len < 1e-4) return grp;

  // —— 并束排布：3~4 根围成三角/方阵；≥5 根时中间填一根芯木；1 根即独木 ——
  const hasCore = count >= 5 || count === 1;
  const ringN = hasCore ? count - 1 : count;
  const phase = Math.random() * Math.PI * 2;
  for (let i = 0; i < count; i++) {
    let ox = 0, oz = 0;
    if (!(hasCore && i === 0)) {
      const k = hasCore ? i - 1 : i;
      const a = (k / Math.max(1, ringN)) * Math.PI * 2 + phase;
      const rr = spread * (0.88 + Math.random() * 0.24);
      ox = Math.cos(a) * rr; oz = Math.sin(a) * rr;
    }
    const rt = rad * (0.82 + Math.random() * 0.4);
    if (splice && count > 2 && len > 1.6 && Math.random() < 0.6) {
      // 错缝搭接：这一根由两截短木对接，接缝高度随机错开，不与邻根同层
      const cut = 0.32 + Math.random() * 0.34;
      const yc = -len / 2 + len * cut;
      grp.add(trunkMesh(ox, oz, -len / 2 - 0.02, yc + 0.07, rt, color, rough));
      grp.add(trunkMesh(ox, oz, yc - 0.07, len / 2 + 0.02, rt * 0.96, color, rough));
    } else {
      grp.add(trunkMesh(ox, oz, -len / 2 - 0.02, len / 2 + 0.02, rt, color, rough));
    }
  }

  // —— 竹篾密缠成箍；每隔几道换手工锻打铁箍（做旧）——
  // 箍环半径取木束实际外缘上限（离轴距与木径的随机放大都计入），确保箍环套在木外、不切入杉木
  const bindR = (count > 1 ? spread * 1.14 : 0) + rad * 1.24;
  const n = Math.max(2, Math.round(len / bindStep));
  // 竹篾箍：每道 3 根细篾（视觉减密）；管径略提回 0.02 保证 3 根仍有存在感
  const wg = windGeoC(r2(bindR), 0.3, 3, 0.02);
  const ig = hoopGeoC(r2(bindR + 0.018), 0.044, 14);
  for (let i = 0; i <= n; i++) {
    const y = -len / 2 + (len / n) * i;
    if (ironEvery > 0 && i % ironEvery === 0) {
      const h = new THREE.Mesh(ig, ironS());
      h.rotation.x = Math.PI / 2;
      h.position.set(0, y, 0);
      h.rotation.z = Math.random() * Math.PI;
      grp.add(h);
    } else {
      const w = new THREE.Mesh(wg, bambooS());
      w.position.set(0, y, 0);
      w.rotation.y = Math.random() * Math.PI;
      grp.add(w);
    }
  }

  grp.position.set((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
  grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return grp;
}

// ============================================================
// 初始化
// ============================================================
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 75, 185);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(16, 12, 26);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('scene-root').appendChild(renderer.domElement);

  // 环境反射：程序生成「上白下暖」渐变环境，让金属设备在白底上有真实质感（离线可用，无外部依赖）
  scene.environment = makeEnvTexture(renderer);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  document.getElementById('scene-root').appendChild(labelRenderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 8;
  controls.maxDistance = 150;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.target.set(0, 6, 0);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xece8df, 0.95); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 1.1);
  dir.position.set(30, 50, 25); dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.near = 1; dir.shadow.camera.far = 170;
  dir.shadow.camera.left = -65; dir.shadow.camera.right = 65;
  dir.shadow.camera.top = 65; dir.shadow.camera.bottom = -65;
  scene.add(dir);
  const fill = new THREE.DirectionalLight(0xcfc7ba, 0.5); fill.position.set(-30, 20, -25); scene.add(fill);

  // 贴图
  TEX.metal = makeMetalTexture();
  TEX.floor = makeFloorTexture();
  TEX.wood = makeWoodTexture();
  TEX.stone = makeStoneTexture();
  TEX.rust = makeRustTexture();
  TEX.thatch = makeThatchTexture();

  buildGround();
  buildStations();
  initParts();
  bindUI();
  buildNav();
  applyLang();
  applyFocus(0); // 基线：无聚焦、无压暗、无描边
  if (SELFTEST) runSelfTest();

  clock = new THREE.Clock();
  window.addEventListener('resize', onResize);
  animate();

  // 首帧渲染完成后隐去加载遮罩（双 rAF 确保场景已实际绘制一帧）
  const loaderEl = document.getElementById('loader');
  if (loaderEl) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      loaderEl.classList.add('hidden');
      loaderEl.addEventListener('transitionend', () => loaderEl.remove(), { once: true });
    }));
  }
}

// ============================================================
// 地面（带工业地面贴图）
// ============================================================
function buildGround() {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 70),
    new THREE.MeshStandardMaterial({ map: TEX.floor, color: 0xE4E0D7, roughness: 0.96, metalness: 0.0 })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = GROUND_Y - 0.02;
  plane.receiveShadow = true;
  scene.add(plane);

  const grid = new THREE.GridHelper(90, 30, 0xCFC9BE, 0xBDB6A8);
  grid.position.y = GROUND_Y;
  grid.material.opacity = 0.35; grid.material.transparent = true;
  scene.add(grid);
}

// ============================================================
// 模型构建：整座天车 compound 是「一套物理模型」，只构建一次，置于原点。
// PROCESS 的 8 个条目是「构件导览」——仅用于相机聚焦（cam/target）与双语详情，
// 不再各自实体化，否则整座模型会被重复构建、叠在原点造成重叠卡位。
// ============================================================
function buildStations() {
  const g = new THREE.Group();
  g.position.set(0, 0, 0);
  g.userData = { step: PROCESS[0], spin: [], vibrate: null, conveyor: null };

  // 每个构件一个独立 group，便于聚焦时单独描边/提亮/压暗
  PART_ORDER.forEach((name) => { PART[name] = new THREE.Group(); g.add(PART[name]); });

  const pad = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.7, 0.4, 32), metalTex(ALLOY_DARK, 0.8, 0.4));
  pad.position.y = 0.2; pad.castShadow = true; pad.receiveShadow = true; PART.well.add(pad);

  buildWell(g);
  scene.add(g);
  stationGroups.push(g);
}

// 采卤井
// 采卤井 · 自贡天车（木构井架，古朴质感）
function buildWell(g) {
  const wood = woodTex(WOOD, 0.85);
  const woodDark = woodTex(WOOD_DARK, 0.9);
  const woodLight = woodTex(WOOD_LIGHT, 0.8);
  const P = { cols: PART.cols, top: PART.top };

  // 木地台（盖住通用金属底座，强化古朴基座）
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.3, 0.5, 32), woodTex(0x6E5A42, 0.95));
  deck.position.y = 0.45; deck.castShadow = true; deck.receiveShadow = true; PART.well.add(deck);

  // 新天车骨架（2 主腿 + 2 辅柱，用户口述定稿）：单次构建整座 compound，置于原点西侧对齐井口。
  // 旧「主天车 + 独立副天车」两塔布局已废弃——辅柱现作为主塔的一部分内嵌。
  buildDerrick(g, P, -0.6, 0.2);

  // 井口中心相对主天车顶辊/束柱中心：沿 z 向略退到束柱平面之后（wellZ=-0.6，
  // 退距≈0.6≈塔高 4%），使提卤绳自天辊出绳点(z=0.2)斜下落到井口(z=-0.6)时，
  // 在横梁高度处已离开横梁 z 平面(0.2±0.09)，不再穿任何不出头横梁。
  const wellX = -0.6, wellZ = -0.6;

  // 井口石箍（自贡盐井以石圈箍井，防潮固壁）。
  // 石台改为石环而非实心圆盘，留出井口孔道，汲卤筒下降时不再穿进石台。
  const stoneBase = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.22, 12, 30), stoneTex(0x97928a, 0.96));
  stoneBase.rotation.x = Math.PI / 2; stoneBase.position.set(wellX, 0.56, wellZ);
  stoneBase.castShadow = true; stoneBase.receiveShadow = true; PART.well.add(stoneBase);
  // 井筒孔道（暗色内壁）：汲卤筒下探时进入此孔，而不是与木台/石台穿插
  const wellShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.8, 0.42, 24),
    new THREE.MeshStandardMaterial({ color: 0x2A2420, roughness: 0.96, metalness: 0.0 })
  );
  wellShaft.position.set(wellX, 0.51, wellZ); PART.well.add(wellShaft);
  const collarN = 14;
  for (let i = 0; i < collarN; i++) {
    const a = (i / collarN) * Math.PI * 2;
    const blk = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.95, 0.34), vStone(0x8f8a80, 0.96));
    const R = 0.82;
    blk.position.set(wellX + Math.cos(a) * R, 1.12, wellZ + Math.sin(a) * R);
    blk.rotation.y = -a + (Math.random() - 0.5) * 0.12;
    const sc = 0.9 + Math.random() * 0.22;
    blk.scale.set(sc, 0.92 + Math.random() * 0.18, sc);
    blk.castShadow = true; blk.receiveShadow = true; PART.well.add(blk);
  }
  // 井口石压顶（一圈略宽的石环）
  const cap = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.09, 8, 28), stoneTex(0x8a857c, 0.95));
  cap.rotation.x = Math.PI / 2; cap.position.set(wellX, 1.62, wellZ); PART.well.add(cap);
  // 井口锻铁箍（压住石圈、护住井唇，长年卤水浸润锈色深重）
  const wellIron = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.055, 8, 26), ironS());
  wellIron.rotation.x = Math.PI / 2; wellIron.position.set(wellX, 1.7, wellZ); PART.well.add(wellIron);
  // 顿钻钻杆（入井）：提卤阶段由 animate 根据汲卤筒高度隐藏，
  // 避免钻杆与汲卤筒同轴重叠（钻 / 提卤交替进行）。
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 10), woodTex(0x473A2B, 0.9));
  stem.position.set(wellX, -1.6, wellZ); PART.well.add(stem);

  // 传统木卤桶（heritage 点缀）：置于木地台之上（桶底落在台面 0.7），
  // 位置避开四角束柱与础石，避免桶体埋进地台、穿入柱腿
  [[-1.5, -1.2], [2.6, 1.2], [-0.9, 2.8]].forEach(([bx, bz]) => {
    const barrel = new THREE.Group();
    const bodyB = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 1.3, 18), woodTex(0x7E6748, 0.9));
    bodyB.position.y = 0.65; bodyB.castShadow = true; barrel.add(bodyB);
    [0.25, 0.95].forEach((yy) => {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.05, 8, 20), ironS()); // 做旧铁箍
      hoop.rotation.x = Math.PI / 2; hoop.position.y = yy; barrel.add(hoop);
    });
    barrel.position.set(bx, 0.7, bz); PART.well.add(barrel);
  });

  // 立式大车（提卤巨轮）+ 地辊（转向定滑轮）+ 碓架（冲击式顿钻踩架）
  buildCart(g, PART.cart, -3.8, 1.4);
  buildGroundRoller(g, PART.ground, -1.9, 2.1);
  // 碓架（踩架）置于井口右前方空地、主天车风篾圈之外，并再外移远离天车：
  // 门形架足距 3.0、足位在 (7.8, 1.4)，与主/副天车束柱腿部、两组风篾地桩/拉索均拉开净空；
  // 避免副天车风篾扫过杠杆（该方位已在 windStaySkip 的 _DEVICES 中跳过）。
  buildDuijia(g, PART.duijia, 7.8, 1.4);
  // 提卤绳链：天辊 → 地辊（转向）→ 大车（绕绳）
  // 起点取自当前天辊（cx=-0.6, topY=H+0.7）轮缘出绳方向；旧值 (-1.8,15.3) 为废弃双塔时代
  // 的硬编码，曾导致一段导绳悬空挂在塔旁——已随新塔几何校准。
  const linkMat = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 1.0, metalness: 0.0 });
  PART.well.add(strut(new THREE.Vector3(-0.6, 12.25, 0.35), new THREE.Vector3(-1.9, 1.0, 2.1), 0.05, linkMat));
  PART.well.add(strut(new THREE.Vector3(-1.9, 1.0, 2.1), new THREE.Vector3(-3.8, 3.0, 1.4), 0.05, linkMat));

  // 汲卤筒（楠竹/镔铁提卤桶）+ 提卤绳（随大车收放上下，联动天辊/地辊）
  const liftRopeMat = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 1.0, metalness: 0.0 });
  const bucket = new THREE.Group();
  const bucketBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 1.05, 18), woodTex(0x7E6748, 0.95));
  bucketBody.position.y = 0; bucketBody.castShadow = true; bucket.add(bucketBody);
  const bucketLid = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 18), ironS());
  bucketLid.position.y = 0.58; bucket.add(bucketLid);
  const bucketTip = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.42, 18), woodTex(0x6E5A42, 0.95));
  bucketTip.position.y = -0.73; bucketTip.rotation.x = Math.PI; bucket.add(bucketTip);
  const bucketEar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 8, 18), ironS());
  bucketEar.position.y = 0.66; bucket.add(bucketEar);
  // 桶身两道铁箍（汲卤筒以竹为身、以铁箍紧口）
  [-0.3, 0.28].forEach((yy) => {
    const bh = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.035, 8, 18), ironS());
    bh.rotation.x = Math.PI / 2; bh.position.y = yy; bucket.add(bh);
  });
  bucket.position.set(wellX, 3.4, wellZ); PART.bailer.add(bucket);
  // 提卤绳：天辊锚点 → 桶顶，随桶升降而伸缩。
  // 该 mesh 每帧由 orientCylinder 直接改写 position/scale/quaternion，
  // 静态 outline 无法跟随，聚焦时会出现“幽灵描边”，故跳过描边生成。
  const liftRope = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1, 6), liftRopeMat);
  liftRope.userData.noOutline = true;
  PART.bailer.add(liftRope);
  g.userData.wellAnim = {
    bucket, liftRope, stem,
    top: 3.4, bottom: 1.3, period: 8.0,
    anchor: new THREE.Vector3(-0.6, 12.1, 0.2), // 天辊绳槽底出绳点（首帧即被 animate 覆写；-0.6=辊半径+余量）
    bucketX: wellX, bucketZ: wellZ,
    prevY: 3.4,
  };

  // 井台周边聚落：盐工寮棚（草顶竹笆）+ 竹笆屏（挡风遮泥）
  // 位置避开风篾地桩，落在拉索圈之外，构成「井—车—棚」的作业场
  buildShed(g, PART.shed, 7.6, 4.8);
  buildScreen(g, PART.shed, -8.6, 3.0, 3.4, 1.5);
  buildScreen(g, PART.shed, 5.6, -6.6, 3.0, 1.35);
}

// 塔身收分形制（对照实景照片的 A 形架读感）：正面 x 向两主腿快速合拢成人字尖（顶半宽≈底×0.16），
// 进深 z 向缓收（≈底×0.44）保持底部梯形的抗侧稳度。buildDerrick 与 windStaySegments（selftest 共用）
// 必须经由本函数取收分参数，防止两处 taper 规则漂移。
function derrickTaper(baseHalf) {
  return { topHX: baseHalf * 0.16, topHZ: baseHalf * 0.44 };
}

// 风篾挂点高度：贴塔顶（0.9H），对照照片伞状拉索自塔顶附近散出。
// buildDerrick 与 windStaySegments（selftest 共用）必须经由本函数取值，防止两处漂移。
function windAttachY(H) { return H * 0.9; }

// 风篾跳过方位：避免拉索刺穿井场设备（大車/地辊/碓架/寮棚）。
// 设备世界坐标相对塔心 (cx,cz) 求方位，落入 ±10° 锥内则跳过该风篾（真实天车也据此绕开厂房）。
const _DEVICES = [[-3.8, 1.4], [-1.9, 2.1], [7.8, 1.4], [7.6, 4.8]];
function windStaySkip(a, cx, cz) {
  const TWO = Math.PI * 2, DEG = Math.PI / 180;
  for (const [dx, dz] of _DEVICES) {
    let d = (a - Math.atan2(dz - cz, dx - cx)) % TWO;
    if (d < -Math.PI) d += TWO;
    if (d > Math.PI) d -= TWO;
    if (Math.abs(d) < 10 * DEG) return true;
  }
  return false;
}

// 生成新天车骨架的风篾线段端点（世界坐标），buildDerrick 与 selftest 共用。
// 5 个高度档、12 方位、约 30° 浅角、自各档散出连地桩；与 buildDerrick 内几何严格一致。
function windStaySegments(cx, cz) {
  const H = 12;
  const mainHX = (y) => 3.0 + (1.6 - 3.0) * (y / H);
  const tan30 = Math.tan(30 * Math.PI / 180);
  const tiers = [11.7, 9.7, 7.4, 5.1, 2.9];
  const segs = [];
  tiers.forEach((ay, tier) => {
    const t0 = ay / H;
    const legOuter = 0.115 * (1 - 0.55 * t0) + 0.085 * (1 - 0.34 * t0);
    const ar = mainHX(ay) + legOuter;   // 附着点推到主腿束身外缘，风篾贴合主腿而非埋入中心
    const pr = ar + ay / tan30;         // 落地半径：约 30° 浅角
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + tier * 0.26;
      if (windStaySkip(a, cx, cz)) continue;   // 绕开井场设备方位，避免刺穿
      segs.push({
        a,
        p1: [cx + Math.cos(a) * ar, ay, cz + Math.sin(a) * ar],
        p2: [cx + Math.cos(a) * pr, 0.45, cz + Math.sin(a) * pr],
      });
    }
  });
  return segs;
}

// 单座天车：四面收分木井架（束柱）+ 交叉斜撑 + 顶部天辊 + 风篾拉索
// 静态构件统一收进 stat 临时树，最后按材质合并，避免束柱带来的网格爆炸。
function buildDerrick(g, P, cx, cz) {
  // 新天车骨架（用户口述定稿）：2 主腿（全高）+ 2 辅柱（辅柱①最高≈10.5、辅柱②次高≈6.75）；
  // 横梁不出头、柱体加不出头短束箍；风篾细长、约 30° 浅角、自各高度档散出连地桩。
  // 沿用束柱 bundleStrut + 几何合并（emit/flushBin），保持低 draw call。
  // H 15→12、底半宽 2.2→3.0、顶半宽 0.7→1.6：整体压低加宽，
  // 两主腿顶角由 ≈11.4° 放大到 ≈13.3°，剪影不再细高。
  const H = 12;
  const wood = woodTex(WOOD, 0.85);
  const woodDark = woodTex(WOOD_DARK, 0.9);
  const woodLight = woodTex(WOOD_LIGHT, 0.8);
  const statC = new THREE.Group();   // 束柱/斜撑/横梁/短箍/础石 → cols
  const statT = new THREE.Group();   // 天辊 + 风篾 + 地桩 → top
  const mainHX = (y) => 3.0 + (1.6 - 3.0) * (y / H); // 主腿半宽收分（底 3.0 → 顶 1.6）

  // ---- 主腿（2 根全高，前后对称于 z=cz 面内收分）；逐段束柱、根数递减（束柱·错缝搭接）----
  const levels = 6;
  for (let i = 0; i < levels; i++) {
    const y0 = (H / levels) * i, y1 = (H / levels) * (i + 1);
    const t0 = i / (levels - 1);
    const cnt = Math.max(2, Math.round(6 - 4 * t0));   // 底 6 根 → 顶 2 根
    const rad = 0.085 * (1 - 0.34 * t0);
    const spread = 0.115 * (1 - 0.55 * t0);
    [-1, 1].forEach((s) => {
      statC.add(bundleStrut(
        new THREE.Vector3(cx + s * mainHX(y0), y0, cz),
        new THREE.Vector3(cx + s * mainHX(y1), y1, cz),
        { count: cnt, rad, spread, color: WOOD, rough: 0.86, bindStep: 0.46 + t0 * 0.32, ironEvery: 4 }
      ));
    });
  }

  // ---- 辅柱①（最高≈10.5）与 辅柱②（次高≈6.75）：根部落地、顶部搁在主腿横梁上 ----
  const buildAux = (fx, fz, tx, tz, top) => {
    const segs = 3;
    for (let i = 0; i < segs; i++) {
      const y0 = top * (i / segs), y1 = top * ((i + 1) / segs);
      const t0 = i / (segs - 1);
      const p1 = new THREE.Vector3(fx + (tx - fx) * (y0 / top), y0, fz + (tz - fz) * (y0 / top));
      const p2 = new THREE.Vector3(fx + (tx - fx) * (y1 / top), y1, fz + (tz - fz) * (y1 / top));
      statC.add(bundleStrut(p1, p2, {
        count: 3, rad: 0.07 * (1 - 0.2 * t0), spread: 0.07 * (1 - 0.3 * t0),
        color: WOOD, rough: 0.88, bindStep: 0.5, ironEvery: 4, splice: false,
      }));
    }
  };
  // ---- 辅柱：位于「俯视主腿连线(x 轴)」两侧(±z)一边一根，足位落地、顶部撑横梁中点(x=cx) ----
  // 足位在 ±z 基础上沿 x 略偏 ±1.2，使柱身斜插入横梁中点而不占 x=cx 的提卤绳通道（避免与绳穿插）。
  // 辅柱① 撑最高承重横梁(y≈10.52)，足位退前(+z,≈3.0)→倾角≈15°；
  // 辅柱② 撑次高承重横梁(y≈6.75)，足位退后(-z,≈2.2)→倾角≈19°；两倾角不同，分列主腿直线两侧。
  buildAux(cx + 1.2, cz + 2.4, cx, cz + 0.19, 8.42);    // 辅柱①（最高横梁，+z 侧，足略偏 +x 避绳）
  buildAux(cx - 1.2, cz - 1.8, cx, cz + 0.19, 5.42);    // 辅柱②（次高横梁，-z 侧，足略偏 -x 避绳）

  // ---- 横梁：不出头，搁在主腿上（跨度 = 主腿半宽×2×0.9，两端收进束身）----
  [1.7, 3.45, 5.15, 6.85, 10.3].forEach((y) => {
    const span = mainHX(y) * 2 * 0.9;
    const b = new THREE.Mesh(new THREE.BoxGeometry(span, 0.17, 0.17), vWood(WOOD_DARK, 0.9));
    b.position.set(cx, y, cz); b.rotation.z = 0.02; b.rotation.y = 0.03; b.castShadow = true; statC.add(b);
  });
  // 承重横梁：辅柱①顶（8.4）、辅柱②顶（5.4）
  [[8.4, 0.19], [5.4, 0.19]].forEach(([y, off]) => {
    const span = mainHX(y) * 2 * 0.9;
    const b = new THREE.Mesh(new THREE.BoxGeometry(span, 0.19, 0.19), vWood(WOOD_DARK, 0.9));
    b.position.set(cx, y, cz + off); b.rotation.z = 0.02; b.castShadow = true; statC.add(b);
  });

  // ---- 柱体不出头短束箍：主腿 [3,6,9,12]、辅柱① [3,6,9]、辅柱② [3,5] ----
  const addCollar = (x, z, ys) => ys.forEach((y) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.16), vWood(WOOD_DARK, 0.9));
    b.position.set(x, y, z); b.rotation.y = 0.04; b.castShadow = true; statC.add(b);
  });
  [-1, 1].forEach((s) => [2.4, 4.8, 7.2, 9.6].forEach((y) => addCollar(cx + s * mainHX(y), cz, [y])));
  // 辅柱短束箍随其斜向(z 向)落点内插：足位→顶在 z 上线性变化（x 随足位 ±1.2）
  addCollar(cx + 1.2, cz + 1.77, [2.4]);
  addCollar(cx + 1.2, cz + 1.14, [4.8]);
  addCollar(cx + 1.2, cz + 0.51, [7.2]);
  addCollar(cx - 1.2, cz - 0.92, [2.4]);
  addCollar(cx - 1.2, cz - 0.33, [4]);

  // ---- 础石（主腿根 ±3.0 + 辅柱根）----
  [-1, 1].forEach((s) => {
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.62), vStone(0x928d84, 0.96));
    pl.position.set(cx + s * 3.0, 0.86, cz); pl.rotation.y = (Math.random() - 0.5) * 0.2;
    pl.castShadow = true; pl.receiveShadow = true; statC.add(pl);
  });
  [[1.2, 2.4], [-1.2, -1.8]].forEach(([px, pz]) => {
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.5), vStone(0x928d84, 0.96));
    pl.position.set(cx + px, 0.86, cz + pz); pl.castShadow = true; pl.receiveShadow = true; statC.add(pl);
  });

  emit(statC); flushBin(P.cols);

  // ---- 顶部：天辊（木轮·辐条·镂空，架于天夹板轴座）+ 天箍头 ----
  // 依据历史构造（《自流井图说》）：天辊安置于「天夹板」中，含辊把子(轴)、座子(轴座)、轴瓦；
  // 风篾系于「天箍头」(主腿顶端束箍)，周围六方斜牵。天辊为扁平小木轮，中心镂空、辐条木撑。
  const topY = H + 0.7;            // 天辊轴心高
  const RR = 0.52;                 // 天辊轮半径（小，扁平定滑轮感）
  const wheelW = 0.42;             // 轮宽（沿 z）
  const hubR = 0.1;
  const wheelGrp = new THREE.Group();
  wheelGrp.position.set(cx, topY, cz);
  P.top.add(wheelGrp);
  // 轮缘（扁平圆环，绳槽在外缘）
  const rim = new THREE.Mesh(new THREE.TorusGeometry(RR, 0.06, 8, 28), woodDark);
  rim.castShadow = true; wheelGrp.add(rim);
  // 轮缘绳槽（细篾环，示意缆绳所嵌）
  const groove = new THREE.Mesh(hoopGeoC(RR, 0.022, 28), bambooS());
  wheelGrp.add(groove);
  // 轮毂（轴心，沿 z）
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(hubR, hubR, wheelW + 0.12, 12), woodTex(0x473A2B, 0.9));
  hub.rotation.x = Math.PI / 2; wheelGrp.add(hub);
  // 辐条：6 根细木棍，从轮毂辐射至轮缘（镂空中心，木撑支撑）
  const spokeN = 6;
  for (let k = 0; k < spokeN; k++) {
    const ang = (k / spokeN) * Math.PI * 2;
    const sp = new THREE.Mesh(new THREE.BoxGeometry(RR - hubR, 0.05, 0.05), woodTex(WOOD, 0.85));
    sp.position.set(Math.cos(ang) * (hubR + RR) / 2, Math.sin(ang) * (hubR + RR) / 2, 0);
    sp.rotation.z = ang; sp.castShadow = true; wheelGrp.add(sp);
  }
  g.userData.skyRoller = wheelGrp;

  // 天夹板（yoke）：自主腿顶端「天箍头」立两短柱，顶端以横梁连成轴座，承天辊轴
  const capTopW = mainHX(H);        // 天箍头半宽（= 主腿顶端半宽）
  const yokeHalf = 0.3;             // 轴座半宽（顶端收拢处）
  [-1, 1].forEach((s) => {
    // 天箍头：主腿顶端束箍（加宽短箍，风篾系于此）
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.28), vWood(WOOD_DARK, 0.9));
    cap.position.set(cx + s * capTopW, H, cz); cap.castShadow = true; statT.add(cap);
    // 天夹板立柱：自天箍头顶斜上收至轴座
    statT.add(bundleStrut(
      new THREE.Vector3(cx + s * capTopW, H + 0.1, cz),
      new THREE.Vector3(cx + s * yokeHalf, topY - 0.05, cz),
      { count: 2, rad: 0.06, spread: 0.05, color: WOOD, rough: 0.88, bindStep: 0.5, ironEvery: 4, splice: false }
    ));
  });
  // 轴座横梁（天夹板顶联系梁）
  const yokeBeam = new THREE.Mesh(new THREE.BoxGeometry(yokeHalf * 2 + 0.3, 0.16, 0.16), vWood(WOOD_DARK, 0.9));
  yokeBeam.position.set(cx, topY - 0.02, cz); statT.add(yokeBeam);
  // 辊把子（轴）+ 座子/轴瓦（铁轴承端盖）
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, wheelW + 0.24, 10), woodTex(0x473A2B, 0.92));
  axle.rotation.x = Math.PI / 2; axle.position.set(cx, topY, cz); statT.add(axle);
  [-1, 1].forEach((s) => {
    const seat = new THREE.Mesh(hoopGeoC(0.11, 0.03, 12), ironS());
    seat.rotation.x = Math.PI / 2; seat.position.set(cx, topY, cz + s * (wheelW / 2 + 0.1)); statT.add(seat);
  });

  // ---- 风篾：细、黑、无彩色，约 30° 浅角，自各高度档散出连地桩；风篾本就系于塔身，故碰撞回归不检 cols ----
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x20201e, roughness: 0.85, metalness: 0.0 });
  const tiers = [11.7, 9.7, 7.4, 5.1, 2.9];
  const tan30 = Math.tan(30 * Math.PI / 180);
  tiers.forEach((ay, tier) => {
    const t0 = ay / H;
    const legOuter = 0.115 * (1 - 0.55 * t0) + 0.085 * (1 - 0.34 * t0);
    const ar = mainHX(ay) + legOuter;   // 附着点推到主腿束身外缘，风篾贴合主腿而非埋入中心
    const pr = ar + ay / tan30;         // 落地半径：约 30° 浅角
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + tier * 0.26; // 螺旋散布，避免直线重叠
      if (windStaySkip(a, cx, cz)) continue;   // 绕开井场设备方位，避免刺穿
      const p1 = new THREE.Vector3(cx + Math.cos(a) * ar, ay, cz + Math.sin(a) * ar);
      const p2 = new THREE.Vector3(cx + Math.cos(a) * pr, 0.45, cz + Math.sin(a) * pr);
      statT.add(strut(p1, p2, 0.02 - 0.007 * (ay / H), ropeMat));
      const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 8), woodDark);
      peg.position.set(p2.x, 0.25, p2.z); peg.castShadow = true; statT.add(peg);
      const pc = new THREE.Mesh(hoopGeoC(0.15, 0.03, 12), ironS());
      pc.rotation.x = Math.PI / 2; pc.position.set(p2.x, 0.62, p2.z); statT.add(pc);
    }
  });

  emit(statT); flushBin(P.top);
}


// 立式大车（提卤巨轮）：轮面朝 z，绕水平轴(z)旋转；底杠支撑轮轴两端
function buildCart(g, part, x, z) {
  const woodMat = woodTex(WOOD, 0.9);
  const woodDark = woodTex(WOOD_DARK, 0.9);
  const R = 1.6;
  const cart = new THREE.Group();
  cart.position.set(x, 0, z);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(R, 0.28, 14, 32), woodTex(WOOD, 0.9));
  wheel.position.y = R; wheel.userData.noOutline = true; // 轮体自身旋转，静态 outline 会脱节
  cart.add(wheel);
  for (let i = 0; i < 10; i++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.14, R * 1.85, 0.14), woodDark);
    sp.position.y = R; sp.rotation.z = (i / 10) * Math.PI * 2; cart.add(sp);
  }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, R * 0.5, 10), woodDark);
  axle.rotation.x = Math.PI / 2; axle.position.y = R; cart.add(axle);
  // 绕绳（篾绳盘于轮缘）
  const ropeRing = new THREE.Mesh(new THREE.TorusGeometry(R, 0.05, 8, 32), new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 1.0, metalness: 0.0 }));
  ropeRing.position.y = R; cart.add(ropeRing);
  // 底杠（支撑轮轴两端）：同样是并束木柱，束身竹篾成箍、隔道铁箍
  [-1, 1].forEach((s) => {
    const b = bundleStrut(
      new THREE.Vector3(x, 0, z + s * 0.6),
      new THREE.Vector3(x, R + 0.5, z + s * 0.6),
      { count: 3, rad: 0.09, spread: 0.088, color: WOOD, rough: 0.9, bindStep: 0.52, ironEvery: 4, splice: false }
    );
    emit(b);
  });
  flushBin(part); // 底杠合并入大车分区
  // 轴碗竹篾 + 轴端铁箍
  const bindMat = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 0.95, metalness: 0.0 });
  const cartWindGeo = helixWindGeo(0.24, 0.5, 3, 0.04);
  [-1, 1].forEach((s) => {
    addWind(cart, new THREE.Vector3(0, R, s * 0.4), 'z', cartWindGeo, bindMat);
    const ic = new THREE.Mesh(hoopGeoC(0.22, 0.04, 14), ironS());
    ic.rotation.x = Math.PI / 2; ic.position.set(0, R, s * 0.52); cart.add(ic);
  });
  part.add(cart);
  g.userData.cartWheel = wheel; // 由提卤绳联动驱动（见 animate）
}

// 地辊（地面转向定滑轮）：绳从天辊到此转向，再引向大车
function buildGroundRoller(g, part, x, z) {
  const woodDark = woodTex(WOOD_DARK, 0.9);
  const roller = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.13, 10, 22), woodTex(WOOD_LIGHT, 0.8));
  roller.position.set(x, 1.0, z); roller.userData.noOutline = true; // 地辊自身旋转，静态 outline 会脱节
  part.add(roller);
  for (let i = 0; i < 4; i++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.0, 0.09), woodDark);
    sp.position.set(x, 1.0, z); sp.rotation.z = (i / 4) * Math.PI * 2; part.add(sp);
  }
  // 竹篾缠绕：轴端篾绳捆扎
  const bindMat = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 0.95, metalness: 0.0 });
  addWind(part, new THREE.Vector3(x, 1.0, z), 'z', helixWindGeo(0.2, 0.45, 3, 0.04), bindMat);
  g.userData.groundRoller = roller; // 由提卤绳联动驱动（见 animate）
}

// 碓架（踩架）：冲击式顿钻。门形木架 + 横梁花辊子 + 踩板杠杆 + 碓头重锤 + 钻杆
function buildDuijia(g, part, x, z) {
  const woodMat = woodTex(WOOD, 0.9);
  const woodDark = woodTex(WOOD_DARK, 0.9);
  const H = 4.2, base = 0.7;
  const POST = 1.5;            // 门形架立柱半距（两立柱净距 3.0）
  const TOP = base + H;        // 立柱顶 / 横梁高 = 4.9
  // 门形架两根立柱：并束木柱（碓头反复冲击，靠束柱与铁箍分散冲击力）。足距加宽，
  // 使碓头+钻杆可悬于两柱之间净空，不再贴柱穿模。
  [-POST, POST].forEach((sx) => {
    emit(bundleStrut(
      new THREE.Vector3(x + sx, 0.05, z),
      new THREE.Vector3(x + sx, TOP, z),
      { count: 3, rad: 0.082, spread: 0.08, color: WOOD, rough: 0.9, bindStep: 0.56, ironEvery: 4, splice: false }
    ));
  });
  flushBin(part); // 立柱合并入碓架分区
  // 顶横梁：压在两立柱顶
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2 * POST + 0.3, 0.3, 0.3), vWood(WOOD_DARK, 0.9));
  beam.position.set(x, TOP, z); part.add(beam);
  // 花辊轴（固定铰接轴）：架在顶横梁之上（高于立柱顶 0.25），杠杆悬于柱顶之上，避免与立柱穿模
  const pivotY = TOP + 0.25;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2 * POST, 10), woodDark);
  hub.rotation.z = Math.PI / 2; hub.position.set(x, pivotY, z); part.add(hub);
  // 杠杆组（绕花辊轴摆动 = 冲击式顿钻）：杠杆 + 碓头 + 钻杆 + 踏板
  const pivot = new THREE.Group();
  pivot.position.set(x, pivotY, z);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(2 * POST + 0.2, 0.16, 0.4), woodMat);
  pivot.add(lever); // 居中，悬于柱顶之上
  // 碓头：悬于两立柱之间（局部 x 轻微偏 -0.5，仍在立柱内侧净空内），不再贴柱
  const headX = -0.5;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.46, 1.4, 12), woodDark);
  head.position.set(headX, -1.0, 0); head.castShadow = true; pivot.add(head);
  // 碓头铁箍 + 铁靴（冲击端包铁，做旧锈重）
  [-0.45, -1.55].forEach((yy) => {
    const hb = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 16), ironS());
    hb.rotation.x = Math.PI / 2; hb.position.set(headX, yy, 0); pivot.add(hb);
  });
  const shoe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 0.4, 12), ironS());
  shoe.position.set(headX, -1.85, 0); shoe.castShadow = true; pivot.add(shoe);
  // 钻杆：自碓头直下，落入井孔（位于立柱之间，不碰立柱）
  const drill = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.2, 10), woodTex(0x473A2B, 0.9));
  drill.position.set(headX, -2.9, 0); pivot.add(drill);
  // 踏板（杠杆长端，伸出门架外供踩踏）
  const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.5), woodTex(WOOD_LIGHT, 0.8));
  pedal.position.set(1.15, -0.1, 0); pivot.add(pedal);
  part.add(pivot);
  g.userData.duijiaPivot = pivot; // 由 animate 驱动（冲击节奏）
  // 竹篾缠绕：门形架穿斗节点 + 花辊轴端 + 碓头连接（螺旋篾绳捆扎，不用铁钉）
  const bindMat = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 0.95, metalness: 0.0 });
  const djWindGeo = helixWindGeo(0.26, 0.5, 3, 0.04);
  [-1, 1].forEach((s) => {
    addWind(part, new THREE.Vector3(x + s * POST, TOP - 0.15, z), 'y', djWindGeo, bindMat);
    addWind(part, new THREE.Vector3(x + s * POST, pivotY, z), 'x', djWindGeo, bindMat);
  });
  addWind(part, new THREE.Vector3(x + headX, pivotY - 0.3, z), 'y', helixWindGeo(0.3, 0.5, 3, 0.04), bindMat);
}

// ============================================================
// 竹笆：竹条编织的席面（寮棚墙、井台屏、晾架都用它）
// 竖篾一前一后错开摆放，模拟经纬互压的编织关系
// ============================================================
function bambooPanel(w, h) {
  const p = new THREE.Group();
  const nV = Math.max(4, Math.round(w / 0.13));
  for (let i = 0; i < nV; i++) {
    const px = -w / 2 + (w / nV) * (i + 0.5);
    const sl = new THREE.Mesh(new THREE.BoxGeometry(0.052, h * (0.93 + Math.random() * 0.11), 0.028), vBamboo(BAMBOO_PALE, 0.9));
    sl.position.set(px, h / 2, i % 2 ? 0.021 : -0.021);
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

// 井台外缘的竹笆屏：挡风遮泥，兼晾晒篾绳
function buildScreen(g, part, x, z, w = 3.2, h = 1.5) {
  const p = new THREE.Group();
  p.position.set(x, 0, z);
  p.rotation.y = Math.atan2(x, z);   // 屏面朝向井口
  [-1, 0, 1].forEach((k) => {
    const px = k * w / 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, h + 0.34, 7), vWood(WOOD_DARK, 0.9));
    post.position.set(px, (h + 0.34) / 2 - 0.14, 0); post.castShadow = true; p.add(post);
    const cap = new THREE.Mesh(hoopGeoC(0.1, 0.022, 10), ironS()); // 桩头铁箍
    cap.rotation.x = Math.PI / 2; cap.position.set(px, h + 0.11, 0); p.add(cap);
  });
  const panel = bambooPanel(w - 0.06, h);
  panel.position.y = 0.05; p.add(panel);
  emit(p);
  flushBin(part); // 竹笆屏合并入寮棚·竹笆分区
}

// ============================================================
// 盐工寮棚：井台旁的草顶竹笆工棚
// 盐工歇脚、存卤、放篾绳与工具之处；单坡草顶前高后低，三面竹笆一面敞开朝井
// ============================================================
function buildShed(g, part, x, z) {
  const s = new THREE.Group();
  s.position.set(x, 0, z);
  s.rotation.y = Math.atan2(x, z);   // 敞开的一面（局部 -z）朝井口
  const W = 3.6, D = 2.8, Hf = 2.5, Hb = 1.95;

  // 角柱：同样是小束柱（三根并束、竹篾捆扎），呼应天车的营造逻辑
  [[-1, -1, Hf], [1, -1, Hf], [1, 1, Hb], [-1, 1, Hb]].forEach(([sx, sz, h]) => {
    s.add(bundleStrut(
      new THREE.Vector3(sx * W / 2, 0, sz * D / 2),
      new THREE.Vector3(sx * W / 2, h, sz * D / 2),
      { count: 3, rad: 0.055, spread: 0.055, color: WOOD_DARK, rough: 0.9, bindStep: 0.56, ironEvery: 0, splice: false }
    ));
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.34), vStone(0x8f8a80, 0.96));
    pl.position.set(sx * W / 2, 0.09, sz * D / 2); pl.receiveShadow = true; s.add(pl);
  });

  // 前后檐檩
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
  const vat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.76, 16), vStone(0x6e6257, 0.9));
  vat.position.set(-0.95, 0.38, 0.4); vat.castShadow = true; s.add(vat);
  const rim = new THREE.Mesh(hoopGeoC(0.43, 0.05, 16), vStone(0x655a50, 0.9));
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
  flushBin(part); // 寮棚合并入寮棚·竹笆分区
}

// 两点之间的木杆 / 斜撑（按方向自动朝向）
function strut(p1, p2, thickness, mat) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y, dz = p2.z - p1.z;
  const len = Math.hypot(dx, dy, dz);
  const m = new THREE.Mesh(new THREE.BoxGeometry(thickness, len, thickness), mat);
  m.position.set((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
  m.castShadow = true;
  return m;
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
  if (p < 0.7) return -0.28 * easeInOut(p / 0.7);              // 碓头缓抬
  return -0.28 + 0.28 * easeInOut((p - 0.7) / 0.3);            // 快速冲击落回
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
// 聚焦分区初始化：每个构件 mesh 克隆独立材质并记录 base 颜色，
// 再为每个构件生成「反向外壳描边」网格（聚焦时显示）：一层清晰淡金边 + 一层更宽的半透明淡金光晕。
function initParts() {
  // 描边材质关闭 toneMapping，保证浅金在任何光照下都鲜亮如“发光”
  outlineMat = new THREE.MeshBasicMaterial({ color: OUTLINE_GOLD, side: THREE.BackSide, toneMapped: false });
  haloMat = new THREE.MeshBasicMaterial({
    color: OUTLINE_GOLD, side: THREE.BackSide, toneMapped: false,
    transparent: true, opacity: 0.32, depthWrite: false,
  });
  PART_ORDER.forEach((name) => {
    const grp = PART[name];
    grp.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      o.material.userData.baseColor = o.material.color.clone();
      o.material.userData.baseEmissive = o.material.emissive.clone();
      o.material.userData.baseEmissiveIntensity = o.material.emissiveIntensity ?? 1;
    });
    buildOutline(grp, name);
  });
}

// 反向外壳描边：克隆每个 mesh 几何、绕其自身质心放大，用 BackSide 渲染，
// 仅露出轮廓（正面被模型本体遮挡）。edge 层清晰描边，halo 层更宽半透明 → 视觉上“发光”的边。
function buildOutline(group, name) {
  const list = [];
  group.traverse((src) => {
    if (!src.isMesh) return;
    if (src.userData.noOutline) return; // 动态 mesh（旋转轮体 / 伸缩提卤绳）不生成静态描边
    const geo = src.geometry;
    geo.computeBoundingBox();
    const c = new THREE.Vector3();
    geo.boundingBox.getCenter(c);
    const mkShell = (scale, mat, order) => {
      const og = geo.clone();
      og.translate(-c.x, -c.y, -c.z);
      og.scale(scale, scale, scale);
      og.translate(c.x, c.y, c.z);
      const om = new THREE.Mesh(og, mat);
      om.position.copy(src.position);
      om.quaternion.copy(src.quaternion);
      om.scale.copy(src.scale);
      om.visible = false;
      om.renderOrder = order;
      om.frustumCulled = false;
      om.userData.isOutline = true; // 描边外壳：不参与 applyFocus 的调色/压暗
      src.parent.add(om);
      return om;
    };
    list.push(mkShell(1.045, outlineMat, 6));   // 清晰淡金边
    list.push(mkShell(1.13, haloMat, 5));        // 更宽的半透明淡金光晕
  });
  PART_OUTLINES[name] = list;
}

// 焦点即所得：聚焦构件保持原色，仅显示淡金描边+光晕；其余构件轻微压暗，使焦点即所得。
function applyFocus(index) {
  const focused = (index >= 1 && FOCUS_MAP[index]) ? FOCUS_MAP[index] : [];
  PART_ORDER.forEach((name) => {
    const isFocus = focused.includes(name);
    PART[name].traverse((o) => {
      if (!o.isMesh || o.userData.isOutline) return;
      const mat = o.material, base = mat.userData.baseColor;
      if (!base) return; // 未登记基色的网格（如描边外壳）跳过，避免 color.copy(undefined)
      if (index === 0 || focused.length === 0) {
        // 总览：全部还原原色与原 emissive
        mat.color.copy(base);
        mat.emissive.copy(mat.userData.baseEmissive);
        mat.emissiveIntensity = mat.userData.baseEmissiveIntensity;
      } else if (isFocus) {
        // 聚焦：保持物体原色，不加提亮、不加自发光；焦点由淡金描边+光晕与“其余压暗”共同呈现
        mat.color.copy(base);
        mat.emissive.copy(mat.userData.baseEmissive);
        mat.emissiveIntensity = mat.userData.baseEmissiveIntensity;
      } else {
        // 非聚焦：轻微压暗，凸显焦点
        mat.color.copy(base).multiplyScalar(DIM);
        mat.emissive.copy(mat.userData.baseEmissive);
        mat.emissiveIntensity = mat.userData.baseEmissiveIntensity;
      }
    });
    const outs = PART_OUTLINES[name] || [];
    outs.forEach((om) => { om.visible = (index >= 1 && isFocus); });
  });
}

function setActive(index) {
  currentActive = index;
  document.querySelectorAll('.nav-item').forEach((el, i) => el.classList.toggle('active', i === index));
  applyFocus(index);
  if (index >= 0) showInfo(PROCESS[index]);
}

// 自检：校验分区/描边/压暗逻辑在无头环境也能正确运行（?selftest 时使用）
function runSelfTest() {
  // 统计某分组内「颜色偏离基色」的网格数（用于验证：聚焦件保持原色、其余被压暗）
  const countColorDrift = (grp, expectBase) => {
    let n = 0;
    grp.traverse((o) => {
      if (!o.isMesh || o.userData.isOutline || !o.material.userData.baseColor) return;
      const base = o.material.userData.baseColor;
      const eq = Math.abs(o.material.color.r - base.r) < 1e-4
              && Math.abs(o.material.color.g - base.g) < 1e-4
              && Math.abs(o.material.color.b - base.b) < 1e-4;
      if (expectBase ? !eq : eq) n++;
    });
    return n;
  };
  const visibleOutlines = (name) => (PART_OUTLINES[name] || []).filter((o) => o.visible).length;
  applyFocus(0);
  const resetDrift = countColorDrift(scene, true);   // 总览：全部分区颜色均 = 基色
  applyFocus(2);                                     // 聚焦「天辊·风篾」(top)
  const topDrift = countColorDrift(PART.top, true);  // 聚焦件应「保持原色」(drift=0)
  const topOutline = visibleOutlines('top');         // 聚焦件淡金描边+光晕应可见
  const otherDrift = countColorDrift(PART.cols, false); // 其余构件应被压暗 (drift>0)
  applyFocus(0);

  // —— 碰撞回归断言：关键线段不得命中「不应相交」的构件分区 ——
  const collisionErrors = [];
  const segmentHits = (p1, p2, targets, label, near = 0.05) => {
    const a = new THREE.Vector3(...p1), b = new THREE.Vector3(...p2);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    if (len < 1e-6) return [];
    dir.normalize();
    const objs = [];
    const objectParts = new Map();
    targets.forEach((partName) => {
      if (!PART[partName]) return;
      PART[partName].traverse((o) => {
        if (o.isMesh && !o.userData.isOutline) {
          objectParts.set(o, partName);
          objs.push(o);
        }
      });
    });
    const ray = new THREE.Raycaster(a, dir, near, len * 0.995);
    return ray.intersectObjects(objs, false).map((h) => ({
      label,
      part: objectParts.get(h.object) ?? '?',
      point: [Math.round(h.point.x * 100) / 100, Math.round(h.point.y * 100) / 100, Math.round(h.point.z * 100) / 100],
    }));
  };

  let collisionSegments = 0;
  // 新骨架为单塔；风篾本就系于塔身，故碰撞回归仅检「风篾是否刺穿其余设备」，不检 cols。
  const mainStays = windStaySegments(-0.6, 0.2);
  const stayTargets = ['cart', 'ground', 'duijia', 'shed', 'well'];
  mainStays.forEach((seg) => {
    collisionSegments += 1;
    const hits = segmentHits(seg.p1, seg.p2, stayTargets, `wind@${Math.round(seg.a * 180 / Math.PI)}deg`);
    if (hits.length) collisionErrors.push(...hits);
  });

  const w = stationGroups[0].userData.wellAnim;
  const anchor = new THREE.Vector3(0, -0.6, 0).add(stationGroups[0].userData.skyRoller.position);
  [[w.bucket.position.y, 'lift-top'], [1.3, 'lift-bottom']].forEach(([yy, label]) => {
    collisionSegments += 1;
    const hits = segmentHits(
      [anchor.x, anchor.y, anchor.z],
      [w.bucketX, yy + 0.66, w.bucketZ],
      ['cols', 'top'],
      label
    );
    if (hits.length) collisionErrors.push(...hits);
  });

  // 汲卤筒最低行程：锥尖必须在井筒内、半径小于井筒半径，且钻杆隐藏
  const prevBucketY = w.bucket.position.y;
  w.bucket.position.y = 1.3;
  if (w.stem) w.stem.visible = 1.3 > 2.34;
  scene.updateMatrixWorld(true);
  const bucketBox = new THREE.Box3();
  w.bucket.traverse((o) => {
    if (o.isMesh && !o.userData.isOutline) bucketBox.expandByObject(o);
  });
  const bucketCX = (bucketBox.min.x + bucketBox.max.x) / 2;
  const bucketCZ = (bucketBox.min.z + bucketBox.max.z) / 2;
  const bucketMaxR = Math.max(
    Math.abs(bucketBox.min.x - bucketCX),
    Math.abs(bucketBox.max.x - bucketCX),
    Math.abs(bucketBox.min.z - bucketCZ),
    Math.abs(bucketBox.max.z - bucketCZ)
  );
  if (bucketBox.min.y < 0.3) collisionErrors.push({ label: 'bailer-bottom', detail: `tipY=${bucketBox.min.y}` });
  if (bucketMaxR > 0.75) collisionErrors.push({ label: 'bailer-radius', detail: `r=${bucketMaxR}` });
  if (w.stem && w.stem.visible) collisionErrors.push({ label: 'drill-stem-should-hide' });
  w.bucket.position.y = prevBucketY;
  if (w.stem) w.stem.visible = prevBucketY > 2.34;
  scene.updateMatrixWorld(true);

  collisionErrors.forEach((e) => window.__errs.push(`collision:${e.label}`));
  const diag = {
    errs: window.__errs,
    parts: PART_ORDER.length,
    partChildren: PART_ORDER.map((n) => PART[n].children.length),
    outlinesPerPart: PART_ORDER.map((n) => (PART_OUTLINES[n] || []).length),
    resetDrift, topDrift, topOutline, otherDrift,
    collision: {
      checked: collisionSegments,
      hits: collisionErrors.length,
      clear: collisionErrors.length === 0,
      errors: collisionErrors,
    },
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
  panel.scrollTop = 0; // 切换构件时回到顶部，避免携带上一组件的滚动位置
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
    autoTour = true;
    tourTimer = 0;
    tourIndex = currentActive >= 0 ? currentActive : 0;
    refreshControlsText();
  };

  // 详情抽屉：默认折叠；点击头部 / 拖拽头部都能切换展开
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

  // 头部整体点击（按钮自身用 stopPropagation 单独处理）
  head.addEventListener('click', (e) => {
    if (e.target.closest('.ip-toggle')) return;
    setOpen(!panel.classList.contains('expanded'));
  });
  // 『详情』按钮本身点击：直接切换
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!panel.classList.contains('expanded'));
  });
  // 键盘可达（Enter / Space 切展开）
  head.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!panel.classList.contains('expanded')); }
  });

  // 拖拽：竖屏（底部抽屉）下拖 60px 收 / 上拖 60px 展
  let dragStartY = 0, dragPointerId = -1, dragMoved = false;
  const isNarrow = () => window.matchMedia('(max-width: 860px)').matches;
  head.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.ip-toggle')) return; // 不与按钮冲突
    if (!isNarrow()) return;                   // 仅竖屏启用拖拽
    dragStartY = e.clientY;
    dragPointerId = e.pointerId;
    dragMoved = false;
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
    if (!wasDragging) return; // 没有拖动 → 交给 head.click 处理
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

  stationGroups.forEach((g) => {
    g.userData.spin.forEach((s) => { if (playing) s.mesh.rotation[s.axis] += s.speed * dt; });
    if (g.userData.vibrate && playing) {
      const v = g.userData.vibrate;
      v.mesh.position.y = v.baseY + Math.sin(t * v.freq) * v.amp;
      if (v.rock) v.mesh.rotation.z = 0.18 + Math.sin(t * v.freq) * v.rock;
    }
    if (g.userData.conveyor && playing) {
      const c = g.userData.conveyor;
      c.bags.children.forEach((bag, i) => { bag.position.x = -3 + ((i * 2 + t * c.speed) % 8); });
    }
    // 采卤站动态叙事：碓架冲击 + 汲卤筒升降 + 提卤绳联动天辊/地辊/大车
    if (g.userData.duijiaPivot && playing) {
      g.userData.duijiaPivot.rotation.z = duijiaAngle(t);
    }
    if (g.userData.wellAnim && playing) {
      const w = g.userData.wellAnim;
      const p = (t % w.period) / w.period;
      const yy = w.bottom + (w.top - w.bottom) * (0.5 - 0.5 * Math.cos(p * Math.PI * 2));
      w.bucket.position.y = yy;
      // 汲卤筒下探时隐藏静止钻杆（钻 / 提卤交替进行）；
      // 阈值取「桶锥尖仍高于钻杆顶 1.4」的时刻，保证二者永不同框相交。
      if (w.stem) w.stem.visible = yy > 2.34;
      orientCylinder(w.liftRope, w.anchor, new THREE.Vector3(w.bucketX, yy + 0.66, w.bucketZ));
      const vel = (yy - w.prevY) / Math.max(dt, 1e-3);
      w.prevY = yy;
      const dW = -vel * 0.22 * dt; // 桶升→收绳：大车/地辊/天辊同向转
      if (g.userData.cartWheel) g.userData.cartWheel.rotation.z += dW;
      if (g.userData.groundRoller) g.userData.groundRoller.rotation.z += dW;
      if (g.userData.skyRoller) {
        g.userData.skyRoller.rotation.z += dW;
        // 提卤绳从天辊绳槽正下方出绳（-0.6 = 辊半径 0.52 + 余量）：井口已与天辊中心对齐，
        // 固定底缘出绳点保证绳段竖直落在塔内无撑通道中，不会扫过侧向水平箍梁。
        w.anchor.set(0, -0.6, 0).add(g.userData.skyRoller.position);
      }
    }
  });

  if (autoTour && playing) {
    tourTimer += dt;
    if (tourTimer > 4.5) { tourTimer = 0; tourIndex = (tourIndex + 1) % PROCESS.length; focusOn(tourIndex); }
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

try {
  init();
} catch (e) {
  __recordErr('init:' + (e && e.stack ? e.stack : e));
  throw e;
}
