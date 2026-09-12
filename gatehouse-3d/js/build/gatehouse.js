// 门楼本体:三层石台基 / 拱门白墩 / 柱枋格扇 / 参数化翘角屋顶 / 无字匾 / 灯笼 / 金顶
import * as THREE from 'three';
import { C, TERRACE, DECK_Y, GATE, PLAQUE_Y, PLAQUE_Z, TIERS, CROWN, LANTERN, PORTAL, ROOF } from '../spec.js';
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
  const stone = new THREE.MeshStandardMaterial({ map: grainTexture('#a9a294', 18), roughness: 0.93 });
  const stoneDeep = new THREE.MeshStandardMaterial({ map: grainTexture('#8b8578', 22), roughness: 0.95 });
  const plaster = new THREE.MeshStandardMaterial({ map: grainTexture('#f1e9d8', 9), roughness: 0.9 });
  const tile = new THREE.MeshStandardMaterial({ color: C.tile, roughness: 0.66, side: THREE.DoubleSide });
  const tileDeep = new THREE.MeshStandardMaterial({ color: C.tileDeep, roughness: 0.8, side: THREE.DoubleSide });
  const ridgeM = new THREE.MeshStandardMaterial({ color: C.ridge, roughness: 0.7 });
  const gold = new THREE.MeshStandardMaterial({ color: C.gold, roughness: 0.35, metalness: 0.65 });
  const red = new THREE.MeshStandardMaterial({ color: C.red, roughness: 0.68 });
  const chestnut = new THREE.MeshStandardMaterial({ color: C.chestnut, roughness: 0.85 });
  const latticeD = new THREE.MeshStandardMaterial({
    color: C.lattice, roughness: 0.95, emissive: C.windowLit, emissiveIntensity: 0.42,
  });
  const warmGlow = new THREE.MeshStandardMaterial({
    color: C.windowLit, emissive: C.windowLit, emissiveIntensity: 1.45, roughness: 0.6,
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
  const flareAt = (s) => ROOF.flare * Math.exp(-((cornerDist(s) / (cornerSigma * 1.15)) ** 2));

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
        // 檐口封边带:同一圈往下拉;角端加厚,读作"挑"出的檐板而不是薄纸
        const fH = ROOF.fasciaH + lift * 0.55;
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
  const tmp = new THREE.Group();
  for (const tier of TIERS) {
    const { surface, fascia } = makeRoofGeo(tier);
    tmp.add(new THREE.Mesh(surface, mats.tile));
    tmp.add(new THREE.Mesh(fascia, mats.tileDeep));
    // 顶部平座:托住上一重楼身(或金顶)
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(tier.topRX * 2 + 0.5, 0.42, tier.topRZ * 2 + 0.5),
      mats.ridge
    );
    cap.position.y = tier.y + tier.h - 0.21;
    tmp.add(cap);
  }
  // 檐角点金:每个翘角末梢一枚小金珠(四檐角 × 下两层,金预算 <1%)
  for (const tier of [TIERS[0], TIERS[1]]) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), mats.gold);
      bead.position.set(sx * (tier.ax + 0.85), tier.y + tier.cornerLift + 0.12, sz * (tier.az + 0.6));
      tmp.add(bead);
    }
  }
  // 25 个散件按材质并成 4 个 mesh(瓦面 / 檐板 / 平座 / 金珠)
  emit(tmp);
  flushBin(roofs);
  roofs.userData.partId = 'eaves';   // 拾取靠向上冒泡,组级 partId 足够
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
  // 正面踏道:逐台而下的三跑台阶,每跑两侧带垂带
  {
    const lvls = [
      { y0: 0, y1: TERRACE.L1.h, z0: TERRACE.L1.d / 2 + 0.2 },
      { y0: TERRACE.L1.h, y1: TERRACE.L1.h + TERRACE.L2.h, z0: TERRACE.L2.d / 2 + 0.2 },
      { y0: TERRACE.L1.h + TERRACE.L2.h, y1: topY, z0: TERRACE.L3.d / 2 + 0.2 },
    ];
    const n = 5, tread = 0.46;
    for (const lv of lvls) {
      const rise = (lv.y1 - lv.y0) / n;
      for (let k = 0; k < n; k++) {
        const st = new THREE.Mesh(new THREE.BoxGeometry(TERRACE.STEP.w, rise, tread), mats.stone);
        st.position.set(0, lv.y0 + rise * (k + 0.5), lv.z0 + tread * (n - 1 - k) + tread / 2);
        tmp.add(st);
      }
      // 垂带:两侧各一条斜条石,把台阶收边
      const runLen = tread * n;
      for (const sx of [-1, 1]) {
        const st = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.24, runLen + 0.8), mats.stoneDeep);
        st.position.set(sx * (TERRACE.STEP.w / 2 + 0.2), (lv.y0 + lv.y1) / 2 + 0.3, lv.z0 + runLen / 2);
        st.rotation.x = -Math.atan2(lv.y1 - lv.y0, runLen);
        tmp.add(st);
      }
    }
    // 月台:底跑之前一块铺石场坪(半埋入地,读作铺装而不是浮板)
    const apron = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.5, 4.4), mats.stone);
    apron.position.set(0, -0.23, TERRACE.L1.d / 2 + 4.4);
    tmp.add(apron);
    for (const dz of [-1.6, 0, 1.6]) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.06, 0.09), mats.stoneDeep);
      seam.position.set(0, 0.02, TERRACE.L1.d / 2 + 4.4 + dz);
      tmp.add(seam);
    }
    const seamX = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 4.4), mats.stoneDeep);
    seamX.position.set(0, 0.02, TERRACE.L1.d / 2 + 4.4);
    tmp.add(seamX);
  }
  // 前导石径:从桥头沿水岸铺到月台(固定步距的连续石板,不是几块散板)
  {
    const pts = [[-22, 22.6], [-16, 20.6], [-10, 19.4], [-4, 18.4], [0, 17.2]];
    const stepLen = 2.0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
      const dx = x1 - x0, dz = z1 - z0;
      const len = Math.hypot(dx, dz);
      for (let d = 0; d < len; d += stepLen) {
        const t = d / len;
        const px = x0 + dx * t, pz = z0 + dz * t;
        const slab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.3, 1.9), mats.stoneDeep);
        slab.position.set(px, (terrainY(px, pz) || 0) - 0.06, pz);
        slab.rotation.y = Math.atan2(dx, dz) + (i % 2 ? 0.05 : -0.04);
        tmp.add(slab);
      }
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

// ---------- 格扇窗:实心暗板 + 朝外一面的暖光芯与栗木格条 ----------
// outDir 指出「朝外」的法向;本地 +z 会被旋到该方向,保证格条与光芯永远朝街
function latticePanel(wd, ht, mats, tmp, outDir = new THREE.Vector3(0, 0, 1)) {
  const g = new THREE.Group();
  const back = new THREE.Mesh(new THREE.BoxGeometry(wd, ht, 0.14), mats.latticeD);
  g.add(back);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(wd * 0.84, ht * 0.74), mats.warmGlow);
  glow.position.z = 0.08;
  g.add(glow);
  const nV = Math.max(2, Math.round(wd / 0.42));
  for (let i = 0; i <= nV; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, ht, 0.06), mats.chestnut);
    bar.position.set(-wd / 2 + (wd / nV) * i, 0, 0.11);
    g.add(bar);
  }
  for (let j = 0; j <= 2; j++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(wd, 0.06, 0.06), mats.chestnut);
    bar.position.set(0, -ht / 2 + (ht / 2) * j, 0.11);
    g.add(bar);
  }
  g.rotation.y = Math.atan2(outDir.x, outDir.z);
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
    // 格扇窗:前后两排 + 两侧;一层正面中格让给匾
    const bayW = (w / (colsX.length - 1)) - 0.55;
    const winH = colH - 1.1;
    const winY = y + (colH - winH) / 2 - 0.1;
    for (const z of colsZ) {
      const outDir = new THREE.Vector3(0, 0, z > 0 ? 1 : -1);
      for (let i = 0; i < colsX.length - 1; i++) {
        const cx = (colsX[i] + colsX[i + 1]) / 2;
        const isFront = z > 0;
        const isCenter = Math.abs(cx) < bayW * 0.55;
        if (isFront && isCenter && y === tiers[0].y) continue; // 一层正面中格让给匾
        const p = latticePanel(bayW, winH, mats, tmp, outDir);
        p.position.set(cx, winY, z + (z > 0 ? 0.02 : -0.02));
      }
    }
    for (const x of [-(w / 2), w / 2]) {
      const outDir = new THREE.Vector3(x > 0 ? 1 : -1, 0, 0);
      for (const zz of [-d / 4, d / 4]) {
        const p = latticePanel(d / 2 - 0.9, winH, mats, tmp, outDir);
        p.position.set(x + (x > 0 ? 0.02 : -0.02), winY, zz);
      }
    }
  }
  // 无字匾:挂在一层楼身正面的中格(该格不排格扇窗),金框 + 玉印灵光
  // ⚠ 不能再用 baseY + arch.h 推导——那会把匾塞进拱洞里(曾出的 bug)
  const plaqueY = PLAQUE_Y;
  const pw = GATE.plaque.w, ph = GATE.plaque.h;
  const pz = PLAQUE_Z;
  const pf = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.24, ph + 0.24, 0.1), mats.gold);
  pf.position.set(0, plaqueY, pz - 0.02);
  tmp.add(pf);
  const pboard = new THREE.Mesh(
    new THREE.BoxGeometry(pw, ph, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x7a3422, emissive: 0x30140a, emissiveIntensity: 1.0, roughness: 0.45 })
  );
  pboard.position.set(0, plaqueY, pz + 0.02);
  tmp.add(pboard);
  // 内圈一道细金线(匾的"框内框",让黑面不空)
  for (const [w2, h2, oy, ox] of [[pw * 0.86, 0.03, ph * 0.3, 0], [pw * 0.86, 0.03, -ph * 0.3, 0], [0.03, ph * 0.64, 0, pw * 0.43], [0.03, ph * 0.64, 0, -pw * 0.43]]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(w2, h2, 0.03), mats.gold);
    line.position.set(ox, plaqueY + oy, pz + 0.09);
    tmp.add(line);
  }
  // 玉印:金环托底 + 一枚发光的玉印(架空之物无名可题,只留这一枚印)
  const sealRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 8, 24), mats.gold);
  sealRing.position.set(0, plaqueY, pz + 0.1);
  tmp.add(sealRing);
  const seal = new THREE.Mesh(
    new THREE.CircleGeometry(0.36, 24),
    new THREE.MeshStandardMaterial({ color: C.portal, emissive: C.portal, emissiveIntensity: 1.3, roughness: 0.4 })
  );
  seal.position.set(0, plaqueY, pz + 0.11);
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
  // 拱门两侧各一:吊点在檐口压顶之下 0.25,避免顶部压顶与灯身相交
  spots.push([-GATE.arch.w / 2 - 1.4, DECK_Y + GATE.podium.h - 0.85, GATE.podium.d / 2 + 0.2]);
  spots.push([GATE.arch.w / 2 + 1.4, DECK_Y + GATE.podium.h - 0.85, GATE.podium.d / 2 + 0.2]);
  // 灯芯共用一份自发光材质:循环内 new 会让 6 盏灯各占一次 draw call
  const coreMat = new THREE.MeshStandardMaterial({
    color: C.windowLit, emissive: C.windowLit, emissiveIntensity: 2.2,
  });
  for (const [x, y, z] of spots) {
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
    const core = new THREE.Mesh(new THREE.SphereGeometry(LANTERN.r * 0.45, 8, 8), coreMat);
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

// ---------- 灵光门:一张填满拱洞的光膜(玉金三臂漩涡) ----------
export function buildPortal() {
  const g = new THREE.Group();
  g.name = 'portal';
  const baseY = DECK_Y;
  const { halfW, straight } = PORTAL;
  // 与拱洞同形(直壁 + 半圆)的光膜,四周略内收 0.06 留一线石边
  const shape = new THREE.Shape();
  shape.moveTo(-halfW + 0.06, 0.05);
  shape.lineTo(-halfW + 0.06, straight);
  shape.absarc(0, straight, halfW - 0.06, Math.PI, 0, true);
  shape.lineTo(halfW - 0.06, 0.05);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape, 30);
  const spanY = straight + halfW;
  // 拱洞深处压一层暗幕:光膜贴着一片黑,漩涡才读作"深处有光"
  const backing = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 24),
    new THREE.MeshBasicMaterial({ color: 0x0d1a1c })
  );
  backing.scale.setScalar(1.04);
  backing.position.set(0, baseY, PORTAL.z - 1.5);
  backing.userData.partId = 'portal';
  g.add(backing);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      time: { value: 0 },
      jadeDeep: { value: new THREE.Color(0x0d5c54) },
      jadeMid: { value: new THREE.Color(0x3fbfa4) },
      goldC: { value: new THREE.Color(C.portalGold) },
      halfSpan: { value: new THREE.Vector2(halfW, spanY) },
    },
    vertexShader: `
      varying vec2 vLocal;
      void main() {
        vLocal = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec2 vLocal;
      uniform float time; uniform vec3 jadeDeep; uniform vec3 jadeMid; uniform vec3 goldC; uniform vec2 halfSpan;
      void main() {
        // 归一化膜内坐标:底部 0 → 顶部 1
        vec2 n = vec2(vLocal.x / halfSpan.x, vLocal.y / halfSpan.y - 0.42);
        float r = length(n * vec2(1.0, 1.05));
        float a = atan(n.y, n.x);
        // 对数螺旋:细亮丝绕着门心转,而不是几块亮斑
        float sp  = a * 3.0 + log(max(r, 0.07)) * 6.0 - time * 1.6;
        float sp2 = a * -5.0 + log(max(r, 0.07)) * 9.0 + time * 1.05;
        float fil  = pow(0.5 + 0.5 * sin(sp), 6.0);
        float fil2 = pow(0.5 + 0.5 * sin(sp2), 10.0);
        float core = pow(max(0.0, 1.0 - r * 3.6), 3.0);
        vec3 col = mix(jadeDeep, jadeMid, 0.18 + 0.30 * core);
        col += jadeMid * fil  * 0.80;
        col += jadeMid * fil2 * 0.35;
        col += goldC   * core * 0.45;
        col += goldC   * fil * fil * 0.22;
        float edge = smoothstep(1.04, 0.90, r);
        gl_FragColor = vec4(col, edge * (0.92 + 0.06 * fil));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const disc = new THREE.Mesh(geo, mat);
  disc.position.set(0, baseY, PORTAL.z);
  disc.renderOrder = 2;
  disc.userData.partId = 'portal';
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
  sealSprite.position.set(0, PLAQUE_Y, PLAQUE_Z + 0.5);
  sealSprite.userData.partId = 'gate';
  // 装饰性辉光不参与拾取:否则它会先于拱洞光膜挡住视线,点拱门被识别成'匾'
  sealSprite.raycast = () => {};
  group.add(sealSprite);
  group.userData.glowTex = glowTex;
  return group;
}

// podium 组装(把白墩、门框、金框并入 gate 组)
function buildPodiumInto(group, mats) {
  const { w, d, h } = GATE.podium;
  const baseY = DECK_Y;
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

  // 墩的上下收边:基座一圈青石裙 + 檐口一圈外挑压顶(白面才不空)
  // ⚠ 石裙必须左右分块、门洞处留空:整块 Box 横穿拱门会埋掉灵光膜底部 0.6 m
  const skH = 0.6, skOut = 0.25;
  const segW = (w / 2 + skOut) - aw;
  for (const sx of [-1, 1]) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(segW, skH, d + 0.5), mats.stoneDeep);
    seg.position.set(sx * (aw + segW / 2), baseY + skH / 2, 0);
    seg.castShadow = true; seg.receiveShadow = true;
    seg.userData.partId = 'gate';
    group.add(seg);
  }
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.34, d + 0.8), mats.stone);
  cornice.position.set(0, baseY + h - 0.17, 0);
  cornice.castShadow = true; cornice.receiveShadow = true;
  cornice.userData.partId = 'gate';
  group.add(cornice);

  // 券脸:拱洞外一圈略深的石圈(券石),拱门唯一的"收边"
  const aw2 = aw + 0.34, ah2 = ah + 0.34;
  const ringShape = new THREE.Shape();
  ringShape.moveTo(-aw2, 0); ringShape.lineTo(-aw2, ah2);
  ringShape.absarc(0, ah2, aw2, Math.PI, 0, true);
  ringShape.lineTo(aw2, 0); ringShape.closePath();
  const ringHole = new THREE.Path();
  ringHole.moveTo(-aw, 0); ringHole.lineTo(-aw, ah);
  ringHole.absarc(0, ah, aw, Math.PI, 0, true);
  ringHole.lineTo(aw, 0); ringHole.closePath();
  ringShape.holes.push(ringHole);
  const ringGeo = new THREE.ExtrudeGeometry(ringShape, { depth: 0.4, bevelEnabled: false, curveSegments: 28 });
  const ring = new THREE.Mesh(ringGeo, mats.stoneDeep);
  ring.position.set(0, baseY, d / 2 - 0.02);
  ring.castShadow = true; ring.receiveShadow = true;
  ring.userData.partId = 'gate';
  group.add(ring);
  return { mesh, baseY };
}
