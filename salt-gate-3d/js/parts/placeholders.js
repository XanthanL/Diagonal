// T5 —— 9 个 Part 的占位体素生成器
// 每个 Part 给出粗轮廓体素块（各自图例色），供 buildPartMesh 出网格。
// 真实建模自 T6 起逐 Part 替换：buildPlaceholder(partId) 的返回值换成精细世界即可，装配层不动。
// 体素坐标系：x∈[0,160]（中轴 80），y 向上（0=地面），z∈[0,44]（+z 临街）。

import { VoxelWorld, ops } from '../voxel/builder.js';

const box = ops.box;

// P1 台基：全宽石台明（砂岩·暗主体 + 砂岩·亮压顶）+ 顶面暗色栏杆基线环 + 中央 4 级踏步
function terrace() {
  const w = new VoxelWorld();
  const X0 = 8, W = 145;        // 台明 x8..152（≈30 m 全宽）
  const Z0 = 4, D = 36;         // z4..39（进深 ≈7.2 m；z=40 起为踏步）
  // 台明主体（砂岩·暗，3 层）
  box(w, X0, 0, Z0, W, 3, D, '砂岩·暗');
  // 压顶（砂岩·亮，整片顶面）
  box(w, X0, 3, Z0, W, 1, D, '砂岩·亮');
  // 栏杆基线：顶面外缘 1 格砂岩·暗环线（前/后/左/右四面）
  box(w, X0, 3, Z0, W, 1, 1, '砂岩·暗');             // 后缘（z=4）
  box(w, X0, 3, Z0 + D - 1, W, 1, 1, '砂岩·暗');     // 前缘（z=39，紧贴踏步）
  box(w, X0, 3, Z0, 1, 1, D, '砂岩·暗');             // 左缘（x=8）
  box(w, X0 + W - 1, 3, Z0, 1, 1, D, '砂岩·暗');     // 右缘（x=152）
  // 中央踏步（4 级，居中，实填楔形体，砂岩·亮）
  const SX = 64, SW = 32;       // 踏步 x64..96（≈6.4 m），居中于 x80
  box(w, SX, 3, 40, SW, 1, 1, '砂岩·亮');            // 第1级（贴台明前缘 y=3 顶 y=4）
  box(w, SX, 2, 40, SW, 1, 2, '砂岩·亮');            // 第2级（z40..41 y=2 顶 y=3）
  box(w, SX, 1, 40, SW, 1, 3, '砂岩·亮');            // 第3级（z40..42 y=1 顶 y=2）
  box(w, SX, 0, 40, SW, 1, 4, '砂岩·亮');            // 第4级（z40..43 y=0 顶 y=1，触地）
  return w;
}

// P2 石狮：左右各一（连门枕座）
function lions() {
  const w = new VoxelWorld();
  for (const cx of [56, 104]) {
    box(w, cx - 2, 6, 34, 5, 2, 5, '灰塑·亮');       // 座
    box(w, cx - 1, 8, 35, 3, 3, 3, '水波·浅青');      // 身（暂用浅青区分）
    box(w, cx, 11, 36, 1, 1, 1, '金·主体');           // 头顶标记
  }
  return w;
}

// P3 门堂柱网：两排 × 7 间列柱 + 柱础
function colonnade() {
  const w = new VoxelWorld();
  for (const z of [16, 26]) {
    for (let i = 0; i < 7; i++) {
      const x = 32 + i * 16;
      box(w, x, 0, z, 3, 1, 3, '灰塑·亮');            // 柱础
      const thick = i === 3 ? 4 : 3;                   // 明间加粗
      const yTop = i === 3 ? 34 : 32;
      box(w, x + ((i === 3) ? 0 : 0), 1, z, thick === 4 ? 3 : 2, yTop, 2, '朱红·柱');
    }
  }
  // 额枋联系梁（前后各一根）
  box(w, 30, 33, 16, 100, 2, 2, '朱红·柱');
  box(w, 30, 33, 26, 100, 2, 2, '朱红·柱');
  return w;
}

// P4 第一重檐：最宽檐带（厚 10 vx，含斗栱带）
function eave1() {
  const w = new VoxelWorld();
  box(w, 24, 37, 8, 112, 2, 24, '瓦·亮垄');           // 檐口主体
  box(w, 32, 39, 12, 96, 6, 16, '瓦·暗垄');           // 上层檐体收进
  box(w, 24, 35, 8, 112, 2, 24, '黑漆·受光');         // 斗栱带（黑底）
  // 金点阵示意斗栱
  for (let x = 26; x <= 132; x += 8) box(w, x, 35, 18, 2, 2, 2, '金·主体');
  return w;
}

// P5 匾额墙身：黑漆墙 + 大匾 + 两侧横团窠
function wallbody() {
  const w = new VoxelWorld();
  box(w, 48, 47, 14, 64, 14, 12, '黑漆·主体');        // 墙身
  box(w, 68, 50, 13, 24, 7, 2, '黑漆·主体');          // 大匾（凸出）
  box(w, 68, 50, 13, 24, 1, 1, '金·高光');            // 匾顶金线
  box(w, 68, 56, 13, 24, 1, 1, '金·高光');            // 匾底金线
  for (let i = 0; i < 9; i++) box(w, 70 + i * 2, 52, 13, 1, 3, 1, '金·主体'); // 9 字位
  box(w, 52, 51, 13, 12, 7, 1, '黑漆·受光');          // 左团窠底
  box(w, 96, 51, 13, 12, 7, 1, '黑漆·受光');          // 右团窠底
  box(w, 56, 53, 12, 4, 3, 1, '金·主体');             // 左菱花芯
  box(w, 100, 53, 12, 4, 3, 1, '金·主体');            // 右菱花芯
  return w;
}

// P6 上层檐与脊：三重收分檐带 + 宝顶
function uppertiers() {
  const w = new VoxelWorld();
  box(w, 40, 61, 12, 80, 8, 16, '瓦·亮垄');           // 二重檐
  box(w, 46, 69, 14, 68, 12, 10, '黑漆·主体');        // 三层墙身+檐
  box(w, 52, 81, 15, 56, 8, 10, '瓦·亮垄');           // 三重檐
  box(w, 58, 89, 16, 44, 10, 8, '黑漆·主体');         // 四层墙身
  box(w, 52, 99, 15, 56, 6, 8, '瓦·暗垄');            // 四重檐（正方形花板层）
  box(w, 76, 105, 17, 8, 2, 4, '金·主体');            // 花板标记
  box(w, 76, 107, 18, 8, 4, 2, '灰塑·亮');            // 宝顶基座
  box(w, 78, 111, 18, 4, 4, 2, '金·主体');            // 宝顶尖
  box(w, 79, 115, 19, 2, 3, 1, '金·高光');            // 顶珠
  return w;
}

// P7 次间两翼：左右白灰披檐
function wings() {
  const w = new VoxelWorld();
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? 8 : 124;
    box(w, x0, 0, 10, 28, 30, 22, '白灰墙');           // 翼墙
    box(w, x0 - 2, 30, 8, 32, 3, 26, '瓦·暗垄');       // 披檐
  }
  return w;
}

// P8 特写件：金色标记件（浮层视口自 T13 接入）
function closeups() {
  const w = new VoxelWorld();
  box(w, 78, 47, 12, 4, 4, 2, '金·主体');             // 匾心特写标记
  return w;
}

const BUILDERS = {
  terrace, lions, colonnade, eave1,
  wallbody, uppertiers, wings, closeups,
};

/**
 * 返回某 Part 的占位 VoxelWorld；overview 无独立实体 → 返回 null。
 * @param {string} partId
 * @returns {import('../voxel/builder.js').VoxelWorld | null}
 */
export function buildPlaceholder(partId) {
  const fn = BUILDERS[partId];
  if (!fn) throw new Error('buildPlaceholder: unknown part id: ' + partId);
  return fn();
}
