// Part: 顶 —— 攒尖收口：两级薄檐 → 金领 → 一枚灵光（STYLE §七：顶要么一条线收掉，要么一个尖收掉）
import { VoxelWorld } from '../voxel/builder.js';
import { crownTop } from '../voxel/ops.js';

export default function build() {
  const w = new VoxelWorld();
  crownTop(w);
  return w;
}
