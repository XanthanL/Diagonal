// 苏州园林构件 —— 粉墙 · 黛瓦墙帽 · 青石勒脚 · 漏窗(花窗) · 月洞门 · 竹丛
//
// 设计原则(与门楼一致,但更进一步):
//  · 园林不靠"多"取胜,靠**白墙作纸、构件作墨**。墙是负空间,是最贵的一块颜色。
//  · 一切几何都由 GARDEN(js/spec.js) 派生,本文件不得另写尺寸。
//  · 全部静态件走 emit/flushBin 合桶(按材质引用),不新增 draw call 数量级。
//
// ⚠ 墙不能是 Box:一旦墙上要开漏窗,Box 就没法挖洞了。改**立面拉伸**(Shape + holes),
//   顺便白拿一个好处 —— ExtrudeGeometry 的默认 uv 就是"米",贴图铺法天然正确。
import * as THREE from 'three';
import { C, ENV, GARDEN } from '../spec.js';
import {
  emit, flushBin, mulberry, grainTexture, wallTexture, mergeGeos,
  waterColorTexture, rippleNormalTexture,
} from './util.js';

// ---------- 材质(模块级:合桶按材质引用,循环里 new 会让合桶失效) ----------
const MAT = {
  // 粉墙:多尺度渍斑 + 竖向雨痕。园林的白墙是"一面有年岁的墙",不是一块白塑料板
  plaster: new THREE.MeshStandardMaterial({
    map: wallTexture('#f8f6f0', { amp: 6, streak: 0.03, seed: 4242 }),
    roughness: 0.94,
  }),
  // 勒脚:青石。江南多雨,墙根必须有石脚,否则墙是"插"在地里的
  plinth: new THREE.MeshStandardMaterial({
    map: grainTexture('#a8aca8', 16, { blotch: 5, seed: 5252 }),
    roughness: 0.95,
  }),
  // 墙帽:黛瓦。0.34 m 宽的瓦垄在墙上根本读不出来 —— 给一层细颗粒就够,不必挂瓦垄贴图
  tileCap: new THREE.MeshStandardMaterial({
    map: grainTexture('#5f6a6f', 13, { blotch: 4, seed: 6161 }),
    roughness: 0.82, side: THREE.DoubleSide,
  }),
  ridge: new THREE.MeshStandardMaterial({ color: C.ridge, roughness: 0.74 }),
  // 门套/窗套:砖细。**不能用勒脚的深青石** —— 月洞门的圈边一旦发黑,整座门
  //   就读成"铁环"而不是"砖细"(v45 里最刺眼的一处)。
  collar: new THREE.MeshStandardMaterial({
    map: grainTexture('#c6c2b6', 20, { blotch: 4, seed: 7373 }),
    roughness: 0.9,
  }),
  bambooDeep: new THREE.MeshStandardMaterial({ color: C.bambooDeep, roughness: 0.88 }),
  // 太湖石:flatShading 是必须的 —— 光滑球面读作"肥皂",有刻面才读作"石"。
  //   顶点色走竖向明暗(石脚暗、石顶亮),比多加一盏灯便宜且不出噪点。
  rock: new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, flatShading: true, roughness: 0.97,
  }),
  bark: new THREE.MeshStandardMaterial({ color: C.bark, roughness: 0.95 }),
  // 柳条:细管。DoubleSide 不必开(是管不是片),省一半填充
  willow: new THREE.MeshStandardMaterial({ color: C.willow, roughness: 0.9 }),
  // 柳冠必须**另开一份材质**:顶点色是"乘"在材质色上的,若沿用 C.willow 的材质,
  //   C.willow × 顶点色(本身就在 C.leafDeep~C.willow 之间)= 墨绿。白底才对。
  willowCrown: new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.92,
  }),
  // 阔叶冠:顶点色(冠顶亮、冠内暗)。伞冠靠"压扁的球",不靠贴图
  leafBroad: new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.92,
  }),
  // 竹叶:薄片必须 DoubleSide;但**不能投影**(见 buildGarden 末尾的 castShadow 处理)
  bamboo: new THREE.MeshStandardMaterial({
    color: C.bamboo, roughness: 0.8, side: THREE.DoubleSide,
  }),
  // 柳叶:披针小叶,双面。柳叶偏黄绿 —— 用 C.willow,不用 C.leaf
  willowLeaf: new THREE.MeshStandardMaterial({
    color: C.willow, roughness: 0.86, side: THREE.DoubleSide,
  }),
  // 阔叶散叶:挂在球冠外缘,给冠"长毛"。颜色比球冠的顶点色亮一档(缘叶受光)
  leafSpray: new THREE.MeshStandardMaterial({
    color: C.leaf, roughness: 0.88, side: THREE.DoubleSide,
  }),
  // 铺地:石板。地面是园林里面积最大的一块"材质",不能交给草地糊过去
  // ⚠ side:DoubleSide 是给裙边用的(见 buildPaving):顶面用哪面都行,
  //   但裙边一圈的绕序不可能一套写完,双面最稳。
  paving: new THREE.MeshStandardMaterial({ map: slabTexture(), roughness: 0.94, side: THREE.DoubleSide }),
  // 池水。参数与河同源但更"静":园林的池是镜面静水,**不设 tick**(不流动)。
  // ⚠ 法线贴图的 repeat 要按水面长宽比补偿(同 environment 的教训):椭圆把 uv 沿 x 拉了
  //   rx/rz = 1.67 倍,不补的话扰动被拉成一道道平行长条,读作"丝绸"不读作"水"。
  pond: (() => {
    const rip = rippleNormalTexture(256, 9);
    rip.repeat.set(4.6, 2.8);
    rip.anisotropy = 8;                      // 掠射角不设 anisotropy 会挑错 mip → 摩尔纹
    return new THREE.MeshStandardMaterial({
      map: waterColorTexture(0x2b5852, 0x47756c, 0x7a9a90, 1.67),
      color: 0xd9e2dc,                       // 再压一档蓝:映天的冷调由 envMap 给,不必让底色也冷

      roughness: 0.15,                       // 比河(0.17)略镜面:无风静水
      metalness: 0.0,
      envMap: null,                          // 在 buildPond 里注入(见 B3)
      // ⚠ 河面用 0.68 是对的(河要映天);园池 0.68 会把整池映成"泳池蓝",水色被蓝天吃掉。
      //   0.44 才既留得住深绿的水色、又有静水该有的天光。这是实测出来的,不是拍的。
      envMapIntensity: 0.24,
      normalMap: rip, normalScale: new THREE.Vector2(0.17, 0.17),
      transparent: true, opacity: 0.96,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  })(),
  // 亭的柱、枋、挂落:木。色同门楼的 C.wood(全站一套木色,不另起一套)
  timber: new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.72 }),
  // 驳岸石:青灰,flatShading。**必须另开材质** —— MAT.rock 是 vertexColors:true,
  //   拿不到 color 属性的几何会按 (0,0,0) 渲成纯黑(util.js 里记过这个静默失败)。
  shore: new THREE.MeshStandardMaterial({ color: 0x767d78, roughness: 0.97, flatShading: true }),
};

// ---------- 小工具 ----------
/**
 * 叶簇 —— 园林里所有树叶的**基本单元**。这个函数是 v51 的核心。
 *
 * 为什么不能用"一片大叶子":0.95×0.15 的矩形在 60 m 外能读成团,凑近就是一张绿纸板。
 * 为什么不能用"一片真叶子":0.3×0.05 近看对了,60 m 外是亚像素 —— 整丛只剩光杆。
 * 解法是**簇**:4~6 片真叶从一个点放射。整簇尺度 0.35~0.5 m(远方有团感),
 * 簇内每片都是真叶尺寸(近看不假)。这比"把叶子放大"省面,比"加更多叶子"省对象。
 *
 * ⚠ 变体必须**量化**:len/seed 若逐簇随机,缓存键会爆炸成上千个 geometry。
 *   尺寸取 3 档、seed 取 8 档 = 24 个共享几何,几千个 mesh 共用它们。
 */
const _sprayCache = new Map();
function leafSprayGeo(len, wid, n, seed, droop = 0.60) {
  const key = len.toFixed(3) + '|' + wid.toFixed(3) + '|' + n + '|' + seed + '|' + droop.toFixed(2);
  const hit = _sprayCache.get(key);
  if (hit) return hit;
  const R = mulberry(seed * 977 + 13);
  const parts = [];
  for (let i = 0; i < n; i++) {
    const lf = len * (0.66 + R() * 0.46);
    const g = new THREE.PlaneGeometry(lf, wid);
    g.rotateX(-Math.PI / 2);                    // 叶面躺平:长边沿 x,法线朝上
    g.translate(lf / 2, 0, 0);                  // ⚠ 叶柄落在原点 —— 旋转才是绕叶柄,不是绕叶心
    g.rotateZ(-(droop * 0.35 + R() * droop));   // 下垂(叶尖向下)
    g.rotateX((R() - 0.5) * 1.5);               // 各片叶面朝向打散,不然是一把摊开的伞
    g.rotateY((i / n) * 6.283 + R() * 0.9);     // 绕叶柄放射
    g.translate(0, (R() - 0.5) * 0.05, 0);
    parts.push(g);
  }
  const merged = mergeGeos(parts);
  _sprayCache.set(key, merged);
  return merged;
}

/** ExtrudeGeometry 的 uv 是"米",要按目标纹理的世界周期缩放 */
function scaleUV(geo, su, sv) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  uv.needsUpdate = true;
  return geo;
}

/** 沿一段墙的多点采样地形,取最低点 —— 直墙才不会一头悬空一头入土 */
function groundMin(terrainY, x0, z0, x1, z1) {
  let lo = Infinity;
  for (let t = 0; t <= 1.0001; t += 0.1) {
    lo = Math.min(lo, terrainY(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t));
  }
  return lo - 0.30;          // 再埋 0.3 m,接缝看不出来
}

/**
 * 墙面(带洞立面)拉伸。局部坐标:x 沿墙长(0 → len),y 自墙脚地面向上。
 * holes: [[沿墙距离, 离地高, 宽, 高], ...]
 */
function wallGeo(len, h, t, holes = []) {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(len, 0); s.lineTo(len, h); s.lineTo(0, h); s.closePath();
  for (const [hx, hy, hw, hh] of holes) {
    const p = new THREE.Path();
    p.moveTo(hx - hw / 2, hy - hh / 2);
    p.lineTo(hx + hw / 2, hy - hh / 2);
    p.lineTo(hx + hw / 2, hy + hh / 2);
    p.lineTo(hx - hw / 2, hy + hh / 2);
    p.closePath();
    s.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false });
  g.translate(0, 0, -t / 2);
  return g;
}

/** 墙帽:中脊 + 两坡。坡面的外端往下斜,脊压在墙顶正中 */
function wallCap(len, topY) {
  const W = GARDEN.wall;
  const c = new THREE.Group();
  const halfW = W.t / 2 + W.capOver;
  const ang = Math.atan2(W.capH, halfW);
  const slope = Math.hypot(halfW, W.capH);
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(
      scaleUV(new THREE.BoxGeometry(len, 0.07, slope), len / 1.8, slope / 1.8), MAT.tileCap);
    p.position.set(0, topY + W.capH / 2, s * halfW / 2);
    p.rotation.x = s * ang;                  // 外端下斜(见注释:rotX(+) 使 +z 端下降)
    c.add(p);
  }
  const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.13, 0.22), MAT.ridge);
  r.position.y = topY + W.capH + 0.03;
  c.add(r);
  return c;
}

/** 一段墙 = 墙身(带洞) + 勒脚 + 墙帽。(x0,z0) 是起点,局部 +x 指向 (x1,z1) */
function wallRun(tmp, x0, z0, x1, z1, baseY, holes = []) {
  const W = GARDEN.wall;
  const len = Math.hypot(x1 - x0, z1 - z0);
  const g = new THREE.Group();
  g.position.set(x0, baseY, z0);
  g.rotation.y = Math.atan2(-(z1 - z0), x1 - x0);

  g.add(new THREE.Mesh(scaleUV(wallGeo(len, W.h, W.t, holes), 1 / 3.2, 1 / 3.2), MAT.plaster));

  const plinth = new THREE.Mesh(
    scaleUV(new THREE.BoxGeometry(len, W.base, W.t + 0.09), len / 2.2, W.base / 2.2), MAT.plinth);
  plinth.position.set(len / 2, W.base / 2, 0);
  g.add(plinth);

  const cap = wallCap(len, W.h);
  cap.position.x = len / 2;
  g.add(cap);

  tmp.add(g);
  return g;
}

// ---------- 漏窗纹样 ----------
/** Sutherland–Hodgman:把多边形裁到矩形内(六角孔要铺满,不能只留"全在内"的那些) */
function clipPoly(poly, x0, y0, x1, y1) {
  const eps = 1e-9;
  const inside = [(p) => p[0] >= x0 - eps, (p) => p[0] <= x1 + eps,
    (p) => p[1] >= y0 - eps, (p) => p[1] <= y1 + eps];
  const cut = [
    (a, b) => [x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0] || eps)],
    (a, b) => [x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0] || eps)],
    (a, b) => [a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1] || eps), y0],
    (a, b) => [a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1] || eps), y1],
  ];
  let p = poly;
  for (let e = 0; e < 4; e++) {
    const out = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      const ia = inside[e](a), ib = inside[e](b);
      if (ia && ib) out.push(b);
      else if (ia && !ib) out.push(cut[e](a, b));
      else if (!ia && ib) { out.push(cut[e](a, b)); out.push(b); }
    }
    p = out;
    if (!p.length) return [];
  }
  return p;
}

/** 乱砖/冰裂:递归二分出大小不一的矩形(苏州"乱砖墙"的做法),每块内缩成孔 */
function iceRects(x0, y0, x1, y1, depth, R, out) {
  const w = x1 - x0, h = y1 - y0;
  if (depth <= 0 || (w < 0.26 && h < 0.26)) { out.push([x0, y0, x1, y1]); return; }
  const t = 0.32 + R() * 0.36;
  if (w > h) {
    const c = x0 + w * t;
    iceRects(x0, y0, c, y1, depth - 1, R, out);
    iceRects(c, y0, x1, y1, depth - 1, R, out);
  } else {
    const c = y0 + h * t;
    iceRects(x0, y0, x1, c, depth - 1, R, out);
    iceRects(x0, c, x1, y1, depth - 1, R, out);
  }
}

/** 纹样 → 一组孔洞多边形(局部坐标,原点在窗心) */
function patternHoles(pattern, W, H, seed) {
  const R = mulberry(seed);
  const ix = W / 2, iy = H / 2;
  const polys = [];

  if (pattern === 'hex') {
    // 六角龟背:尖顶正六边形密铺。只留内缩的六边形,六边之间的"楞"就是纹样
    const s = Math.min(W, H) / 4.4;
    const hw = Math.sqrt(3) * s / 2;
    const k = 0.78;        // 0.86 → 楞 6 cm;0.78 才有 9 cm,远看是"花格"
    for (let ci = -1; ci <= Math.ceil(W / (2 * hw)) + 1; ci++) {
      for (let ri = -1; ri <= Math.ceil(H / (1.5 * s)) + 1; ri++) {
        const cx = -ix + ci * 2 * hw + (ri % 2 ? hw : 0);
        const cy = -iy + ri * 1.5 * s;
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 2 + i * Math.PI / 3;
          pts.push([cx + Math.cos(a) * s * k, cy + Math.sin(a) * s * k]);
        }
        const c = clipPoly(pts, -ix, -iy, ix, iy);
        if (c.length >= 3) polys.push(c);
      }
    }
  } else if (pattern === 'ice') {
    // 乱冰裂:矩形铺砌 + 内缩。缝宽 ≈ 2*joint,和六角窗的楞宽对齐
    const rects = [];
    iceRects(-ix, -iy, ix, iy, 5, R, rects);
    const joint = 0.032;   // 0.022 → 楞只有 4.4 cm,20 m 外就没了
    for (const [a, b, c, d] of rects) {
      if (c - a < 2.6 * joint || d - b < 2.6 * joint) continue;
      polys.push([[a + joint, b + joint], [c - joint, b + joint],
        [c - joint, d - joint], [a + joint, d - joint]]);
    }
  } else {
    // 海棠花格:3×3 四瓣花(肥瓣) + 4 个内角小方。
    // ⚠ 原实现是"一整朵大花挖在一块实心板上" —— 读作"贴了一块的砖",不是漏窗。
    //   漏窗的实质是**花格**:洞要铺满画面,剩下的是细楞。所以改成阵列,
    //   花与花之间只留 5 cm 楞;四瓣之间的内角再用小方补掉,整扇才透气。
    const d = Math.min(W, H) / 3;                   // 一朵花占的格
    const bar = 0.052;                              // 楞宽(与六角/冰裂对齐)
    const R0 = d / 2 - bar / 2;
    for (let gy = 0; gy < 3; gy++) {
      for (let gx = 0; gx < 3; gx++) {
        const cx = -ix + d * (gx + 0.5), cy = -iy + d * (gy + 0.5);
        const pts = [];
        for (let i = 0; i < 72; i++) {
          const th = i / 72 * Math.PI * 2;
          // 0.64→0.88:瓣要**肥**。细瓣等于细楞,远看只剩一团实心
          const r = R0 * (0.76 + 0.24 * Math.cos(4 * th));
          pts.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]);
        }
        polys.push(pts);
      }
    }
    // 内角补方:四朵花之间那块空地。不补,每个交点就留一个 25 cm 的死疙瘩
    const h4 = Math.max(0.028, Math.SQRT1_2 * d - 0.52 * R0 - bar / 2);
    for (let gy = 0; gy < 2; gy++) {
      for (let gx = 0; gx < 2; gx++) {
        const cx = -ix + d * (gx + 1), cy = -iy + d * (gy + 1);
        polys.push([[cx - h4, cy], [cx, cy - h4], [cx + h4, cy], [cx, cy + h4]]);
      }
    }
  }
  return polys;
}

/** 一扇漏窗:方框 + 纹样孔。整体拉伸成一块厚度略大于墙的"砖细窗",嵌在墙洞里 */
function latticeWindowGeo(w, h, frame, pattern, seed) {
  const iw = w - 2 * frame, ih = h - 2 * frame;
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2);
  s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
  for (const poly of patternHoles(pattern, iw, ih, seed)) {
    const p = new THREE.Path();
    p.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) p.lineTo(poly[i][0], poly[i][1]);
    p.closePath();
    s.holes.push(p);
  }
  const t = GARDEN.wall.t + 0.07;      // 比墙厚一点 → 窗套略凸出墙面,像砖细做出来的
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -t / 2);
  return g;
}

// ---------- 月洞门 ----------
/** 圆环(门套):内圆 r,外圆 r+band,拉伸 depth */
function annulusGeo(rIn, rOut, depth) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const h = new THREE.Path();
  h.absarc(0, 0, rIn, 0, Math.PI * 2, true);
  s.holes.push(h);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 56 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** 内园月洞门墙:一段带圆洞的墙(局部原点在墙脚中线,x 向两侧各半) */
function moonGateWall(tmp, span, groundY) {
  const M = GARDEN.moon;
  const W = GARDEN.wall;
  const g = new THREE.Group();
  g.position.set((M.x0 + M.x1) / 2, groundY, M.z);

  // 墙身:矩形 - 圆洞。洞心抬 r+0.14 → 洞口落地留一道 14 cm 石门槛
  const hh = W.h, half = span / 2;
  const s = new THREE.Shape();
  s.moveTo(-half, 0); s.lineTo(half, 0); s.lineTo(half, hh); s.lineTo(-half, hh); s.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, M.r + 0.14, M.r, 0, Math.PI * 2, true);
  s.holes.push(hole);

  // 月洞门两侧各开一扇漏窗 —— 26 m 长的北墙只开一个圆洞太寡。补上两扇,墙面就有了
  //   "窗 · 洞 · 窗" 的横向节奏;从池对岸(六角亭)望过来才有东西可看,对景才成立。
  const LG = GARDEN.lattice;
  const FLANK_X = 4.60;
  for (const sx of [-1, 1]) {
    const wc = sx * FLANK_X, wyc = LG.sill + LG.h / 2;
    const p = new THREE.Path();
    p.moveTo(wc - LG.w / 2, wyc - LG.h / 2);
    p.lineTo(wc + LG.w / 2, wyc - LG.h / 2);
    p.lineTo(wc + LG.w / 2, wyc + LG.h / 2);
    p.lineTo(wc - LG.w / 2, wyc + LG.h / 2);
    p.closePath();
    s.holes.push(p);
  }
  const body = new THREE.Mesh(scaleUV(
    (() => { const gg = new THREE.ExtrudeGeometry(s, { depth: W.t, bevelEnabled: false, curveSegments: 48 }); gg.translate(0, 0, -W.t / 2); return gg; })(),
    1 / 3.2, 1 / 3.2), MAT.plaster);
  g.add(body);

  // 门套:砖细圈边,前后各凸出墙一点点
  const collar = new THREE.Mesh(annulusGeo(M.r, M.r + M.collar, W.t + 0.10), MAT.collar);
  collar.position.y = M.r + 0.14;
  g.add(collar);

  // 勒脚:青石。**必须避开洞口** —— 整条勒脚会把这个门堵死
  const segs = [[-half, -(M.r + M.collar + 0.30)], [M.r + M.collar + 0.30, half]];
  for (const [a, b] of segs) {
    const len = b - a;
    const p = new THREE.Mesh(
      scaleUV(new THREE.BoxGeometry(len, W.base, W.t + 0.09), len / 2.2, W.base / 2.2), MAT.plinth);
    p.position.set((a + b) / 2, W.base / 2, 0);
    g.add(p);
  }
  // 门槛:洞口底下那道石
  const thr = new THREE.Mesh(new THREE.BoxGeometry(M.r * 2, 0.14, W.t + 0.06), MAT.plinth);
  thr.position.set(0, 0.07, 0);
  g.add(thr);

  // 两扇漏窗的窗套:纹样与南墙错开(南墙是 hex/ice/haitang),这里只用 hex + haitang
  for (const sx of [-1, 1]) {
    const geo = latticeWindowGeo(LG.w + 0.05, LG.h + 0.05, LG.frame,
      sx < 0 ? 'hex' : 'haitang', 1300 + (sx < 0 ? 0 : 91));
    const wm = new THREE.Mesh(geo, MAT.collar);
    wm.position.set(sx * FLANK_X, LG.sill + LG.h / 2, 0);
    g.add(wm);
  }

  // 墙帽:全跨贯通(园林的洞门上方仍是连续的墙帽)
  const cap = wallCap(span, W.h);
  g.add(cap);

  tmp.add(g);
  return g;
}

// ---------- 竹 ----------
/** 一丛竹:竿 + 散叶。丛半径 < 0.7 m,取一处地形高即可 */
function bambooCluster(tmp, x, z, groundY, h, seed) {
  const R = mulberry(seed);
  const n = 7 + Math.floor(R() * 5);
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, rad = Math.sqrt(R()) * 0.66;
    const bx = x + Math.cos(a) * rad, bz = z + Math.sin(a) * rad;
    const bh = h * (0.70 + R() * 0.58);
    // 竿:两极径差 30% 且带一点侧倾 —— 等径直立筒读作"PVC 管"
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.062, bh, 6), MAT.bambooDeep);
    stem.position.set(bx, groundY + bh / 2, bz);
    stem.rotation.set((R() - 0.5) * 0.10, R() * 6.283, (R() - 0.5) * 0.14);
    tmp.add(stem);
    // 叶:9~13 簇,每簇 5 片真叶。旧版的 11 片 0.95×0.15 矩形片是"绿便利贴"。
    const s = [0.86, 1.0, 1.20];
    const nc = 9 + Math.floor(R() * 5);
    for (let k = 0; k < nc; k++) {
      const ly = groundY + bh * (0.32 + R() * 0.72);
      const lr = 0.04 + R() * 0.26;             // 叶贴着竿长,不许飘出去变成"浮萍"
      const la = R() * Math.PI * 2;
      const iv = (i * 3 + k) % 3;
      const spray = new THREE.Mesh(
        leafSprayGeo(0.34 * s[iv], 0.050, 5, (i * 31 + k * 7) % 8, 0.85), MAT.bamboo);
      spray.position.set(bx + Math.cos(la) * lr, ly, bz + Math.sin(la) * lr);
      spray.rotation.y = R() * 6.283;
      spray.rotation.z = (R() - 0.5) * 0.55;
      tmp.add(spray);
    }
  }
}

// ---------- 置石与乔木 ----------
/**
 * 太湖石(置石)。园林的"骨":白墙前立一块石,画面立刻从"草地上的房子"变成"园子"。
 * 做法是 3~5 块**长在一起的石头**,不是"一个变形的球":
 *   · 各自 0.6~1.1 的各向异性缩放 → 主石瘦高、侧石矮扁
 *   · 半径按角度加整数谐波 → 剪影没有一段是圆弧
 *   · 竖向拉长(ky 1.25~1.75)→ 太湖石"瘦、皱"的那股劲
 * 石脚再埋 6% 高度,石头才是"长在地里"而不是"放在地上"。
 */
function rockery(tmp, x, z, groundY, h, seed) {
  const R = mulberry(seed);
  const g = new THREE.Group();
  g.position.set(x, groundY - h * 0.06, z);
  const n = 3 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) {
    const t = i === 0 ? 1 : 0.42 + R() * 0.44;
    const rr = h * 0.30 * t;
    const geo = new THREE.IcosahedronGeometry(rr, 2);
    const p = geo.attributes.position;
    const ph = R() * 6.283;
    const sx = 0.60 + R() * 0.52, sz = 0.60 + R() * 0.52, ky = 1.25 + R() * 0.50;
    for (let k = 0; k < p.count; k++) {
      const vx = p.getX(k), vy = p.getY(k), vz = p.getZ(k);
      const a = Math.atan2(vz, vx);
      const w = 1 + 0.40 * Math.sin(a * 3 + ph) + 0.24 * Math.sin(a * 5 - ph * 1.7)
        + 0.13 * Math.sin(a * 7 + ph * 0.4) + 0.07 * Math.sin(a * 11 - ph);
      p.setX(k, vx * w * sx);
      p.setZ(k, vz * w * sz);
      p.setY(k, vy * ky * (1 + 0.16 * Math.sin(a * 4 + ph)));
    }
    geo.computeVertexNormals();
    const col = [];
    const cLo = new THREE.Color(C.rockDeep), cHi = new THREE.Color(C.rock);
    for (let k = 0; k < p.count; k++) {
      const up = Math.max(0, Math.min(1, (p.getY(k) / (rr * ky) + 1) / 2));
      const c = cLo.clone().lerp(cHi, 0.42 + 0.58 * up);
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, MAT.rock);
    m.position.set((R() - 0.5) * h * 0.26, h * (0.30 + R() * 0.40), (R() - 0.5) * h * 0.26);
    m.rotation.y = R() * 6.283;
    g.add(m);
  }
  tmp.add(g);
}

/**
 * 垂柳。江南的"水"是靠柳点出来的 —— 岸上有柳,那块水才不是一块蓝布。
 * 结构:一段略斜的干 + 一圈自冠心向外、再向下垂的柳条(细管)。
 * ⚠ 初版做的是"从冠心放射出去的伞骨"(向外 0.62·len),渲染出来是**一顶绿阳伞**。
 *   柳的真相是:**先有一个团,再从团的表面往下垂帘** ——
 *     · 起点落在冠体内部(rStart = 0.42~1.04 R),不是冠心一个点
 *     · 向外只弓一点点(bow,sin 弓形:中段出、末端回收)→ 柳条是"垂"不是"射"
 *     · 竖向走 t^1.15(前段慢、末段快),梢头几乎垂直落下
 *   冠体本身必须有几团叶:枝条插在空气里,那还是一把伞。
 */
function willow(tmp, x, z, groundY, h, seed) {
  const R = mulberry(seed);
  const g = new THREE.Group();
  g.position.set(x, groundY, z);
  const trunkH = h * 0.34;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.030, h * 0.066, trunkH, 7), MAT.bark);
  trunk.position.y = trunkH / 2;
  trunk.rotation.z = (R() - 0.5) * 0.16;          // 没有一棵柳是直的
  g.add(trunk);
  const crownY = trunkH + h * 0.40;
  const crownR = h * 0.33;

  // 冠:三团压扁的叶,把柳条"生出来"的地方填成实体
  const cLo = new THREE.Color(C.leafDeep), cHi = new THREE.Color(C.willow);
  for (let i = 0; i < 3; i++) {
    const rr = crownR * (0.72 + R() * 0.34);
    const geo = new THREE.IcosahedronGeometry(rr, 1);
    const p = geo.attributes.position;
    const ph = R() * 6.283;
    for (let k = 0; k < p.count; k++) {
      const vx = p.getX(k), vy = p.getY(k), vz = p.getZ(k);
      const a = Math.atan2(vz, vx);
      const w = 1 + 0.18 * Math.sin(a * 3 + ph) + 0.09 * Math.sin(a * 5 - ph);
      p.setX(k, vx * w);
      p.setZ(k, vz * w);
      p.setY(k, vy * w * 0.62);
    }
    geo.computeVertexNormals();
    const col = [];
    for (let k = 0; k < p.count; k++) {
      const up = Math.max(0, Math.min(1, (p.getY(k) / (rr * 0.62) + 1) / 2));
      const c = cLo.clone().lerp(cHi, 0.25 + 0.75 * up);
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, MAT.willowCrown);
    m.position.set((R() - 0.5) * crownR * 0.5,
      crownY + (i - 0.5) * crownR * 0.36, (R() - 0.5) * crownR * 0.5);
    g.add(m);
  }

  // 柳条 + 柳叶。
  // ⚠ 旧版是 40 根 TubeGeometry 半径 h*0.011(≈6 cm)的**光管** —— 那是水母触手。
  //   真柳条直径 1~1.5 cm,而且"帘"的体量几乎全部来自**叶**,不是条本身。
  //   所以:条降到 1.3 cm 并提到 48 根(提供骨架),每根沿线挂 6 簇叶(提供体量)。
  const n = 48;
  const N = 7;
  const tubeR = Math.max(0.010, h * 0.0026);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283 + R() * 0.5;
    const len = h * (0.34 + R() * 0.24);          // 梢头落在 0.16h 上下,不扫地
    const rStart = crownR * (0.42 + R() * 0.62);  // 起点在冠"体"内,不在冠心
    const bow = h * (0.05 + R() * 0.11);          // 只向外弓一点点
    const pts = [];
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      const sp = rStart + bow * Math.sin(Math.PI * t);
      const yy = crownY - len * Math.pow(t, 1.15);
      pts.push(new THREE.Vector3(Math.cos(a) * sp, yy, Math.sin(a) * sp));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 7, tubeR, 3, false), MAT.willow);
    g.add(tube);
    // 叶:沿条等分挂 6 簇,叶尖朝下、略向外张 —— 这才是"帘"
    for (let m = 1; m <= 6; m++) {
      const pt = curve.getPoint(0.12 + (m / 6) * 0.80);
      const lf = new THREE.Mesh(
        leafSprayGeo(0.30, 0.042, 2, (i * 5 + m * 3) % 6, 1.25), MAT.willowLeaf);
      lf.position.copy(pt);
      lf.rotation.y = a + (R() - 0.5) * 1.3;
      lf.rotation.z = (R() - 0.5) * 0.8;
      g.add(lf);
    }
  }
  tmp.add(g);
}

/**
 * 阔叶(香樟)。园林里的"冠"—— 松是背景,樟/柳才是园中住人的树。
 * 冠是**压扁的球**(y × 0.80):圆球读作气球,扁一点的伞冠才是阔叶。
 * 顶点色同样走竖向明暗 —— 冠顶受光、冠内是暗的,这是"体积"最便宜的做法。
 */
function broadleaf(tmp, x, z, groundY, h, seed) {
  const R = mulberry(seed);
  const g = new THREE.Group();
  g.position.set(x, groundY, z);
  const trunkH = h * 0.40;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.035, h * 0.074, trunkH, 7), MAT.bark);
  trunk.position.y = trunkH / 2;
  g.add(trunk);
  for (let i = 0; i < 3; i++) {                  // 主枝:把冠托起来
    const a = i / 3 * 6.283 + R();
    const br = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.014, h * 0.032, h * 0.32, 5), MAT.bark);
    br.position.set(Math.cos(a) * h * 0.09, trunkH + h * 0.11, Math.sin(a) * h * 0.09);
    br.rotation.z = Math.cos(a) * 0.40;
    br.rotation.x = -Math.sin(a) * 0.40;
    g.add(br);
  }
  const cLo = new THREE.Color(C.leafDeep), cHi = new THREE.Color(C.leaf);
  // ⚠ 6 团半球各飞各的 → 出来是"一丛花椰菜"。冠要**抱成一体**:
  //   团更多(9)、铺得更开却彼此重叠、半径差收紧,剪影才是一个连续的伞冠。
  const n = 9;
  for (let i = 0; i < n; i++) {
    const t = i === 0 ? 1 : 0.66 + R() * 0.30;
    const rr = h * 0.30 * t;
    const geo = new THREE.IcosahedronGeometry(rr, 1);
    const p = geo.attributes.position;
    const ph = R() * 6.283;
    for (let k = 0; k < p.count; k++) {
      const vx = p.getX(k), vy = p.getY(k), vz = p.getZ(k);
      const a = Math.atan2(vz, vx);
      const w = 1 + 0.16 * Math.sin(a * 3 + ph) + 0.08 * Math.sin(a * 5 - ph);
      p.setX(k, vx * w * 1.06);
      p.setZ(k, vz * w * 1.06);
      p.setY(k, vy * w * 0.70);
    }
    geo.computeVertexNormals();
    const col = [];
    for (let k = 0; k < p.count; k++) {
      const up = Math.max(0, Math.min(1, (p.getY(k) / (rr * 0.70) + 1) / 2));
      const c = cLo.clone().lerp(cHi, 0.30 + 0.70 * up);
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, MAT.leafBroad);
    m.position.set((R() - 0.5) * h * 0.30, trunkH + h * 0.24 + (R() - 0.5) * h * 0.16,
      (R() - 0.5) * h * 0.30);
    m.rotation.y = R() * 6.283;
    g.add(m);
  }
  // 冠缘散叶:球冠给"体",散叶给"毛"。少这一步,冠就是一个光滑的绿馒头。
  const cY = trunkH + h * 0.24;
  for (let i = 0; i < 34; i++) {
    const a = R() * 6.283;
    const el = Math.acos(1 - R() * 1.10);         // 偏上半球(下半球的叶被自身挡掉)
    const rr = h * 0.30 * (0.82 + R() * 0.36);
    const sp = new THREE.Mesh(
      leafSprayGeo(0.60, 0.098, 4, i % 6, 0.42), MAT.leafSpray);
    sp.position.set(Math.cos(a) * Math.sin(el) * rr,
      cY + Math.cos(el) * rr * 0.70,
      Math.sin(a) * Math.sin(el) * rr);
    sp.rotation.y = a + (R() - 0.5) * 0.9;
    sp.rotation.z = (R() - 0.5) * 0.6;
    g.add(sp);
  }
  tmp.add(g);
}

// ---------- 园池 ----------
/**
 * 园池。三件事:水面、岸线、驳岸石。
 *
 * 关键约束是**水位**:池是地形上挖出来的盆(见 environment 的 terrainHeight),
 * 但水面是一个 y = level 的水平面。要水不漫出岸,level 必须低于**整圈岸线**的地形。
 * 我不用硬编码常数 —— 沿水面外沿采 96 点取最低,再降 0.26 m。
 * 常数一旦碰上噪声的局部低谷,水就从那个缺口漏出去,而且是"从侧面看见水的截面"这种
 * 一眼假的形态(池边一圈 0.3 m 的垂直水墙)。
 */
function buildPond(tmp, terrainY, envMap) {
  const P = ENV.pond;
  const R = mulberry(9931);

  // 水位:设计值 与 采样校正值 取低
  let lo = Infinity;
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * 6.283;
    lo = Math.min(lo, terrainY(P.cx + Math.cos(a) * P.rx * 0.99,
      P.cz + Math.sin(a) * P.rz * 0.99));
  }
  const level = Math.min(P.level, lo - 0.26);

  /**
   * 求 a 方向上的**真实岸线**半径(归一化:1.0 = 标称 rx/rz)。
   * 岸线 = 「地形高度 = 水位」等高线,二分 22 次足够(过渡带宽 ~10 m,精度 2 µm)。
   * ⚠ 这是本版的核心修正。v52 按固定椭圆(1.03~1.14)摆石岸,而岸线是地形决定的,
   *   两者能差出 2~4 m —— 整圈石带浮在草坡上,驳岸等于没做。
   */
  const shoreAt = (a, strict = true) => {
    const dx = Math.cos(a), dz = Math.sin(a);
    let up = 1.34;                                  // 已知在水上(凹盆过渡带止于 1.0)
    if (terrainY(P.cx + dx * P.rx * up, P.cz + dz * P.rz * up) < level) return 1.0;
    let dn = 0.18;                                  // 已知在水下
    if (terrainY(P.cx + dx * P.rx * dn, P.cz + dz * P.rz * dn) > level) return strict ? 0.18 : 1.0;
    for (let i = 0; i < 22; i++) {
      const m = (dn + up) / 2;
      if (terrainY(P.cx + dx * P.rx * m, P.cz + dz * P.rz * m) < level) dn = m; else up = m;
    }
    return up;
  };

  /**
   * 岸线的角向扰动。**只向内收** —— 放出去水面就超出岸线,低机位能看见一圈垂直的水墙。
   * 两个频率:5 次(大湾,~12 m 一个)给"进进出出"的形体,11 次(小湾,~5 m)破掉大湾的规律感。
   * ⚠ 水面顶点与驳岸石**必须共用这一个函数**,否则石头会离开水面几十厘米。
   */
  const wob = (a) => 1 - 0.125 * (0.5 + 0.5 * Math.sin(a * 5 + 1.1))
                      - 0.070 * (0.5 + 0.5 * Math.sin(a * 11 - 0.6));

  // 水面:圆盘的**每个顶点半径都取真实岸线**。
  // 比"固定椭圆 + 正弦扰动"正确 —— 正弦只是把"岸线由地形决定"这件事做了个近似,
  //   近似一旦与地形错开,水就会悬空(从低机位能看见一圈垂直的水墙)。
  //   uv 仍用 CircleGeometry 的单位圆,岸边贴图的径向过渡不受影响。
  const geo = new THREE.CircleGeometry(1, 160);
  geo.rotateX(-Math.PI / 2);
  const pp = geo.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const px = pp.getX(i), pz = pp.getZ(i);
    if (Math.hypot(px, pz) < 0.02) continue;        // 圆心不动
    const a = Math.atan2(pz, px);
    const k = shoreAt(a, false) * wob(a);
    pp.setX(i, Math.cos(a) * k);
    pp.setZ(i, Math.sin(a) * k);
  }
  geo.scale(P.rx, 1, P.rz);
  geo.computeVertexNormals();                      // 改过顶点必须重算法线,否则反射会歪
  MAT.pond.envMap = envMap || null;
  const water = new THREE.Mesh(geo, MAT.pond);
  water.position.set(P.cx, level, P.cz);
  water.receiveShadow = true;                      // 岸石与树的影子要落在水上
  water.name = 'pond';
  tmp.add(water);

  // 驳岸石:中心落在岸线上 —— 一半在水里、一半在岸上,水陆接缝被石头吃掉。
  //   n 提到 46 且大小交错:等大的石头围一圈读作"串珠",大小交错才是"叠石驳岸"。
  const n = 42;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283 + (R() - 0.5) * 0.14;
    const k = shoreAt(a, false) * wob(a) + (R() - 0.5) * 0.030;
    const bx = P.cx + Math.cos(a) * P.rx * k;
    const bz = P.cz + Math.sin(a) * P.rz * k;
    const h = 0.50 + R() * 0.40;
    const sg = new THREE.IcosahedronGeometry(h * 0.5, 1);
    const sp = sg.attributes.position;
    const ph = R() * 6.283;
    // ⚠ 两个致命细节(上一版石岸读作"尖刺"就是这两个):
    //   ① 相位必须用顶点的**方位角**,不能用顶点索引 m —— 相邻索引相位跳 0.7 rad,
    //      半径随之跳变,光滑球面被搅成锯齿。
    //   ② 三个轴向的缩放系数必须**提到循环外**,一个石头一组常量。写在循环里
    //      (1.18 + R()*0.36) 会让相邻顶点缩得都不一样 —— 这是更彻底的碎法。
    const flat = 1.14 + R() * 0.34;               // 岸石横卧,不是圆球
    const sy = 0.48 + R() * 0.26;
    for (let m = 0; m < sp.count; m++) {
      const vx = sp.getX(m), vy = sp.getY(m), vz = sp.getZ(m);
      const ua = Math.atan2(vz, vx);
      const w = 1 + 0.22 * Math.sin(ua * 3 + ph) + 0.11 * Math.sin(ua * 5 - ph);
      sp.setX(m, vx * w * flat);
      sp.setZ(m, vz * w);
      sp.setY(m, vy * w * sy);
    }
    sg.computeVertexNormals();
    const st = new THREE.Mesh(sg, MAT.shore);
    // 石顶必须高过水位:h*0.5 的半高里抬 0.34 —— 而**基准取水位**,不取地形
    //   (取地形的话,岸线附近地形已低于水位,石头会整块没进水里)
    st.position.set(bx, Math.max(level - 0.10, terrainY(bx, bz) - 0.28) + h * 0.34, bz);
    st.rotation.y = R() * 6.283;
    tmp.add(st);
  }
  /**
   * 荷叶:池面唯一的**尺度参照物**。没有它,再大的池也只是一片颜色 —— 人眼无从判断它
   * 是三米还是三十米。江南园林的池边几乎必有,而且极便宜:一个带 V 形口的圆盘,边缘上翘。
   * ⚠ 圆盘用 thetaLength = 5.5 rad(315°)而不是 2π:荷叶有个 V 形裂口,整圆读作"浮盘"。
   * ⚠ 上翘取 r² 而不是 r:线性的边会翘成一个碗,平方才只翘起最外一小圈 —— 那才是荷叶。
   */
  const ln = 20;
  for (let i = 0; i < ln; i++) {
    const a = R() * 6.283;
    const rad = Math.sqrt(R()) * 0.76;              // 分布在池面之内,不贴岸
    const lx = P.cx + Math.cos(a) * P.rx * rad;
    const lz = P.cz + Math.sin(a) * P.rz * rad;
    // ⚠ 荷叶不许长在石矶与亭前的水面上(那里是主景,浮叶会把"挑出的石台"搅乱)
    if (Math.hypot(lx - 12.0, lz + 46.0) < 5.6) continue;
    const lr = 0.34 + R() * 0.42;
    const lg = new THREE.CircleGeometry(lr, 14, R() * 6.283, 5.5);
    lg.rotateX(-Math.PI / 2);
    const lp = lg.attributes.position;
    for (let m = 0; m < lp.count; m++) {
      const vx = lp.getX(m), vz = lp.getZ(m);
      const rr = Math.hypot(vx, vz) / lr;
      lp.setY(m, rr * rr * lr * 0.42);               // 只翘最外一圈
    }
    lg.computeVertexNormals();
    const leaf = new THREE.Mesh(lg, MAT.bamboo);
    leaf.position.set(lx, level + 0.035, lz);
    leaf.rotation.y = R() * 6.283;
    tmp.add(leaf);
  }

  return level;
}

// ---------- 亭 ----------
/**
 * 六角亭。江南园林池边的"眼" —— 池是面,亭是眼上的一点墨。
 *
 * 全部由**低边数旋转体**拼成,不写自定义几何:
 *   台基/台明/额枋 = CylinderGeometry(..., 6);攒尖顶 = ConeGeometry(..., 6)。
 * ⚠ 但攒尖顶的六条**垂脊必须单加**:tileCap 的瓦面是六棱锥的侧面,光滑一片,
 *   没有脊线就读作"一个六面锥" —— 有脊线才是"六角攒尖"。脊走顶点到六角,
 *   那正好是六棱锥的棱,所以直线连接即天然贴合锥面,不会切进去。
 * ⚠ 亭的方位:柱与台基/屋顶的六边形顶点方向都是 θ=0 → +z(three 的 CylinderGeometry
 *   顶点 x = r·sinθ)、z = r·cosθ)。柱子必须用同一套角度,否则柱会踩在台基的**边**上。
 */
function pavilion(tmp, x, z, terrainY, R0, H, seed) {
  const R = mulberry(seed);
  const g = new THREE.Group();
  g.position.set(x, 0, z);                         // ⚠ y = 0:组内直接用世界高度,省掉一层换算
  const r = R0;

  /**
   * 人工台地。台基是"做"出来的,它的顶面必须高过其下**所有**地形 ——
   * 否则低的一侧露出台基下的空洞、高的一侧被草坡吃掉半个台基。
   * 采样台基外沿一圈(24 点)取最高点定台明、最低点定埋深,台基高度自动适配地形。
   */
  let hi = -Infinity, lo = Infinity;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * 6.283;
    const y = terrainY(x + Math.sin(a) * (r + 0.72), z + Math.cos(a) * (r + 0.72));
    hi = Math.max(hi, y); lo = Math.min(lo, y);
  }
  const deckY = hi + 0.07;                         // 台明面标高
  const plinthH = deckY - (lo - 0.38);             // 底面沉到最低点以下 0.38

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.40, r + 0.62, plinthH, 6), MAT.shore);
  plinth.position.y = deckY - plinthH / 2;
  g.add(plinth);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.12, r + 0.12, 0.14, 6), MAT.collar);
  deck.position.y = deckY + 0.07;
  g.add(deck);
  const y0 = deckY + 0.14;                         // 台明面(柱脚落在这里)

  // 六柱(x = r·sinθ, z = r·cosθ —— 与六边形顶点同向)
  for (let i = 0; i < 6; i++) {
    const th = (i / 6) * 6.283;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.115, H, 8), MAT.timber);
    col.position.set(Math.sin(th) * r, y0 + H / 2, Math.cos(th) * r);
    g.add(col);
  }

  // 额枋:用一层六棱柱代替六根方木 —— 省 5 个几何,视觉上完全等价
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.07, r + 0.07, 0.20, 6), MAT.timber);
  beam.position.y = y0 + H + 0.10;
  g.add(beam);

  // 攒尖顶
  // ⚠ 出檐 0.78 / 顶高 1.50 是"一把伞"。江南六角亭的出檐约等于柱高的一半,
  //   攒尖还相当平缓(举高 ≈ 出檐)。0.78→1.06、1.50→1.18 之后才立得住"亭"这个字。
  const roofH = 1.18, roofR = r + 1.06;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(roofR, roofH, 6), MAT.tileCap);
  roof.position.y = y0 + H + 0.20 + roofH / 2;
  g.add(roof);
  const apex = new THREE.Vector3(0, y0 + H + 0.20 + roofH, 0);
  for (let i = 0; i < 6; i++) {
    const th = (i / 6) * 6.283;
    const b = new THREE.Vector3(Math.sin(th) * roofR, y0 + H + 0.20, Math.cos(th) * roofR);
    const dir = b.clone().sub(apex);
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.050, 0.050, dir.length(), 5), MAT.ridge);
    rib.position.copy(apex).add(b).multiplyScalar(0.5);
    rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    g.add(rib);
  }
  // 宝顶:座 + 珠 + 尖(三段,一段就是"插了根钉子")
  const finY = y0 + H + 0.20 + roofH;
  const fBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.20, 0.20, 8), MAT.ridge);
  fBase.position.y = finY + 0.10;
  g.add(fBase);
  const fBall = new THREE.Mesh(new THREE.SphereGeometry(0.155, 10, 8), MAT.ridge);
  fBall.position.y = finY + 0.34;
  g.add(fBall);
  const fTip = new THREE.Mesh(new THREE.ConeGeometry(0.070, 0.40, 8), MAT.ridge);
  fTip.position.y = finY + 0.66;
  g.add(fTip);

  // 美人靠:座凳面 + 靠背。朝池那一面(θ=0 → +z)**留空**当出入口。
  for (let i = 0; i < 6; i++) {
    if (i === 0) continue;                          // 30° 那一段留口(边中点,不与柱相撞)
    const th = (i / 6 + 1 / 12) * 6.283;            // 段中
    // ⚠ 切向是 (cosθ, **-sinθ**) —— 柱位用 (sinθ, cosθ),对它求导才是切向。
    //   所以 rotation.y = **+th**(把 x 轴转到 (cos th, 0, -sin th));写成 -th 会让座面
    //   横穿柱子、靠背悬空。木构件"飘着"十有八九是这类角度符号错,不是位置错。
    const seat = new THREE.Mesh(new THREE.BoxGeometry(r * 0.88, 0.09, 0.16), MAT.timber);
    seat.position.set(Math.sin(th) * r * 0.94, y0 + 0.42, Math.cos(th) * r * 0.94);
    seat.rotation.y = th;
    g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(r * 0.88, 0.07, 0.09), MAT.timber);
    back.position.set(Math.sin(th) * r * 0.98, y0 + 0.90, Math.cos(th) * r * 0.98);
    back.rotation.y = th;
    g.add(back);
    // 蜀柱:把座面与靠背串起来,不然靠背是"飘着的一根"
    for (const u of [-0.36, 0.36]) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.50, 0.06), MAT.timber);
      st.position.set(Math.sin(th) * r * 0.95 + Math.cos(th) * r * 0.86 * u,
        y0 + 0.66,
        Math.cos(th) * r * 0.95 - Math.sin(th) * r * 0.86 * u);
      st.rotation.y = th;
      g.add(st);
    }
  }
  tmp.add(g);
  return { deckY, y0 };                            // 石矶要用台明标高接上去
}

/**
 * 临水石矶:亭 → 台阶 → 挑出水面的石台。
 *
 * 为什么必须有:亭立在岸上、水面在 8 m 外的低处,中间只能是一片空草坡 ——
 * 从月洞门望过去是"草地上一个亭子",不是"池畔一个亭子"。石矶把两者焊成一件。
 * 也是唯一能优雅处理"岸高水低"这 1.9 m 落差的手法(直接种草坡就是土坡)。
 *
 * ⚠ 石台是**水平**的,而池岸地形是下坡:台子南缘必然悬空。不许把它埋进坡里填平,
 *   那不是石矶是土台。悬空那一侧用石柱落到水下 —— 这才是"挑"出去的石台。
 * ⚠ 池在亭的**南侧**,即局部 **+z** 方向(three 里 -z 是"进深/后方")。
 */
function stoneJetty(tmp, px, pz, y0, R0, level, seed) {
  const g = new THREE.Group();
  g.position.set(px, 0, pz);                       // y=0:组内直接用世界高度,省一层换算
  // ⚠ 整组绕 y 转 30° —— 六角亭的**柱**在 0°/60°/…,**边**的中点在 30°/90°/…。
  //   石矶必须正对边中点(开口处),朝 0° 会一头撞在柱子上。
  // ⚠ 方向取 **-30°(西南)**:池心在亭的西南(x 更小)。朝 +30° 会往东北走,
  //   归一化距池心反而变大 —— 石台整段落在岸上,一根石柱都碰不到水。
  g.rotation.y = -Math.PI / 6;
  const jw = R0 * 2 - 0.90;                        // 台面比亭窄,给六角台明留出边
  const deckTop = level + 0.34;
  const stepN = 4, stepD = 0.42;
  const stepH = (y0 - deckTop) / stepN;

  // 台阶:自亭台明向南(+z,朝池)下。顶面标高精确落在 y0 - stepH·(i+1),末级 = 石台面。
  const z0 = R0 + 0.10;
  for (let i = 0; i < stepN; i++) {
    const topY = y0 - stepH * (i + 1);
    // ⚠ 厚出 1.05:台基到池边地形下降快,只厚出 0.55 时最下两级的下沿仍露出一线空
    //   (从低机位看是"三块悬空的石板")。
    const th = stepH + 1.05;
    const st = new THREE.Mesh(new THREE.BoxGeometry(jw, th, stepD), MAT.collar);
    st.position.set(0, topY - th / 2, z0 + stepD * (i + 0.5));
    g.add(st);
  }

  // 石台:水平,挑出水面
  const dOut = 2.10;
  const zNear = z0 + stepD * stepN;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(jw, 0.32, dOut), MAT.collar);
  slab.position.set(0, deckTop - 0.16, zNear + dOut / 2);
  g.add(slab);
  // 台缘压条:一圈略深的边,石板才不是"一块浮板"
  const rim = new THREE.Mesh(new THREE.BoxGeometry(jw + 0.24, 0.15, dOut + 0.24), MAT.shore);
  rim.position.set(0, deckTop - 0.28, zNear + dOut / 2);
  g.add(rim);

  // 支撑:两根石柱落到水下(挑出那一侧的底)
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.26, 2.2, 6), MAT.shore);
    leg.position.set(sx * jw * 0.30, deckTop - 0.32 - 1.1, zNear + dOut - 0.55);
    g.add(leg);
  }
  tmp.add(g);
}

// ---------- 铺地 ----------
/** 石板贴图:方石板 + 深缝 + 细颗粒。没有缝的话,侧光下就是四块纯色 */
function slabTexture(size = 256, cells = 3, seed = 31) {
  const R = mulberry(seed);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  // ⚠ 缝色原来是 #7e807a —— 亮底上画深线,整片读成"卫生间地砖"。
  //   真石板的缝只比石面**暗一档**,不是格线。
  g.fillStyle = '#8b8d86';
  g.fillRect(0, 0, size, size);
  // ⚠ 石板读成"瓷砖"的真因不是颜色,是**规整**:等大、等缝、等色。真石板是同
  //   一批料,缝宽、色相、风渍全都在跳。四边各给一个独立内缩 + 一块中央风渍。
  const cs = size / cells;
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      const il = size * (0.005 + R() * 0.012), ir = size * (0.005 + R() * 0.012);
      const it = size * (0.005 + R() * 0.012), ib = size * (0.005 + R() * 0.012);
      const v = 142 + Math.floor(R() * 34);
      const x0 = i * cs + il, y0 = j * cs + it, w0 = cs - il - ir, h0 = cs - it - ib;
      g.fillStyle = 'rgb(' + (v - 3) + ',' + v + ',' + (v + 3) + ')';
      g.fillRect(x0, y0, w0, h0);
      // 一块风渍:石板中央略暗的一团,打散"平涂"感
      if (R() < 0.6) {
        const gr = g.createRadialGradient(
          x0 + w0 * (0.3 + R() * 0.4), y0 + h0 * (0.3 + R() * 0.4), 1,
          x0 + w0 / 2, y0 + h0 / 2, Math.max(2, w0 * 0.66));
        gr.addColorStop(0, 'rgba(96,100,96,0.15)');
        gr.addColorStop(1, 'rgba(96,100,96,0)');
        g.fillStyle = gr;
        g.fillRect(x0, y0, w0, h0);
      }
    }
  }
  const img = g.getImageData(0, 0, size, size);
  for (let k = 0; k < img.data.length; k += 4) {
    const n = (Math.random() - 0.5) * 11;
    img.data[k] = Math.max(0, Math.min(255, img.data[k] + n));
    img.data[k + 1] = Math.max(0, Math.min(255, img.data[k + 1] + n));
    img.data[k + 2] = Math.max(0, Math.min(255, img.data[k + 2] + n));
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;                              // 地面必是掠射角,不设会走样成摩尔纹
  return t;
}

/**
 * 一片铺地:逐顶点贴地 + **四周落裙边**。
 * ⚠ 只贴地不落裙边的话,掠射角下它就是"草地上浮着的一张纸":顶面与草地之间那
 *   4.5 cm 缝在画面里读成一条亮边,边界又硬又直(v45 的门前场坪正是如此)。
 *   真实的铺地是**有厚度**的 —— 给一圈 0.34 m 的垂面把板沉进地里,边缘就从
 *   "纸的断面"变成"石板的侧面"。
 */
function buildPaving(tmp, terrainY, r) {
  const w = r.x1 - r.x0, d = r.z1 - r.z0;
  // ⚠ 采样步长必须**小于地形网格**(terrain.r*2/100 ≈ 1.9 m)。原 1.6 m + 抬 4.5 cm
  //   在地形隆起处会被戳穿,门前场坪上就露出一块块土色斑(看着像地上摆了两块木板)。
  const segX = Math.max(2, Math.round(w / 0.9)), segZ = Math.max(2, Math.round(d / 0.9));
  const SINK = 0.34;
  const top = (x, z) => terrainY(x, z) + 0.07;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= segZ; j++) {
    for (let i = 0; i <= segX; i++) {
      const wx = r.x0 + w * i / segX, wz = r.z0 + d * j / segZ;
      pos.push(wx, top(wx, wz), wz);
      uv.push(wx / 3.6, wz / 3.6);         // 米 → uv;cells=3 → 石板 1.2 m 一格
    }
  }
  const row = segX + 1;
  for (let j = 0; j < segZ; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * row + i, b = a + 1, c = a + row, e = c + 1;
      idx.push(a, c, b, b, c, e);
    }
  }
  // 裙边:沿周长一圈垂面。uv 取常数 → 不出现被拉长的石缝,只留一个素的石色侧边
  const ring = [];
  for (let i = 0; i <= segX; i++) ring.push(i);
  for (let j = 1; j <= segZ; j++) ring.push(j * row + segX);
  for (let i = segX - 1; i >= 0; i--) ring.push(segZ * row + i);
  for (let j = segZ - 1; j >= 1; j--) ring.push(j * row);
  ring.push(ring[0]);
  const bot = [];
  for (const bi of ring) {
    const k = bi * 3;
    bot.push(pos.length / 3);
    pos.push(pos[k], pos[k + 1] - SINK, pos[k + 2]);
    uv.push(0.62, 0.62);
  }
  for (let i = 0; i < ring.length - 1; i++) {
    const t0 = ring[i], t1 = ring[i + 1], b0 = bot[i], b1 = bot[i + 1];
    idx.push(t0, b0, t1, t1, b0, b1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  tmp.add(new THREE.Mesh(geo, MAT.paving));
}

// ---------- 装配 ----------
export function buildGarden({ terrainY, envMap }) {
  const group = new THREE.Group();
  group.name = 'garden';
  const tmp = new THREE.Group();

  const S = GARDEN.south, L = GARDEN.lattice, W = GARDEN.wall;
  const startX = S.splay.to.x;                 // 直墙起点 |x|
  const straight = S.outTo - startX;           // 直墙长度

  for (const sgn of [-1, 1]) {
    const f = { x: sgn * S.splay.from.x, z: S.splay.from.z };
    const t = { x: sgn * S.splay.to.x, z: S.splay.to.z };
    // 八字墙:从门楼台基侧向前外撇,再折回直墙 —— 苏州正门的标准做法
    wallRun(tmp, f.x, f.z, t.x, t.z, groundMin(terrainY, f.x, f.z, t.x, t.z));

    // ⚠ 直墙的墙脚标高**必须只算一次并复用**。墙身(wallGeo)的局部 y=0 落在 baseY 上,
    //   而 baseY = 地形最低点 − 0.30(埋深);窗洞坐标是"自墙脚地面向上"。两者差 0.30:
    //   若窗套按 terrainY 定位,它就会比窗洞**高 0.30 m**,洞的底边露出一条缝
    //   —— 那正是 v45 里"漏窗下面挂了条绿带"的原因。
    const straightBase = groundMin(terrainY, t.x, t.z, sgn * S.outTo, S.z);

    // 直墙:墙上按 centersX 开窗洞(洞 = 窗的外形,窗套自己填进去)
    const holes = L.centersX
      .filter((cx) => cx >= startX && cx <= S.outTo)
      .map((cx) => [cx - startX, L.sill + L.h / 2, L.w, L.h]);
    wallRun(tmp, t.x, t.z, sgn * S.outTo, S.z, straightBase, holes);

    // 漏窗:窗套用**砖细**(collar),不用粉墙 —— 同色的白套在白墙上等于没做
    L.centersX.forEach((cx, i) => {
      if (cx < startX || cx > S.outTo) return;
      const pattern = L.patterns[i % L.patterns.length];
      const geo = latticeWindowGeo(L.w + 0.05, L.h + 0.05, L.frame, pattern, 900 + i * 37 + (sgn > 0 ? 0 : 500));
      const m = new THREE.Mesh(geo, MAT.collar);
      m.position.set(sgn * cx, straightBase + L.sill + L.h / 2, S.z);
      m.rotation.y = sgn > 0 ? 0 : Math.PI;      // 让贴图正反一致(两面都是墙,视觉上无差,但避免法线反)
      tmp.add(m);
    });
  }

  // 内园月洞门(园门北侧,东西向短墙)
  const M = GARDEN.moon;
  moonGateWall(tmp, M.x1 - M.x0, groundMin(terrainY, M.x0, M.z, M.x1, M.z));

  // 竹丛
  for (const [bx, bz, bh, seed] of GARDEN.bamboo) {
    bambooCluster(tmp, bx, bz, terrainY(bx, bz), bh, seed);
  }

  // 置石(太湖石)
  for (const [rx, rz, rh, rs] of GARDEN.rockery) {
    rockery(tmp, rx, rz, terrainY(rx, rz), rh, rs);
  }
  // 垂柳(河岸) + 阔叶(园内)
  for (const [wx, wz, wh, ws] of GARDEN.willow) {
    willow(tmp, wx, wz, terrainY(wx, wz), wh, ws);
  }
  for (const [bx, bz, bh, bs] of GARDEN.broadleaf) {
    broadleaf(tmp, bx, bz, terrainY(bx, bz), bh, bs);
  }

  // 园池(园子的心) —— 必须在铺地之前,后续构件才好围着它定位
  const pondLevel = buildPond(tmp, terrainY, envMap);

  // 池畔六角亭(对景)
  const PV = GARDEN.pavilion;
  const pv = pavilion(tmp, PV.x, PV.z, terrainY, PV.r, PV.h, 7717);

  // 亭前的临水石矶:把亭与水面连成一件事(水位取 buildPond 的返回值,标高取台明)
  stoneJetty(tmp, PV.x, PV.z, pv.y0, PV.r, pondLevel, 3391);

  // 铺地:门前场坪 + 穿门甬道
  for (const r of GARDEN.paving) buildPaving(tmp, terrainY, r);

  // 合桶:⚠ 必须先 emit 把临时树收进桶,flushBin 才有东西可合并 —— 漏掉 emit 的话
  //   flushBin 拿到的是空桶,园林会**静默地什么都不渲染**(不报错,自检只在 #4 露馅)。
  emit(tmp);
  const meshes = flushBin(tmp, { shadow: true });
  for (const m of meshes) {
    // ⚠ 竹叶是 DoubleSide 薄片:开投影会自己糊自己(shadow acne,细条纹)。
    //   这是 salt-plant 里"贴地薄板开 castShadow"同一个坑,在叶子这类散片上更明显。
    if (m.material === MAT.bamboo) m.castShadow = false;
    if (m.material === MAT.willowLeaf) m.castShadow = false;
    if (m.material === MAT.leafSpray) m.castShadow = false;
    // ⚠ 铺地同理,而且更明显:一整片 40 × 8 m 的水平薄板自投影,法线几乎平行于光,
    //   摄影机一动就是一层滚动的条纹。平片只该"接影",不该"投影"。
    if (m.material === MAT.paving) m.castShadow = false;
    if (m.material === MAT.pond) m.castShadow = false;
    // 墙身(MAT.plaster:南墙直段 + 月洞门墙)单列成 'wall' 站 —— 用户点墙看的是
    //   「粉墙 · 漏窗 · 月洞门」;点池/亭/铺地/石/竹才是「园心 · 池 · 亭」。
    m.userData.partId = m.material === MAT.plaster ? 'wall' : 'garden';
    group.add(m);
  }
  group.userData.terrainHeight = terrainY;
  return group;
}

export { MAT as GARDEN_MATS };
