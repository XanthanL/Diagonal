// 西秦会馆 · 武圣宫大门 体素解构（中英双语）
// T3 脚手架：空场景 + 相机 + 灯光 + 地面 + UI 绑定 + selftest 钩子。
// 模型装配自 T5 起（buildAll → #model 组）；交互聚焦自 T14 起。
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
  bindUI();
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

// T5 起由 data.js 的 I18N 驱动；当前仅标题示范
function applyLang() {
  const el = document.getElementById('side-title');
  if (!el) return;
  el.textContent = state.lang === 'zh' ? '武圣宫大门 · 复合门楼' : 'Wusheng Palace Gate · Composite Gatehouse';
}

function hideLoader() {
  const l = document.getElementById('loader');
  if (!l) return;
  l.classList.add('hidden'); // CSS: #loader.hidden { opacity:0; pointer-events:none }
  l.addEventListener('transitionend', () => l.remove(), { once: true });
}

// ---------- selftest ----------
function runSelftest() {
  const d = document.getElementById('diag');
  const checks = [];
  checks.push(['renderer', renderer instanceof THREE.WebGLRenderer]);
  checks.push(['scene', scene instanceof THREE.Scene]);
  checks.push(['modelGroup', modelGroup.name === 'model']);
  checks.push(['controls', !!controls]);
  const ok = checks.every(([, v]) => v);
  const msg =
    (ok ? 'SELFTEST-OK' : 'SELFTEST-FAIL') +
    ' three=' + THREE.REVISION +
    ' errs=' + window.__errs.length +
    ' | ' + checks.map(([k, v]) => k + ':' + (v ? 1 : 0)).join(',');
  if (d) {
    d.removeAttribute('hidden');
    d.textContent = window.__errs.length ? 'ERR:' + window.__errs.join(' ; ') : msg;
  }
  console.info('[selftest]', msg);
}

init();
