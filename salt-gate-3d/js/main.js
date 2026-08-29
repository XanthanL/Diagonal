// 盐署门楼（架空）· 体素解构（中英双语）
// T3 脚手架：空场景 + 相机 + 灯光 + 地面 + UI 绑定 + selftest 钩子。
// T4 接入：selftest.js 8+1 项断言（palette/builder 闭环）。
// T5 接入：PARTS 装配（占位体素）+ 侧栏导览 + 信息面板 + 双语切换。
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { runSelftest, summarizeSelftest } from './selftest.js';
import { PARTS, I18N } from './data.js';
import { buildPartMesh } from './voxel/builder.js';
// 每个 Part 一个生成模块（03 §2 目录契约）；尺寸统一取自 spec.js = elevation-guide.png
import { PART_BUILDERS } from './parts/index.js';

// 自检钩子（?selftest）：捕获运行时错误，便于无头浏览器断言验收
const SELFTEST =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('selftest');
window.__errs = [];
function __recordErr(m) {
  window.__errs.push(m);
  const d = document.getElementById('diag');
  if (d) d.textContent = 'ERR:' + m;
}
window.addEventListener('error', (e) => __recordErr(String(e.message || (e.error && e.error.message) || e)));
window.addEventListener('unhandledrejection', (e) => __recordErr('promise:' + (e.reason && e.reason.message ? e.reason.message : e.reason)));

// ---------- 常量与状态 ----------
const BG = 0xfaFAF8; // diagonal 设计系统暖纸底
const DEFAULT_CAM = [36, 62, 235]; // P0 总览锚点（03-dev-plan §6）
const DEFAULT_TGT = [0, 48, 0];
const state = { lang: 'zh' };

let scene, camera, renderer, controls, clock;
const modelGroup = new THREE.Group();
modelGroup.name = 'model';
const partGroups = [];        // 与 PARTS 顺序对应（overview 无实体 → null 占位）
const VX = 0.2;               // 1 vx = 0.2 m（118 vx ≈ 23.6 m）

// ---------- 装配（T5 骨架 / 重构版接 parts/*） ----------
function assemble() {
  for (const p of PARTS) {
    let group = null;
    if (p.id !== 'overview') {
      const buildFn = PART_BUILDERS[p.id];
      if (!buildFn) throw new Error('no builder for part: ' + p.id);
      const world = buildFn();
      if (!world || world.count() === 0) throw new Error('empty world: ' + p.id);
      const geo = buildPartMesh(world, { voxelSize: VX });
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
      group = new THREE.Group();
      group.name = 'part-' + p.id;
      group.add(mesh);
      // 体素 x∈[0,160]、中轴 80 → 平移使中轴落在世界 x=0
      group.position.set(-80 * VX, 0, -22 * VX);
      modelGroup.add(group);
    }
    partGroups.push(group);
  }
}

// ---------- 导览 ----------
function focusOn(part) {
  camera.position.set(...part.cam);
  controls.target.set(...part.target);
  document.querySelectorAll('.nav-item').forEach((el) =>
    el.classList.toggle('active', el.dataset.part === part.id)
  );
  showInfo(part);
}

function showInfo(part) {
  const zh = state.lang === 'zh';
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('ip-index', (zh ? I18N.ipIndexLabel.zh : I18N.ipIndexLabel.en) + ' ' + String(part.index).padStart(2, '0'));
  set('ip-name', zh ? part.name : part.nameEn);
  set('ip-sub', zh ? part.subtitle : part.subtitleEn);
  set('ip-principle', zh ? part.principle : part.principleEn);
  set('ip-reaction-title', zh ? I18N.reactionTitle.zh : I18N.reactionTitle.en);
  set('ip-params-title', zh ? I18N.paramsTitle.zh : I18N.paramsTitle.en);
  set('ip-equip-title', zh ? I18N.equipTitle.zh : I18N.equipTitle.en);
  const rx = document.getElementById('ip-reaction');
  if (rx) {
    rx.innerHTML = '';
    for (const item of (zh ? part.reaction.zh : part.reaction.en)) {
      const li = document.createElement('li');
      li.textContent = item;
      rx.appendChild(li);
    }
  }
  const px = document.getElementById('ip-params');
  if (px) {
    px.innerHTML = '';
    for (const item of (zh ? part.params : part.paramsEn)) {
      const d = document.createElement('div');
      d.textContent = item;
      px.appendChild(d);
    }
  }
  const sw = document.getElementById('ip-color');
  if (sw) sw.style.background = '#' + part.color.toString(16).padStart(8, '0').slice(2);
  const panel = document.getElementById('infopanel');
  if (panel) panel.classList.add('show');
}

function buildNav() {
  const nav = document.getElementById('nav-list');
  if (!nav) return;
  for (const p of PARTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-item';
    btn.dataset.part = p.id;
    btn.innerHTML =
      '<span class="ni-index">' + String(p.index).padStart(2, '0') + '</span>' +
      '<span class="ni-name"></span>';
    btn.addEventListener('click', () => focusOn(p));
    nav.appendChild(btn);
  }
  refreshNavNames();
}

function refreshNavNames() {
  const zh = state.lang === 'zh';
  document.querySelectorAll('.nav-item').forEach((el) => {
    const p = PARTS.find((x) => x.id === el.dataset.part);
    if (!p) return;
    const nameEl = el.querySelector('.ni-name');
    if (nameEl) nameEl.textContent = zh ? p.name : p.nameEn;
  });
}

function buildLegend() {
  const lg = document.getElementById('legend');
  if (!lg) return;
  lg.innerHTML = '';
  for (const p of PARTS) {
    if (p.id === 'overview') continue;
    const s = document.createElement('span');
    s.dataset.part = p.id;
    s.innerHTML = '<i style="background:#' + p.color.toString(16).padStart(6, '0') + '"></i><em></em>';
    lg.appendChild(s);
  }
  refreshLegend();
}

function refreshLegend() {
  const zh = state.lang === 'zh';
  document.querySelectorAll('#legend span').forEach((el) => {
    const p = PARTS.find((x) => x.id === el.dataset.part);
    const em = el.querySelector('em');
    if (p && em) em.textContent = zh ? p.name : p.nameEn;
  });
}

// ---------- 初始化 ----------
function init() {
  const root = document.getElementById('scene-root');

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(BG);
  renderer.shadowMap.enabled = false; // T19 性能任务再评估是否开启
  root.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(...DEFAULT_CAM);

  // 灯光：暖纸环境 + 暖白主光（体素顶点色 + Lambert，无需更多）
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d2c4, 0.95);
  const dir = new THREE.DirectionalLight(0xfff4e0, 1.05);
  dir.position.set(120, 180, 140);
  scene.add(hemi, dir);

  // 地面：暖纸圆盘 + 极淡网格（呼应 salt-plant-3d 展台感）
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(600, 64),
    new THREE.MeshLambertMaterial({ color: 0xe4e0d7 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);
  const grid = new THREE.GridHelper(600, 60, 0x000000, 0x000000);
  grid.material.opacity = 0.06;
  grid.material.transparent = true;
  scene.add(grid);

  scene.add(modelGroup);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...DEFAULT_TGT);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.minDistance = 20;
  controls.maxDistance = 600;

  clock = new THREE.Clock();
  window.addEventListener('resize', onResize);
  assemble();
  buildNav();
  buildLegend();
  bindUI();
  applyLang();
  // 支持 ?focus=<id> 深链直跳某 Part（主站直链 / 逐 Part 截图验收用）
  const focusId = new URLSearchParams(location.search).get('focus');
  if (focusId) {
    const p = PARTS.find((x) => x.id === focusId);
    if (p) focusOn(p);
  }
  renderer.setAnimationLoop(tick);
  hideLoader();
  if (SELFTEST) runSelftest();
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function tick() {
  controls.update();
  renderer.render(scene, camera);
}

// ---------- UI ----------
function bindUI() {
  const btnOverview = document.getElementById('btn-overview');
  const btnPlay = document.getElementById('btn-play');
  const btnTour = document.getElementById('btn-tour');
  const btnLang = document.getElementById('btn-lang');

  if (btnOverview)
    btnOverview.addEventListener('click', () => {
      camera.position.set(...DEFAULT_CAM);
      controls.target.set(...DEFAULT_TGT);
    });
  // T14/T15 接管：动画与自动导览（当前为占位）
  if (btnPlay) btnPlay.addEventListener('click', () => {});
  if (btnTour) btnTour.addEventListener('click', () => {});
  if (btnLang)
    btnLang.addEventListener('click', () => {
      state.lang = state.lang === 'zh' ? 'en' : 'zh';
      btnLang.dataset.lang = state.lang;
      const ct = btnLang.querySelector('.ct');
      if (ct) ct.textContent = state.lang === 'zh' ? 'EN' : '中';
      applyLang();
    });
}

// T5 起由 data.js 的 I18N 驱动
function applyLang() {
  const zh = state.lang === 'zh';
  const el = document.getElementById('side-title');
  if (el) el.textContent = zh ? I18N.sideTitle.zh : I18N.sideTitle.en;
  refreshNavNames();
  refreshLegend();
}

function hideLoader() {
  const l = document.getElementById('loader');
  if (!l) return;
  l.classList.add('hidden'); // CSS: #loader.hidden { opacity:0; pointer-events:none }
  l.addEventListener('transitionend', () => l.remove(), { once: true });
}

// ---------- selftest ----------
function runDiag() {
  const d = document.getElementById('diag');
  const checks = [];
  checks.push(['renderer', renderer instanceof THREE.WebGLRenderer]);
  checks.push(['scene', scene instanceof THREE.Scene]);
  checks.push(['modelGroup', modelGroup.name === 'model']);
  checks.push(['controls', !!controls]);
  const built = partGroups.filter(Boolean).length;
  checks.push(['parts:1', built === PARTS.length - 1]);   // overview 无实体，其余 8 个必须全部装配
  const ok = checks.every(([, v]) => v);
  const msg =
    (ok ? 'SELFTEST-OK' : 'SELFTEST-FAIL') +
    ' three=' + THREE.REVISION +
    ' errs=' + window.__errs.length +
    ' parts:' + built +
    ' | ' + checks.map(([k, v]) => k + ':' + (v ? 1 : 0)).join(',');
  if (d) {
    d.removeAttribute('hidden');
    d.textContent = window.__errs.length ? 'ERR:' + window.__errs.join(' ; ') : msg;
  }
  console.info('[selftest:diag]', msg);
}

function runSelftestSuite() {
  const d = document.getElementById('diag');
  let results;
  try {
    results = runSelftest();
  } catch (e) {
    if (d) { d.removeAttribute('hidden'); d.textContent = 'ERR:selftest threw ' + (e && e.message || e); }
    console.error('[selftest:suite] threw', e);
    return;
  }
  const { passed, total, failed, allPass } = summarizeSelftest(results);
  const built = partGroups.filter(Boolean).length;
  const partsOk = built === PARTS.length - 1;
  const summary =
    (allPass && partsOk && window.__errs.length === 0 ? 'SELFTEST-OK' : 'SELFTEST-FAIL') +
    ' three=' + THREE.REVISION +
    ' errs=' + window.__errs.length +
    ' selftests=' + passed + '/' + total +
    ' parts:' + built +
    (failed.length ? ' failed=' + failed.length : '') +
    // 失败明细直接进 #diag：无头验收时无需再抓 console
    (failed.length
      ? ' | ' + results.filter((x) => !x.pass).map((x) => x.name + ' → ' + x.detail).join(' ;; ')
      : '') +
    ' | ' + results.map(x => {
      const short = x.name.split('：')[0].replace(/^#\d+\s*/, '');
      return short + ':' + (x.pass ? 1 : 0);
    }).join(',');
  if (d) {
    d.removeAttribute('hidden');
    d.textContent = window.__errs.length
      ? 'ERR:' + window.__errs.join(' ; ')
      : summary;
  }
  console.info('[selftest:suite]', summary);
  // 详细条目（带 detail）打到 console，方便无头验证
  for (const x of results) {
    const tag = x.pass ? '✓' : '✗';
    console.info('  ' + tag + ' ' + x.name + (x.detail ? '  ' + x.detail : ''));
  }
}

if (SELFTEST) {
  init();
  runSelftestSuite();
} else {
  init();
}
