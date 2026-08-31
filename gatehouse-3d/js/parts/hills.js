// Part: 山 —— 两道相叠的山脊剪影（STYLE §二.1「几道山」、§二.3 横向长条、§五 单层薄幕）
// 山全是纸幕：进深一格，正身读作崖壁，侧看是一张纸；淡出交给雾，不画出来。
// 近幕 黛绿→松绿（深、矮），远幕 松绿→岩影（浅、高）→ 越远越浅、山外有山；顶部一律不戴帽。
import { VoxelWorld } from '../voxel/builder.js';
import { RIDGES } from '../spec.js';
import { mountainScreen } from '../voxel/ops.js';

export default function build() {
  const w = new VoxelWorld();
  for (const r of RIDGES) mountainScreen(w, r);
  return w;
}
