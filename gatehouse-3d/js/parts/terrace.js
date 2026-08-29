// P1 台基 · 石阶 · 栏杆基线（T6 / 重构版）
// 尺寸全部取自 spec.js，无本地魔数。
// 立面图：台基 y0..2 砂岩·亮 + y3 砂岩·暗（压顶/栏杆基线）；中央踏步 4 级居中。
import { VoxelWorld, ops } from '../voxel/builder.js';
import { stairs } from '../voxel/ops.js';
import { Z, TERRACE, GRID } from '../spec.js';

export function build() {
  const w = new VoxelWorld();
  const [tz0, tz1] = Z.TERRACE;
  const dz = tz1 - tz0 + 1;

  // 台明主体（砂岩·亮，y0..2）
  ops.box(w, 0, TERRACE.Y[0], tz0, GRID.W, TERRACE.Y[1] - TERRACE.Y[0], dz, '砂岩·亮');
  // 压顶 / 栏杆基线（砂岩·暗，y3 整层）
  ops.box(w, 0, TERRACE.CAP_Y, tz0, GRID.W, 1, dz, '砂岩·暗');

  // 中央踏步：4 级实填楔形体，自台基前缘向外向下渐降至地面
  stairs(w, {
    cx: GRID.W / 2,
    width: TERRACE.STEPS.width,
    count: TERRACE.STEPS.count,
    zFrom: TERRACE.STEPS.zFrom,
    yTop: TERRACE.Y[1] + 1,
  });
  return w;
}

export default build;
