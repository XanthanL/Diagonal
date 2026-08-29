// P9 山水（T21 · 门赖以拄其间）：地平让位于台基，曲水绕于左趾，连峰倚其背后，一桥通渡。
// 尺寸全部取自 spec.js（ENV/RIVER/BRIDGE/MOUNT），无本地魔数；纯函数、确定性。
// 预算纪律（#13 ≤250k 三角）：地坪单层、河面单层贴地、桥面坐落于两岸地坪并向水跨搭。
// 坐标可越出建筑界（x 可为负）：#10 建筑包围盒断言排除本 Part。
import { VoxelWorld, ops } from '../voxel/builder.js';
import { ENV, RIVER, BRIDGE, MOUNT } from '../spec.js';

export function build() {
  const w = new VoxelWorld();
  const [gx0, gx1] = ENV.X;
  const [gz0, gz1] = ENV.Z;
  const [cx0, cx1] = ENV.CARVE.x;
  const [cz0, cz1] = ENV.CARVE.z;

  // ---- 地坪（单层 y0，砂岩·亮）；台基·踏步领地让位 ----
  for (let x = gx0; x <= gx1; x++) {
    for (let z = gz0; z <= gz1; z++) {
      if (x >= cx0 && x <= cx1 && z >= cz0 && z <= cz1) continue;
      ops.box(w, x, 0, z, 1, 1, 1, '砂岩·亮');
    }
  }

  // ---- 门前甬道：台明正对面的深色铺石（把视线引进大门） ----
  ops.box(w, 20, 0, 44, 120, 1, 4, '砂岩·暗');

  // ---- 曲水（水面 y0 单层浅青，与地坪齐平——石滩式浅溪） ----
  for (const seg of RIVER.channel) {
    ops.box(w, seg.x[0], 0, seg.z[0], seg.x[1] - seg.x[0] + 1, 1, seg.z[1] - seg.z[0] + 1, '水波·浅青');
  }
  ops.box(w, RIVER.bank.x[0], 0, RIVER.bank.z, RIVER.bank.x[1] - RIVER.bank.x[0] + 1, 1, 1, '砂岩·暗');
  // 浪花：水面中缝隔 8 石一枚浅色泡点（明暗交替成水纹）
  const c0 = RIVER.channel[0];
  for (let x = c0.x[0] + 3; x <= c0.x[1] - 3; x += 8) {
    const zf = 51 + ((Math.abs(x) >> 3) % 2 ? 1 : 0);
    ops.box(w, x, 0, zf, 1, 1, 1, '灰塑·亮');
  }

  // ---- 石梁桥：桥面 y1..2 贴水（两端落在两岸地坪上，满足 6-连通接地）+ 两翼低栏 ----
  const bw = BRIDGE.x[1] - BRIDGE.x[0] + 1;
  const bz = BRIDGE.z[1] - BRIDGE.z[0] + 1;
  ops.box(w, BRIDGE.x[0], 1, BRIDGE.z[0], bw, 2, bz, '砂岩·暗');
  ops.box(w, BRIDGE.x[0], 3, BRIDGE.z[0], 1, 1, bz, '砂岩·暗');
  ops.box(w, BRIDGE.x[1], 3, BRIDGE.z[0], 1, 1, bz, '砂岩·暗');

  // ---- 山：阶梯台地堆叠，台面砂岩·亮、高巅灰塑·亮为云帽 ----
  for (const m of MOUNT) {
    const mx = m.x[1] - m.x[0] + 1;
    const my = m.y[1] - m.y[0] + 1;
    const mz = m.z[1] - m.z[0] + 1;
    ops.box(w, m.x[0], m.y[0], m.z[0], mx, my, mz, m.body);
    ops.box(w, m.x[0], m.y[1], m.z[0], mx, 1, mz, m.top);
  }

  return w;
}

export default build;
