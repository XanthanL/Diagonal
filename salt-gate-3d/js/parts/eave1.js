// P4 第一重檐 + 如意斗栱带（T9 / 重构版）
// 斗栱带：黑漆底 2 格高（y33..34）+ 2×2 金点（起点 x=28，周期 8）
// 檐带：全楼最宽的一重，halfW=56（x24..135），中央 rows 35..46，角端升起 5
import { VoxelWorld, ops } from '../voxel/builder.js';
import { band, eaveTier } from '../voxel/ops.js';
import { Z, TIERS } from '../spec.js';

export function build() {
  const w = new VoxelWorld();
  const [ez0, ez1] = Z.EAVE_BAND;
  const t = TIERS[0];
  const dg = t.douGong;

  band(w, {
    x0: dg.x[0], x1: dg.x[1], y0: dg.y[0], y1: dg.y[1], z0: ez0, z1: ez1,
    base: '黑漆·主体',
    unitEvery: dg.unitEvery, unitW: dg.unitW, unitStart: 28,
  });
  eaveTier(w, { ...t.eave, z0: ez0, z1: ez1 });
  return w;
}

export default build;
