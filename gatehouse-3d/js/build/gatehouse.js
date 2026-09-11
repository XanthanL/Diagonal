// 门楼本体:三层石台基 / 拱门白墩 / 柱枋格扇 / 参数化翘角屋顶 / 无字匾 / 灯笼 / 金顶
import * as THREE from 'three';
import { C, TERRACE, GATE, TIERS, CROWN, LANTERN, PORTAL } from '../spec.js';
import { emit, flushBin, glowTexture, grainTexture } from './util.js';

const R = mulberry(42);
function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 材质(整个门楼共用的有限几种) ----------
function makeMats() {
  const stone = new THREE.MeshStandardMaterial({ map: grainTexture('#cdc8ba', 16), roughness: 0.92 });
  const stoneDeep = new THREE.MeshStandardMaterial({ map: grainTexture('#a8a294', 20), roughness: 0.95 });
  const plaster = new THREE.MeshStandardMaterial({ map: grainTexture('#f5f0e3', 8), roughness: 0.9 });
  const tile = new THREE.MeshStandardMaterial({ color: C.tile, roughness: 0.82 });
  const tileDeep = new THREE.MeshStandardMaterial({ color: C.tileDeep, roughness: 0.85 });
  const ridgeM = new THREE.MeshStandardMaterial({ color: C.ridge, roughness: 0.7 });
  const gold = new THREE.MeshStandardMaterial({ color: C.gold, roughness: 0.35, metalness: 0.65 });
  const red = new THREE.MeshStandardMaterial({ color: C.red, roughness: 0.68 });
  const chestnut = new THREE.MeshStandardMaterial({ color: C.chestnut, roughness: 0.85 });
  const latticeD = new THREE.MeshStandardMaterial({ color: C.lattice, roughness: 0.95 });
  const warmGlow = new THREE.MeshStandardMaterial({
    color: C.windowLit, emissive: C.windowLit, emissiveIntensity: 0.9, roughness: 0.6,
  });
  const jadeGlow = new THREE.MeshStandardMaterial({
    color: C.portal, emissive: C.portal, emissiveIntensity: 1.6, roughness: 0.4,
  });
  return { stone, stoneDeep, plaster, tile, tileDeep, ridge: ridgeM, gold, red, chestnut, latticeD, warmGlow, jadeGlow };
}

// ---------- 参数化翘角屋顶(本作的灵魂) ----------
/**
 * 截断式庑殿 loft:
 *  · 周长参数 s 沿檐口矩形走一圈;E(s) = 檐口点,带翘角抬升 lift(s) 与外撇 flare(s)
 *  · u ∈[0,1] 檐→顶:plan 向顶部平座矩形收敛,y = h·u^profile(举折:檐缓脊陡)
 *  · 翘角贡献按 (1-u)^1.6 衰减 —— 檐角全翘,到顶收平,角脊自然外鼓成弧
 *  · 返回 { surface, fascia }:曲面片 + 檐口封边带(读出屋面厚度)
 */
function makeRoofGeo(tier, opts = {}) {
  const { ax, az, topRX, topRZ, h, cornerLift, cornerSigma, profile } = tier;
  const N = opts.segP ?? 160;
  const M = opts.segU ?? 14;
  const per = 2 * (ax + topRX) + 2 * (az + topRZ) * 0 + 2 * (ax - topRX) + 2 * (az - topRZ) + 0; // unused
  const PERIM = 4 * ax + 4 * az; // 以檐口矩形周长参数化

  // 檐口矩形周界点(从 (+ax,+az) 逆时针)与其外法线
  function eaveAt(s) {
    let x, z, nx, nz;
    if (s < 2 * ax) { x = ax - s; z = az; nx = 0; nz = 1; }
    else if (s < 2 * ax + 2 * az) { x = -ax; z = az - (s - 2 * ax); nx = -1; nz = 0; }
    else if (s < 4 * ax + 2 * az) { x = -ax + (s - 2 * ax - 2 * az); z = -az; nx = 0; nz = -1; }
    else { const t = s - 4 * ax - 2 * az; x = ax; z = -az + t; nx = 1; nz = 0; }
    return { x, z, nx, nz };
  }
  // 沿周长到最近檐角点的弧长距离
  function cornerDist(s) {
    const cs = [0, 2 * ax, 2 * ax + 2 * az, 4 * ax + 2 * az];
    let d = Infinity;
    for (const c of cs) {
      const dd = Math.abs(s - c);
      d = Math.min(d, dd, PERIM - dd);
    }
    return d;
  }
  const liftAt = (s) => cornerLift * Math.exp(-((cornerDist(s) / cornerSigma) ** 2));
  const flareAt = (s) => 0.9 * Math.exp(-((cornerDist(s) / (cornerSigma * 1.35)) ** 2));

  const pos = [];
  const idx = [];
  const fasciaPos = [];
  const fasciaIdx = [];
  for (let j = 0; j <= M; j++) {
    const u = j / M;
    for (let i = 0; i < N; i++) {
      const s = (i / N) * PERIM;
      const e = eaveAt(s);
      const lift = liftAt(s);
      const flare = flareAt(s) * Math.pow(1 - u, 2);
      // plan:向顶部平座矩形收敛(线性收敛 + 檐端缓的 u^1.18 微调)
      const ue = Math.pow(u, 1.18);
      const ex = e.x + e.nx * flare, ez = e.z + e.nz * flare;
      const tx = Math.max(-topRX, Math.min(topRX, ex));
      const tz = Math.max(-topRZ, Math.min(topRZ, ez));
      const x = ex + (tx - ex) * ue;
      const z = ez + (tz - ez) * ue;
      const y = tier.y + h * Math.pow(u, profile) + lift * Math.pow(1 - u, 1.6);
      pos.push(x, y, z);
      if (j === 0) {
        // 檐口封边带:同一圈往下拉 fasciaH
        const fH = 0.55 + lift * 0.22;
        fasciaPos.push(x, y, z, x, y - fH, z);
      }
    }
  }
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const a = j * N + i, b = j * N + ((i + 1) % N);
      const c = (j + 1) * N + ((i + 1) % N), d = (j + 1) * N + i;
      idx.push(a, b, d, b, c, d);
    }
  }
  for (let i = 0; i < N; i++) {
    const a0 = i * 2, b0 = ((i + 1) % N) * 2;
    fasciaIdx.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
  }
  const mk = (p, ix) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setIndex(ix);
    g.computeVertexNormals();
    return g;
  };
  return { surface: mk(pos, idx), fascia: mk(fasciaPos, fasciaIdx) };
}

function buildRoofs(group, mats) {
  const roofs = new THREE.Group();
  roofs.name = 'roofs';
  for (const tier of TIERS) {
    const { surface, fascia } = makeRoofGeo(tier);
    const s = new THREE.Mesh(surface, mats.tile);
    const f = new THREE.Mesh(fascia, mats.tileDeep);
    s.castShadow = true; s.receiveShadow = true;
    f.castShadow = true;
    s.userData.partId = 'eaves'; f.userData.partId = 'eaves';
    roofs.add(s, f);
    // 顶部平座:托住上一重楼身(或金顶)
    const isLast = tier === TIERS[TIERS.length - 1];
    const capY = tier.y + tier.h;
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(tier.topRX * 2 + 0.5, 0.42, tier.topRZ * 2 + 0.5),
      isLast ? mats.ridge : mats.ridge
    );
    cap.position.y = capY - 0.21;
    cap.castShadow = true; cap.receiveShadow = true;
    cap.userData.partId = 'eaves';
    roofs.add(cap);
  }
  // 檐角点金:每个翘角末梢一枚小金珠(四檐角 × 下两层,金预算 <1%)
  for (const tier of [TIERS[0], TIERS[1]]) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), mats.gold);
      bead.position.set(sx * (tier.ax + 0.85), tier.y + tier.cornerLift + 0.12, sz * (tier.az + 0.6));
      bead.userData.partId = 'eaves';
      roofs.add(bead);
    }
  }
  group.add(roofs);
}

// ---------- 三层石台基 + 栏杆 + 踏道 + 前导石径 ----------
function buildTerrace(group, mats, terrainY) {
  const t = new THREE.Group();
  t.name = 'terrace';
  const tmp = new THREE.Group();
  const levels = [
    { ...TERRACE.L1, y: 0 },
    { ...TERRACE.L2, y: TERRACE.L1.h },
    { ...TERRACE.L3, y: TERRACE.L1.h + TERRACE.L2.h },
  ];
  const topY = levels.reduce((a, l) => a + l.h, 0);
  for (const l of levels) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(l.w, l.h, l.d), mats.stoneDeep);
    body.position.y = l.y + l.h / 2;
    tmp.add(body);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(l.w + 0.5, 0.16, l.d + 0.5), mats.stone);
    cap.position.y = l.y + l.h + 0.08;
    tmp.add(cap);
  }
  // 望柱栏杆:二、三层台边缘,正面门洞前开缺
  for (const li of [1, 2]) {
    const l = levels[li];
    const rY = l.y + l.h + 0.08;
    const hw = l.w / 2, hd = l.d / 2;
    const gapX = (TERRACE.STEP.w + 1.2) / 2; // 正面开缺半宽
    const post = new THREE.BoxGeometry(0.22, TERRACE.RAIL.h, 0.22);
    // 用直线段逐边布柱:跳过正面(x轴、z=+hd)的中段开缺
    for (const sz of [-1, 1]) {
      for (let x = -hw + 0.3; x <= hw - 0.3; x += TERRACE.RAIL.postGap) {
        if (sz === 1 && li === 2 && Math.abs(x) < gapX) continue;
        const p = new THREE.Mesh(post, mats.stone);
        p.position.set(x, rY + TERRACE.RAIL.h / 2, sz * hd);
        tmp.add(p);
      }
      railRunX(tmp, -hw + 0.3, hw - 0.3, sz * hd, rY, mats.stone, (sz === 1 && li === 2) ? gapX : null);
    }
    for (const sx of [-1, 1]) {
      for (let z = -hd + 0.3; z <= hd - 0.3; z += TERRACE.RAIL.postGap) {
        const p = new THREE.Mesh(post, mats.stone);
        p.position.set(sx * hw, rY + TERRACE.RAIL.h / 2, z);
        tmp.add(p);
      }
      railRunZ(tmp, -hd + 0.3, hd - 0.3, sx * hw, rY, mats.stone);
    }
  }
  // 正面踏道:从场坪逐台而上
  {
    const stepYs = [0, TERRACE.L1.h, TERRACE.L1.h + TERRACE.L2.h, topY];
    const depths = [TERRACE.L1.d / 2 + 2.6, TERRACE.L2.d / 2 + 2.0, TERRACE.L3.d / 2 + 1.4];
    for (let i = 0; i < 3; i++) {
      const y0 = stepYs[i], y1 = stepYs[i + 1];
      const zFront = depths[i];
      const steps = 5;
      for (let k = 0; k < steps; k++) {
        const h = y1 - y0;
        const st = new THREE.Mesh(
          new THREE.BoxGeometry(TERRACE.STEP.w, h / steps, 0.52),
          mats.stone
        );
        st.position.set(0, y0 + (h / steps) * (k + 0.5), zFront + 0.26 * (steps - 1 - k) + 0.26);
        tmp.add(st);
      }
    }
  }
  // 前导石径:从桥头蜿蜒到踏道(卵石板)
  {
    const pts = [[-14, 30], [-9, 26], [-4, 21], [-1, 17], [0, 14.5]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
      const seg = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.14, 2.3), mats.stone);
      seg.position.set((x0 + x1) / 2, (terrainY((x0 + x1) / 2, (z0 + z1) / 2) || 0) + 0.05, (z0 + z1) / 2);
      seg.rotation.y = Math.atan2(x1 - x0, z1 - z0);
      tmp.add(seg);
    }
  }
  emit(tmp);
  flushBin(t);
  t.children.forEach((m) => { m.userData.partId = 'terrace'; });
  group.add(t);
  return topY;
}
// 栏杆横楣辅助(正面遇开缺断成两段)
function railRunX(tmp, x0, x1, z, rY, mat, gap) {
  const rail = new THREE.BoxGeometry(1, 0.1, 0.1);
  const mid = TERRACE ? gap : null;
  if (gap != null) {
    for (const [a, b] of [[x0, -gap], [gap, x1]]) {
      if (b - a < 0.3) continue;
      const m = new THREE.Mesh(rail, mat);
      m.scale.x = b - a;
      m.position.set((a + b) / 2, rY + TERRACE.RAIL.h * 0.62, z);
      tmp.add(m);
    }
  } else {
    const m = new THREE.Mesh(rail, mat);
    m.scale.x = x1 - x0;
    m.position.set((x0 + x1) / 2, rY + TERRACE.RAIL.h * 0.62, z);
    tmp.add(m);
  }
}
function railRunZ(tmp, z0, z1, x, rY, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, Math.max(0.1, z1 - z0)), mat);
  m.position.set(x, rY + TERRACE.RAIL.h * 0.62, (z0 + z1) / 2);
  tmp.add(m);
}

// ---------- 灵光门(拱洞里的玉金漩涡) ----------
function latticePanel(wd, ht, mats, tmp) {
  // 暗底板 + 暖光内芯 + 栗木格条
  const g = new THREE.Group();
  const back = new THREE.Mesh(new THREE.PlaneGeometry(wd, ht), mats.latticeD);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(wd * 0.8, ht * 0.72),
    new THREE.MeshStandardMaterial({ color: C.windowLit, emissive: C.windowLit, emissiveIntensity: 0.75 })
  );
  glow.position.z = -0.02;
  g.add(back, glow);
  const nV = Math.max(2, Math.round(wd / 0.38));
  for (let i = 0; i <= nV; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.055, ht, 0.055), mats.chestnut);
    bar.position.set(-wd / 2 + (wd / nV) * i, 0, 0.03);
    g.add(bar);
  }
  for (let j = 0; j <= 3; j++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(wd, 0.055, 0.055), mats.chestnut);
    bar.position.set(0, -ht / 2 + (ht / 3) * j, 0.03);
    g.add(bar);
  }
  tmp.add(g);
  return g;
}

function buildHalls(group, mats, podium) {
  const halls = new THREE.Group();
  halls.name = 'halls';
  const tmp = new THREE.Group();
  const baseY = podium.baseY;
  const tiers = [
    { hall: GATE.hall1, y: baseY + GATE.podium.h },
    { hall: GATE.hall2, y: TIERS[0].y + TIERS[0].h },
    { hall: GATE.hall3, y: TIERS[1].y + TIERS[1].h },
  ];
  for (const { hall, y } of tiers) {
    const { w, d, colH, colR, colsX, colsZ } = hall;
    // 柱
    for (const x of colsX) for (const z of colsZ) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(colR, colR * 1.08, colH, 10), mats.red);
      col.position.set(x, y + colH / 2, z);
      tmp.add(col);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(colR * 1.5, colR * 1.7, 0.22, 10), mats.chestnut);
      base.position.set(x, y + 0.11, z);
      tmp.add(base);
    }
    // 额枋(柱头圈梁)
    for (const z of colsZ) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(w + colR, 0.34, 0.3), mats.red);
      beam.position.set(0, y + colH - 0.05, z);
      tmp.add(beam);
    }
    for (const x of [-(w / 2), w / 2]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.34, d + colR), mats.red);
      beam.position.set(x, y + colH - 0.05, 0);
      tmp.add(beam);
    }
    // 檐下椽望暗层:一圈薄暗带(压住白墙与亮檐之间的过渡)
    const band = new THREE.Mesh(new THREE.BoxGeometry(w + 1.6, 0.5, d + 1.6), mats.tileDeep);
    band.position.y = y + colH + 0.28;
    tmp.add(band);
    // 格扇窗:背面整排 + 两侧;正面留中(匾位)
    const bayW = (w / (colsX.length - 1)) - 0.55;
    const winH = colH - 1.1;
    const winY = y + (colH - winH) / 2 - 0.1;
    for (const z of colsZ) {
      for (let i = 0; i < colsX.length - 1; i++) {
        const cx = (colsX[i] + colsX[i + 1]) / 2;
        const isFront = z > 0;
        const isCenter = Math.abs(cx) < bayW * 0.55;
        if (isFront && isCenter && y === tiers[0].y) continue; // 一层正面中格让给匾
        const p = latticePanel(bayW, winH, mats, tmp);
        p.position.set(cx, winY, z + (z > 0 ? -0.18 : 0.18));
        if (z < 0) p.rotation.y = Math.PI;
      }
    }
    for (const x of [-(w / 2), w / 2]) {
      for (const zz of [-d / 4, d / 4]) {
        const p = latticePanel(d / 2 - 0.7, winH, mats, tmp);
        p.position.set(x + (x > 0 ? -0.18 : 0.18), winY, zz);
        p.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
        tmp.add(p);
      }
    }
  }
  // 无字匾:一层正面,金框 + 玉印灵光
  const plaqueY = baseY + GATE.podium.h + 0.4;
  const pw = GATE.plaque.w, ph = GATE.plaque.h;
  const pz = GATE.podium.d / 2 + 0.06;
  const pf = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.24, ph + 0.24, 0.1), mats.gold);
  pf.position.set(0, plaqueY, pz - 0.02);
  tmp.add(pf);
  const pb = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.12), mats.latticeD);
  pb.position.set(0, plaqueY, pz + 0.02);
  tmp.add(pb);
  const seal = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), mats.jadeGlow);
  seal.position.set(0, plaqueY, pz + 0.09);
  tmp.add(seal);
  emit(tmp);
  flushBin(halls);
  halls.children.forEach((m) => { m.userData.partId = 'gate'; m.castShadow = true; m.receiveShadow = true; });
  group.add(halls);
  // 匾上灵光 sprite 由 main 层加(需 glowTexture)
}

// ---------- 灯笼(檐角六盏,静态并桶 + 独立光晕) ----------
function buildLanterns(group, mats, glowTex) {
  const lans = new THREE.Group();
  lans.name = 'lanterns';
  const tmp = new THREE.Group();
  const spots = [];
  const t1 = TIERS[0];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    spots.push([sx * (t1.ax - 1.6), t1.y + t1.cornerLift * 0.8 - 0.3, sz * (t1.az - 0.9)]);
  }
  spots.push([-GATE.arch.w / 2 - 1.4, TERRACE.L1.h + TERRACE.L2.h + TERRACE.L3.h + GATE.podium.h - 0.4, GATE.podium.d / 2 + 0.2]);
  spots.push([GATE.arch.w / 2 + 1.4, TERRACE.L1.h + TERRACE.L2.h + TERRACE.L3.h + GATE.podium.h - 0.4, GATE.podium.d / 2 + 0.2]);
  for (const [x, y, z] of spots) {
    const top = y + LANTERN.drop;
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, LANTERN.drop, 4), mats.chestnut);
    cord.position.set(x, y + LANTERN.drop / 2, z);
    tmp.add(cord);
    const body = new THREE.Mesh(new THREE.SphereGeometry(LANTERN.r, 12, 12), mats.red);
    body.scale.y = LANTERN.h / (LANTERN.r * 2);
    body.position.set(x, y, z);
    tmp.add(body);
    const cap1 = new THREE.Mesh(new THREE.CylinderGeometry(LANTERN.r * 0.5, LANTERN.r * 0.72, 0.13, 10), mats.gold);
    cap1.position.set(x, y + LANTERN.h / 2 + 0.05, z);
    tmp.add(cap1);
    const cap2 = cap1.clone(); cap2.position.y = y - LANTERN.h / 2 - 0.05;
    tmp.add(cap2);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(LANTERN.r * 0.45, 8, 8),
      new THREE.MeshStandardMaterial({ color: C.windowLit, emissive: C.windowLit, emissiveIntensity: 2.2 })
    );
    core.position.set(x, y, z);
    tmp.add(core);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: C.goldGlow, transparent: true, opacity: 0.5, depthWrite: false,
    }));
    sp.scale.setScalar(2.6);
    sp.position.set(x, y, z);
    lans.add(sp);
  }
  emit(tmp);
  flushBin(lans);
  lans.children.forEach((m) => { if (m.isMesh) m.userData.partId = 'lanterns'; });
  group.add(lans);
}

// ---------- 灵光门(拱洞里的玉金漩涡) ----------
export function buildPortal() {
  const g = new THREE.Group();
  g.name = 'portal';
  const baseY = TERRACE.L1.h + TERRACE.L2.h + TERRACE.L3.h;
  const geo = new THREE.CircleGeometry(PORTAL.r, 40);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      time: { value: 0 },
      jade: { value: new THREE.Color(C.portal) },
      goldC: { value: new THREE.Color(C.portalGold) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float time; uniform vec3 jade; uniform vec3 goldC;
      void main() {
        float r = length(vUv);
        if (r > 1.0) discard;
        float a = atan(vUv.y, vUv.x);
        // 三臂漩涡 + 径向脉动
        float sw = sin(a * 3.0 - time * 1.6 + r * 7.0);
        float sw2 = sin(a * 5.0 + time * 0.9 - r * 11.0);
        vec3 col = mix(jade, goldC, 0.28 + 0.24 * sw);
        float glow = pow(1.0 - r, 1.6);
        col *= 0.75 + 0.35 * glow + 0.12 * sw2;
        float alpha = smoothstep(1.0, 0.72, r) * (0.72 + 0.2 * sw);
        // 核心亮心
        col += goldC * pow(max(0.0, 1.0 - r * 2.6), 2.0) * 0.9;
        gl_FragColor = vec4(col, alpha);
      }`,
  });
  const disc = new THREE.Mesh(geo, mat);
  disc.position.set(0, baseY + GATE.arch.h * 0.52, 0.5);
  disc.renderOrder = 2;
  g.add(disc);
  g.userData.disc = disc;
  return g;
}

// ---------- 金顶(葫芦宝珠 + 灵光) ----------
function buildCrown(group, mats, glowTex) {
  const cr = new THREE.Group();
  cr.name = 'crown';
  const tmp = new THREE.Group();
  const y0 = CROWN.baseY;
  const t3 = TIERS[2];
  const cap = new THREE.Mesh(new THREE.BoxGeometry(t3.topRX * 2 + 0.3, 0.2, t3.topRZ * 2 + 0.3), mats.ridge);
  cap.position.y = y0 - 0.1;
  tmp.add(cap);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.12, 8, 20), mats.gold);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = y0 + 0.2;
  tmp.add(collar);
  const b1 = new THREE.Mesh(new THREE.SphereGeometry(CROWN.ballR, 14, 12), mats.gold);
  b1.scale.y = 1.25; b1.position.y = y0 + 0.75;
  tmp.add(b1);
  const b2 = new THREE.Mesh(new THREE.SphereGeometry(CROWN.ballR * 0.62, 12, 10), mats.gold);
  b2.scale.y = 1.3; b2.position.y = y0 + 1.35;
  tmp.add(b2);
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, CROWN.spike, 8), mats.gold);
  spike.position.y = y0 + 1.55 + CROWN.spike / 2 - 0.1;
  tmp.add(spike);
  const pearl = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 10, 10),
    new THREE.MeshStandardMaterial({ color: C.portalGold, emissive: C.portalGold, emissiveIntensity: 2.4 })
  );
  pearl.position.y = y0 + 1.55 + CROWN.spike - 0.05;
  tmp.add(pearl);
  emit(tmp);
  flushBin(cr);
  cr.children.forEach((m) => { if (m.isMesh) { m.userData.partId = 'crown'; m.castShadow = true; } });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: C.goldGlow, transparent: true, opacity: 0.55, depthWrite: false,
  }));
  sp.scale.setScalar(4.2);
  sp.position.y = y0 + 1.5;
  sp.userData.partId = 'crown';
  cr.add(sp);
  group.add(cr);
}

// ---------- 装配 ----------
export function buildGatehouse(terrainY) {
  const group = new THREE.Group();
  group.name = 'gatehouse';
  const mats = makeMats();
  const glowTex = glowTexture();

  const podiumTop = buildTerrace(group, mats, terrainY);
  const podium = buildPodiumInto(group, mats);
  buildHalls(group, mats, podium);
  buildRoofs(group, mats);
  buildLanterns(group, mats, glowTex);
  buildCrown(group, mats, glowTex);

  // 匾额灵光晕 + 拱门内暖光
  const sealSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: C.portal, transparent: true, opacity: 0.4, depthWrite: false,
  }));
  sealSprite.scale.setScalar(2.4);
  sealSprite.position.set(0, podium.baseY + GATE.podium.h + 0.4, GATE.podium.d / 2 + 0.4);
  sealSprite.userData.partId = 'gate';
  group.add(sealSprite);
  group.userData.glowTex = glowTex;
  return group;
}

// podium 组装(把白墩、门框、金框并入 gate 组)
function buildPodiumInto(group, mats) {
  const { w, d, h } = GATE.podium;
  const baseY = TERRACE.L1.h + TERRACE.L2.h + TERRACE.L3.h;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(w / 2, h); shape.lineTo(-w / 2, h); shape.closePath();
  const aw = GATE.arch.w / 2, ah = GATE.arch.h;
  const hole = new THREE.Path();
  hole.moveTo(-aw, 0); hole.lineTo(-aw, ah);
  hole.absarc(0, ah, aw, Math.PI, 0, true);
  hole.lineTo(aw, 0); hole.closePath();
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, curveSegments: 28 });
  geo.translate(0, 0, -d / 2);
  const mesh = new THREE.Mesh(geo, mats.plaster);
  mesh.position.y = baseY;
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.userData.partId = 'gate';
  group.add(mesh);

  const frame = new THREE.Group();
  const fw = 0.34;
  for (const s of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(fw, GATE.arch.h, 0.36), mats.chestnut);
    jamb.position.set(s * (aw + fw / 2), baseY + GATE.arch.h / 2, d / 2 + 0.06);
    frame.add(jamb);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(aw * 2 + fw * 2, fw, 0.36), mats.chestnut);
  lintel.position.set(0, baseY + GATE.arch.h + fw / 2, d / 2 + 0.06);
  frame.add(lintel);
  for (const o of frame.children) o.userData.partId = 'gate';
  group.add(frame);
  return { mesh, baseY };
}
