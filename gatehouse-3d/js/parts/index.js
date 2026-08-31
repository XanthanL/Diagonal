// Part 注册表 —— id → 生成器；并提供合并世界给 selftest 的几何断言用。
// 顺序即侧栏导览顺序（data.js 的 PARTS 与此一一对应，overview 除外）。
import { VoxelWorld } from '../voxel/builder.js';
import terrace from './terrace.js';
import gate from './gate.js';
import eaves from './eaves.js';
import crown from './crown.js';
import water from './water.js';
import hills from './hills.js';

export const PART_BUILDERS = { terrace, gate, eaves, crown, water, hills };

/** 建筑本体（参与总包围盒契约）/ 山水地形（越界不计） */
export const BUILDING_IDS = ['terrace', 'gate', 'eaves', 'crown'];
export const TERRAIN_IDS = ['water', 'hills'];
export const ALL_IDS = [...BUILDING_IDS, ...TERRAIN_IDS];

export function buildAllWorlds() {
  return ALL_IDS.map((id) => ({ id, world: PART_BUILDERS[id]() }));
}

/** 合并成一个世界（exclude 传 id 数组）；用于包围盒 / 悬空 / 重叠断言 */
export function buildMergedWorld(exclude = []) {
  const ex = new Set(exclude);
  const m = new VoxelWorld();
  for (const { id, world } of buildAllWorlds()) {
    if (ex.has(id)) continue;
    for (const [x, y, z, idx] of world.entries()) m.voxels.set(x + ',' + y + ',' + z, idx);
  }
  return m;
}
