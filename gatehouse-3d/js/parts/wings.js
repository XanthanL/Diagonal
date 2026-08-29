// P7 次间与两翼廊庑（T12 / 重构版）
// 三段天际线节奏：两翼(宽28, 高13) < 次间(宽24, 高19) < 中央门楼(T1 檐宽112)。
// 两翼披檐 y18..20；次间单坡屋面 y24..32，向中心逐级上扬 4 级。
// 左半边画一次，镜像出右半边。
import { VoxelWorld, ops } from '../voxel/builder.js';
import { mirror, lattice, roofBox } from '../voxel/ops.js';
import { Z, BAY } from '../spec.js';

export function build() {
  const w = new VoxelWorld();
  const [bz0, bz1] = Z.BODY;
  const [ez0, ez1] = Z.EAVE_BAND;
  const bodyDz = bz1 - bz0 + 1;
  const eaveDz = ez1 - ez0 + 1;

  const left = new VoxelWorld();

  // ---- 两翼廊庑（x0..27）----
  const wg = BAY.WING;
  ops.box(left, wg.x[0], wg.y[0], bz0,
    wg.x[1] - wg.x[0] + 1, wg.y[1] - wg.y[0] + 1, bodyDz, '白灰墙');
  const wl = BAY.WING_LATTICE;
  lattice(left, {
    x0: wl.x[0], y0: wl.y[0], z0: bz0,
    w: wl.x[1] - wl.x[0] + 1, h: wl.y[1] - wl.y[0] + 1, dz: bodyDz, pitchX: 4, pitchY: 4,
  });
  // 墙下石地栿（y4）：墙身起于 y5、台基顶面在 y=4，缺此一行则整片两翼悬空
  ops.box(left, wg.x[0], 4, bz0, wg.x[1] - wg.x[0] + 1, 1, bodyDz, '砂岩·暗');
  const we = BAY.WING_EAVE;
  roofBox(left, we.x[0], we.y[0], ez0, we.x[1] - we.x[0] + 1, we.y[1] - we.y[0] + 1, eaveDz);

  // ---- 次间（x28..51）----
  const sd = BAY.SIDE;
  ops.box(left, sd.x[0], sd.y[0], bz0,
    sd.x[1] - sd.x[0] + 1, sd.y[1] - sd.y[0] + 1, bodyDz, '白灰墙');
  ops.box(left, sd.x[0], 4, bz0, sd.x[1] - sd.x[0] + 1, 1, bodyDz, '砂岩·暗');   // 次间地栿
  const sl = BAY.SIDE_LATTICE;
  lattice(left, {
    x0: sl.x[0], y0: sl.y[0], z0: bz0,
    w: sl.x[1] - sl.x[0] + 1, h: sl.y[1] - sl.y[0] + 1, dz: bodyDz, pitchX: 3, pitchY: 4,
  });
  for (const r of BAY.SIDE_ROOF) {
    roofBox(left, r.x[0], r.y[0], ez0, r.x[1] - r.x[0] + 1, r.y[1] - r.y[0] + 1, eaveDz);
  }

  ops.merge(w, left);
  ops.merge(w, mirror(left));
  return w;
}

export default build;
