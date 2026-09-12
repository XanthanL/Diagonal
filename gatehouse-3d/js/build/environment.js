// 环境层:渐变天穹 / 起伏地坪 / 三重雾山 / 碧水 shader / 灵雾 / 松 / 石拱桥 / 月
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
        // 蓝先到:pow<1 让 mid(已是天蓝)在较低仰角就主导,蔚蓝更早铺满画面
        vec3 col = mix(mid, top, pow(max(h, 0.0), 0.45));
        col = mix(bottom, col, smoothstep(-0.05, 0.075, h));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.name = 'sky';
  return sky;
}

// ---------- 地坪:场心平整、水湾下凹、四缘缓缓隆起 ----------
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function terrainHeight(x, z) {
  const r = Math.hypot(x, z);
  const lift = Math.max(0, (r - 42) / 58) ** 1.7 * 6.0;           // 远处隆起,把视线托向山
  const und = Math.sin(x * 0.055 + 1.7) * Math.cos(z * 0.047) * 0.30
            + Math.sin(x * 0.021 - z * 0.03) * 0.42;              // 近处细起伏(轻)
  const flat = smoothstep(18, 34, r);                             // 场心(含踏道与石径)压平
  let h = lift + und * flat;
  // 水湾洼地:椭圆距离场,内部压到 -1.1 m;岸肩微抬收边
  const { cx, cz, rx, rz } = ENV.water;
  const d = Math.hypot((x - cx) / (rx * 1.1), (z - cz) / (rz * 1.34));
  const bowl = 1 - smoothstep(0.88, 1.06, d);
  h = h * (1 - bowl) + -1.1 * bowl;
  h += Math.exp(-(((d - 1.12) / 0.075) ** 2)) * 0.26 * (1 - bowl);
  return h;
}
function buildTerrain(mat) {
  const size = ENV.terrain.r * 2, seg = 100;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  const col = new Float32Array(p.count * 3);
  const cDeep = new THREE.Color(C.mossDeep), cMid = new THREE.Color(C.moss), cHigh = new THREE.Color(C.mossHigh);
  const tmpC = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const y = terrainHeight(x, z);
    p.setY(i, y);
    // 明度分层:低处深苔、台前中绿、远处提浅接山;再叠一点点横向笔触
    tmpC.copy(cDeep).lerp(cMid, smoothstep(-1.1, 1.8, y));
    tmpC.lerp(cHigh, smoothstep(3.5, 9.0, y));
    const streak = 0.5 + 0.5 * Math.sin(x * 0.021 + z * 0.017);
    const k = 0.93 + streak * 0.10;
    col[i * 3] = tmpC.r * k; col[i * 3 + 1] = tmpC.g * k; col[i * 3 + 2] = tmpC.b * k;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  m.name = 'terrain';
  return m;
}

// ---------- 雾山:heightfield 长卷,一山一色,山外有山 ----------
function buildHill({ w = 320, depth = 30, h, seg = 80, color, amp }) {
  const geo = new THREE.PlaneGeometry(w, depth, seg, 4);
  geo.rotateY(Math.PI); // 面朝 +z(相机)
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const t = x / (w / 2);
    const end = Math.max(0.14, 1 - t * t);
    // 三重正弦叠一条连续山脊线(主峰群 + 次峰 + 细齿),端头渐收
    const y =
      0.50 + 0.50 * Math.sin(x * 0.026 + 1.1) +
      0.26 * Math.sin(x * 0.061 + 3.4) +
      0.08 * Math.sin(x * 0.133 + 0.7);
    const peak = Math.max(0, y * 0.76);
    p.setZ(i, (0.12 + peak * amp) * h * end);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: C[color] }));
  mesh.position.y = -0.6;
  return mesh;
}

// ---------- 碧水:一湾会呼吸的水(漩纹 + 近岸提亮 + 粼光) ----------
function buildWater() {
  const { cx, cz, rx, rz } = ENV.water;
  const geo = new THREE.CircleGeometry(1, 80);
  geo.rotateX(-Math.PI / 2);        // 先躺平到 XZ 面,再按椭圆拉伸
  geo.scale(rx, 1, rz);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      colA: { value: new THREE.Color(C.water) },
      colB: { value: new THREE.Color(C.waterDeep) },
      colHi: { value: new THREE.Color(0xe8fbf4) },
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
        // 水色:潭心深、外圈碧,近岸才提亮一圈玉色浅滩
        float rip = sin(r * 22.0 - time * 1.0) * 0.5 + 0.5;
        float rip2 = sin(r * 9.0 + time * 0.5 + vUv.y * 2.0) * 0.5 + 0.5;
        vec3 col = mix(colB, colA, smoothstep(0.10, 0.85, r));
        col += (rip * 0.035 + rip2 * 0.030) * (1.0 - r * 0.5);
        col = mix(col, colHi, smoothstep(0.90, 0.995, r));
        // 粼光:两列波同峰才亮 → 稀疏独立光点,不是成片白斑
        float s1 = sin(vUv.x * 26.0 + time * 0.8) * sin(vUv.y * 7.0 - time * 0.6);
        float s2 = sin(vUv.x * 34.0 - time * 1.1) * sin(vUv.y * 13.0 + time * 0.9);
        float g = max(s1, 0.0) * max(s2, 0.0);
        col += pow(g, 8.0) * 0.28 * (1.0 - r * 0.5);
        float a = smoothstep(1.0, 0.97, r);
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
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
      opacity: 0.05 + R() * 0.05, depthWrite: false,
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
      s.material.opacity = 0.06 + 0.04 * (0.5 + 0.5 * Math.sin(t * 0.12 + s.userData.phase * 2));
    }
  };
  return group;
}

// ---------- 松:一群三两棵,有主次;全部并桶 ----------
function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// 松树材质必须模块级共享:若在 pine() 内 new,每棵树各持一套材质,
// emit/flushBin 的按材质并桶就失效,30+ 棵树 = 30+ draw call。
const PINE_MATS = {
  trunk: new THREE.MeshStandardMaterial({ color: C.chestnut, roughness: 0.95 }),
  leaf: new THREE.MeshStandardMaterial({ color: C.pine, roughness: 0.95 }),
  leafD: new THREE.MeshStandardMaterial({ color: C.pineDeep, roughness: 0.95 }),
};
function pine(h) {
  const g = new THREE.Group();
  const trunkMat = PINE_MATS.trunk, leafMat = PINE_MATS.leaf, leafMatD = PINE_MATS.leafD;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.028, h * 0.05, h * 0.4, 6), trunkMat);
  trunk.position.y = h * 0.2;
  g.add(trunk);
  let y = h * 0.26;
  let r = h * 0.26;
  const mats = [leafMatD, leafMat, leafMat];
  for (let i = 0; i < 3; i++) {
    const ch = h * (0.34 - i * 0.055);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, ch, 8), mats[i]);
    cone.position.y = y + ch / 2;
    g.add(cone);
    y += ch * 0.6;
    r *= 0.72;
  }
  return g;
}
function buildTrees(terrainY) {
  const group = new THREE.Group();
  group.name = 'trees';
  const clusters = [
    { cx: -30, cz: 8, n: 3, base: 13 },
    { cx: 27, cz: 9, n: 2, base: 11 },
    { cx: -26, cz: -18, n: 2, base: 15 },
    { cx: 36, cz: -26, n: 1, base: 17 },
    { cx: 8, cz: -34, n: 2, base: 12 },
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

// ---------- 石拱桥:券洞 + 拱背 + 雁翅(跨水,唯一破对称处) ----------
function buildBridge() {
  const { cx, cz, w, span } = ENV.bridge;
  const group = new THREE.Group();
  group.name = 'bridge';
  const stone = new THREE.MeshStandardMaterial({ map: grainTexture('#a89f8a', 18), roughness: 0.92 });
  const stoneD = new THREE.MeshStandardMaterial({ map: grainTexture('#7f7663', 22), roughness: 0.95 });
  const tmp = new THREE.Group();
  const half = span / 2;
  const deckY = 3.0;                                     // 桥面脊高(拱桥要有驼峰,平了读作堤坝)
  const camber = (t) => Math.sin(Math.PI * t) * deckY;   // t:0..1 沿桥长
  const archR = 3.8, archBase = -1.0;                    // 券洞半径 / 起拱线(没入水面下)
  // ⚠ 约束:archBase + archR(2.8) < deckY + 0.42(券顶不得溢出桥体轮廓,同拱门 bug)
  // 两片券脸墙:外轮廓走拱背线,挖一个半圆券洞
  for (const sx of [-1, 1]) {
    const s = new THREE.Shape();
    const N = 18;
    s.moveTo(-half, -1.8);
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      s.lineTo(-half + span * t, camber(t) + 0.42);
    }
    s.lineTo(half, -1.8);
    s.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-archR, archBase);
    // ⚠ clockwise=true 才走"上半圆"(PI→PI/2→0);false 会走水下下半圆,券洞等于没挖(曾出的 bug)
    hole.absarc(0, archBase, archR, Math.PI, 0, true);
    hole.lineTo(archR, archBase);
    hole.closePath();
    s.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false, curveSegments: 24 });
    geo.rotateY(Math.PI / 2);                            // Shape 在 x-y 面 → 转到 z-y 面,挤出沿 x
    const m = new THREE.Mesh(geo, stone);
    m.position.set(sx * (w / 2), 0, 0);
    tmp.add(m);
  }
  // 桥面石板 + 两侧望柱
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const zz = -half + span * t;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.26, span / 14 + 0.1), stoneD);
    slab.position.set(0, camber(t) + 0.55, zz);
    tmp.add(slab);
    if (i % 2 === 0) {
      for (const sx of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.22), stoneD);
        post.position.set(sx * (w / 2 + 0.1), camber(t) + 0.9, zz);
        tmp.add(post);
      }
    }
  }
  for (const sx of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, span), stoneD);
    rail.position.set(sx * (w / 2 + 0.1), camber(0.5) + 1.02, 0);
    tmp.add(rail);
  }
  // 两端雁翅(桥台)
  for (const e of [-1, 1]) {
    const ab = new THREE.Mesh(new THREE.BoxGeometry(w + 1.8, 2.2, 3.2), stoneD);
    ab.position.set(0, -1.0, e * (half + 1.2));
    tmp.add(ab);
  }
  tmp.position.set(cx, 0, cz);
  emit(tmp);
  flushBin(group);
  return group;
}

// ---------- 日轮:晴空里藏远山之后的一枚暖白太阳 + 晕 ----------
function buildSun(tex) {
  const g = new THREE.Group();
  g.name = 'sun';
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(ENV.sun.r, 40),
    new THREE.MeshBasicMaterial({ color: 0xfffdf0, transparent: true, opacity: 1.0, fog: false })
  );
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, color: 0xffeeb8, transparent: true, opacity: 0.42, fog: false, depthWrite: false,
  }));
  halo.scale.setScalar(ENV.sun.r * 6);
  g.add(halo, disc);
  g.position.set(...ENV.sun.pos);
  return g;
}

// ---------- 装配 ----------
export function buildEnvironment() {
  const group = new THREE.Group();
  group.name = 'environment';
  const glowTex = glowTexture();

  group.add(buildSky());

  const gTex = grainTexture('#ffffff', 12);
  gTex.repeat.set(26, 26);
  const terrainMat = new THREE.MeshStandardMaterial({ map: gTex, vertexColors: true, roughness: 1.0 });
  group.add(buildTerrain(terrainMat));

  const hills = new THREE.Group();
  hills.name = 'hills';
  for (const h of ENV.hills) {
    const m = buildHill({ h: h.h, seg: h.seg, color: h.color, amp: h.amp });
    m.position.z = h.z;
    hills.add(m);
  }
  for (const s of ENV.sideHills) {
    const m = buildHill({ w: 240, depth: 30, h: s.h, seg: 60, color: s.color, amp: s.amp });
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
  group.add(buildSun(glowTex));

  group.userData.terrainHeight = terrainHeight;
  return group;
}
