// P5 二三层墙身（T10 / 重构版）：白灰墙 + 朱红立柱 + 金窗 + 金顶线的可读立面，
// 消除纯黑"黑洞"观感。团窠花板与匾额在 upperRoofs.js（嵌于檐带内，同世界覆写）。
// 墙身纵向区间已裁剪 1 格，保证与上下檐带"相邻而不重叠"。
import { VoxelWorld, ops } from '../voxel/builder.js';
import { Z, TIERS } from '../spec.js';

export function build() {
  const w = new VoxelWorld();
  const [bz0, bz1] = Z.BODY;
  const dz = bz1 - bz0 + 1;

  for (const t of [TIERS[1], TIERS[2]]) {          // T2 / T3
    const y1 = Math.min(t.wall.y[1], t.eave.yTop - t.eave.h);
    const x0 = t.wall.x[0], x1 = t.wall.x[1];
    const W = x1 - x0 + 1, H = y1 - t.wall.y[0] + 1;
    const y0 = t.wall.y[0];

    ops.box(w, x0, y0, bz0, W, H, dz, '白灰墙');                       // 白墙为底
    for (let cx = x0; cx <= x1 - 1; cx += 12)                          // 朱红立柱
      ops.box(w, cx, y0, bz0, 2, H, dz, '朱红·柱');
    ops.box(w, x1 - 1, y0, bz0, 2, H, dz, '朱红·柱');
    if (H >= 5)                                                        // 中部金窗一行
      for (let cx = x0 + 4; cx <= x1 - 6; cx += 8)
        ops.box(w, cx, y0 + 2, bz0, 3, 2, dz, '金·主体');
    ops.box(w, x0, y1, bz0, W, 1, dz, '金·主体');                      // 顶部金线收边
  }
  return w;
}

export default build;
