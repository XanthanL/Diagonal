// 自贡井盐 · 真空制盐 3D 工艺流程可视化（精细版 + 中英双语）
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { PROCESS, FLOW_LINKS, LEGEND, I18N } from './data.js';

// ---------- 常量与状态 ----------
const BG = 0xFAFAF8;
const GROUND_Y = 0;
const state = { lang: 'zh' };

// diagonal 设计系统配色（暖纸 + 墨 + 品牌红 + 暖灰金属设备）
const ALLOY = 0xB9B2A6;        // 设备主色（暖灰金属）
const ALLOY_DARK = 0x8A8478;   // 设备暗部
const ALLOY_LIGHT = 0xC9C4BA;  // 设备亮部
const BRAND_RED = 0xB33A2A;    // diagonal 品牌红

let scene, camera, renderer, labelRenderer, controls, clock;
let stationGroups = [];
let flowSystems = [];
let steamEmitters = [];
let crystalEmitters = [];
let crystalInst, crystalState = [], crystalDummy;
let baseRings = [];
let tween = null;
let playing = true;
let autoTour = false;
let tourTimer = 0;
let tourIndex = 0;
let showLabels = true;
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
function makeSaltTexture() {
  const s = 256, c = cv(s), x = c.getContext('2d');
  x.fillStyle = '#F4F1EA'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 900; i++) {
    x.fillStyle = `rgba(${190 + Math.random() * 50 | 0},${200 + Math.random() * 40 | 0},${220 + Math.random() * 30 | 0},${0.4 + Math.random() * 0.5})`;
    x.beginPath(); x.arc(Math.random() * s, Math.random() * s, Math.random() * 2.2, 0, Math.PI * 2); x.fill();
  }
  // 晶体棱角暗示
  x.strokeStyle = 'rgba(150,145,135,0.35)'; x.lineWidth = 1;
  for (let i = 0; i < 60; i++) {
    const px = Math.random() * s, py = Math.random() * s, r = 3 + Math.random() * 4;
    x.beginPath(); x.moveTo(px - r, py); x.lineTo(px, py - r); x.lineTo(px + r, py); x.lineTo(px, py + r); x.closePath(); x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeBrineTexture() {
  const s = 256, c = cv(s), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, '#7FC4DE'); g.addColorStop(1, '#2E6E8E');
  x.fillStyle = g; x.fillRect(0, 0, s, s);
  x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 2;
  for (let i = 0; i <= s; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(s, i); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
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

// ============================================================
// 初始化
// ============================================================
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 75, 185);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 36, 58);

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
  controls.minDistance = 12;
  controls.maxDistance = 150;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.target.set(0, 3, 0);

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
  TEX.salt = makeSaltTexture();
  TEX.brine = makeBrineTexture();

  buildGround();
  buildStations();
  buildPipes();
  buildFlowParticles();
  buildCrystals();
  buildLabels();
  buildSteam();
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
    new THREE.PlaneGeometry(240, 130),
    new THREE.MeshStandardMaterial({ map: TEX.floor, color: 0xE4E0D7, roughness: 0.96, metalness: 0.0 })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = GROUND_Y - 0.02;
  plane.receiveShadow = true;
  scene.add(plane);

  const grid = new THREE.GridHelper(240, 60, 0xCFC9BE, 0xBDB6A8);
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

    switch (step.model) {
      case 'well': buildWell(g); break;
      case 'tank': buildTank(g); break;
      case 'evaporator': buildEvaporator(g); break;
      case 'centrifuge': buildCentrifuge(g); break;
      case 'dryer': buildDryer(g); break;
      case 'screen': buildScreen(g); break;
      case 'packer': buildPacker(g); break;
    }
    scene.add(g);
    stationGroups.push(g);
  });
}

// 采卤井
function buildWell(g) {
  const legMat = metalTex(ALLOY, 0.45, 0.8);
  const h = 11, half = 1.6;
  const corners = [[-half, -half], [half, -half], [half, half], [-half, half]];
  corners.forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, h, 0.35), legMat);
    leg.position.set(x, h / 2, z); leg.castShadow = true; g.add(leg);
  });
  for (let i = 1; i <= 3; i++) {
    const y = (h / 4) * i, s = half * (1 - i * 0.12);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(s * 2, 0.18, 0.18), legMat);
    bar.position.set(0, y, -s); g.add(bar);
    const bar2 = bar.clone(); bar2.position.z = s; g.add(bar2);
    const bar3 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, s * 2), legMat);
    bar3.position.set(-s, y, 0); g.add(bar3);
    const bar4 = bar3.clone(); bar4.position.x = s; g.add(bar4);
  }
  const crown = new THREE.Mesh(new THREE.BoxGeometry(half * 2 + 0.6, 0.5, half * 2 + 0.6), legMat);
  crown.position.y = h; g.add(crown);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.18, 10, 24), metalTex(ALLOY, 0.5, 0.6));
  wheel.position.set(0, h + 0.4, 0); wheel.castShadow = true; g.add(wheel);
  g.userData.spin.push({ mesh: wheel, axis: 'z', speed: 1.4 });

  const wellhead = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 2.2, 16), metalTex(ALLOY_DARK, 0.5, 0.7));
  wellhead.position.y = 1.3; wellhead.castShadow = true; g.add(wellhead);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), glowMat(0x2F6F8F));
  cap.position.y = 2.6; g.add(cap);
}

// 净化罐
function buildTank(g) {
  const bodyMat = new THREE.MeshStandardMaterial({ map: TEX.brine, color: 0xffffff, roughness: 0.35, metalness: 0.5 });
  const steel = metalTex(ALLOY, 0.4, 0.6);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 6, 36), bodyMat);
  body.position.y = 4.0; body.castShadow = true; g.add(body);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.2, 36), steel);
  cone.position.y = 1.9; cone.rotation.x = Math.PI; cone.castShadow = true; g.add(cone);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2), steel);
  dome.position.y = 7.0; g.add(dome);
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 4.2, 36), glowMat(0x4E9D8F));
  liq.material.opacity = 0.32; liq.material.transparent = true; liq.position.y = 4.4; g.add(liq);
  // 加药管
  const dose = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3, 12), steel);
  dose.position.set(2.4, 7.5, 0); g.add(dose);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 16), metalTex(ALLOY, 0.5, 0.6));
  motor.position.y = 8.6; g.add(motor);
  const shaft = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 6, 12), metalTex(ALLOY_LIGHT, 0.4, 0.8));
  rod.position.y = -3; shaft.add(rod);
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.4), metalTex(ALLOY_LIGHT, 0.4, 0.8));
    blade.position.y = -1.2 - i * 1.4; blade.rotation.y = i * 0.6; shaft.add(blade);
  }
  shaft.position.y = 7.4; shaft.castShadow = true; g.add(shaft);
  g.userData.spin.push({ mesh: shaft, axis: 'y', speed: 2.2 });
}

// 蒸发结晶：真实多效蒸发罐
function buildEvaporator(g) {
  const V = [
    { x: -3.4, h: 12.5, r: 2.6 },
    { x: 1.0, h: 10.0, r: 2.0 },
    { x: 4.6, h: 7.8, r: 1.55 },
  ];
  const geom = (v) => ({
    heatH: v.h * 0.30,
    sepBase: v.h * 0.18 + v.h * 0.30,
    sepTop: v.h * 0.18 + v.h * 0.30 + v.h * 0.42,
  });
  V.forEach((v) => {
    buildEffectVessel(g, v, BRAND_RED);
    const G = geom(v);
    steamEmitters.push({ pos: new THREE.Vector3(g.position.x + v.x, G.sepTop + v.h * 0.16, g.position.z), kind: 'steam', rate: 0.18, timer: Math.random() * 0.4 });
  });
  // 二次蒸汽串联管（上一效顶 → 下一效加热室）
  for (let i = 0; i < V.length - 1; i++) {
    const Gi = geom(V[i]), Gj = geom(V[i + 1]);
    const p1 = new THREE.Vector3(V[i].x, Gi.sepTop + V[i].h * 0.16, 0);
    const p2 = new THREE.Vector3(V[i + 1].x + V[i + 1].r + 0.6, V[i + 1].h * 0.18 + Gj.heatH * 0.5, 0);
    const mid = p1.clone().add(p2).multiplyScalar(0.5); mid.y += 2.5;
    const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
    const pipe = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.3, 12, false), metalTex(ALLOY, 0.4, 0.7));
    pipe.castShadow = true; g.add(pipe);
  }
}
// 单台蒸发罐：裙座 + 加热室 + 中央循环管 + 分离室 + 除沫器 + 视镜 + 锥底 + 二次蒸汽出口
function buildEffectVessel(parent, v, color) {
  const grp = new THREE.Group(); grp.position.x = v.x;
  const mat = metalTex(ALLOY), matDark = metalTex(ALLOY_DARK, 0.5, 0.7);
  const heatH = v.h * 0.30, sepBase = v.h * 0.18 + heatH, sepTop = sepBase + v.h * 0.42;
  // 裙座
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(v.r * 0.95, v.r * 1.08, v.h * 0.18, 28), matDark);
  skirt.position.y = v.h * 0.09; skirt.castShadow = true; grp.add(skirt);
  // 加热室
  const heat = new THREE.Mesh(new THREE.CylinderGeometry(v.r, v.r, heatH, 28), mat);
  heat.position.y = v.h * 0.18 + heatH / 2; heat.castShadow = true; grp.add(heat);
  [v.h * 0.18, v.h * 0.18 + heatH].forEach((yy) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(v.r, 0.12, 10, 28), matDark);
    ring.rotation.x = Math.PI / 2; ring.position.y = yy; grp.add(ring);
  });
  // 蒸汽进口喷嘴
  const steamIn = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5, 12), matDark);
  steamIn.rotation.z = Math.PI / 2; steamIn.position.set(v.r + 0.6, v.h * 0.18 + heatH * 0.5, 0); grp.add(steamIn);
  // 冷凝水出口
  const cond = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.0, 12), matDark);
  cond.rotation.z = Math.PI / 2; cond.position.set(-(v.r + 0.4), v.h * 0.18 + 0.4, 0); grp.add(cond);
  // 中央循环管（底部凸出）
  const down = new THREE.Mesh(new THREE.CylinderGeometry(v.r * 0.16, v.r * 0.16, heatH * 0.55, 16), metalTex(ALLOY_LIGHT, 0.4, 0.8));
  down.position.y = v.h * 0.18 - heatH * 0.22; grp.add(down);
  // 分离室
  const sep = new THREE.Mesh(new THREE.CylinderGeometry(v.r * 1.08, v.r, v.h * 0.42, 28), mat);
  sep.position.y = sepBase + (v.h * 0.42) / 2; sep.castShadow = true; grp.add(sep);
  // 视镜
  for (let i = 0; i < 3; i++) {
    const sg = new THREE.Mesh(new THREE.CircleGeometry(0.34, 16),
      new THREE.MeshStandardMaterial({ color: 0x0b1226, roughness: 0.15, metalness: 0.3, emissive: 0x1a2a55, emissiveIntensity: 0.4 }));
    const a = (i / 3) * Math.PI * 2;
    sg.position.set(Math.cos(a) * v.r * 1.04, sepBase + v.h * 0.42 * 0.6, Math.sin(a) * v.r * 1.04);
    sg.lookAt(sg.position.clone().add(new THREE.Vector3(Math.cos(a), 0, Math.sin(a))));
    grp.add(sg);
  }
  // 进料口
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.3, 12), matDark);
  feed.rotation.z = Math.PI / 2; feed.position.set(v.r * 1.12 + 0.3, sepBase + v.h * 0.42 * 0.85, 0); grp.add(feed);
  // 除沫器（顶部栅格）
  const dem = new THREE.Mesh(new THREE.CylinderGeometry(v.r * 0.92, v.r * 0.92, 0.55, 24, 1, true), metalTex(ALLOY_LIGHT, 0.5, 0.6));
  dem.position.y = sepTop - 0.4; grp.add(dem);
  // 二次蒸汽出口
  const vap = new THREE.Mesh(new THREE.CylinderGeometry(v.r * 0.34, v.r * 0.34, v.h * 0.14, 16), matDark);
  vap.position.y = sepTop + v.h * 0.07; grp.add(vap);
  // 锥底
  const cone = new THREE.Mesh(new THREE.ConeGeometry(v.r, v.h * 0.16, 28), mat);
  cone.position.y = v.h * 0.18 - v.h * 0.08; cone.rotation.x = Math.PI; grp.add(cone);
  // 液位发光
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(v.r * 1.0, v.r * 1.0, v.h * 0.42 * 0.5, 28), glowMat(color));
  liq.material.opacity = 0.3; liq.material.transparent = true; liq.position.y = sepBase + v.h * 0.42 * 0.35; grp.add(liq);
  parent.add(grp);
}

// 固液分离：卧式离心机
function buildCentrifuge(g) {
  const drum = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 5.5, 28), metalTex(0xC99A3F, 0.35, 0.7));
  shell.rotation.z = Math.PI / 2; shell.position.y = 3; shell.castShadow = true; drum.add(shell);
  const cap1 = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.2, 28), metalTex(0xC99A3F, 0.35, 0.7));
  cap1.rotation.z = -Math.PI / 2; cap1.position.set(2.75, 3, 0); drum.add(cap1);
  const cap2 = cap1.clone(); cap2.rotation.z = Math.PI / 2; cap2.position.x = -2.75; drum.add(cap2);
  for (let i = 0; i < 6; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 4.6), glowMat(0xD8A24A));
    stripe.rotation.x = (i / 6) * Math.PI * 2; stripe.position.y = 3; drum.add(stripe);
  }
  g.add(drum);
  g.userData.spin.push({ mesh: drum, axis: 'x', speed: 4.0 });
  [-2, 2].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3, 1.2), metalTex(ALLOY_DARK, 0.6, 0.5));
    leg.position.set(x, 1.5, 0); leg.castShadow = true; g.add(leg);
  });
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 2, 12), metalTex(ALLOY_LIGHT, 0.4, 0.8));
  feed.position.set(0, 5.4, 0); g.add(feed);
  // 出料溜槽
  const chute = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 1.0), metalTex(ALLOY, 0.5, 0.6));
  chute.position.set(0, 1.5, 2.2); chute.rotation.x = 0.3; g.add(chute);
}

// 干燥：流化床 + 热风
function buildDryer(g) {
  const box = new THREE.Mesh(new THREE.BoxGeometry(7, 2.4, 3.2), metalTex(0xC9915E, 0.4, 0.5));
  box.position.y = 2.6; box.castShadow = true; g.add(box);
  const grate = new THREE.Mesh(new THREE.BoxGeometry(7, 0.15, 3.2), glowMat(0xD98C5A));
  grate.position.y = 3.9; g.add(grate);
  [[-3, -1], [3, -1], [-3, 1], [3, 1]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), metalTex(ALLOY_DARK, 0.6, 0.5));
    leg.position.set(x, 0.7, z); leg.castShadow = true; g.add(leg);
  });
  const wind = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.8, 2.8), metalTex(0xC99A3F, 0.5, 0.5));
  wind.position.y = 1.2; g.add(wind);
  for (let i = 0; i < 5; i++) {
    steamEmitters.push({ pos: new THREE.Vector3(g.position.x - 3 + i * 1.5, 1.6, g.position.z), kind: 'hot', rate: 0.1, timer: Math.random() * 0.3 });
  }
  g.userData.vibrate = { mesh: box, amp: 0.06, freq: 9, baseY: 2.6 };
}

// 筛分：振动筛
function buildScreen(g) {
  const screen = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 3), metalTex(ALLOY, 0.4, 0.6));
  screen.add(frame);
  for (let i = 0; i < 8; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(6, 0.04, 0.05), glowMat(0x6FA8A0));
    line.position.set(0, 0.3, -1.4 + i * 0.4); screen.add(line);
  }
  screen.position.set(0, 4.5, 0); screen.rotation.z = 0.18; screen.castShadow = true; g.add(screen);
  g.userData.vibrate = { mesh: screen, amp: 0.12, freq: 14, baseY: 4.5, rock: 0.02 };
  const hopper = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2, 20), metalTex(ALLOY, 0.4, 0.6));
  hopper.position.y = 1.6; hopper.rotation.x = Math.PI; g.add(hopper);
  [-2.5, 2.5].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3, 0.4), metalTex(ALLOY_DARK, 0.6, 0.5));
    leg.position.set(x, 1.5, 0); leg.castShadow = true; g.add(leg);
  });
}

// 包装：输送带 + 包装头 + 盐袋（盐晶贴图）
function buildPacker(g) {
  const beltMat = metalTex(ALLOY_DARK, 0.6, 0.4);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 1.6), beltMat);
  belt.position.y = 2.2; belt.castShadow = true; g.add(belt);
  [-3.6, 3.6].forEach((x) => {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.8, 18), metalTex(ALLOY_LIGHT, 0.4, 0.7));
    r.rotation.x = Math.PI / 2; r.position.set(x, 2.2, 0); g.add(r);
  });
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 1.4), metalTex(BRAND_RED, 0.4, 0.6));
  head.position.set(0, 4.2, 0); head.castShadow = true; g.add(head);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1, 12), metalTex(ALLOY_LIGHT, 0.4, 0.8));
  nozzle.position.set(0, 2.9, 0); g.add(nozzle);
  const bags = new THREE.Group();
  const bagMat = new THREE.MeshStandardMaterial({ map: TEX.salt, color: 0xffffff, roughness: 0.85, metalness: 0.0 });
  for (let i = 0; i < 4; i++) {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 1.1), bagMat);
    bag.position.set(-3 + i * 2, 3.0, 0); bag.castShadow = true; bags.add(bag);
  }
  bags.userData.phase = 0; g.add(bags);
  g.userData.conveyor = { belt, bags, speed: 0.9 };
  [-3.5, 3.5].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.0, 1.2), metalTex(ALLOY_DARK, 0.6, 0.5));
    leg.position.set(x, 1.0, 0); leg.castShadow = true; g.add(leg);
  });
  // 盐堆（产品）
  const heap = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.4, 20), new THREE.MeshStandardMaterial({ map: TEX.salt, color: 0xffffff, roughness: 0.9 }));
  heap.position.set(4.8, 0.7, 0); g.add(heap);
}

// ============================================================
// 管道
// ============================================================
function buildPipes() {
  const map = {};
  PROCESS.forEach((s) => (map[s.id] = new THREE.Vector3(s.position[0], 0, s.position[2])));
  FLOW_LINKS.forEach((link) => {
    const p1 = map[link.from].clone().setY(1.4);
    const p2 = map[link.to].clone().setY(1.4);
    const mid = p1.clone().add(p2).multiplyScalar(0.5); mid.y += 6;
    const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
    const geo = new THREE.TubeGeometry(curve, 48, 0.45, 14, false);
    const mat = new THREE.MeshStandardMaterial({ color: link.color, emissive: link.color, emissiveIntensity: 0.25, roughness: 0.35, metalness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; scene.add(mesh);
    link._curve = curve;
  });
}

// ============================================================
// 物流粒子
// ============================================================
function buildFlowParticles() {
  FLOW_LINKS.forEach((link) => {
    const N = 14;
    const geo = new THREE.SphereGeometry(0.3, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: link.color });
    const inst = new THREE.InstancedMesh(geo, mat, N);
    inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(inst);
    const offsets = []; for (let i = 0; i < N; i++) offsets.push(i / N);
    flowSystems.push({ inst, curve: link._curve, offsets, N, speed: 0.06 });
  });
}

// ============================================================
// 盐晶颗粒（受重力下落 + 翻滚）
// ============================================================
function buildCrystals() {
  const N = 170;
  const geo = new THREE.OctahedronGeometry(0.17, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xC9C4BA, emissiveIntensity: 0.22, roughness: 0.15, metalness: 0.0 });
  crystalInst = new THREE.InstancedMesh(geo, mat, N);
  crystalInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  crystalInst.castShadow = true; scene.add(crystalInst);
  crystalDummy = new THREE.Object3D();
  for (let i = 0; i < N; i++) crystalState.push({ active: false, pos: new THREE.Vector3(0, -999, 0), vel: new THREE.Vector3(), rot: new THREE.Euler(), rotVel: new THREE.Vector3(), life: 0, maxLife: 2.6 });
  // 发射器：离心出料、干燥沸腾、包装灌装
  crystalEmitters.push({ pos: new THREE.Vector3(0, 5.4, 7), dir: new THREE.Vector3(0.15, -1, 0.1), speed: 2.2, spread: 0.7, rate: 0.05, timer: 0 });
  crystalEmitters.push({ pos: new THREE.Vector3(10, 2.8, -5), dir: new THREE.Vector3(0, 1, 0), speed: 2.6, spread: 0.9, rate: 0.045, timer: 0.2 });
  crystalEmitters.push({ pos: new THREE.Vector3(30, 3.4, -5), dir: new THREE.Vector3(0, -1, 0), speed: 1.6, spread: 0.5, rate: 0.07, timer: 0.4 });
}
function emitCrystal(em) {
  const c = crystalState.find((s) => !s.active);
  if (!c) return;
  c.active = true; c.life = 0; c.maxLife = 2.2 + Math.random() * 0.8;
  c.pos.copy(em.pos).add(new THREE.Vector3((Math.random() - 0.5) * em.spread, (Math.random() - 0.5) * em.spread, (Math.random() - 0.5) * em.spread));
  c.vel.copy(em.dir).multiplyScalar(em.speed).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 0.4, (Math.random() - 0.5) * 0.8));
  c.rot.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
  c.rotVel.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
}
function updateCrystals(dt) {
  crystalState.forEach((c, i) => {
    if (c.active) {
      c.vel.y -= 7.0 * dt;
      c.pos.addScaledVector(c.vel, dt);
      c.rot.x += c.rotVel.x * dt; c.rot.y += c.rotVel.y * dt; c.rot.z += c.rotVel.z * dt;
      c.life += dt;
      if (c.pos.y < 1.7 || c.life > c.maxLife) c.active = false;
      crystalDummy.position.copy(c.pos);
      crystalDummy.rotation.copy(c.rot);
      crystalDummy.scale.setScalar(c.active ? 1 : 0.0001);
    } else {
      crystalDummy.position.set(0, -999, 0); crystalDummy.scale.setScalar(0.0001);
    }
    crystalDummy.updateMatrix();
    crystalInst.setMatrixAt(i, crystalDummy.matrix);
  });
  crystalInst.instanceMatrix.needsUpdate = true;
}

// ============================================================
// 标签
// ============================================================
function buildLabels() {
  PROCESS.forEach((step) => {
    const el = document.createElement('div');
    el.className = 'station-label';
    const obj = new CSS2DObject(el);
    obj.position.set(step.position[0], 13, step.position[2]);
    scene.add(obj);
    step._labelEl = el;
  });
  applyLabelsText();
}
function applyLabelsText() {
  PROCESS.forEach((step) => {
    const el = step._labelEl;
    if (!el) return;
    const col = '#' + step.color.toString(16).padStart(6, '0');
    el.innerHTML = `<span class="badge" style="background:${col}">${step.index}</span>
      <span class="label-name">${lf(step, 'name')}</span>
      <span class="label-sub">${lf(step, 'subtitle')}</span>`;
    el.style.display = showLabels ? 'flex' : 'none';
  });
}

// ============================================================
// 蒸汽 / 热风
// ============================================================
let steamPool = [];
function buildSteam() {
  for (let i = 0; i < 160; i++) {
    const mat = new THREE.SpriteMaterial({ map: softTex, transparent: true, depthWrite: false, opacity: 0 });
    const sp = new THREE.Sprite(mat); sp.visible = false;
    sp.userData = { active: false, life: 0, maxLife: 1, vel: new THREE.Vector3(), kind: 'steam' };
    scene.add(sp); steamPool.push(sp);
  }
}
const softTex = makeSoftTexture();
function makeSoftTexture() {
  const s = 128, c = cv(s), x = c.getContext('2d');
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}
function emitSteam(em) {
  const sp = steamPool.find((s) => !s.userData.active);
  if (!sp) return;
  sp.userData.active = true; sp.userData.life = 0; sp.userData.kind = em.kind;
  if (em.kind === 'steam') {
    sp.userData.maxLife = 2.2 + Math.random() * 0.8;
    sp.position.copy(em.pos).add(new THREE.Vector3((Math.random() - 0.5) * 1.2, 0, (Math.random() - 0.5) * 1.2));
    sp.userData.vel.set((Math.random() - 0.5) * 0.6, 1.6 + Math.random() * 0.8, (Math.random() - 0.5) * 0.6);
    sp.material.color.set(0xdfe7f5); sp.material.blending = THREE.NormalBlending;
  } else {
    sp.userData.maxLife = 1.4 + Math.random() * 0.5;
    sp.position.copy(em.pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0, (Math.random() - 0.5) * 0.8));
    sp.userData.vel.set((Math.random() - 0.5) * 0.4, 2.4 + Math.random() * 1.0, (Math.random() - 0.5) * 0.4);
    sp.material.color.set(0xD98C5A); sp.material.blending = THREE.AdditiveBlending;
  }
  sp.scale.set(1.2, 1.2, 1.2); sp.visible = true;
}
function updateSteam(dt) {
  steamPool.forEach((sp) => {
    if (!sp.userData.active) return;
    sp.userData.life += dt; const k = sp.userData.life / sp.userData.maxLife;
    if (k >= 1) { sp.userData.active = false; sp.visible = false; return; }
    sp.position.addScaledVector(sp.userData.vel, dt);
    sp.userData.vel.y += dt * (sp.userData.kind === 'hot' ? 1.2 : 0.4);
    const sc = sp.userData.kind === 'hot' ? 1.2 + k * 1.6 : 1.2 + k * 3.0;
    sp.scale.set(sc, sc, sc);
    sp.material.opacity = (1 - k) * (sp.userData.kind === 'hot' ? 0.8 : 0.55);
  });
}

// ============================================================
// 视角聚焦
// ============================================================
function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function focusOn(index) {
  const step = PROCESS[index];
  const p = new THREE.Vector3(step.position[0], 0, step.position[2]);
  const toPos = p.clone().add(new THREE.Vector3(0, 9, 19));
  const toTarget = p.clone().add(new THREE.Vector3(0, 4, 0));
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
    else if (key === 'labels') ct.textContent = showLabels ? I.labels : I.labelsOff;
    else ct.textContent = I[key];
  });
}
function applyLang() {
  const I = I18N[state.lang];
  document.getElementById('tb-title').textContent = I.title;
  document.getElementById('tb-sub').textContent = I.sub;
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
  applyLabelsText();
  applyNavText();
  refreshControlsText();
  if (currentActive >= 0) showInfo(PROCESS[currentActive]);
}
function stopTour() {
  autoTour = false; tourTimer = 0;
  const b = document.getElementById('btn-tour');
  b.classList.remove('active'); refreshControlsText();
}

function bindUI() {
  document.getElementById('btn-reset').onclick = () => {
    tween = { fromPos: camera.position.clone(), toPos: new THREE.Vector3(0, 36, 58), fromTarget: controls.target.clone(), toTarget: new THREE.Vector3(0, 3, 0), t: 0, dur: 1.1 };
    setActive(-1);
  };
  document.getElementById('btn-play').onclick = () => { playing = !playing; refreshControlsText(); };
  document.getElementById('btn-rotate').onclick = () => { controls.autoRotate = !controls.autoRotate; controls.autoRotateSpeed = 0.6; refreshControlsText(); };
  document.getElementById('btn-labels').onclick = () => { showLabels = !showLabels; applyLabelsText(); refreshControlsText(); };
  document.getElementById('btn-lang').onclick = () => { state.lang = state.lang === 'zh' ? 'en' : 'zh'; applyLang(); };
  document.getElementById('btn-download').onclick = () => {
    const a = document.createElement('a');
    a.href = './salt-plant-3d.zip';
    a.download = 'salt-plant-3d.zip';
    document.body.appendChild(a); a.click(); a.remove();
  };
  document.getElementById('btn-tour').onclick = () => {
    autoTour = !autoTour; tourTimer = 0; tourIndex = 0;
    document.getElementById('btn-tour').classList.toggle('active', autoTour);
    refreshControlsText();
    if (autoTour) focusOn(0);
  };
  document.getElementById('btn-prev').onclick = () => { stopTour(); focusOn((currentActive + PROCESS.length - 1) % PROCESS.length); };
  document.getElementById('btn-next').onclick = () => { stopTour(); focusOn((currentActive + 1) % PROCESS.length); };
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
  });

  baseRings.forEach((r, i) => {
    const base = i === currentActive ? 1.1 : 0.45;
    r.material.emissiveIntensity = base + Math.sin(t * 2 + i) * 0.12;
  });

  if (playing) {
    flowSystems.forEach((f) => {
      f.offsets.forEach((off, i) => {
        const u = (off + t * f.speed) % 1;
        f.curve.getPointAt(u, tmpV);
        tmpM.makeTranslation(tmpV.x, tmpV.y, tmpV.z);
        f.inst.setMatrixAt(i, tmpM);
      });
      f.inst.instanceMatrix.needsUpdate = true;
    });
    steamEmitters.forEach((em) => { em.timer -= dt; if (em.timer <= 0) { emitSteam(em); em.timer = em.rate; } });
    crystalEmitters.forEach((em) => { em.timer -= dt; if (em.timer <= 0) { emitCrystal(em); em.timer = em.rate; } });
  }
  updateSteam(dt);
  updateCrystals(dt);

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
