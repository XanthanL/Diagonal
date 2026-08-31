// Part: 水 · 桥 —— 一湾水、一座桥（STYLE §二.1：一片地、一湾水；§三：水只用两阶）
// 地 = 纸：本 Part 不铺地坪，苔绿地面由 main.js 的圆盘承担；水直接落在纸面上，只占 y=0 一层。
// 岸线由 WATER.coast 控制点逐列插值 → 1 格微台阶，读作一条蜿蜒水岸而不是矩形拼贴（§七）。
// 墨线只描远岸（背向相机的一岸），近岸直接接纸 → 轮廓不成闭合边框（§七「矩形边框当水岸 = 贴胶带」）。
import { VoxelWorld, ops } from '../voxel/builder.js';
import { getIndex } from '../voxel/palette.js';
import { interpolateCols } from '../voxel/ops.js';
import { WATER, BRIDGE } from '../spec.js';

export default function build() {
  const w = new VoxelWorld();
  const iInk = getIndex(WATER.deep);
  const iFace = getIndex(WATER.face);

  const { x0, x1, cols } = interpolateCols(WATER.coast);
  const col = (x) => cols[x - x0];

  // 桥跨水处让位：桥体从 y=0 起砌，同格再铺水会 z-fighting（§五 跨 Part 零重叠）
  const [bx0, bx1] = BRIDGE.x;
  const arch = interpolateCols(BRIDGE.arch);
  const underBridge = (x, z) => BRIDGE.x[0] <= x && x <= BRIDGE.x[1] && z >= arch.x0 && z <= arch.x1;

  for (let x = x0; x <= x1; x++) {
    const c = col(x);
    for (let z = c[0]; z <= c[1]; z++) {
      if (underBridge(x, z)) continue;
      w.set(x, 0, z, z === c[0] ? iInk : iFace);
    }
  }

  // ---- 桥：拱背逐列插值 → 1 格台阶堆出一条低弧，不立栏 ----
  for (let i = 0; i < arch.cols.length; i++) {
    const z = arch.x0 + i;
    const y = arch.cols[i][0];
    ops.box(w, bx0, 0, z, bx1 - bx0 + 1, y + 1, 1, BRIDGE.deck);
  }
  return w;
}
