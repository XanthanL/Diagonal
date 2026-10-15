// 工具层:几何合并(借鉴 salt-plant-3d 验证过的实现)/ 程序贴图 / 辉光精灵
import * as THREE from 'three';

// ---------- 静态几何合并:把临时对象树按材质收进合并桶,draw call 回落 ----------
function mergeGeos(list) {
  let vCount = 0, iCount = 0, hasCol = false;
  for (const g of list) {
    vCount += g.attributes.position.count;
    iCount += g.index ? g.index.count : g.attributes.position.count;
    if (g.attributes.color) hasCol = true;
  }
  const pos = new Float32Array(vCount * 3);
  const nor = new Float32Array(vCount * 3);
  const uv = new Float32Array(vCount * 2);
  // ⚠ 顶点色必须一起搬。丢掉它不会报错 —— 而 vertexColors:true 的材质拿不到 color
  //   属性时,attribute 默认取 (0,0,0) → **整块渲成纯黑**。这是最阴的一类静默失败。
  const col = hasCol ? new Float32Array(vCount * 3) : null;
  const idx = vCount > 65535 ? new Uint32Array(iCount) : new Uint16Array(iCount);
  let vo = 0, io = 0;
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    pos.set(p.array, vo * 3);
    if (n) nor.set(n.array, vo * 3);
    if (u) uv.set(u.array, vo * 2);
    if (col) {
      if (g.attributes.color) col.set(g.attributes.color.array, vo * 3);
      else col.fill(1, vo * 3, (vo + p.count) * 3);   // 同桶里没顶点色的按白(不改变原色)
    }
    if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx[io + i] = a[i] + vo; io += a.length; }
    else { for (let i = 0; i < p.count; i++) idx[io + i] = vo + i; io += p.count; }
    vo += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  return out;
}

const _bin = new Map();
const _m4 = new THREE.Matrix4();
/** 把(未入场的)对象树按材质收集进合并桶 */
function emit(obj, base) {
  obj.updateMatrixWorld(true);
  obj.traverse((o) => {
    if (!o.isMesh) return;
    _m4.copy(o.matrixWorld);
    if (base) _m4.premultiply(base);
    let arr = _bin.get(o.material);
    if (!arr) { arr = []; _bin.set(o.material, arr); }
    arr.push(o.geometry.clone().applyMatrix4(_m4));
  });
}
/** 把合并桶落成 mesh 挂到 parent;返回落成的 mesh 数组 */
function flushBin(parent, { shadow = true } = {}) {
  const out = [];
  _bin.forEach((arr, mat) => {
    const merged = mergeGeos(arr);
    arr.forEach((a) => a.dispose());
    const m = new THREE.Mesh(merged, mat);
    if (shadow) { m.castShadow = true; m.receiveShadow = true; }
    parent.add(m);
    out.push(m);
  });
  _bin.clear();
  return out;
}

// ---------- 确定性伪随机:贴图烘焙要可复现,不能用 Math.random ----------
function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 无缝值噪声:粗网格随机值 + 平滑插值,索引取模 → 平铺无缝。
 * 存在的理由:用正弦叠加做中频斑驳,会在整个平面上切出**肉眼可见的规则格**
 * (白灰墙上表现为一层"纱窗",实测非常穿帮)。噪声没有周期,不会有这个问题。
 */
function valueNoise2D(cells, seed) {
  const rb = mulberry(seed);
  const g = new Float32Array(cells * cells);
  for (let i = 0; i < g.length; i++) g[i] = rb();
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = x * cells, fy = y * cells;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = sm(fx - x0), ty = sm(fy - y0);
    const i0 = ((x0 % cells) + cells) % cells, i1 = (i0 + 1) % cells;
    const j0 = ((y0 % cells) + cells) % cells, j1 = (j0 + 1) % cells;
    const a = g[j0 * cells + i0], b = g[j0 * cells + i1];
    const c = g[j1 * cells + i0], d = g[j1 * cells + i1];
    return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
  };
}

// ---------- 程序贴图 ----------
/** 柔和径向辉光精灵(canvas 生成) */
function glowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, inner.replace(/[\d.]+\)$/, '0.55)'));
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** 圆点粒子贴图(灵火/溪流用) */
function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * 无机质地贴图(石作 / 白灰墙 / 草地通用)。
 * 关键是**多尺度**:只有 per-pixel 噪声时,大面积上会被平均成"一块平色板" ——
 * 这正是"塑料感"的来源。所以由三层叠成:
 *   低频渍斑(柔团,九宫重绘保证平铺无缝) + 中频斑驳(整数周期 sine) + 高频颗粒
 * ⚠ 中频给整数周期(2π/32 → 8 个周期铺满 256),否则左右接缝上会有一条断线。
 */
function grainTexture(base = '#ffffff', amp = 18, opts = {}) {
  const { blotch = 5, blotchAmp = 0.06, mottle = 0.085, seed = 9173, size = 256, mottleCells = 4 } = opts;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  const rb = mulberry(seed);
  const off = [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size],
    [size, size], [size, -size], [-size, size], [-size, -size]];
  for (let i = 0; i < blotch; i++) {
    const bx = rb() * size, by = rb() * size, br = size * (0.18 + rb() * 0.26);
    const dark = rb() < 0.55;
    const a = blotchAmp * (0.5 + rb() * 0.8);
    const tone = dark ? '0,0,0' : '255,255,255';
    for (const [ox, oy] of off) {
      const gr = g.createRadialGradient(bx + ox, by + oy, 0, bx + ox, by + oy, br);
      gr.addColorStop(0, 'rgba(' + tone + ',' + a.toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(' + tone + ',0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(bx + ox, by + oy, br, 0, Math.PI * 2); g.fill();
    }
  }
  const n1 = valueNoise2D(mottleCells, seed + 11);
  const n2 = valueNoise2D(mottleCells * 3, seed + 29);
  const img = g.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const m = 1 + mottle * ((n1(x / size, y / size) - 0.5) * 1.7 + (n2(x / size, y / size) - 0.5) * 0.85);
      const n = (Math.random() - 0.5) * amp;
      img.data[i] = Math.max(0, Math.min(255, img.data[i] * m + n));
      img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] * m + n));
      img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] * m + n));
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/**
 * 白灰墙:细颗粒 + **竖向雨痕/流挂**。
 * ⚠ 关键不是幅度而是**方向性**:各向同性的斑块贴在竖直墙面上,受光后读成"霉斑/水渍"
 *   (实测就是一面脏墙)。只有沿 x 变化、沿 y 恒定的条带,才读得出"被雨淋过的粉墙"。
 *   条带只对 x 采样,所以 y 方向天然无缝。
 */
function wallTexture(base = '#efe6d1', opts = {}) {
  const { size = 256, amp = 15, streak = 0.075, seed = 606 } = opts;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  const ns = valueNoise2D(6, seed + 5);
  const ng = valueNoise2D(24, seed + 9);
  const img = g.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const u = x / size, v = y / size;
      const streakK = Math.max(0, ns(u, 0.37) - 0.55) * 2.3;
      const m = 1 - streakK * streak + (ng(u, v) - 0.5) * 0.10;
      const n = (Math.random() - 0.5) * amp;
      img.data[i] = Math.max(0, Math.min(255, img.data[i] * m + n));
      img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] * m + n));
      img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] * m + n));
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** 由无缝值噪声转出的法线贴图:给草地/石作一点微观起伏。
 *  ⚠ 没有它,大面积平面在平行光下就是一张塑料片 —— 颜色贴图再细也救不回来。 */
function grainNormalTexture(size = 256, cells = 26, strength = 3.2, seed = 777) {
  const n1 = valueNoise2D(cells, seed);
  const n2 = valueNoise2D(cells * 3, seed + 3);
  const at = (x, y) => {
    const u = (((x % size) + size) % size) / size;
    const v = (((y % size) + size) % size) / size;
    return n1(u, v) * 0.72 + n2(u, v) * 0.28;
  };
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 0.5;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 0.5;
      const nx = -dx * strength * size * 0.05, ny = -dy * strength * size * 0.05, nz = 1;
      const l = Math.hypot(nx, ny, nz);
      const i = (y * size + x) * 4;
      img.data[i] = (nx / l * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/**
 * 窗纸:横向帘纹 + 大尺度透光不均 + 微噪点。
 * 格扇窗芯原本是一整块 emissive 平色 → 读作色卡。有了这张,它才是一层纸、后面有灯火。
 */
function paperTexture(base = '#ffd9a0', opts = {}) {
  const { size = 256, lit = 0.32, lines = 32, seed = 4231 } = opts;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  const rb = mulberry(seed);
  for (let i = 0; i < 8; i++) {
    const bx = rb() * size, by = rb() * size, br = size * (0.2 + rb() * 0.3);
    const a = lit * (0.45 + rb() * 0.75);
    const gr = g.createRadialGradient(bx, by, 0, bx, by, br);
    gr.addColorStop(0, 'rgba(255,248,225,' + a.toFixed(3) + ')');
    gr.addColorStop(1, 'rgba(255,248,225,0)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
  }
  // 帘纹:线距整除尺寸才无缝
  const step = size / Math.round(lines);
  g.strokeStyle = 'rgba(120,86,50,0.15)';
  g.lineWidth = 1;
  for (let i = 0; i < Math.round(lines); i++) {
    const y = i * step + step * 0.5;
    g.beginPath(); g.moveTo(0, y); g.lineTo(size, y); g.stroke();
  }
  const img = g.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/**
 * 水波法线:两列**整数波数**的 sine 交织 → 平铺无缝。
 * 用它(而不是在片元里手写扰动)的好处:法线交给 PBR 走,镜面反射/菲涅耳自动是对的。
 * ⚠ 法线贴图必须 NoColorSpace —— 当 sRGB 解码会得到错误的方向。
 */
function rippleNormalTexture(size = 256, cells = 11) {
  // ⚠ 曾用两三列正弦叠加:任何"周期"结构在镜面反射下都会结成规则亮点阵(泡泡纸 / 纱窗)。
  //   水面的法线必须是不规则的 —— 改用多倍频 value noise,天生没有格点。
  //   三个倍频的权重是按"每像素梯度 ≈ 0.14"配的(与旧正弦版同量级),
  //   所以 S = 5.0 的收尾不用动,normalScale 也还在同一个量纲上。
  const n0 = valueNoise2D(cells, 2027);
  const n1 = valueNoise2D(cells * 2 + 1, 4129);
  const n2 = valueNoise2D(cells * 4 + 3, 8231);
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      h[y * size + x] = n0(u, v) * 0.42 + n1(u, v) * 0.34 + n2(u, v) * 0.24;
    }
  }
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const at = (x, y) => h[((y % size) + size) % size * size + (((x % size) + size) % size)];
  const S = 5.0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 0.5;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 0.5;
      const nx = -dx * S, ny = -dy * S, nz = 1;
      const l = Math.hypot(nx, ny, nz);
      const i = (y * size + x) * 4;
      img.data[i] = (nx / l * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** 径向水色:潭心深 → 外圈碧 → 极近岸一线浅滩(CircleGeometry 的 uv 是内切圆) */
function waterColorTexture(deepHex, midHex, shoreHex, aspect = 1) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const hx = (h) => 'rgb(' + ((h >> 16) & 255) + ',' + ((h >> 8) & 255) + ',' + (h & 255) + ')';
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0.00, hx(deepHex));
  gr.addColorStop(0.38, hx(midHex));
  gr.addColorStop(0.84, hx(midHex));
  gr.addColorStop(1.00, hx(shoreHex));
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  // 叠一层斑驳:只有一圈干净的径向渐变时,水面在受光下读成一块塑料板
  // ⚠ 尺度是陷阱:贴图 uv 覆盖整个水湾(84 m × 20 m),cells=4 就是 21 m 一块的大色斑,
  //   反而把水画"脏"了(实测像水面浮了一层油膜)。14/38/90 → 斑块 0.9~6 m 才是水的深浅。
  const n1 = valueNoise2D(14, 313);
  const n2 = valueNoise2D(38, 909);
  const n3 = valueNoise2D(90, 1717);
  const img = g.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // ⚠ 幅度必须够大:一圈干净的径向渐变 + 均匀反射 = 一块塑料板。
      //   0.78~1.26 才够在明暗上做出"深浅不一的水";±10% 会被光照直接平均掉。
      // ⚠ uv 是内接正方形,圆盘再按 (rx, rz) 拉伸 —— 水湾 84 m × 20 m = 4.2:1。
      //   valueNoise 在等格数下,沿 x 的格子就是沿 z 的 4.2 倍宽 → 斑驳被拉成一道道
      //   顺河的长条(法线图早就按 8.4/2.0 补偿过了,颜色图漏了这一步)。
      //   把 v 除以 aspect,两轴的**世界**格子边长才相等。
      const vv = (y / size) / aspect;
      const m = n1(x / size, vv) * 0.50 + n2(x / size, vv) * 0.32 + n3(x / size, vv) * 0.18;
      // ⚠ 上摆给到 +18% 时,叠加在天空反射上就是一个明晃晃的"水床鼓包"。
      //   水的深浅是**压暗**出来的,不是提亮 —— 所以把摆幅挪到负半边。
      const k = 0.80 + 0.26 * m;
      img.data[i] = Math.min(255, img.data[i] * k);
      img.data[i + 1] = Math.min(255, img.data[i + 1] * k);
      img.data[i + 2] = Math.min(255, img.data[i + 2] * k);
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** 青瓦瓦垄贴图:横向一个"筒瓦拱 + 板瓦沟"周期(无缝),纵向带极轻雨痕。
 *  瓦垄是跟着 uv.x 走的:调用方把 uv.x 设成 弧长/垄距,所以贴图横向周期必须=1。 */
function roofTileTexture(tileHex, ridgeHex, deepHex) {
  const W = 96, H = 64;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(W, H);
  const hx = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  const rr = mulberry(606);                         // 确定性:截图要能逐版比对
  const A = hx(tileHex), R = hx(ridgeHex), D = hx(deepHex);
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  for (let y = 0; y < H; y++) {
    const dirt = 1 - (y / H) * 0.05;                  // 顺坡往下略脏(雨痕),幅度极小
    for (let x = 0; x < W; x++) {
      const t = x / W;
      // 0~0.46 板瓦(凹沟压暗) / 0.46~1 筒瓦(半圆拱提亮)
      // ⚠ 对比度必须给足:0.32 / 0.72 这种"温和"的差值在 6 px / 垄 的屏幕上会被直接
      //   平均掉,屋顶读成一块纯色板。0.80 / 1.15 且让筒瓦顶越过 ridge 色,瓦垄才看得见。
      const k = t < 0.46
        ? -0.80 * Math.sin((t / 0.46) * Math.PI)
        : 1.15 * Math.pow(Math.sin(((t - 0.46) / 0.54) * Math.PI), 0.7);
      const col = k >= 0 ? mix(A, R, Math.min(1, k)) : mix(A, D, Math.min(1, -k));
      const n = 1 + (rr() - 0.5) * 0.05;
      const i = (y * W + x) * 4;
      img.data[i] = Math.min(255, col[0] * dirt * n);
      img.data[i + 1] = Math.min(255, col[1] * dirt * n);
      img.data[i + 2] = Math.min(255, col[2] * dirt * n);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;          // 屋面总是掠射角,各向异性低了瓦垄会被磨平
  return tex;
}

/**
 * 瓦垄法线:与 roofTileTexture 用同一套剖面(板瓦凹沟 / 筒瓦半圆拱)求导得出。
 * 只给颜色不给法线时,瓦垄只是"画上去的条纹";有了法线,太阳才会在筒瓦顶拉出高光、
 * 在板瓦沟里留暗 —— 屋面才是一层瓦,而不是一块印花布。
 * strength = 1.0 对应最大坡度约 1.0(45°),正好是筒瓦该有的圆拱陡度。
 */
function roofRidgeNormal(size = 64, strength = 1.0) {
  const W = 96;
  const prof = (t) => (t < 0.46
    ? -0.34 * Math.sin((t / 0.46) * Math.PI)
    : 0.80 * Math.pow(Math.sin(((t - 0.46) / 0.54) * Math.PI), 0.72));
  const c = document.createElement('canvas');
  c.width = W; c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(W, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < W; x++) {
      const t = (x + 0.5) / W;
      const d = (prof((t + 1 / W) % 1) - prof((t - 1 / W + 1) % 1)) * 0.5;
      const nx = -d * strength * 42, nz = 1;          // 沿垄向恒定 → ny ≡ 0
      const l = Math.hypot(nx, nz);
      const i = (y * W + x) * 4;
      img.data[i] = (nx / l * 0.5 + 0.5) * 255;
      img.data[i + 1] = 128;
      img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.NoColorSpace;             // 法线图绝不能被当 sRGB 解码
  return tex;
}

/**
 * 云:低频 value noise 烘成一张带 alpha 的白斑,给天穹铺一层淡云。
 * 天穹只有渐变时会读成"蓝幕布"—— 云是给天空补重量最省的一招(零新增 mesh)。
 * u 向 repeat 取整数 3,绕一圈接缝才无缝。
 */
function cloudTexture(size = 256, seed = 6161) {
  const na = valueNoise2D(4, seed);
  const nb = valueNoise2D(9, seed + 17);
  const nc = valueNoise2D(19, seed + 41);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const n = na(u, v) * 0.58 + nb(u, v) * 0.28 + nc(u, v) * 0.14;
      const k = Math.max(0, (n - 0.44) / 0.56);      // 阈值以下留白:天要透,不能糊满
      const a = Math.round(Math.min(1, k * k) * 240);
      const i = (y * size + x) * 4;
      img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255;
      img.data[i + 3] = a;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 把天穹烘成 PMREM 环境贴图 → 水面可以真的"映天"。
 * 只给水面材质用(不要挂 scene.environment,那会顺手改掉全场的受光)。
 * PMREMGenerator 内部会把 toneMapping 置 NoToneMapping、outputColorSpace 置线性,
 * 所以烘出来的是一张真正的线性 HDR,不会把 ACES 烤两遍。
 */
function skyEnvironment(renderer, skyMesh) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const scene = new THREE.Scene();
  const clone = skyMesh.clone();
  clone.position.set(0, 0, 0);
  scene.add(clone);
  const rt = pmrem.fromScene(scene, 0, 0.1, 1200);
  pmrem.dispose();
  return rt.texture;
}

export {
  mergeGeos, emit, flushBin, mulberry, valueNoise2D,
  glowTexture, dotTexture, grainTexture, paperTexture,
  wallTexture, grainNormalTexture,
  rippleNormalTexture, waterColorTexture, roofTileTexture,
  roofRidgeNormal, cloudTexture, skyEnvironment,
};
