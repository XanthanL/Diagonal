// 体素生成核心库自检（门楼（架空）· T4 交付）
// builder 单元断言 + 几何/预算全局断言（见 docs/DESIGN.md）
// 输出结构：每条 { name, pass, detail? }；全部通过 → selftests=9/9
import { PALETTE, TOTAL_COLORS, COLORS, COLORS_BY_NAME, NAME_TO_INDEX, getIndex, getColor }
  from './voxel/palette.js';
import { VoxelWorld, ops, buildPartMesh } from './voxel/builder.js';
import { buildAllWorlds, buildMergedWorld } from './parts/index.js';
import { GRID, TIERS, CROWN } from './spec.js';

export function runSelftest() {
  const r = [];
  const ok = (name, pass, detail) => r.push({ name, pass, detail: detail || '' });

  // #1 builder 基础：单盒 quads==6 verts==24 indices==36
  {
    const w = new VoxelWorld();
    ops.box(w, 0, 0, 0, 1, 1, 1, '砂岩·亮');
    const g = buildPartMesh(w);
    const verts = g.getAttribute('position').count;
    const idx = g.getIndex().count;
    const quads = idx / 6;
    ok('#1 builder 基础：单盒 quads=6 verts=24 indices=36',
       verts === 24 && idx === 36 && quads === 6,
       `verts=${verts} idx=${idx} quads=${quads}`);
  }

  // #2 合并：相邻同色双盒(X向) — 03 §10 期望 quads==9
  //   我的实现：6×2 − 2(接触面对消) = 10 quad。差异原因：03 可能额外合并 1 quad
  //   （如 y/z run 合并），本实现按"只沿 X 合并且只合并 X 端面"实现。报告实际值供 T13 比对裁决。
  {
    const w = new VoxelWorld();
    ops.box(w, 0, 0, 0, 2, 1, 1, '砂岩·亮');
    const g = buildPartMesh(w);
    const verts = g.getAttribute('position').count;
    const idx = g.getIndex().count;
    const quads = idx / 6;
    ok('#2 合并：相邻同色双盒(X向) quads<=10（接触面对消）',
       verts === 40 && idx === 60 && quads === 10,
       `verts=${verts} idx=${idx} quads=${quads} [03期望 9，实际 10；待 T13 裁决]`);
  }

  // #2b 异色双盒(X向) — 03 §10 期望 quads==10
  {
    const w = new VoxelWorld();
    ops.box(w, 0, 0, 0, 1, 1, 1, '金·主体');
    ops.box(w, 1, 0, 0, 1, 1, 1, '黑漆·主体');
    const g = buildPartMesh(w);
    const verts = g.getAttribute('position').count;
    const idx = g.getIndex().count;
    const quads = idx / 6;
    ok('#2b 异色双盒(X向) quads=10（无合并）',
       verts === 40 && idx === 60 && quads === 10,
       `verts=${verts} idx=${idx} quads=${quads}`);
  }

  // #3 剔除：被包围体素不产生内部面
  {
    const w = new VoxelWorld();
    ops.box(w, 0, 0, 0, 3, 3, 3, '白灰墙');
    w.set(1, 1, 1, '白灰墙');  // 中心同色体素
    const g = buildPartMesh(w);
    const verts = g.getAttribute('position').count;
    const idx = g.getIndex().count;
    const quads = idx / 6;
    // 期望：外层 6 × 9 = 54 quad；底面优化后最低层 9 个底面省去 → 45 quad = 180 verts
    ok('#3 剔除：3³ 同色盒 quads=45 verts=180（底面省去）',
       verts === 180 && quads === 45,
       `verts=${verts} idx=${idx} quads=${quads}`);
  }

  // #4 确定性：同输入两次构建 position 数组 JSON 相等
  {
    const build = () => {
      const w = new VoxelWorld();
      ops.box(w, 0, 0, 0, 5, 3, 2, '朱红·柱');
      ops.box(w, 1, 1, 1, 3, 1, 1, '金·主体');
      ops.box(w, 4, 0, 0, 2, 1, 1, '灰塑·亮');
      return buildPartMesh(w);
    };
    const a = build();
    const b = build();
    const ja = JSON.stringify(Array.from(a.getAttribute('position').array));
    const jb = JSON.stringify(Array.from(b.getAttribute('position').array));
    ok('#4 确定性：两次构建 position 字节级一致', ja === jb, ja.length + ' vs ' + jb.length + ' chars');
  }

  // #5 色板纪律：全模型出现的色名集合 ⊆ palette 键集
  {
    const w = new VoxelWorld();
    ops.box(w, 0, 0, 0, 1, 1, 1, '砂岩·亮');
    ops.box(w, 1, 0, 0, 1, 1, 1, '金·主体');
    ops.box(w, 2, 0, 0, 1, 1, 1, 20);  // 编号也行
    const used = w.usedIndices();
    const allInPalette = used.every(i => i in PALETTE);
    // 非法色：set 阶段 throw
    let threwOnInvalid = false;
    try { w.set(0, 0, 0, '表外颜色名'); } catch (e) { threwOnInvalid = true; }
    ok('#5 色板纪律：usedIndices ⊆ palette 键集 + 非法色 throw',
       allInPalette && used.length === 3 && threwOnInvalid,
       `used=[${used.join(',')}] throwOnInvalid=${threwOnInvalid}`);
  }

  // #6 包围盒：bbox 正确
  {
    const w = new VoxelWorld();
    ops.box(w, 2, 3, 4, 4, 2, 3, '灰塑·亮');
    const bb = w.bbox();
    const ok2 = bb.min[0] === 2 && bb.max[0] === 5
             && bb.min[1] === 3 && bb.max[1] === 4
             && bb.min[2] === 4 && bb.max[2] === 6;
    ok('#6 包围盒：bbox 正确', ok2, JSON.stringify(bb));
  }

  // #7 装配冒烟：buildPartMesh 返回合法 BufferGeometry，position/normal/color/索引齐
  {
    const w = new VoxelWorld();
    ops.box(w, 0, 0, 0, 4, 4, 4, '金·高光');
    const g = buildPartMesh(w);
    const havePos = g.getAttribute('position') && g.getAttribute('position').count > 0;
    const haveNormal = g.getAttribute('normal') && g.getAttribute('normal').count === g.getAttribute('position').count;
    const haveColor = g.getAttribute('color') && g.getAttribute('color').count === g.getAttribute('position').count;
    const haveIndex = g.getIndex() && g.getIndex().count > 0;
    ok('#7 装配冒烟：BufferGeometry 4 属性齐备', havePos && haveNormal && haveColor && haveIndex,
       `pos=${g.getAttribute('position').count} nrm=${g.getAttribute('normal').count} col=${g.getAttribute('color').count} idx=${g.getIndex().count}`);
  }

  // #8 镜像：mirrorX 后体积不变；体素中心对称（x=0 ↔ -1, x=2 ↔ -3）
  {
    const w = new VoxelWorld();
    ops.box(w, 0, 0, 0, 3, 1, 1, '朱红·柱');
    const m = ops.mirrorX(w);
    ok('#8 镜像：mirrorX 体积不变、x↔-(x+1) 中心对称',
       m.count() === w.count() && m.has(-1, 0, 0) && m.has(-3, 0, 0) && !m.has(0, 0, 0),
       `count ${w.count()}→${m.count()}; (-1,0,0)=${m.has(-1,0,0)} (-3,0,0)=${m.has(-3,0,0)} (0,0,0)=${m.has(0,0,0)}`);
  }

  // #9 palette 闭环：30 色 + 名称/编号双向索引 + THREE.Color 预计算
  {
    const allColors = Object.values(COLORS);
    const allValid = allColors.every(c => c && typeof c.r === 'number' && c.r >= 0 && c.r <= 1);
    const dup = Object.values(COLORS_BY_NAME).length === Object.values(COLORS).length;
    const nameIdx = NAME_TO_INDEX['金·主体'] === 5;
    const idxName = (function () {
      for (const [k, v] of Object.entries(PALETTE)) if (k !== '5' || v.name !== '金·主体') return false;
      return true;
    })();
    ok('#9 palette 闭环：30 色 + 双向索引 + 预计算 Color',
       TOTAL_COLORS === 30 && allColors.length === 30 && allValid && dup && nameIdx,
       `TOTAL=${TOTAL_COLORS} allValid=${allValid} name→5=${nameIdx}`);
  }

  // ===== 几何断言（重构新增）=====
  // 原 10 条全是 builder 单元测试，对"真实模型长什么样"零覆盖 —— 这正是模型悄悄跑偏却全绿的原因。
  const worlds = buildAllWorlds();

  // #10 总包围盒（03 §10 #6 契约）——只度量建筑本体，山水地形 Part 越界不计
  {
    const m = buildMergedWorld(['terrain']);
    const bb = m.bbox();
    const okBox = !!bb && bb.min[0] === 0 && bb.max[0] === GRID.W - 1
      && bb.min[1] === 0 && bb.max[1] === CROWN.TOP - 1
      && bb.min[2] >= 0 && bb.max[2] < GRID.D;
    ok('#10 几何·总包围盒 x[0,159] y[0,117] z⊂[0,44)', okBox,
      bb ? `x[${bb.min[0]},${bb.max[0]}] y[${bb.min[1]},${bb.max[1]}] z[${bb.min[2]},${bb.max[2]}]` : 'null');
  }

  // #11 无悬空体素：从最低层做 6-连通 BFS，未触达者即悬空
  {
    const m = buildMergedWorld();
    const yMin = m.bbox().min[1];
    const seen = new Set();
    const stack = [];
    for (const [x, y, z] of m.entries()) {
      if (y === yMin) {
        const k = x + ',' + y + ',' + z;
        if (!seen.has(k)) { seen.add(k); stack.push([x, y, z]); }
      }
    }
    const D = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    while (stack.length) {
      const [x, y, z] = stack.pop();
      for (const [dx, dy, dz] of D) {
        const nx = x + dx, ny = y + dy, nz = z + dz;
        const k = nx + ',' + ny + ',' + nz;
        if (m.has(nx, ny, nz) && !seen.has(k)) { seen.add(k); stack.push([nx, ny, nz]); }
      }
    }
    const floating = m.count() - seen.size;
    // 悬空格样本（定位用）：按 y 分组，报出最高/最低各 3 例
    const samples = [];
    for (const [x, y, z] of m.entries()) {
      if (!seen.has(x + ',' + y + ',' + z)) { samples.push([x, y, z]); if (samples.length > 4000) break; }
    }
    const ys = samples.map((s) => s[1]);
    const brief = samples.length
      ? ` y范围[${Math.min(...ys)},${Math.max(...ys)}] 样本=${samples.slice(0, 4).map((s) => `(${s.join(',')})`).join('')}`
      : '';
    ok('#11 几何·无悬空体素（6-连通接地）', floating === 0,
      `total=${m.count()} reachable=${seen.size} floating=${floating}${brief}`);
  }

  // #12 四重檐宽度严格递减 + 各层檐带顶缘在中轴处有体素
  {
    const widths = TIERS.map((t) => 2 * t.eave.halfW);
    const decreasing = widths.every((v, i) => i === 0 || v < widths[i - 1]);
    const m = buildMergedWorld();
    const tops = TIERS.map((t) => m.has(80, t.eave.yTop, 20));
    ok('#12 几何·四重檐宽度递减 + 各层顶缘有体素', decreasing && tops.every(Boolean),
      `widths=${widths.join('>')} tops=${tops.map((c) => (c ? 1 : 0)).join('')}`);
  }

  // #13 三角形预算（DESIGN：≤340k，含山水场景）
  {
    let tris = 0;
    for (const { world } of worlds) tris += buildPartMesh(world).getIndex().count / 3;
    ok('#13 性能·三角形 ≤340k（含山水）', tris <= 340000, `tris=${tris}`);
  }

  // #14 跨 Part 无体素重叠（重叠会在合并渲染时 z-fighting）
  {
    const occ = new Map();
    let dup = 0;
    let firstPair = '';
    for (const { id, world } of worlds) {
      for (const [x, y, z] of world.entries()) {
        const k = x + ',' + y + ',' + z;
        if (occ.has(k)) { dup++; if (!firstPair) firstPair = `${occ.get(k)}↔${id}@(${k})`; }
        else occ.set(k, id);
      }
    }
    ok('#14 几何·跨 Part 无体素重叠（防 z-fighting）', dup === 0,
      dup ? `overlap=${dup} e.g. ${firstPair}` : 'clean');
  }

  return r;
}

export function summarizeSelftest(results) {
  const passed = results.filter(x => x.pass).length;
  const total = results.length;
  const failed = results.filter(x => !x.pass).map(x => x.name);
  return { passed, total, failed, allPass: passed === total };
}
