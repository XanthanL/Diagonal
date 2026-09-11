// 环境层:渐变天穹 / 起伏地坪 / 三重雾山 / 碧水 shader / 灵雾 / 松 / 石桥 / 月
import * as THREE from 'three';
import { C, WORLD, ENV } from '../spec.js';
import { emit, flushBin, glowTexture, grainTexture } from './util.js';

// ---------- 天穹:玉青→纸暖 渐变球 ----------
function buildSky() {
  const geo = new THREE.SphereGeometry(420, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(WORLD.sky.top) },
      mid: { value: new THREE.Color(WORLD.sky.mid) },
      bottom: { value: new THREE.Color(WORLD.sky.bottom) },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;
      void main() {
        float h = clamp(vDir.y, -0.1, 1.0);
        vec3 col = mix(mid, top, pow(max(h, 0.0), 0.62));
        col = mix(bottom, col, smoothstep(-0.06, 0.10, h));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.name = 'sky';
  return sky;
}

// ---------- 地坪:中心平整、水湾下凹、四缘缓缓隆起 ----------
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function terrainHeight(x, z) {
  const r = Math.hypot(x, z);
  const lift = Math.max(0, (r - 36) / 59) ** 1.6 * 7.5;           // 远处隆起接山
  const und = Math.sin(x * 0.055 + 1.7) * Math.cos(z * 0.047) * 0.35
            + Math.sin(x * 0.021 - z * 0.03) * 0.5;               // 近处细起伏
  const flat = Math.exp(-((r / 26) ** 2));                        // 场心压平
  let h = lift + und * (1 - flat) * Math.min(1, r / 18);
  // 水湾洼地:椭圆距离场,内部压到 -1 m,岸肩微微隆起收边
  const { cx, cz, rx, rz } = ENV.water;
  const d = Math.hypot((x - cx) / (rx * 1.12), (z - cz) / (rz * 1.38));
  const bowl = 1 - smoothstep(0.85, 1.05, d);
  h = h * (1 - bowl) + -1.0 * bowl;
  h += Math.exp(-(((d - 1.1) / 0.07) ** 2)) * 0.22 * (1 - bowl);
  return h;
}
function buildTerrain(mat) {
  const size = ENV.terrain.r * 2, seg = 96;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    p.setY(i, terrainHeight(p.getX(i), p.getZ(i)));
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  m.name = 'terrain';
  return m;
}

// ---------- 雾山:heightfield 长卷,一山一色,山外有山 ----------
function buildHill({ w = 300, depth = 26, h, seg = 80, color, amp }) {
  const geo = new THREE.PlaneGeometry(w, depth, seg, 3);
  geo.rotateY(Math.PI); // 面朝 +z(相机)
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    // 多重正弦叠出山脊:主峰 + 次峰 + 抖动,端头压到 0.25 避免断面穿帮
    const t = x / (w / 2);
    const end = Math.max(0.12, 1 - t * t);
    const y =
      (Math.sin(x * 0.032 + 1.3) * 0.5 + 0.5) * 0.62 +
      (Math.sin(x * 0.071 + 4.1) * 0.5 + 0.5) * 0.28 +
      (Math.sin(x * 0.15 + 2.2) * 0.5 + 0.5) * 0.10;
    p.setZ(i, (0.18 + y * amp) * h * end);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: C[color] }));
  mesh.position.y = -0.4;
  return mesh;
}

// ---------- 碧水:一湾会呼吸的水(漩纹 + 近岸提亮 + 粼光) ----------
function buildWater() {
  const { cx, cz, rx, rz } = ENV.water;
  const geo = new THREE.CircleGeometry(1, 72);
  geo.scale(rx, 1, rz);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      colA: { value: new THREE.Color(C.water) },
      colB: { value: new THREE.Color(C.waterDeep) },
      colHi: { value: new THREE.Color(0xeaf6ee) },
    },
    transparent: true,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float time; uniform vec3 colA; uniform vec3 colB; uniform vec3 colHi;
      void main() {
        float r = length(vUv);
        if (r > 1.0) discard;
        // 涟漪:两组相向行走的同心纹
        float rip = sin(r * 26.0 - time * 1.1) * 0.5 + 0.5;
        float rip2 = sin(r * 13.0 + time * 0.6 + vUv.x * 3.0) * 0.5 + 0.5;
        vec3 col = mix(colA, colB, smoothstep(0.25, 1.0, r));
        col += (rip * 0.05 + rip2 * 0.04) * (1.0 - r * 0.55);
        // 近岸一圈玉色浅水
        col = mix(colHi, col, smoothstep(0.86, 0.985, r));
        // 粼光:高频碎片闪
        float gl = pow(max(0.0, sin(vUv.x * 47.0 + time * 0.9) * sin(vUv.y * 53.0 - time * 0.7)), 24.0);
        col += gl * 0.35 * (1.0 - r * 0.4);
        // 边缘软一点点,贴纸面
        float a = smoothstep(1.0, 0.97, r);
        gl_FragColor = vec4(col, a);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, 0.05, cz);
  mesh.name = 'water';
  return mesh;
}

// ---------- 灵雾:大 soft sprite,慢漂 ----------
function buildMist(tex) {
  const group = new THREE.Group();
  group.name = 'mist';
  const items = [];
  const R = Math.random;
  for (let i = 0; i < ENV.mist.count; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex, color: C.mist, transparent: true,
      opacity: 0.09 + R() * 0.07, depthWrite: false,
    });
    const s = new THREE.Sprite(mat);
    const sc = 26 + R() * 30;
    s.scale.set(sc, sc * (0.32 + R() * 0.18), 1);
    const side = i % 3 === 2 ? (R() - 0.5) * 90 : 0;
    s.position.set(side + (R() - 0.5) * 50, 3 + R() * 12, -14 - R() * 70);
    s.userData.phase = R() * Math.PI * 2;
    s.userData.speed = 0.4 + R() * 0.5;
    s.userData.baseX = s.position.x;
    group.add(s);
    items.push(s);
  }
  group.userData.tick = (t) => {
    for (const s of items) {
      s.position.x = s.userData.baseX + Math.sin(t * 0.05 * s.userData.speed + s.userData.phase) * 9;
      s.material.opacity = 0.10 + 0.05 * (0.5 + 0.5 * Math.sin(t * 0.12 + s.userData.phase * 2));
    }
  };
  return group;
}

// ---------- 松:一群三两棵,有主次;全部并桶 ----------
function pine(h) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: C.chestnut, roughness: 0.95 });
  const leafMat = new THREE.MeshStandardMaterial({ color: C.pine, roughness: 0.95 });
  const leafMatD = new THREE.MeshStandardMaterial({ color: C.pineDeep, roughness: 0.95 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.03, h * 0.05, h * 0.34, 6), trunkMat);
  trunk.position.y = h * 0.17;
  g.add(trunk);
  let y = h * 0.3;
  let r = h * 0.24;
  const mats = [leafMatD, leafMat, leafMat];
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h * (0.30 - i * 0.05), 7), mats[i]);
    cone.position.y = y + h * (0.30 - i * 0.05) / 2;
    g.add(cone);
    y += h * (0.30 - i * 0.05) * 0.62;
    r *= 0.72;
  }
  return g;
}
function buildTrees(terrainY) {
  const group = new THREE.Group();
  group.name = 'trees';
  // 三个群落,每个群落一大几小
  const clusters = [
    { cx: -24, cz: 12, n: 3, base: 7.5 },
    { cx: 26, cz: 6, n: 2, base: 6.0 },
    { cx: -20, cz: -16, n: 2, base: 8.5 },
    { cx: 34, cz: -22, n: 1, base: 9.5 },
  ];
  const R = mulberry(11);
  for (const c of clusters) {
    for (let i = 0; i < c.n; i++) {
      const h = c.base * (i === 0 ? 1 : 0.55 + R() * 0.3);
      const t = pine(h);
      t.position.set(c.cx + (R() - 0.5) * 6, terrainY(c.cx, c.cz) - 0.2, c.cz + (R() - 0.5) * 6);
      t.rotation.y = R() * Math.PI * 2;
      emit(t);
    }
  }
  flushBin(group);
  return group;
}

function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 石拱桥:逐列插值的缓拱 + 实砌桥身 ----------
function buildBridge() {
  const { cx, cz, w, span } = ENV.bridge;
  const group = new THREE.Group();
  group.name = 'bridge';
  const stone = new THREE.MeshStandardMaterial({ map: grainTexture('#cfcabd', 14), color: 0xffffff, roughness: 0.9 });
  const stoneD = new THREE.MeshStandardMaterial({ map: grainTexture('#b4ac9d', 16), color: 0xffffff, roughness: 0.92 });
  const R = mulberry(23);
  const n = 22;
  const tmp = new THREE.Group();
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = (u - 0.5) * span;
    const y = Math.sin(u * Math.PI) * 1.15;                 // 缓拱
    const dep = 2.6 + Math.sin(u * Math.PI) * 0.5;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(span / n + 0.12, 0.5, dep), stone);
    slab.position.set(x, y + 1.55, 0);
    tmp.add(slab);
    // 桥身两侧向水下收的墩
    if (i % 3 === 0) {
      const pk = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.6, dep * 0.9), stoneD);
      pk.position.set(x, y + 0.1, 0);
      tmp.add(pk);
    }
  }
  // 两侧低矮踏步边
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(span, 0.16, 0.3), stoneD);
    rail.position.set(0, 2.86, (s * w) / 2);
    tmp.add(rail);
  }
  tmp.position.set(cx, 0, cz);
  emit(tmp);
  flushBin(group);
  return group;
}

// ---------- 月:纸面上一枚淡金圆 + 晕 ----------
function buildMoon(tex) {
  const g = new THREE.Group();
  g.name = 'moon';
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(ENV.moon.r, 40),
    new THREE.MeshBasicMaterial({ color: 0xf7ecc8, transparent: true, opacity: 0.92, fog: false })
  );
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, color: 0xf3e6bd, transparent: true, opacity: 0.35, fog: false, depthWrite: false,
  }));
  halo.scale.setScalar(ENV.moon.r * 6);
  g.add(halo, disc);
  g.position.set(...ENV.moon.pos);
  return g;
}

// ---------- 装配 ----------
export function buildEnvironment() {
  const group = new THREE.Group();
  group.name = 'environment';
  const glowTex = glowTexture();
  const dotTex = glowTexture(); // 占位,粒子层自己再生成

  group.add(buildSky());

  const gTex = grainTexture('#ffffff', 10);
  const terrainMat = new THREE.MeshStandardMaterial({ map: gTex, color: C.moss, roughness: 1.0 });
  group.add(buildTerrain(terrainMat));

  const hills = new THREE.Group();
  hills.name = 'hills';
  for (const h of ENV.hills) {
    const m = buildHill({ h: h.h, seg: h.seg, color: h.color, amp: h.amp });
    m.position.z = h.z;
    hills.add(m);
  }
  for (const s of ENV.sideHills) {
    const m = buildHill({ w: 240, depth: 26, h: s.h, seg: 60, color: s.color, amp: s.amp });
    m.rotation.y = s.rot;
    m.position.x = s.x;
    m.position.z = -14;
    hills.add(m);
  }
  group.add(hills);

  group.add(buildWater());
  group.add(buildMist(glowTex));
  const ty = (x, z) => terrainHeight(x, z);
  group.add(buildTrees(ty));
  group.add(buildBridge());
  group.add(buildMoon(glowTex));

  group.userData.terrainHeight = terrainHeight;
  return group;
}
