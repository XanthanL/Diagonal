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
function makeWoodTexture() {
  const s = 512, c = cv(s), x = c.getContext('2d');
  // 陈年杉木底色（灰暖、低饱和）
  x.fillStyle = '#8c755a'; x.fillRect(0, 0, s, s);
  // 竖向木纹（带轻微波动，灰调）
  for (let i = 0; i < 240; i++) {
    const gx = Math.random() * s, w = 1 + Math.random() * 3;
    x.strokeStyle = (Math.random() > 0.5 ? 'rgba(50,42,32,' : 'rgba(175,160,135,') + (0.04 + Math.random() * 0.10) + ')';
    x.lineWidth = w;
    x.beginPath(); x.moveTo(gx, 0);
    for (let y = 0; y <= s; y += 16) x.lineTo(gx + Math.sin(y * 0.03 + gx) * 2, y);
    x.stroke();
  }
  // 木板接缝（横向）
  x.strokeStyle = 'rgba(50,32,16,0.5)'; x.lineWidth = 3;
  for (let i = 0; i <= s; i += 128) { x.beginPath(); x.moveTo(0, i); x.lineTo(s, i); x.stroke(); }
  // 木节
  for (let i = 0; i < 14; i++) {
    const kx = Math.random() * s, ky = Math.random() * s, r = 4 + Math.random() * 8;
    const rg = x.createRadialGradient(kx, ky, 0, kx, ky, r);
    rg.addColorStop(0, 'rgba(60,38,18,0.6)'); rg.addColorStop(1, 'rgba(60,38,18,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(kx, ky, r, 0, Math.PI * 2); x.fill();
  }
  // 风化噪点：深色霉斑 + 浅色泛白（陈年杉木经风日晒的银灰质感）
  for (let i = 0; i < 2200; i++) {
    x.fillStyle = `rgba(40,30,18,${Math.random() * 0.06})`;
    x.fillRect(Math.random() * s, Math.random() * s, 1, 1);
  }
  for (let i = 0; i < 1400; i++) {
    x.fillStyle = `rgba(205,196,178,${Math.random() * 0.05})`;
    x.fillRect(Math.random() * s, Math.random() * s, 1, 1);
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

  // 井口（石/木箍）
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 1.0, 16), woodDark);
  collar.position.set(0.4, 1.1, 0); collar.castShadow = true; g.add(collar);
  // 顿钻钻杆（入井）
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 10), woodTex(0x473A2B, 0.9));
  stem.position.set(0.4, -1.6, 0); g.add(stem);

  // 传统木卤桶（heritage 点缀）
  [[-3.0, 1.7], [2.7, 2.3], [-2.3, -2.5]].forEach(([bx, bz]) => {
    const barrel = new THREE.Group();
    const bodyB = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 1.3, 18), woodTex(0x7E6748, 0.9));
    bodyB.position.y = 0.65; bodyB.castShadow = true; barrel.add(bodyB);
    [0.25, 0.95].forEach((yy) => {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.05, 8, 20), metalTex(ALLOY_DARK, 0.6, 0.5));
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
  const bucketLid = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 18), metalTex(ALLOY_DARK, 0.6, 0.5));
  bucketLid.position.y = 0.58; bucket.add(bucketLid);
  const bucketTip = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.42, 18), woodTex(0x6E5A42, 0.95));
  bucketTip.position.y = -0.73; bucketTip.rotation.x = Math.PI; bucket.add(bucketTip);
  const bucketEar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 8, 18), metalTex(ALLOY_DARK, 0.6, 0.5));
  bucketEar.position.y = 0.66; bucket.add(bucketEar);
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
}

// 单座天车：四面收分木井架 + 交叉斜撑 + 顶部天车轮 + 底部大车（绞盘木轮）+ 麻绳
function buildDerrick(g, cx, cz, H, baseHalf, levels, woodMat, woodDarkMat, isMain) {
  const topHalf = baseHalf * 0.32;
  const frames = [];
  for (let i = 0; i <= levels; i++) {
    const t = i / levels;
    frames.push({ half: baseHalf * (1 - t) + topHalf * t, y: (H / levels) * i });
  }
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  // 立柱：连接相邻两层角点
  for (let i = 0; i < levels; i++) {
    const a = frames[i], b = frames[i + 1];
    corners.forEach(([sx, sz]) => {
      const p1 = new THREE.Vector3(cx + a.half * sx, a.y, cz + a.half * sz);
      const p2 = new THREE.Vector3(cx + b.half * sx, b.y, cz + b.half * sz);
      g.add(strut(p1, p2, 0.2, woodMat));
    });
  }
  // 水平箍梁 + 交叉斜撑
  for (let i = 0; i < levels; i++) {
    const a = frames[i], b = frames[i + 1];
    [['x', -1], ['x', 1], ['z', -1], ['z', 1]].forEach(([axis, sign]) => {
      if (axis === 'x') {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(a.half * 2 + 0.1, 0.14, 0.14), woodDarkMat);
        bar.position.set(cx, a.y, cz + a.half * sign); g.add(bar);
      } else {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, a.half * 2 + 0.1), woodDarkMat);
        bar.position.set(cx + a.half * sign, a.y, cz); g.add(bar);
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
      g.add(strut(p1, p2, 0.12, woodDarkMat));
      g.add(strut(p3, p4, 0.12, woodDarkMat));
    });
  }
  // 竹篾捆绑环：每层四角以竹篾环捆扎木构（自贡天车全靠竹篾，不用铁钉）
  const bindMat = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 0.95, metalness: 0.0 });
  frames.forEach((f, idx) => {
    if (idx === 0) return; // 跳过地面层，避免埋入木地台
    corners.forEach(([sx, sz]) => {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.06, 6, 18), bindMat);
      r.rotation.x = Math.PI / 2;
      r.position.set(cx + f.half * sx, f.y, cz + f.half * sz);
      g.add(r);
    });
  });
  // 踏阶（三角木楔）：四根立柱均设攀爬木楔踏脚（兼竹篾捆扎处的木楔）
  for (let i = 1; i < levels; i++) {
    const f = frames[i], yy = f.y;
    corners.forEach(([sx, sz]) => {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.26), woodDarkMat);
      st.position.set(cx + f.half * sx, yy, cz + f.half * sz * 1.08);
      st.rotation.x = -0.32;
      g.add(st);
    });
  }
  // 顶部天车轮（天辊，带槽定滑轮，缓慢自转）
  const topY = H + 0.3;
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.22, 12, 28), woodTex(WOOD_LIGHT, 0.8));
  wheel.position.set(cx, topY, cz); wheel.castShadow = true; g.add(wheel);
  for (let i = 0; i < 6; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 0.12), woodDarkMat);
    spoke.position.set(cx, topY, cz); spoke.rotation.z = (i / 6) * Math.PI * 2; g.add(spoke);
  }
  if (isMain) g.userData.skyRoller = wheel; else g.userData.spin.push({ mesh: wheel, axis: 'z', speed: 0.8 });
  const crown = new THREE.Mesh(new THREE.BoxGeometry(topHalf * 2 + 0.4, 0.5, topHalf * 2 + 0.4), woodMat);
  crown.position.set(cx, topY + 0.45, cz); g.add(crown);

  // 悬吊篾绳材质（风篾拉索复用）；天辊→汲卤筒的提卤主绳改由采卤站统一生成（见 buildWell）
  const ropeMat = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 1.0, metalness: 0.0 });

  // 风篾（放射状拉索 + 地桩）：自贡天车最标志性的防风结构，自井架上部向外伞状放射
  const windY = H * 0.78;
  const ringR = topHalf + 0.25;
  const windRing = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.09, 8, 20), woodDarkMat);
  windRing.rotation.x = Math.PI / 2; windRing.position.set(cx, windY, cz); g.add(windRing);
  const R = baseHalf * 2.6, N = 12;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const ax = cx + Math.cos(a) * ringR, az = cz + Math.sin(a) * ringR;
    const px = cx + Math.cos(a) * R, pz = cz + Math.sin(a) * R;
    g.add(strut(new THREE.Vector3(ax, windY, az), new THREE.Vector3(px, 0.7, pz), 0.06, ropeMat));
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 8), woodDarkMat);
    peg.position.set(px, 0.25, pz); peg.castShadow = true; g.add(peg);
  }
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
  // 底杠（支撑轮轴两端）
  [-1, 1].forEach((s) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.34, R + 0.5, 0.34), woodMat);
    post.position.set(0, (R + 0.5) / 2, s * 0.6); post.castShadow = true; cart.add(post);
  });
  // 竹篾捆绑：轴碗处 + 立柱顶（藤篾捆扎，不用铁钉，呼应天车工艺）
  const bindMat = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 0.95, metalness: 0.0 });
  [-1, 1].forEach((s) => {
    const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 6, 16), bindMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.set(0, R + 0.4, s * 0.6); cart.add(topRing);
    const axRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 6, 16), bindMat);
    axRing.position.set(0, R, s * 0.4); cart.add(axRing); // 轴端缠绕（默认朝向即绕 z 轴）
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
  g.userData.groundRoller = roller; // 由提卤绳联动驱动（见 animate）
}

// 碓架（踩架）：冲击式顿钻。门形木架 + 横梁花辊子 + 踩板杠杆 + 碓头重锤 + 钻杆
function buildDuijia(g, x, z) {
  const woodMat = woodTex(WOOD, 0.9);
  const woodDark = woodTex(WOOD_DARK, 0.9);
  const H = 4.2, base = 0.7;
  [[-1.2, 0], [1.2, 0]].forEach(([sx]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, H, 0.3), woodMat);
    post.position.set(x + sx, base + H / 2, z); post.castShadow = true; g.add(post);
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.3, 0.3), woodDark);
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
  const drill = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.0, 10), woodTex(0x473A2B, 0.9));
  drill.position.set(-1.3, -2.8, 0); pivot.add(drill);
  const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.5), woodTex(WOOD_LIGHT, 0.8));
  pedal.position.set(1.3, -0.1, 0); pivot.add(pedal);
  g.add(pivot);
  g.userData.duijiaPivot = pivot; // 由 animate 驱动（冲击节奏）
  // 竹篾捆绑：门形架穿斗节点 + 花辊轴端 + 碓头连接（藤篾捆扎，不用铁钉）
  const bindMat = new THREE.MeshStandardMaterial({ color: BAMBOO, roughness: 0.95, metalness: 0.0 });
  [-1, 1].forEach((s) => {
    const postRing = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.05, 6, 16), bindMat);
    postRing.rotation.x = Math.PI / 2;
    postRing.position.set(x + s * 1.2, base + H - 0.15, z); g.add(postRing);
    const hubRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.05, 6, 16), bindMat);
    hubRing.rotation.y = Math.PI / 2; // 绕 x 轴（花辊轴）缠绕
    hubRing.position.set(x + s * 1.1, pivotY, z); g.add(hubRing);
  });
  const headRing = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 6, 16), bindMat);
  headRing.rotation.x = Math.PI / 2;
  headRing.position.set(x - 1.3, pivotY - 0.3, z); g.add(headRing);
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
