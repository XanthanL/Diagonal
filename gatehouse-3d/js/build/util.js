// 工具层:几何合并(借鉴 salt-plant-3d 验证过的实现)/ 程序贴图 / 辉光精灵
import * as THREE from 'three';

// ---------- 静态几何合并:把临时对象树按材质收进合并桶,draw call 回落 ----------
function mergeGeos(list) {
  let vCount = 0, iCount = 0;
  for (const g of list) {
    vCount += g.attributes.position.count;
    iCount += g.index ? g.index.count : g.attributes.position.count;
  }
  const pos = new Float32Array(vCount * 3);
  const nor = new Float32Array(vCount * 3);
  const uv = new Float32Array(vCount * 2);
  const idx = vCount > 65535 ? new Uint32Array(iCount) : new Uint16Array(iCount);
  let vo = 0, io = 0;
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    pos.set(p.array, vo * 3);
    if (n) nor.set(n.array, vo * 3);
    if (u) uv.set(u.array, vo * 2);
    if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx[io + i] = a[i] + vo; io += a.length; }
    else { for (let i = 0; i < p.count; i++) idx[io + i] = vo + i; io += p.count; }
    vo += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
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

/** 细颗粒噪点贴图(石作/墙面的手工感) */
function grainTexture(base = '#ffffff', amp = 18) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 256);
  const img = g.getImageData(0, 0, 256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amp;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
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
  const A = hx(tileHex), R = hx(ridgeHex), D = hx(deepHex);
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  for (let y = 0; y < H; y++) {
    const dirt = 1 - (y / H) * 0.05;                  // 顺坡往下略脏(雨痕),幅度极小
    for (let x = 0; x < W; x++) {
      const t = x / W;
      // 0~0.46 板瓦(凹沟压暗) / 0.46~1 筒瓦(半圆拱提亮)
      const k = t < 0.46
        ? -0.32 * Math.sin((t / 0.46) * Math.PI)
        : 0.72 * Math.pow(Math.sin(((t - 0.46) / 0.54) * Math.PI), 0.8);
      const col = k >= 0 ? mix(A, R, Math.min(1, k)) : mix(A, D, Math.min(1, -k));
      const n = 1 + (Math.random() - 0.5) * 0.05;
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
  tex.anisotropy = 4;
  return tex;
}

export { mergeGeos, emit, flushBin, glowTexture, dotTexture, grainTexture, roofTileTexture };
