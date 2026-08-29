// P3 底层柱网与门堂（T7 / 重构版）：白灰墙 · 黑漆大门 · 朱红柱 · 石青彩画带 · 九字大匾
// 尺寸取自 spec.js BAY（= elevation-guide.png）。左半边的非对称构件画完后镜像出右半边。
import { VoxelWorld, ops } from '../voxel/builder.js';
import { mirror, plaque, lattice } from '../voxel/ops.js';
import { Z, BAY } from '../spec.js';

export function build() {
  const w = new VoxelWorld();
  const [bz0, bz1] = Z.BODY;
  const dz = bz1 - bz0 + 1;
  const z = bz0;

  // ---- 对称构件（区间本身关于中轴对称）----
  // 黑漆大门 + 门缝 + 门环
  ops.box(w, BAY.DOOR.x[0], BAY.DOOR.y[0], z,
    BAY.DOOR.x[1] - BAY.DOOR.x[0] + 1, BAY.DOOR.y[1] - BAY.DOOR.y[0] + 1, dz, '黑漆·主体');
  for (const sx of BAY.DOOR_SEAM_X)
    ops.box(w, sx, BAY.DOOR.y[0], z, 1, BAY.DOOR.y[1] - BAY.DOOR.y[0] + 1, dz, '栗木·受光');
  for (const r of BAY.DOOR_RING)
    ops.box(w, r.x[0], r.y[0], z, r.x[1] - r.x[0] + 1, r.y[1] - r.y[0] + 1, dz, '金·高光');

  // 石青彩画带 + 中部赭金开光 + 四朵宝相花
  ops.box(w, BAY.PAINT_BAND.x[0], BAY.PAINT_BAND.y[0], z,
    BAY.PAINT_BAND.x[1] - BAY.PAINT_BAND.x[0] + 1,
    BAY.PAINT_BAND.y[1] - BAY.PAINT_BAND.y[0] + 1, dz, '石青·彩画地');
  ops.box(w, 74, 23, z, 12, 1, dz, '金·高光');            // 开光
  ops.box(w, 79, 24, z, 2, 2, dz, '石青·彩画地');
  for (const fx of [66, 70, 88, 92]) {
    ops.box(w, fx, 24, z, 2, 2, dz, '白灰墙');           // 宝相花瓣
    ops.box(w, fx + 1, 25, z, 1, 1, dz, '金·主体');       // 花心
  }

  // 一层大匾（9 字）
  // Z 跨度取 [BODY.0, 34]：大匾是地面层通往 T1 斗栱带(y33) 的唯一竖向桥梁，
  //   若只画在 BODY(z13..30) 会与斗栱带(z9..32) 之间留下 z31..32 的缝而断开。
  // 纵向裁剪到 y32（原 28..35）：与 T1 斗栱带底 y33 相邻而不重叠，避免跨 Part z-fighting。
  plaque(w, {
    x0: BAY.PLAQUE_1.x[0], y0: BAY.PLAQUE_1.y[0], z0: z,
    w: BAY.PLAQUE_1.x[1] - BAY.PLAQUE_1.x[0] + 1,
    h: 32 - BAY.PLAQUE_1.y[0] + 1,
    dz: 34 - z + 1, chars: 9, charW: 3,
  });

  // ---- 左半边（画完镜像出右半边）----
  const left = new VoxelWorld();
  const cw = BAY.CENTER_WALL;
  ops.box(left, cw.x[0], cw.y[0], z, cw.x[1] - cw.x[0] + 1, cw.y[1] - cw.y[0] + 1, dz, '白灰墙');
  // 墙边深色框
  for (const fx of [cw.x[0], cw.x[1]])
    ops.box(left, fx, cw.y[0], z, 1, cw.y[1] - cw.y[0] + 1, dz, '栗木格栅');
  // 石柱础 + 朱红柱
  const cb = BAY.COLUMN_BASE;
  ops.box(left, cb.x[0], cb.y[0], z, cb.x[1] - cb.x[0] + 1, cb.y[1] - cb.y[0] + 1, dz, '砂岩·暗');
  const co = BAY.COLUMN;
  ops.box(left, co.x[0], co.y[0], z, co.x[1] - co.x[0] + 1, co.y[1] - co.y[0] + 1, dz, '朱红·柱');

  ops.merge(w, left);
  ops.merge(w, mirror(left));
  return w;
}

export default build;
