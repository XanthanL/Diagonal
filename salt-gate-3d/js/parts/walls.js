// P5 二三层墙身（T10 / 重构版）：仅黑漆墙身（承接下层檐顶、托起上层檐底）
// 团窠花板与匾额移至 upperRoofs.js：它们嵌在檐带内部，必须与檐带同属一个世界才能正确覆写
// （跨 Part 同占一个体素会在合并渲染时 z-fighting）。
// 墙身纵向区间已裁剪 1 格，保证与上下檐带"相邻而不重叠"（T3 墙 62..72 / T4 墙 86..92）。
import { VoxelWorld, ops } from '../voxel/builder.js';
import { Z, TIERS } from '../spec.js';

export function build() {
  const w = new VoxelWorld();
  const [bz0, bz1] = Z.BODY;
  const dz = bz1 - bz0 + 1;

  for (const t of [TIERS[1], TIERS[2]]) {          // T2 / T3
    // 檐带中央底边 = yTop - h + 1（中央平段 u=0 处最厚、位置最低）
    // 故墙身顶格须取 yTop - h —— 差 1 就会在层间留下 1 格断缝，整座上层塔楼悬空（#11 断言抓到过）。
    const y1 = Math.min(t.wall.y[1], t.eave.yTop - t.eave.h);
    ops.box(w, t.wall.x[0], t.wall.y[0], bz0,
      t.wall.x[1] - t.wall.x[0] + 1, y1 - t.wall.y[0] + 1, dz, '黑漆·主体');
  }
  return w;
}

export default build;
