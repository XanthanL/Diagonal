// P3 底层柱网与门堂（T22 进深三维化）：三排柱 + 双皮墙壳 + 柱头枋，前廊开门、背设后檐。
// 尺寸全部取自 spec.js（BAY/Z 分层常量），左半边的非对称构件画完后镜像出右半边。
// 连通设计：彩画带前后皮经山墙条与墙皮相连；大匾（y≤32）是通往 T1 檐带（y≥33）的竖向桥。
import { VoxelWorld, ops } from '../voxel/builder.js';
import { mirror, plaque } from '../voxel/ops.js';
import { Z, BAY } from '../spec.js';

export function build() {
  const w = new VoxelWorld();
  const CF = Z.COL_FRONT, CM = Z.COL_MID, CB = Z.COL_BACK;
  const WF = Z.WALL_FRONT, WB = Z.WALL_BACK, BM = Z.BEAM;
  const dy = BAY.DOOR.y[1] - BAY.DOOR.y[0] + 1;
  const cy = BAY.CENTER_WALL.y[1] - BAY.CENTER_WALL.y[0] + 1;

  // ---- 中跨（对称直绘）：门槛石垫底，黑漆门叶立于前柱列，门缝刻在门皮，门环凸出一环 ----
  ops.box(w, BAY.DOOR.x[0], 4, CF[0], BAY.DOOR.x[1] - BAY.DOOR.x[0] + 1, 1, CF[1] - CF[0] + 1, '砂岩·暗');   // 门槛石（接地垫层）
  ops.box(w, BAY.DOOR.x[0], BAY.DOOR.y[0], CF[0],
    BAY.DOOR.x[1] - BAY.DOOR.x[0] + 1, dy, CF[1] - CF[0] + 1, '黑漆·主体');
  for (const sx of BAY.DOOR_SEAM_X)
    ops.box(w, sx, BAY.DOOR.y[0], CF[1], 1, dy, 1, '栗木·受光');
  for (const r of BAY.DOOR_RING)
    ops.box(w, r.x[0], r.y[0], CF[1] + 1, r.x[1] - r.x[0] + 1, r.y[1] - r.y[0] + 1, 1, '金·高光');

  // 石青彩画带：前皮居门楣之上、后皮与后檐同线（与山墙条相接保接地）
  const pb = BAY.PAINT_BAND;
  ops.box(w, pb.x[0], pb.y[0], CF[0], pb.x[1] - pb.x[0] + 1, pb.y[1] - pb.y[0] + 1, 3, '石青·彩画地');
  ops.box(w, pb.x[0], pb.y[0], CB[0], pb.x[1] - pb.x[0] + 1, pb.y[1] - pb.y[0] + 1, 3, '石青·彩画地');
  // 前皮饰：赭金开光 + 石青卡子 + 四朵宝相花
  ops.box(w, 74, 23, CF[0], 12, 1, 3, '金·高光');
  ops.box(w, 79, 24, CF[0], 2, 2, 3, '石青·彩画地');
  for (const fx of [66, 70, 88, 92]) {
    ops.box(w, fx, 24, CF[0], 2, 2, 3, '白灰墙');
    ops.box(w, fx + 1, 25, CF[0], 1, 1, 3, '金·主体');
  }

  // ---- 左半边（画完镜像出右半边）----
  const left = new VoxelWorld();
  const cw = BAY.CENTER_WALL;
  // 白灰墙双皮 + 山墙条贯通进深（皮-腔-皮的壳式砌置）
  ops.box(left, cw.x[0], cw.y[0], WF[0], cw.x[1] - cw.x[0] + 1, cy, WF[1] - WF[0] + 1, '白灰墙');
  ops.box(left, cw.x[0], cw.y[0], WB[0], cw.x[1] - cw.x[0] + 1, cy, WB[1] - WB[0] + 1, '白灰墙');
  ops.box(left, cw.x[0], cw.y[0], CB[0], 2, cy, WF[1] - CB[0] + 1, '白灰墙');
  // 墙隅栗木深色边（前后皮的山面收头）
  ops.box(left, cw.x[0], cw.y[0], WF[0], 1, cy, WF[1] - WF[0] + 1, '栗木格栅');
  ops.box(left, cw.x[0], cw.y[0], WB[0], 1, cy, WB[1] - WB[0] + 1, '栗木格栅');
  // 三排柱：前廊 / 金柱 / 后檐（朱红柱；前后排带砂岩·暗柱础）+ 各排柱头枋
  const col = BAY.COLUMN, base = BAY.COLUMN_BASE;
  for (const [z0, z1] of [CF, CM, CB]) {
    ops.box(left, col.x[0], col.y[0], z0, col.x[1] - col.x[0] + 1, col.y[1] - col.y[0] + 1, z1 - z0 + 1, '朱红·柱');
    // 三排柱一律落础：柱脚 y5 与台基顶 y3 之间必须有一格础垫（否则 #11 判悬空）
    ops.box(left, base.x[0], base.y[0], z0, base.x[1] - base.x[0] + 1, base.y[1] - base.y[0] + 1, z1 - z0 + 1, '砂岩·暗');
    ops.box(left, cw.x[0], BM[0], z0, cw.x[1] - cw.x[0] + 1, BM[1] - BM[0] + 1, z1 - z0 + 1, '栗木·受光');
  }
  ops.merge(w, left);
  ops.merge(w, mirror(left));

  // 一层大匾（9 字）：立于门楣彩画带上皮，纵向探至 z34 与檐带 y33 相接（竖向桥）。
  plaque(w, {
    x0: BAY.PLAQUE_1.x[0], y0: BAY.PLAQUE_1.y[0], z0: CF[0],
    w: BAY.PLAQUE_1.x[1] - BAY.PLAQUE_1.x[0] + 1,
    h: 32 - BAY.PLAQUE_1.y[0] + 1,
    dz: 34 - CF[0] + 1, chars: 9, charW: 3,
  });

  return w;
}

export default build;
