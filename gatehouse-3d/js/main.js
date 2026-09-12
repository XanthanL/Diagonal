// 魔幻门楼 · The Gatehouse —— 查看器外壳(中英双语)
// 场景 = buildEnvironment + buildGatehouse + buildPortal + 粒子;尺寸 js/spec.js。
// 本文件只管:渲染器/相机/灯光/聚焦 tween/自动导览/信息面板/双语/载入揭幕/?selftest 钩子。
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { runSelftest, summarizeSelftest } from './selftest.js';
import { PARTS, I18N } from './data.js';
import { WORLD, PORTAL, TERRACE } from './spec.js';
import { buildEnvironment } from './build/environment.js';
import { buildGatehouse, buildPortal } from './build/gatehouse.js';
import { buildFireflies, buildPortalStream } from './build/particles.js';

// 自检钩子(?selftest):捕获运行时错误,便于无头浏览器断言验收
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

// ---------- 状态 ----------
const DEFAULT_PART = PARTS[0];
const state = {
  lang: 'zh',
  playing: true,     // 动画总开关
  tour: false,       // 自动导览
  animTime: 0,       // 仅在 playing 时推进的动画时钟
  focusAnim: null,   // 相机 tween
  tourNext: 0,
};

let scene, camera, renderer, controls;
const tickers = [];   // (t, dt) => void 的动画单元

// ---------- 相机 tween ----------
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
function flyTo(part, dur = 1.5) {
  state.focusAnim = {
    t0: performance.now() / 1000,
    dur,
    fromP: camera.position.clone(),
    toP: new THREE.Vector3(...part.cam),
    fromT: controls.target.clone(),
    toT: new THREE.Vector3(...part.target),
  };
  markActive(part.id);
  showInfo(part);
}
function tickFocus(now) {
  const a = state.focusAnim;
  if (!a) return;
  const u = Math.min(1, (now - a.t0) / a.dur);
  const k = easeInOut(u);
  camera.position.lerpVectors(a.fromP, a.toP, k);
  controls.target.lerpVectors(a.fromT, a.toT, k);
  if (u >= 1) state.focusAnim = null;
}

// ---------- 导览 ----------
function focusOn(part, { fly = true } = {}) {
  if (fly) flyTo(part);
  else {
    camera.position.set(...part.cam);
    controls.target.set(...part.target);
    markActive(part.id);
    showInfo(part);
  }
}
function markActive(id) {
  document.querySelectorAll('.nav-item').forEach((el) =>
    el.classList.toggle('active', el.dataset.part === id)
  );
}
function showInfo(part) {
  const zh = state.lang === 'zh';
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('ip-index', (zh ? I18N.ipIndexLabel.zh : I18N.ipIndexLabel.en) + ' ' + String(part.index).padStart(2, '0'));
  set('ip-name', zh ? part.name : part.nameEn);
  set('ip-sub', zh ? part.subtitle : part.subtitleEn);
  set('ip-principle', zh ? part.principle : part.principleEn);
  set('ip-title', zh ? I18N.principleTitle.zh : I18N.principleTitle.en);
  set('ip-reaction-title', zh ? I18N.reactionTitle.zh : I18N.reactionTitle.en);
  set('ip-params-title', zh ? I18N.paramsTitle.zh : I18N.paramsTitle.en);
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
    btn.addEventListener('click', () => {
      stopTour();
      focusOn(p);
    });
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

// ---------- 拾取:点击 3D 构件 → 聚焦对应 Part ----------
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let downXY = null;
function bindPick() {
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => { downXY = [e.clientX, e.clientY]; });
  el.addEventListener('pointerup', (e) => {
    if (!downXY) return;
    const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]);
    downXY = null;
    if (moved > 6) return; // 拖拽不算点击
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(scene.children, true);
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData.partId) o = o.parent;
      if (o && o.userData.partId) {
        const p = PARTS.find((x) => x.id === o.userData.partId);
        if (p) { stopTour(); focusOn(p); }
        return;
      }
    }
  });
  el.addEventListener('pointermove', (e) => {
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(scene.children, true);
    let hover = false;
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData.partId) o = o.parent;
      if (o && o.userData.partId) { hover = true; break; }
    }
    el.style.cursor = hover ? 'pointer' : 'grab';
  });
}

// ---------- 自动导览 ----------
function startTour() {
  state.tour = true;
  state.tourNext = performance.now() / 1000 + 0.6;
  document.getElementById('btn-tour')?.classList.add('active');
}
function stopTour() {
  if (!state.tour) return;
  state.tour = false;
  document.getElementById('btn-tour')?.classList.remove('active');
}
function tickTour(now) {
  if (!state.tour || now < state.tourNext) return;
  const cur = PARTS.findIndex((p) => document.querySelector('.nav-item.active')?.dataset.part === p.id);
  const next = PARTS[(cur + 1 + PARTS.length) % PARTS.length];
  focusOn(next, { fly: cur >= 0 });
  state.tourNext = now + 7;
}

// ---------- 初始化 ----------
function init() {
  const root = document.getElementById('scene-root');

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  root.appendChild(renderer.domElement);
  renderer.domElement.style.cursor = 'grab';

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(WORLD.fog.color, WORLD.fog.near, WORLD.fog.far);
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(...DEFAULT_PART.cam);

  // 灯光:半球环境 + 暖阳(投影) + 门内一点玉色点光
  const hemi = new THREE.HemisphereLight(WORLD.hemi.sky, WORLD.hemi.ground, WORLD.hemi.intensity);
  const sun = new THREE.DirectionalLight(WORLD.sun.color, WORLD.sun.intensity * 1.15);
  sun.position.set(...WORLD.sun.pos);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -52; sun.shadow.camera.right = 52;
  sun.shadow.camera.top = 56; sun.shadow.camera.bottom = -40;
  sun.shadow.camera.near = 8; sun.shadow.camera.far = 200;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(hemi, sun, sun.target);

  // 场景装配
  const env = buildEnvironment();
  scene.add(env);
  const gate = buildGatehouse(env.userData.terrainHeight);
  scene.add(gate);
  const portal = buildPortal();
  scene.add(portal);
  const portalCtr = TERRACE.L1.h + TERRACE.L2.h + TERRACE.L3.h + (PORTAL.straight + PORTAL.halfW) * 0.5;
  const portalLight = new THREE.PointLight(0x7fe0c8, 90, 26, 2);
  portalLight.position.set(0, portalCtr, 1.8);
  portalLight.userData.partId = 'portal';
  scene.add(portalLight);
  const fireflies = buildFireflies();
  scene.add(fireflies);
  const stream = buildPortalStream();
  scene.add(stream);

  tickers.push((t) => {
    env.traverse((o) => { if (o.userData.tick) o.userData.tick(t); });
    portal.userData.disc.material.uniforms.time.value = t;
    fireflies.userData.tick(t);
    stream.userData.tick(t);
  });

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...DEFAULT_PART.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 8;
  controls.maxDistance = 220;
  controls.target.set(...DEFAULT_PART.target);

  window.addEventListener('resize', onResize);
  buildNav();
  buildLegend();
  bindUI();
  bindPick();
  applyLang();
  markActive(DEFAULT_PART.id);
  showInfo(DEFAULT_PART);

  const focusId = new URLSearchParams(location.search).get('focus');
  if (focusId) {
    const p = PARTS.find((x) => x.id === focusId);
    if (p) focusOn(p, { fly: false });
  }
  window.__gh = { scene, camera, controls, renderer, parts: PARTS };
  renderer.setAnimationLoop(tick);
  hideLoader();
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function tick() {
  const now = performance.now() / 1000;
  if (state.playing) state.animTime += 1 / 60;
  const t = state.playing ? state.animTime : state.animTime; // 暂停时冻结 animTime,t 不再前进
  for (const fn of tickers) fn(t);
  tickFocus(now);
  tickTour(now);
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
    btnOverview.addEventListener('click', () => { stopTour(); focusOn(DEFAULT_PART); });
  if (btnPlay)
    btnPlay.addEventListener('click', () => {
      state.playing = !state.playing;
      btnPlay.classList.toggle('active', !state.playing);
    });
  if (btnTour)
    btnTour.addEventListener('click', () => {
      if (state.tour) stopTour();
      else startTour();
    });
  if (btnLang)
    btnLang.addEventListener('click', () => {
      state.lang = state.lang === 'zh' ? 'en' : 'zh';
      btnLang.dataset.lang = state.lang;
      const ct = btnLang.querySelector('.ct');
      if (ct) ct.textContent = state.lang === 'zh' ? 'EN' : '中';
      applyLang();
    });
  // 详情面板折叠头(沿用外壳交互)
  const head = document.querySelector('.ip-head');
  const panel = document.getElementById('infopanel');
  if (head && panel) {
    const toggle = () => {
      const ex = panel.classList.toggle('expanded');
      head.setAttribute('aria-expanded', String(ex));
      const t = panel.querySelector('.ip-toggle');
      if (t) t.setAttribute('aria-expanded', String(ex));
    };
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  }
}

function applyLang() {
  const zh = state.lang === 'zh';
  const el = document.getElementById('side-title');
  if (el) el.textContent = zh ? I18N.sideTitle.zh : I18N.sideTitle.en;
  refreshNavNames();
  refreshLegend();
  const cur = PARTS.find((p) => document.querySelector('.nav-item.active')?.dataset.part === p.id);
  if (cur) showInfo(cur);
}

function hideLoader() {
  const l = document.getElementById('loader');
  if (!l || l.classList.contains('revealed')) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const wait = Math.max(0, 1000 - performance.now());
    setTimeout(() => {
      l.classList.add('revealed');
      const done = () => l.remove();
      l.addEventListener('transitionend', done, { once: true });
      setTimeout(done, 900);
    }, wait);
  }));
}

// ---------- selftest ----------
function runSelftestSuite() {
  const d = document.getElementById('diag');
  let results;
  try {
    results = runSelftest({ scene, camera, renderer, tickers });
  } catch (e) {
    if (d) { d.removeAttribute('hidden'); d.textContent = 'ERR:selftest threw ' + (e && e.message || e); }
    console.error('[selftest:suite] threw', e);
    return;
  }
  const { passed, total, failed, allPass } = summarizeSelftest(results);
  const summary =
    (allPass && window.__errs.length === 0 ? 'SELFTEST-OK' : 'SELFTEST-FAIL') +
    ' three=' + THREE.REVISION +
    ' errs=' + window.__errs.length +
    ' selftests=' + passed + '/' + total +
    (failed.length ? ' | ' + failed.map((x) => x.name + ' → ' + x.detail).join(' ;; ') : '');
  if (d) {
    d.removeAttribute('hidden');
    d.textContent = window.__errs.length
      ? 'ERR:' + window.__errs.join(' ; ')
      : summary;
  }
  console.info('[selftest:suite]', summary);
  for (const x of results) {
    console.info('  ' + (x.pass ? '✓' : '✗') + ' ' + x.name + (x.detail ? '  ' + x.detail : ''));
  }
}

if (SELFTEST) {
  init();
  // 等 2 帧让 render info 生效
  requestAnimationFrame(() => requestAnimationFrame(runSelftestSuite));
} else {
  init();
}
