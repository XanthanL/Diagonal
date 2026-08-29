// Part 注册表（03 §2 目录契约：每 Part 一个生成模块）
// 独立成模块的目的：main.js 与 selftest.js 都要拿到同一份世界，
// 若注册表放在 main.js 会形成 main ↔ selftest 循环依赖。
import terrace from './terrace.js';
import lions from './lions.js';
import gatehouse from './gatehouse.js';
import eave1 from './eave1.js';
import walls from './walls.js';
import upperRoofs from './upperRoofs.js';
import wings from './wings.js';
import closeups from './closeups.js';
import terrain from './terrain.js';

export const PART_BUILDERS = {
  terrace, lions, gatehouse, eave1, walls, upperRoofs, wings, closeups, terrain,
};

export const PART_IDS = Object.keys(PART_BUILDERS);

/** 构建全部 Part 世界（纯函数，同参数两次结果一致） */
export function buildAllWorlds() {
  return PART_IDS.map((id) => {
    const world = PART_BUILDERS[id]();
    if (!world || !world.count()) throw new Error('empty world: ' + id);
    return { id, world };
  });
}

/** 合并为一个世界（供 bbox / 连通域等全局几何断言使用；不用于渲染） */
export function buildMergedWorld(excludeIds = []) {
  const merged = new (buildAllWorlds()[0].world.constructor)();
  for (const { id, world } of buildAllWorlds()) {
    if (excludeIds.includes(id)) continue;
    for (const [x, y, z, idx] of world.entries()) merged.set(x, y, z, idx);
  }
  return merged;
}
