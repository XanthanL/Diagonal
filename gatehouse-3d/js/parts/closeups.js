// P8 特写件（T16 预埋）：主场景内的金色标记件，浮层小视口待 T16 接入
// 特写世界（1vx=0.02m 的戏文看板 / 团窠 / 石狮头）定义于 parts/carvings.js（未建）。
import { VoxelWorld, ops } from '../voxel/builder.js';
import { Z } from '../spec.js';

export function build() {
  const w = new VoxelWorld();
  // 置于台基前沿平台上（台基顶面 y=3，标记件自 y4 起 → 与台基相邻、不悬空）
  // 注意：不可放在 Z.EAVE_FACE(z33..34) 的高处——该 Z 层在其下方别无他物，会整块悬空（#11 断言会抓到）。
  ops.box(w, 76, 4, 33, 8, 4, 2, '金·主体');
  return w;
}

export default build;
