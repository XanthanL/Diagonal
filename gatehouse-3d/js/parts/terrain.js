// P9 绿水青山（门赖以拄其间 · 魔幻架空）：苔绿地坪、绕门碧水、石梁桥、层叠青山、锥状石峰、点状乔木。
// 尺寸全部取自 spec.js（ENV/RIVER/BRIDGE/MOUNT/KARST/TREES），无本地魔数；纯函数、确定性。
// 坐标可越出建筑界（x 可为负）：#10 建筑包围盒断言排除本 Part。
import { VoxelWorld, ops } from '../voxel/builder.js';
import { ENV, RIVER, BRIDGE, MOUNT, KARST, TREES } from '../spec.js';

export function build() {
  const w = new VoxelWorld();
  const [gx0, gx1] = ENV.X;
  const [gz0, gz1] = ENV.Z;
  const [cx0, cx1] = ENV.CARVE.x;
  const [cz0, cz1] = ENV.CARVE.z;

  // ---- 地坪：y0 岩影 / y1 苔绿（青山绿地基）；台基·踏步领地让位 ----
  for (let x = gx0; x <= gx1; x++) {
    for (let z = gz0; z <= gz1; z++) {
      if (x >= cx0 && x <= cx1 && z >= cz0 && z <= cz1) continue;
      ops.box(w, x, 0, z, 1, 1, 1, ENV.GROUND.rock);
      ops.box(w, x, 1, z, 1, 1, 1, ENV.GROUND.top);
    }
  }

  // ---- 门前甬道：台明正对面的深色铺石 ----
  ops.box(w, 20, 1, 44, 120, 1, 4, '砂岩·暗');

  // ---- 绕门碧水：深潭底 + 碧水面 + 浪花 ----
  for (const seg of RIVER.channel) {
    const sx = seg.x[1] - seg.x[0] + 1;
    const sz = seg.z[1] - seg.z[0] + 1;
    ops.box(w, seg.x[0], 0, seg.z[0], sx, 1, sz, RIVER.deep);
    ops.box(w, seg.x[0], 1, seg.z[0], sx, 1, sz, RIVER.surface);
  }
  // 浪花勾边：每片水域外缘一圈浅色岸沫，勾出清晰岸线
  for (const seg of RIVER.channel) {
    const sx = seg.x[1] - seg.x[0] + 1;
    const sz = seg.z[1] - seg.z[0] + 1;
    ops.box(w, seg.x[0], 1, seg.z[0], sx, 1, 1, RIVER.foam);                 // 北缘
    ops.box(w, seg.x[0], 1, seg.z[1], sx, 1, 1, RIVER.foam);                 // 南缘
    ops.box(w, seg.x[0], 1, seg.z[0], 1, 1, sz, RIVER.foam);                 // 西缘
    ops.box(w, seg.x[1], 1, seg.z[0], 1, 1, sz, RIVER.foam);                 // 东缘
  }
  // 湖面散点波纹：隔 9 石一枚浅色泡点，明暗成纹
  const c0 = RIVER.channel[0];
  for (let x = c0.x[0] + 4; x <= c0.x[1] - 4; x += 9) {
    const zf = 52 + ((Math.abs(x) % 18 < 9) ? 2 : -2);
    ops.box(w, x, 1, zf, 1, 1, 1, RIVER.foam);
  }

  // ---- 石梁桥：桥面 y1..2 贴水、两翼低栏 ----
  const bw = BRIDGE.x[1] - BRIDGE.x[0] + 1;
  const bz = BRIDGE.z[1] - BRIDGE.z[0] + 1;
  ops.box(w, BRIDGE.x[0], 1, BRIDGE.z[0], bw, 2, bz, '砂岩·亮');
  ops.box(w, BRIDGE.x[0], 3, BRIDGE.z[0], 1, 1, bz, '砂岩·暗');
  ops.box(w, BRIDGE.x[1], 3, BRIDGE.z[0], 1, 1, bz, '砂岩·暗');

  // ---- 青山：阶梯台地堆叠，台面苔绿、高巅云雾 ----
  for (const m of MOUNT) {
    const mx = m.x[1] - m.x[0] + 1;
    const my = m.y[1] - m.y[0] + 1;
    const mz = m.z[1] - m.z[0] + 1;
    ops.box(w, m.x[0], m.y[0], m.z[0], mx, my, mz, m.body);
    ops.box(w, m.x[0], m.y[1], m.z[0], mx, 1, mz, m.top);
  }

  // ---- 锥状石峰（桂林式）：逐层向心收分成尖，末层冠色 ----
  for (const k of KARST) {
    const tiers = Math.max(5, Math.round(k.h / 7));
    for (let i = 0; i < tiers; i++) {
      const y0 = Math.round((i * k.h) / tiers);
      const y1 = Math.round(((i + 1) * k.h) / tiers);
      const r = Math.max(1, Math.round(k.half * (1 - Math.pow(i / tiers, 1.7))));
      ops.box(w, k.cx - r, y0, k.cz - r, 2 * r + 1, y1 - y0, 2 * r + 1,
        i === tiers - 1 ? k.cap : k.body);
    }
  }

  // ---- 点状乔木：树干栗木、树冠黛绿/松绿叠团 + 青翠顶 ----
  for (const t of TREES) {
    ops.box(w, t.x, 2, t.z, 1, 2, 1, '栗木格栅');       // 树干 y2..3
    ops.box(w, t.x - 1, 4, t.z - 1, 3, 1, 3, '黛绿');   // 冠下层
    ops.box(w, t.x - 1, 5, t.z - 1, 3, 1, 3, '松绿');   // 冠中层
    ops.box(w, t.x, 6, t.z, 1, 1, 1, '青翠');           // 冠顶
  }

  return w;
}

export default build;
