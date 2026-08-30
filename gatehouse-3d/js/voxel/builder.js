// 体素生成核心库（门楼（架空） · T4 交付）
// 数据结构 → 可见面剔除 → X 向 run-merge → BufferGeometry (position / normal / color)
// 纯函数：同输入两次构建输出字节级一致（selftest 断言 #4）
import * as THREE from 'three';
import { getIndex, COLORS } from './palette.js';

// ========== VoxelWorld ==========
// 内部 Map<"x,y,z", paletteIndex(1..20)>；外部用 set/get/has/delete/entries。
// 关键不变量：键是整数串，颜色索引合法（同 palette.js set 阶段已 throw 拦截）。
export class VoxelWorld {
  constructor() {
    this.voxels = new Map();
  }
  _k(x, y, z) { return x + ',' + y + ',' + z; }

  set(x, y, z, colorNameOrIndex) {
    this.voxels.set(this._k(x, y, z), getIndex(colorNameOrIndex));
    return this;
  }
  get(x, y, z) {
    const v = this.voxels.get(this._k(x, y, z));
    return v === undefined ? null : v;
  }
  has(x, y, z) { return this.voxels.has(this._k(x, y, z)); }
  delete(x, y, z) { return this.voxels.delete(this._k(x, y, z)); }
  count() { return this.voxels.size; }
  keys() { return this.voxels.keys(); }

  *entries() {
    for (const [k, idx] of this.voxels) {
      const p = k.split(',');
      yield [Number(p[0]), Number(p[1]), Number(p[2]), idx];
    }
  }

  // 实际出现的色编号集合（用于 selftest #5 色板纪律）
  usedIndices() {
    const s = new Set();
    for (const idx of this.voxels.values()) s.add(idx);
    return [...s].sort((a, b) => a - b);
  }

  // 整数坐标的轴对齐包围盒；空世界返回 null
  bbox() {
    if (this.voxels.size === 0) return null;
    let xmin = Infinity, ymin = Infinity, zmin = Infinity;
    let xmax = -Infinity, ymax = -Infinity, zmax = -Infinity;
    for (const k of this.voxels.keys()) {
      const [x, y, z] = k.split(',').map(Number);
      if (x < xmin) xmin = x; if (x > xmax) xmax = x;
      if (y < ymin) ymin = y; if (y > ymax) ymax = y;
      if (z < zmin) zmin = z; if (z > zmax) zmax = z;
    }
    return { min: [xmin, ymin, zmin], max: [xmax, ymax, zmax] };
  }
}

// ========== 造型算子（纯追加 / 纯函数；修改并返回 world） ==========
export const ops = {
  // 实心长方体：起点 (x0,y0,z0)，尺寸 (sx,sy,sz)，色号
  box(world, x0, y0, z0, sx, sy, sz, color) {
    for (let y = 0; y < sy; y++)
      for (let z = 0; z < sz; z++)
        for (let x = 0; x < sx; x++)
          world.set(x0 + x, y0 + y, z0 + z, color);
    return world;
  },

  // 绕 X=0 平面对称：把 (x,y,z) 映到 (-x-1, y, z)，与"以原点为对称中心"的几何直觉一致
  // 注：03 §5 写的是"绕 x=80 镜像"，但那是世界坐标系的中心轴；体素坐标系内统一以 X=0 为对称面。
  // 实际组装时通过 group.position.x 调整。
  mirrorX(src) {
    const out = new VoxelWorld();
    for (const [x, y, z, idx] of src.entries()) out.set(-x - 1, y, z, idx);
    return out;
  },

  // 合并：b 覆盖 a（返回 a 便于链式）
  merge(a, b) {
    for (const [x, y, z, idx] of b.entries()) a.set(x, y, z, idx);
    return a;
  },
};

// ========== 网格化（mesher） ==========
// 单位立方体 [0,1]³ 的 8 顶点 + 6 面定义（逆时针，从外侧看）
const C = {
  C000: [0, 0, 0], C100: [1, 0, 0], C010: [0, 1, 0], C110: [1, 1, 0],
  C001: [0, 0, 1], C101: [1, 0, 1], C011: [0, 1, 1], C111: [1, 1, 1],
};
const FACES = {
  px: { n: [ 1, 0, 0], c: [C.C100, C.C101, C.C111, C.C110] },  // +X 朝外
  nx: { n: [-1, 0, 0], c: [C.C001, C.C000, C.C010, C.C011] },  // -X 朝外
  // 下方四面的角点序按「从面外侧看为逆时针」排列（THREE FrontSide 约定）。
  // 历史上 py/ny/pz/nz 与 px/nx 约定相反，导致顶面/前面被背面剔除、模型呈纸片感——已修正。
  py: { n: [ 0, 1, 0], c: [C.C010, C.C011, C.C111, C.C110] },  // +Y 顶
  ny: { n: [ 0,-1, 0], c: [C.C000, C.C001, C.C101, C.C100] },  // -Y 底
  pz: { n: [ 0, 0, 1], c: [C.C001, C.C011, C.C111, C.C101] },  // +Z 前
  nz: { n: [ 0, 0,-1], c: [C.C000, C.C100, C.C110, C.C010] },  // -Z 后
};
// faceKey 在 run 合并时：上下前后四面的 x∈[0,1] 拉伸到 x∈[0,sx]（面平面含 X 轴）；
// px/nx 端盖不拉伸（面平面垂直 X 轴，只贴在 run 两端）。
const STRETCH_X = new Set(['py', 'ny', 'pz', 'nz']);

// 在 (x,y,z) 位置、run 长 sx 处 emit 一个 quad 到数组。
// 全程直接 push 到调用方 buffer（不创建临时数组），保证纯函数语义。
function emitFace(faceKey, x, y, z, sx, color, vs, positions, normals, colors, indices) {
  const face = FACES[faceKey];
  const [nx, ny, nz] = face.n;
  const stretch = STRETCH_X.has(faceKey);
  const base = positions.length / 3;
  for (let i = 0; i < 4; i++) {
    const c = face.c[i];
    const vx = stretch ? c[0] * sx : c[0];
    positions.push((x + vx) * vs, (y + c[1]) * vs, (z + c[2]) * vs);
    normals.push(nx, ny, nz);
    colors.push(color.r, color.g, color.b);
  }
  indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

// 把一个 VoxelWorld 转换成一个 Mesh 用的 BufferGeometry。
// 步骤：①按 (y,z) 分组；②每行 X 排序后做同色 run 合并（仅 X 方向）；③对每个 run：
//   - emit -X 端面（最左，跨 run 长度）；  emit +X 端面（最右，跨 run 长度）；
//   - emit 上/下/前/后 4 面（每个体素独立，未合并，控制简单性）；
// ④可见面 = 邻域不在世界内（或世界有但不同色 → 此处简化为"不在世界内"，跨 Part 接触面允许少量保留换取 Part 独立网格）。
export function buildPartMesh(world, opts = {}) {
  const vs = opts.voxelSize ?? 1;
  const positions = [];
  const normals = [];
  const colors = [];
  const indices = [];

  // ①按 (y,z) 分组：紧凑整数 key；同时记录全局最低层 yMin（最低层底面永不可见，省去不发）
  const yzGroups = new Map();
  let yMin = Infinity, yMax = -Infinity;
  for (const [x, y, z, idx] of world.entries()) {
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
    const key = y * 1048576 + z;  // z 留 20 bits 足够
    let arr = yzGroups.get(key);
    if (!arr) { arr = []; yzGroups.set(key, arr); }
    arr.push({ x, y, z, idx });
  }

  // ②每行 X 排序 + 同色 run 合并
  for (const row of yzGroups.values()) {
    const rowY = row[0].y;
    row.sort((a, b) => a.x - b.x);
    let i = 0;
    while (i < row.length) {
      const c0 = row[i];
      let j = i + 1;
      while (j < row.length && row[j].x === row[j - 1].x + 1 && row[j].idx === c0.idx) j++;
      const c1 = row[j - 1];
      const runLen = c1.x - c0.x + 1;
      const color = COLORS[c0.idx];

      // -X 端盖（最左）：仅当左侧是空气；单位 quad，贴 run 左缘
      if (!world.has(c0.x - 1, c0.y, c0.z))
        emitFace('nx', c0.x, c0.y, c0.z, runLen, color, vs, positions, normals, colors, indices);
      // +X 端盖（最右）：仅当右侧是空气；角点 x=1，平面落在 c1.x+1
      if (!world.has(c1.x + 1, c1.y, c1.z))
        emitFace('px', c1.x, c1.y, c1.z, runLen, color, vs, positions, normals, colors, indices);

      // 上下前后 4 面：整 run 邻域条件一致 → 一枚拉伸合并 quad；不一致 → 逐体素回退
      let above = 0, below = 0, front = 0, back = 0;
      for (let k = i; k < j; k++) {
        const c = row[k];
        if (!world.has(c.x, c.y + 1, c.z)) above++;
        if (!world.has(c.x, c.y - 1, c.z)) below++;
        if (!world.has(c.x, c.y, c.z + 1)) front++;
        if (!world.has(c.x, c.y, c.z - 1)) back++;
      }
      const skipBottom = rowY === yMin && yMax > yMin; // 全局最低层底面永不可见
      if (above === runLen)
        emitFace('py', c0.x, c0.y, c0.z, runLen, color, vs, positions, normals, colors, indices);
      if (below === runLen && !skipBottom)
        emitFace('ny', c0.x, c0.y, c0.z, runLen, color, vs, positions, normals, colors, indices);
      if (front === runLen)
        emitFace('pz', c0.x, c0.y, c0.z, runLen, color, vs, positions, normals, colors, indices);
      if (back === runLen)
        emitFace('nz', c0.x, c0.y, c0.z, runLen, color, vs, positions, normals, colors, indices);
      for (let k = i; k < j; k++) {
        const c = row[k];
        if (above !== runLen && !world.has(c.x, c.y + 1, c.z))
          emitFace('py', c.x, c.y, c.z, 1, color, vs, positions, normals, colors, indices);
        if (below !== runLen && !skipBottom && !world.has(c.x, c.y - 1, c.z))
          emitFace('ny', c.x, c.y, c.z, 1, color, vs, positions, normals, colors, indices);
        if (front !== runLen && !world.has(c.x, c.y, c.z + 1))
          emitFace('pz', c.x, c.y, c.z, 1, color, vs, positions, normals, colors, indices);
        if (back !== runLen && !world.has(c.x, c.y, c.z - 1))
          emitFace('nz', c.x, c.y, c.z, 1, color, vs, positions, normals, colors, indices);
      }

      i = j;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.setIndex(indices);
  return geom;
}
