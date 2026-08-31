// Part: 三重檐 —— 一整片连续坡屋面 + 两端翘角（STYLE §四：翘角是本作的灵魂）
// 每重 = eaveTier：檐口周圈按 u² 起翘、举折控制点逐格收向正脊平台；角端向外 N 段挑出，末段金身、顶一枚灵光。
import { VoxelWorld } from '../voxel/builder.js';
import { TIERS, CX } from '../spec.js';
import { eaveTier } from '../voxel/ops.js';

export default function build() {
  const w = new VoxelWorld();
  for (const t of TIERS) {
    eaveTier(w, { ...t, cx: CX, z0: t.z[0], z1: t.z[1] });
  }
  return w;
}
