// P6 第二~四重檐 + 墙身 + 歇山脊饰（T11 / 重构版）
// 本文件独占 T2/T3/T4 的"檐带 + 嵌于带内的花板/匾额"——两者必须在同一世界内，
// 花板才能正确覆写檐带（立面观感：花板被檐体上下左右包裹），且避免跨 Part z-fighting。
// 三重叠收：T2 halfW=44 → T3 38 → T4 30（宽度严格递减）；角端升起 6/5/5。
import { VoxelWorld, ops } from '../voxel/builder.js';
import { eaveTier, panelSym, plaque, ridgeSet } from '../voxel/ops.js';
import { Z, TIERS, CROWN } from '../spec.js';

export function build() {
  const w = new VoxelWorld();
  const [bz0, bz1] = Z.BODY;
  const [ez0, ez1] = Z.EAVE_BAND;
  const eaveDz = ez1 - ez0 + 1;

  // 檐带（先画）→ 花板/匾额（后画，覆写嵌入带内正中）
  for (const t of [TIERS[1], TIERS[2], TIERS[3]]) {
    eaveTier(w, { ...t.eave, z0: ez0, z1: ez1 });
    if (t.plaque) {
      plaque(w, {
        x0: t.plaque.x[0], y0: t.plaque.y[0], z0: ez0,
        w: t.plaque.x[1] - t.plaque.x[0] + 1,
        h: t.plaque.y[1] - t.plaque.y[0] + 1,
        dz: eaveDz, chars: t.plaque.chars, charW: 1,
      });
    }
    for (const p of t.panels) panelSym(w, { ...p, z0: ez0, z1: ez1 });
  }

  // T4 墙身（顶格 = yTop - h：与 T4 檐带中央底边 yTop-h+1 相邻而不重叠）
  const t4 = TIERS[3];
  const t4Top = Math.min(t4.wall.y[1], t4.eave.yTop - t4.eave.h);
  ops.box(w, t4.wall.x[0], t4.wall.y[0], bz0,
    t4.wall.x[1] - t4.wall.x[0] + 1, t4Top - t4.wall.y[0] + 1, bz1 - bz0 + 1, '黑漆·主体');

  // 顶：黑漆顶柱 → 灰塑正脊 + 鸱吻 → 立体宝顶（16→12→8→4 三段阶梯）
  ridgeSet(w, CROWN, ez0, ez1);
  return w;
}

export default build;
