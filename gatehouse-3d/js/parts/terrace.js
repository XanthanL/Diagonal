// Part: 台基 · 踏道 —— 门楼唯一的石作基座（砂岩两层：暗体亮面，正面对门洞开缺）
import { VoxelWorld, ops } from '../voxel/builder.js';
import { stoneLion } from '../voxel/ops.js';
import { TERRACE } from '../spec.js';

/** 沿 X 画一道横栏，中间留出 [gapX0, gapX1] 的开口 */
function railRun(w, x0, x1, gapX0, gapX1, y, z0, z1, color) {
  if (gapX0 > x0) ops.box(w, x0, y, z0, gapX0 - x0, 1, z1 - z0 + 1, color);
  if (gapX1 < x1) ops.box(w, gapX1 + 1, y, z0, x1 - gapX1, 1, z1 - z0 + 1, color);
}

export default function build() {
  const w = new VoxelWorld();
  const { x, y, z, RAIL, STEPS, APRON } = TERRACE;

  // 台身（暗）+ 压顶（亮，四周外突一格作檐口线）
  ops.box(w, x[0], y[0], z[0], x[1] - x[0] + 1, y[1] - y[0], z[1] - z[0] + 1, '砂岩·暗');
  ops.box(w, x[0] - 1, y[1], z[0] - 1, x[1] - x[0] + 3, 1, z[1] - z[0] + 3, '砂岩·亮');

  // 台面周圈栏板：两层（亮体 + 顶墨线），正中对踏道开缺
  const gap = STEPS.x;
  for (const line of [[RAIL.y[0], '砂岩·亮'], [RAIL.y[1], '砂岩·暗']]) {
    const [ry, c] = line;
    railRun(w, RAIL.x[0], RAIL.x[1], gap[0], gap[1], ry, RAIL.zF[0], RAIL.zF[1], c);
    ops.box(w, RAIL.x[0], ry, RAIL.zB[0], RAIL.x[1] - RAIL.x[0] + 1, 1,
            RAIL.zB[1] - RAIL.zB[0] + 1, c);
    ops.box(w, RAIL.x[0], ry, RAIL.zB[1] + 1, 1, 1, RAIL.zF[0] - RAIL.zB[1] - 1, c);
    ops.box(w, RAIL.x[1], ry, RAIL.zB[1] + 1, 1, 1, RAIL.zF[0] - RAIL.zB[1] - 1, c);
  }

  // 三级实砌踏道：逐级降低、逐级外挑（实砌保证 6-连通接地）
  for (let i = 0; i < STEPS.count; i++) {
    const ty = y[1] - 1 - i;
    ops.box(w, gap[0], 0, STEPS.z0 + i, gap[1] - gap[0] + 1, ty, 1, '砂岩·亮');
    ops.box(w, gap[0], ty, STEPS.z0 + i, gap[1] - gap[0] + 1, 1, 1, '砂岩·暗');
  }
  // 阶前地平石
  ops.box(w, APRON.x[0], 0, APRON.z[0], APRON.x[1] - APRON.x[0] + 1, 1,
          APRON.z[1] - APRON.z[0] + 1, '砂岩·亮');

  // 门前石狮一对：贴踏道缺口两侧守门洞（左狮 + 逐体素镜像右狮）
  stoneLion(w);
  stoneLion(w, { mirror: true });
  return w;
}
