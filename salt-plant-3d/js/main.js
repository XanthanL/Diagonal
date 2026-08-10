// 自贡井盐 · 天车（木构井架）3D 解构（中英双语）
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { PROCESS, LEGEND, I18N } from './data.js';

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
const WOOD = 0x8C755A;         // 陈年杉木主色（灰暖木，做旧）
const WOOD_DARK = 0x5A4836;    // 陈年杉木暗部（阴影 / 老木）
const WOOD_LIGHT = 0xA39276;   // 陈年杉木亮部（受光面）
const BAMBOO = 0xA9AC82;       // 竹篾色（浅黄绿灰）：绳索与捆绑环，区别于木构
const BAMBOO_PALE = 0xBFBD98;  // 新篾（略亮）：竹笆编织面，与陈年篾箍拉开层次
const IRON = 0x6B6259;         // 做旧铁箍（暗铁灰）：关键节点锁紧
const THATCH = 0x9A8455;       // 茅草屋面（盐工寮棚）

let scene, camera, renderer, labelRenderer, controls, clock;
let stationGroups = [];
let baseRings = [];
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
  // 陈年杉木底色（灰暖、低饱和）
  x.fillStyle = '#8c755a'; x.fillRect(0, 0, s, s);
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
function glowMat(color) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.2 });
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
    bindStep = 0.9,     // 竹篾箍间距
    ironEvery = 3,      // 每隔几道箍换成铁箍（0 = 全竹篾，无铁）
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
  const bindR = (count > 1 ? spread : 0) + rad * 1.12;
  const n = Math.max(2, Math.round(len / bindStep));
  const wg = windGeoC(r2(bindR), 0.3, 2.5, 0.028);
  const ig = hoopGeoC(r2(bindR + 0.015), 0.038, 14);
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
  bindUI();
  buildNav();
  applyLang();

  clock = new THREE.Clock();
  window.addEventListener('resize', onResize);
  animate();
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
// 站台
// ============================================================
function buildStations() {
  PROCESS.forEach((step) => {
    const g = new THREE.Group();
    g.position.set(step.position[0], 0, step.position[2]);
    g.userData = { step, spin: [], vibrate: null, conveyor: null };

    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.7, 0.2, 12, 48), glowMat(step.color));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring); baseRings.push(ring);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.7, 0.4, 32), metalTex(ALLOY_DARK, 0.8, 0.4));
    pad.position.y = 0.2; pad.castShadow = true; pad.receiveShadow = true; g.add(pad);

    buildWell(g);
    scene.add(g);
    stationGroups.push(g);
  });
}

// 采卤井
// 采卤井 · 自贡天车（木构井架，古朴质感）
function buildWell(g) {
  const wood = woodTex(WOOD, 0.85);
  const woodDark = woodTex(WOOD_DARK, 0.9);
  const woodLight = woodTex(WOOD_LIGHT, 0.8);

  // 木地台（盖住通用金属底座，强化古朴基座；半径小于聚焦光环以保持指示一致）
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.3, 0.5, 32), woodTex(0x6E5A42, 0.95));
  deck.position.y = 0.45; deck.castShadow = true; deck.receiveShadow = true; g.add(deck);

  // 主天车（高，正对井口，驱动提卤）+ 副天车（略矮），呼应自贡旧时「天车林立、盐井成群」之景
  buildDerrick(g, -0.6, 0.2, 15, 2.1, 6, wood, woodDark, true);
  buildDerrick(g, 1.9, -0.5, 11, 1.6, 5, woodLight, woodDark, false);

  // 井口石箍（自贡盐井以石圈箍井，防潮固壁）
  const stoneBase = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.32, 26), stoneTex(0x97928a, 0.96));
  stoneBase.position.set(0.4, 0.56, 0); stoneBase.castShadow = true; stoneBase.receiveShadow = true; g.add(stoneBase);
  const collarN = 14;
  for (let i = 0; i < collarN; i++) {
    const a = (i / collarN) * Math.PI * 2;
    const blk = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.95, 0.34), vStone(0x8f8a80, 0.96));
    const R = 0.82;
    blk.position.set(0.4 + Math.cos(a) * R, 1.12, Math.sin(a) * R);
    blk.rotation.y = -a + (Math.random() - 0.5) * 0.12;
    const sc = 0.9 + Math.random() * 0.22;
    blk.scale.set(sc, 0.92 + Math.random() * 0.18, sc);
    blk.castShadow = true; blk.receiveShadow = true; g.add(blk);
  }
  // 井口石压顶（一圈略宽的石环）
  const cap = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.09, 8, 28), stoneTex(0x8a857c, 0.95));
  cap.rotation.x = Math.PI / 2; cap.position.set(0.4, 1.62, 0); g.add(cap);
  // 井口锻铁箍（压住石圈、护住井唇，长年卤水浸润锈色深重）
  const wellIron = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.055, 8, 26), ironS());
  wellIron.rotation.x = Math.PI / 2; wellIron.position.set(0.4, 1.7, 0); g.add(wellIron);
  // 顿钻钻杆（入井）
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 10), woodTex(0x473A2B, 0.9));
  stem.position.set(0.4, -1.6, 0); g.add(stem);

  // 传统木卤桶（heritage 点缀）
  [[-3.0, 1.7], [2.7, 2.3], [-2.3, -2.5]].forEach(([bx, bz]) => {
    const barrel = new THREE.Group();
    const bodyB = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 1.3, 18), woodTex(0x7E6748, 0.9));
    bodyB.position.y = 0.65; bodyB.castShadow = true; barrel.add(bodyB);
    [0.25, 0.95].forEach((yy) => {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.05, 8, 20), ironS()); // 做旧铁箍
      hoop.rotation.x = Math.PI / 2; hoop.position.y = yy; barrel.add(hoop);
    });
    barrel.position.set(bx, 0.45, bz); g.add(barrel);
  });

  // 立式大车（提卤巨轮）+ 地辊（转向定滑轮）+ 碓架（冲击式顿钻踩架）
  buildCart(g, -3.8, 1.4);
  buildGroundRoller(g, -1.9, 2.1);
  buildDuijia(g, 3.0, -1.6);
  // 提卤绳链：天辊 → 地辊（转向）→ 大车（绕绳）
  const linkMat = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 1.0, metalness: 0.0 });
  g.add(strut(new THREE.Vector3(-0.6, 15.3, 0.2), new THREE.Vector3(-1.9, 1.0, 2.1), 0.05, linkMat));
  g.add(strut(new THREE.Vector3(-1.9, 1.0, 2.1), new THREE.Vector3(-3.8, 3.0, 1.4), 0.05, linkMat));

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
  bucket.position.set(0.4, 3.4, 0); g.add(bucket);
  // 提卤绳：天辊锚点 → 桶顶，随桶升降而伸缩
  const liftRope = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1, 6), liftRopeMat);
  g.add(liftRope);
  g.userData.wellAnim = {
    bucket, liftRope,
    top: 3.4, bottom: 1.3, period: 8.0,
    anchor: new THREE.Vector3(-0.6, 15.3, 0.2),
    bucketX: 0.4, bucketZ: 0,
    prevY: 3.4,
  };

  // 井台周边聚落：盐工寮棚（草顶竹笆）+ 竹笆屏（挡风遮泥）
  // 位置避开风篾地桩，落在拉索圈之外，构成「井—车—棚」的作业场
  buildShed(g, 7.6, 4.8);
  buildScreen(g, -8.6, 3.0, 3.4, 1.5);
  buildScreen(g, 5.6, -6.6, 3.0, 1.35);

  // 静态构件统一合并：束柱/篾箍/铁箍/竹笆共上千个小网格 → 个位数 draw call
  flushBin(g);
}

// 单座天车：四面收分木井架（束柱）+ 交叉斜撑 + 顶部天辊 + 风篾拉索
// 静态构件统一收进 stat 临时树，最后按材质合并，避免束柱带来的网格爆炸。
function buildDerrick(g, cx, cz, H, baseHalf, levels, woodMat, woodDarkMat, isMain) {
  const topHalf = baseHalf * 0.32;
  const stat = new THREE.Group();
  const frames = [];
  for (let i = 0; i <= levels; i++) {
    const t = i / levels;
    frames.push({ half: baseHalf * (1 - t) + topHalf * t, y: (H / levels) * i });
  }
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

  // ---- 立柱：束柱。并束根数由下而上递减（底段最粗，顶段收为两根） ----
  const nBase = isMain ? 6 : 4;     // 底段并束根数
  const radBase = isMain ? 0.085 : 0.072;
  const sprBase = isMain ? 0.115 : 0.095;
  const denom = Math.max(1, levels - 1);
  for (let i = 0; i < levels; i++) {
    const a = frames[i], b = frames[i + 1];
    const t0 = i / denom;
    const cnt = Math.max(2, Math.round(nBase - (nBase - 2) * t0));
    const rad = radBase * (1 - t0 * 0.34);
    const spread = sprBase * (1 - t0 * 0.55);
    corners.forEach(([sx, sz]) => {
      const p1 = new THREE.Vector3(cx + a.half * sx, a.y, cz + a.half * sz);
      const p2 = new THREE.Vector3(cx + b.half * sx, b.y, cz + b.half * sz);
      stat.add(bundleStrut(p1, p2, {
        count: cnt, rad, spread,
        color: WOOD, rough: 0.86,
        bindStep: 0.72 + t0 * 0.5,
        ironEvery: isMain ? 3 : 4,
      }));
    });
  }

  // ---- 水平箍梁（双木并束的横箍）+ 交叉斜撑 ----
  for (let i = 0; i < levels; i++) {
    const a = frames[i], b = frames[i + 1];
    [['x', -1], ['x', 1], ['z', -1], ['z', 1]].forEach(([axis, sign]) => {
      if (axis === 'x') {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(a.half * 2 + 0.1, 0.14, 0.14), vWood(WOOD_DARK, 0.9));
        bar.position.set(cx, a.y, cz + a.half * sign); stat.add(bar);
      } else {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, a.half * 2 + 0.1), vWood(WOOD_DARK, 0.9));
        bar.position.set(cx + a.half * sign, a.y, cz); stat.add(bar);
      }
    });
    const faces = [
      { sx: -1, sz: -1, ex: 1, ez: -1 }, // 前 z-
      { sx: 1, sz: 1, ex: -1, ez: 1 },   // 后 z+
      { sx: -1, sz: 1, ex: -1, ez: -1 }, // 左 x-
      { sx: 1, sz: -1, ex: 1, ez: 1 },   // 右 x+
    ];
    faces.forEach((f) => {
      if (f.sz === 1) return; // 近相机面（sz=+1）保留开口（剖视/展示面），便于观察内部汲卤筒与提卤绳动态
      const p1 = new THREE.Vector3(cx + a.half * f.sx, a.y, cz + a.half * f.sz);
      const p2 = new THREE.Vector3(cx + b.half * f.ex, b.y, cz + b.half * f.ez);
      const p3 = new THREE.Vector3(cx + a.half * f.ex, a.y, cz + a.half * f.ez);
      const p4 = new THREE.Vector3(cx + b.half * f.sx, b.y, cz + b.half * f.sz);
      // 下段斜撑也并两根（受力大），上段单根
      const braceCnt = i < levels / 2 ? 2 : 1;
      const bo = { count: braceCnt, rad: 0.05, spread: 0.05, color: WOOD_DARK, rough: 0.9, bindStep: 1.7, ironEvery: 0, splice: false };
      stat.add(bundleStrut(p1, p2, bo));
      stat.add(bundleStrut(p3, p4, bo));
    });
  }

  // ---- 节点铁箍：层框与束柱交汇处，用手工锻打的铁箍锁紧，上下再各缠一道竹篾 ----
  frames.forEach((f, idx) => {
    if (idx === 0) return; // 地面层埋在木地台里，省略
    const tf = idx / levels;
    const nodeR = (sprBase * (1 - tf * 0.55) + radBase * (1 - tf * 0.34)) * 1.3 + 0.02;
    const wgeo = windGeoC(r2(nodeR - 0.025), 0.26, 2, 0.03);
    corners.forEach(([sx, sz]) => {
      const px = cx + f.half * sx, pz = cz + f.half * sz;
      const hoop = new THREE.Mesh(hoopGeoC(r2(nodeR), 0.05, 18), ironS());
      hoop.rotation.x = Math.PI / 2; hoop.rotation.z = Math.random() * Math.PI;
      hoop.position.set(px, f.y, pz); hoop.castShadow = true; stat.add(hoop);
      addWind(stat, new THREE.Vector3(px, f.y + 0.24, pz), 'y', wgeo, bambooS());
      addWind(stat, new THREE.Vector3(px, f.y - 0.24, pz), 'y', wgeo, bambooS());
    });
  });

  // ---- 础石：束柱落地处的石墩（自贡盐场以石为础，隔潮防朽） ----
  corners.forEach(([sx, sz]) => {
    const f = frames[0];
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.62), vStone(0x928d84, 0.96));
    plinth.position.set(cx + f.half * sx, 0.86, cz + f.half * sz);
    plinth.rotation.y = (Math.random() - 0.5) * 0.2;
    plinth.castShadow = true; plinth.receiveShadow = true; stat.add(plinth);
  });

  // ---- 踏阶（三角木楔）：四根束柱均设攀爬踏脚 ----
  for (let i = 1; i < levels; i++) {
    const f = frames[i], yy = f.y;
    corners.forEach(([sx, sz]) => {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.26), woodDarkMat);
      st.position.set(cx + f.half * sx, yy, cz + f.half * sz * 1.08);
      st.rotation.x = -0.32;
      stat.add(st);
    });
  }

  // ---- 顶部天辊（带槽定滑轮，随提卤绳联动） ----
  const topY = H + 0.3;
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.22, 12, 28), woodTex(WOOD_LIGHT, 0.8));
  wheel.position.set(cx, topY, cz); wheel.castShadow = true; g.add(wheel);
  for (let i = 0; i < 6; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 0.12), woodDarkMat);
    spoke.position.set(cx, topY, cz); spoke.rotation.z = (i / 6) * Math.PI * 2; stat.add(spoke);
  }
  // 天辊轴端铁箍（受力最集中处）
  [-1, 1].forEach((s) => {
    const cap = new THREE.Mesh(hoopGeoC(0.26, 0.05, 14), ironS());
    cap.rotation.x = Math.PI / 2; cap.position.set(cx, topY, cz + s * 0.3); stat.add(cap);
  });
  if (isMain) g.userData.skyRoller = wheel; else g.userData.spin.push({ mesh: wheel, axis: 'z', speed: 0.8 });
  const crown = new THREE.Mesh(new THREE.BoxGeometry(topHalf * 2 + 0.4, 0.5, topHalf * 2 + 0.4), woodMat);
  crown.position.set(cx, topY + 0.45, cz); stat.add(crown);

  // 悬吊篾绳材质（风篾拉索复用）；天辊→汲卤筒的提卤主绳改由采卤站统一生成（见 buildWell）
  const ropeMat = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 1.0, metalness: 0.0 });

  // ---- 风篾（放射状拉索 + 地桩）：天车最标志性的防风结构 ----
  const windY = H * 0.78;
  const ringR = topHalf + 0.25;
  const windRing = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.09, 8, 20), woodDarkMat);
  windRing.rotation.x = Math.PI / 2; windRing.position.set(cx, windY, cz); stat.add(windRing);
  const R = baseHalf * 2.6, N = 12;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const ax = cx + Math.cos(a) * ringR, az = cz + Math.sin(a) * ringR;
    const px = cx + Math.cos(a) * R, pz = cz + Math.sin(a) * R;
    stat.add(strut(new THREE.Vector3(ax, windY, az), new THREE.Vector3(px, 0.7, pz), 0.06, ropeMat));
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 8), woodDarkMat);
    peg.position.set(px, 0.25, pz); peg.castShadow = true; stat.add(peg);
    // 地桩铁箍（防劈裂）
    const pc = new THREE.Mesh(hoopGeoC(0.15, 0.03, 12), ironS());
    pc.rotation.x = Math.PI / 2; pc.position.set(px, 0.62, pz); stat.add(pc);
  }

  emit(stat); // 合并入桶，由 buildWell 末尾统一 flush
}

// 立式大车（提卤巨轮）：轮面朝 z，绕水平轴(z)旋转；底杠支撑轮轴两端
function buildCart(g, x, z) {
  const woodMat = woodTex(WOOD, 0.9);
  const woodDark = woodTex(WOOD_DARK, 0.9);
  const R = 1.6;
  const cart = new THREE.Group();
  cart.position.set(x, 0, z);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(R, 0.28, 14, 32), woodTex(WOOD, 0.9));
  wheel.position.y = R; cart.add(wheel);
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
      { count: 3, rad: 0.09, spread: 0.088, color: WOOD, rough: 0.9, bindStep: 0.62, ironEvery: 3, splice: false }
    );
    emit(b);
  });
  // 轴碗竹篾 + 轴端铁箍
  const bindMat = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 0.95, metalness: 0.0 });
  const cartWindGeo = helixWindGeo(0.24, 0.5, 3, 0.04);
  [-1, 1].forEach((s) => {
    addWind(cart, new THREE.Vector3(0, R, s * 0.4), 'z', cartWindGeo, bindMat);
    const ic = new THREE.Mesh(hoopGeoC(0.22, 0.04, 14), ironS());
    ic.rotation.x = Math.PI / 2; ic.position.set(0, R, s * 0.52); cart.add(ic);
  });
  g.add(cart);
  g.userData.cartWheel = wheel; // 由提卤绳联动驱动（见 animate）
}

// 地辊（地面转向定滑轮）：绳从天辊到此转向，再引向大车
function buildGroundRoller(g, x, z) {
  const woodDark = woodTex(WOOD_DARK, 0.9);
  const roller = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.13, 10, 22), woodTex(WOOD_LIGHT, 0.8));
  roller.position.set(x, 1.0, z); g.add(roller);
  for (let i = 0; i < 4; i++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.0, 0.09), woodDark);
    sp.position.set(x, 1.0, z); sp.rotation.z = (i / 4) * Math.PI * 2; g.add(sp);
  }
  // 竹篾缠绕：轴端篾绳捆扎
  const bindMat = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 0.95, metalness: 0.0 });
  addWind(g, new THREE.Vector3(x, 1.0, z), 'z', helixWindGeo(0.2, 0.45, 3, 0.04), bindMat);
  g.userData.groundRoller = roller; // 由提卤绳联动驱动（见 animate）
}

// 碓架（踩架）：冲击式顿钻。门形木架 + 横梁花辊子 + 踩板杠杆 + 碓头重锤 + 钻杆
function buildDuijia(g, x, z) {
  const woodMat = woodTex(WOOD, 0.9);
  const woodDark = woodTex(WOOD_DARK, 0.9);
  const H = 4.2, base = 0.7;
  // 门形架的两根立柱：并束木柱（碓头反复冲击，靠束柱与铁箍分散冲击力）
  [-1.2, 1.2].forEach((sx) => {
    emit(bundleStrut(
      new THREE.Vector3(x + sx, base * 0.2, z),
      new THREE.Vector3(x + sx, base + H, z),
      { count: 3, rad: 0.082, spread: 0.08, color: WOOD, rough: 0.9, bindStep: 0.7, ironEvery: 3, splice: false }
    ));
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.3, 0.3), vWood(WOOD_DARK, 0.9));
  beam.position.set(x, base + H, z); g.add(beam);
  const pivotY = base + H - 0.4;
  // 花辊轴（固定，铰接杠杆）
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.4, 10), woodDark);
  hub.rotation.z = Math.PI / 2; hub.position.set(x, pivotY, z); g.add(hub);
  // 杠杆组（绕花辊轴摆动 = 冲击式顿钻）：杠杆 + 碓头 + 钻杆 + 踏板
  const pivot = new THREE.Group();
  pivot.position.set(x, pivotY, z);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 0.4), woodMat);
  pivot.add(lever); // 局部坐标 (0,0,0)
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.4, 12), woodDark);
  head.position.set(-1.3, -1.0, 0); head.castShadow = true; pivot.add(head);
  // 碓头铁箍 + 铁靴（冲击端包铁，做旧锈重）
  [-0.45, -1.55].forEach((yy) => {
    const hb = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.055, 8, 16), ironS());
    hb.rotation.x = Math.PI / 2; hb.position.set(-1.3, yy, 0); pivot.add(hb);
  });
  const shoe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 0.4, 12), ironS());
  shoe.position.set(-1.3, -1.85, 0); shoe.castShadow = true; pivot.add(shoe);
  const drill = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.0, 10), woodTex(0x473A2B, 0.9));
  drill.position.set(-1.3, -2.8, 0); pivot.add(drill);
  const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.5), woodTex(WOOD_LIGHT, 0.8));
  pedal.position.set(1.3, -0.1, 0); pivot.add(pedal);
  g.add(pivot);
  g.userData.duijiaPivot = pivot; // 由 animate 驱动（冲击节奏）
  // 竹篾缠绕：门形架穿斗节点 + 花辊轴端 + 碓头连接（螺旋篾绳捆扎，不用铁钉）
  const bindMat = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 0.95, metalness: 0.0 });
  const djWindGeo = helixWindGeo(0.26, 0.5, 3, 0.04);
  [-1, 1].forEach((s) => {
    addWind(g, new THREE.Vector3(x + s * 1.2, base + H - 0.15, z), 'y', djWindGeo, bindMat);
    addWind(g, new THREE.Vector3(x + s * 1.1, pivotY, z), 'x', djWindGeo, bindMat);
  });
  addWind(g, new THREE.Vector3(x - 1.3, pivotY - 0.3, z), 'y', helixWindGeo(0.3, 0.5, 3, 0.04), bindMat);
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
function buildScreen(g, x, z, w = 3.2, h = 1.5) {
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
}

// ============================================================
// 盐工寮棚：井台旁的草顶竹笆工棚
// 盐工歇脚、存卤、放篾绳与工具之处；单坡草顶前高后低，三面竹笆一面敞开朝井
// ============================================================
function buildShed(g, x, z) {
  const s = new THREE.Group();
  s.position.set(x, 0, z);
  s.rotation.y = Math.atan2(x, z);   // 敞开的一面（局部 -z）朝井口
  const W = 3.6, D = 2.8, Hf = 2.5, Hb = 1.95;

  // 角柱：同样是小束柱（三根并束、竹篾捆扎），呼应天车的营造逻辑
  [[-1, -1, Hf], [1, -1, Hf], [1, 1, Hb], [-1, 1, Hb]].forEach(([sx, sz, h]) => {
    s.add(bundleStrut(
      new THREE.Vector3(sx * W / 2, 0, sz * D / 2),
      new THREE.Vector3(sx * W / 2, h, sz * D / 2),
      { count: 3, rad: 0.055, spread: 0.055, color: WOOD_DARK, rough: 0.9, bindStep: 0.68, ironEvery: 0, splice: false }
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
  const p = new THREE.Vector3(step.position[0], 0, step.position[2]);
  const toPos = p.clone().add(new THREE.Vector3(0, 10, 24));
  const toTarget = p.clone().add(new THREE.Vector3(0, 6, 0));
  tween = { fromPos: camera.position.clone(), toPos, fromTarget: controls.target.clone(), toTarget, t: 0, dur: 1.1 };
  setActive(index);
}

// ============================================================
// UI 与 i18n
// ============================================================
function setActive(index) {
  currentActive = index;
  document.querySelectorAll('.nav-item').forEach((el, i) => el.classList.toggle('active', i === index));
  baseRings.forEach((r, i) => { r.material.emissiveIntensity = i === index ? 1.1 : 0.45; r.scale.setScalar(i === index ? 1.12 : 1.0); });
  if (index >= 0) showInfo(PROCESS[index]);
}
function showInfo(step) {
  const panel = document.getElementById('infopanel');
  const I = I18N[state.lang];
  panel.classList.add('show');
  document.getElementById('ip-index').textContent = `${I.ipIndex} ${step.index} / ${PROCESS.length}`;
  document.getElementById('ip-name').textContent = lf(step, 'name');
  document.getElementById('ip-sub').textContent = lf(step, 'subtitle');
  document.getElementById('ip-principle').textContent = lf(step, 'principle');
  document.getElementById('ip-equip').innerHTML = lf(step, 'equipment').map((e) => `<li>${e}</li>`).join('');
  document.getElementById('ip-reaction').innerHTML = step.reaction.map((r) => `<code>${r}</code>`).join('');
  document.getElementById('ip-params').innerHTML = lf(step, 'params').map((p) => `<span>${p}</span>`).join('');
  document.getElementById('ip-output').textContent = lf(step, 'output');
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
  document.querySelectorAll('#controls .ctrl').forEach((btn) => {
    const key = btn.getAttribute('data-ct-key');
    if (key === 'lang') return;
    const ct = btn.querySelector('.ct');
    if (key === 'tour') ct.textContent = autoTour ? I.touring : I.tour;
    else if (key === 'play') ct.textContent = playing ? I.play : I.playOff;
    else if (key === 'rotate') ct.textContent = controls.autoRotate ? I.rotate : I.rotateOff;
    else ct.textContent = I[key];
  });
}
function applyLang() {
  const I = I18N[state.lang];
  document.getElementById('side-title').textContent = I.sideTitle;
  document.getElementById('side-tip').textContent = I.sideTip;
  const legend = document.getElementById('legend');
  if (legend) legend.innerHTML = LEGEND.map((l) => `<span><i style="background:#${l.color.toString(16).padStart(6, '0')}"></i>${state.lang === 'en' ? l.en : l.zh}</span>`).join('');
  document.getElementById('intro-title').textContent = I.introTitle;
  document.getElementById('intro-desc').textContent = I.introDesc;
  document.getElementById('intro-sub').textContent = I.introSub;
  document.getElementById('intro-enter').textContent = I.introBtn;
  const langBtn = document.getElementById('btn-lang');
  if (langBtn) langBtn.querySelector('.ct').textContent = state.lang === 'zh' ? 'EN' : '中文';
  applyNavText();
  if (currentActive >= 0) showInfo(PROCESS[currentActive]);
}
function stopTour() {
  autoTour = false; tourTimer = 0;
  const b = document.getElementById('btn-tour');
  if (b) b.classList.remove('active');
  refreshControlsText();
}

function bindUI() {
  document.getElementById('intro-enter').onclick = () => document.getElementById('intro').classList.add('hidden');
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
      orientCylinder(w.liftRope, w.anchor, new THREE.Vector3(w.bucketX, yy + 0.66, w.bucketZ));
      const vel = (yy - w.prevY) / Math.max(dt, 1e-3);
      w.prevY = yy;
      const dW = -vel * 0.22 * dt; // 桶升→收绳：大车/地辊/天辊同向转
      if (g.userData.cartWheel) g.userData.cartWheel.rotation.z += dW;
      if (g.userData.groundRoller) g.userData.groundRoller.rotation.z += dW;
      if (g.userData.skyRoller) g.userData.skyRoller.rotation.z += dW;
    }
  });

  baseRings.forEach((r, i) => {
    const base = i === currentActive ? 1.1 : 0.45;
    r.material.emissiveIntensity = base + Math.sin(t * 2 + i) * 0.12;
  });


  if (autoTour) {
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

init();
