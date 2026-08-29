// P2 石狮一对（T8 / 重构版）：左狮画一次，镜像出右狮（头朝中轴）
import { VoxelWorld, ops } from '../voxel/builder.js';
import { mirror, lion } from '../voxel/ops.js';
import { Z, BAY } from '../spec.js';

export function build() {
  const w = new VoxelWorld();
  const [lz0, lz1] = Z.LION;
  const left = new VoxelWorld();
  lion(left, { xLeft: BAY.LION.x[0], y0: BAY.LION.y, z0: lz0, dz: lz1 - lz0 + 1 });
  ops.merge(w, left);
  ops.merge(w, mirror(left));       // 右狮 x95..104
  return w;
}

export default build;
