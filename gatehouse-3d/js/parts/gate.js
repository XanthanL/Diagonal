// Part: 墙 · 柱 · 门 —— 三重 body 的墙身与门洞。
// 大开面优先：白灰墙是一整块面，细节只留给一扇格栅窗（STYLE §二.1、§七）。
import { VoxelWorld, ops } from '../voxel/builder.js';
import { BAY, Z, CX, MIRROR } from '../spec.js';
import { wallWithOpening, colonnade, blankPlaque, lattice, sym } from '../voxel/ops.js';

export default function build() {
  const w = new VoxelWorld();
  const B1 = BAY.BODY1, DR = BAY.DOOR, LD = BAY.LINTEL, PQ = BAY.PLAQUE;
  const zf = Z.WALL_F, zb = Z.WALL_B;
  const dzF = zf[1] - zf[0] + 1, dzB = zb[1] - zb[0] + 1;
  const wallW = B1.x[1] - B1.x[0] + 1;

  // ---- 一层墙身：整块实砌，正中挖出门洞 ----
  wallWithOpening(w, {
    x0: B1.x[0], x1: B1.x[1], y0: B1.y[0], y1: B1.y[1], z0: B1.z[0], z1: B1.z[1],
    color: '白灰墙',
    opening: { ox0: DR.x[0], ox1: DR.x[1], oy0: DR.y[0], oy1: DR.y[1] },
  });
  // 碱脚：把白墙从台基上「立」起来（门洞处断开）
  for (const [a, b] of [[B1.x[0], DR.x[0] - 1], [DR.x[1] + 1, B1.x[1]]]) {
    ops.box(w, a, B1.y[0], zf[0], b - a + 1, 2, dzF, '白灰·暗');
    ops.box(w, a, B1.y[0], zb[0], b - a + 1, 2, dzB, '白灰·暗');
  }

  // ---- 门扇：凹在腔内的黑漆双扇 + 一道中缝（不铺门钉：金只留给角梢、匾框、脊心） ----
  const dd = Z.DOOR;
  ops.box(w, DR.x[0], DR.y[0], dd[0], DR.x[1] - DR.x[0] + 1, DR.y[1] - DR.y[0] + 1,
          dd[1] - dd[0] + 1, '黑漆·主体');
  ops.box(w, CX - 1, DR.y[0], dd[0], 2, DR.y[1] - DR.y[0] + 1, dd[1] - dd[0] + 1, '栗木·受光');

  // ---- 洞口收框：两侧柱皮 + 过梁（栗木），把洞收成一个明确的「框」 ----
  ops.box(w, DR.x[0] - 1, DR.y[0], zf[0], 1, DR.y[1] - DR.y[0] + 1, dzF, '栗木格栅');
  ops.box(w, MIRROR(DR.x[0] - 1), DR.y[0], zf[0], 1, DR.y[1] - DR.y[0] + 1, dzF, '栗木格栅');
  ops.box(w, DR.x[0] - 1, DR.y[1], zf[0], DR.x[1] - DR.x[0] + 2, 1, dzF, '栗木格栅');

  // ---- 门额 + 匾留白（有框无字：架空之物无名可题） ----
  ops.box(w, LD.x[0], LD.y[0], zf[0], LD.x[1] - LD.x[0] + 1, LD.y[1] - LD.y[0] + 1, dzF, '黑漆·受光');
  blankPlaque(w, { x0: PQ.x[0], x1: PQ.x[1], y0: PQ.y[0], y1: PQ.y[1], z0: zf[0], z1: zf[1] });

  // ---- 前檐廊柱列：三对朱红柱立在墙皮之前，柱头枋压顶 ----
  colonnade(w, {
    edges: BAY.COLUMNS, width: BAY.COL_W,
    y0: B1.y[0], y1: B1.y[1] - 1, z0: Z.COL[0], z1: Z.COL[1],
  });
  ops.box(w, B1.x[0], B1.y[1] - 1, Z.COL[0], wallW, 1, Z.COL[1] - Z.COL[0] + 1, '栗木·受光');

  // ---- 格栅窗：一层一对、前后皮都开；二层一棂；其余不开洞 ----
  const WN = BAY.WINDOW, ww = WN.x[1] - WN.x[0] + 1, wh = WN.y[1] - WN.y[0] + 1;
  for (const [a, b] of sym(WN.x[0], ww)) {
    lattice(w, { x0: a, y0: WN.y[0], z0: zf[0], w: b - a + 1, h: wh, dz: dzF, pitchX: 3, pitchY: 4 });
    lattice(w, { x0: a, y0: WN.y[0], z0: zb[0], w: b - a + 1, h: wh, dz: dzB, pitchX: 3, pitchY: 4 });
  }

  // ---- 二层墙身（收进）+ 唯一一扇直棂窗 + 檐口暗层线 ----
  const B2 = BAY.BODY2, SL = BAY.SLIT;
  ops.box(w, B2.x[0], B2.y[0], B2.z[0], B2.x[1] - B2.x[0] + 1, B2.y[1] - B2.y[0] + 1,
          B2.z[1] - B2.z[0] + 1, '白灰墙');
  ops.box(w, B2.x[0], B2.y[0], B2.z[1] - 1, B2.x[1] - B2.x[0] + 1, 2, 2, '白灰·暗');
  ops.box(w, SL.x[0], SL.y[0], SL.z[0], SL.x[1] - SL.x[0] + 1, SL.y[1] - SL.y[0] + 1,
          SL.z[1] - SL.z[0] + 1, '栗木格栅');
  for (let x = SL.x[0] + 2; x < SL.x[1]; x += 4)
    ops.box(w, x, SL.y[0], SL.z[1], 1, SL.y[1] - SL.y[0] + 1, 1, '栗木·受光');
  ops.box(w, B2.x[0] - 2, B2.y[1], B2.z[0] - 1, B2.x[1] - B2.x[0] + 5, 1,
          B2.z[1] - B2.z[0] + 2, BAY.EAVE_UNDER);

  // ---- 三层墙身（再收进）+ 暗层线 ----
  const B3 = BAY.BODY3;
  ops.box(w, B3.x[0], B3.y[0], B3.z[0], B3.x[1] - B3.x[0] + 1, B3.y[1] - B3.y[0] + 1,
          B3.z[1] - B3.z[0] + 1, '白灰墙');
  ops.box(w, B3.x[0] - 2, B3.y[1], B3.z[0] - 1, B3.x[1] - B3.x[0] + 5, 1,
          B3.z[1] - B3.z[0] + 2, BAY.EAVE_UNDER);
  return w;
}
