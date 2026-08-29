// 色板（门楼 · 魔幻绿水青山版 · 30 色单一来源）
// 数据闭环：docs/DESIGN.md  ←  本文件。任何色名/HEX 增删须两处同步；违例（表外色名）一律 throw。
// 20 建筑色（黑漆/金/朱红/白灰/石青/砂岩/栗木/灰塑/瓦/木雕/水波）+ 10 自然灵光色（青山绿水云雾）。
import * as THREE from 'three';

export const PALETTE = Object.freeze({
  1:  { name: '瓦·暗垄',       hex: '#55565a' },
  2:  { name: '瓦·亮垄',       hex: '#6b6e6a' },
  3:  { name: '黑漆·主体',     hex: '#211d1b' },
  4:  { name: '黑漆·受光',     hex: '#332c28' },
  5:  { name: '金·主体',       hex: '#c9a13b' },
  6:  { name: '金·高光',       hex: '#e0bd66' },
  7:  { name: '石青·彩画地',   hex: '#3f7076' },
  8:  { name: '石青·浅',       hex: '#57909a' },
  9:  { name: '朱红·柱',       hex: '#a03828' },
  10: { name: '朱红·受光',     hex: '#b8503a' },
  11: { name: '白灰墙',         hex: '#e6e1d6' },
  12: { name: '白灰·暗',       hex: '#d8d2c4' },
  13: { name: '砂岩·亮',       hex: '#98938a' },
  14: { name: '砂岩·暗',       hex: '#7e786e' },
  15: { name: '栗木格栅',       hex: '#4a352a' },
  16: { name: '栗木·受光',     hex: '#5f4636' },
  17: { name: '木雕·金褐',     hex: '#8f6f4e' },
  18: { name: '水波·浅青',     hex: '#b7d0cf' },
  19: { name: '椽望暗层',       hex: '#2b2624' },
  20: { name: '灰塑·亮',       hex: '#efe9dc' },
  // —— 自然 · 青山 ——
  21: { name: '苔绿',           hex: '#7fa36b' },
  22: { name: '松绿',           hex: '#4f7a52' },
  23: { name: '黛绿',           hex: '#2f4a3a' },
  24: { name: '青翠',           hex: '#a8c98a' },
  25: { name: '岩影',           hex: '#6b7a72' },
  // —— 自然 · 绿水 ——
  26: { name: '碧水',           hex: '#4fb0b8' },
  27: { name: '深潭',           hex: '#2b6f86' },
  28: { name: '浪花',           hex: '#cfeceb' },
  29: { name: '云雾',           hex: '#dfe7e6' },
  // —— 魔幻 · 灵光 ——
  30: { name: '灵光',           hex: '#ffe9a8' },
});

export const NAME_TO_INDEX = Object.freeze(
  Object.fromEntries(Object.entries(PALETTE).map(([k, v]) => [v.name, Number(k)]))
);

export const INDEX_TO_NAME = Object.freeze(
  Object.fromEntries(Object.entries(PALETTE).map(([k, v]) => [k, v.name]))
);

// 预计算 linear-space THREE.Color；MeshLambertMaterial({ vertexColors: true }) 直接可用
export const COLORS = Object.freeze(
  Object.fromEntries(
    Object.entries(PALETTE).map(([k, v]) => [k, new THREE.Color(v.hex)])
  )
);

export const COLORS_BY_NAME = Object.freeze(
  Object.fromEntries(
    Object.entries(PALETTE).map(([k, v]) => [v.name, COLORS[k]])
  )
);

export const PALETTE_KEYS = Object.freeze(Object.keys(PALETTE).map(Number));
export const TOTAL_COLORS = 30;

// 入参可为「色名（中/英/含·号）」或「编号 1-20」；表外一律 throw。
export function getIndex(nameOrIndex) {
  if (typeof nameOrIndex === 'number') {
    if (!Number.isInteger(nameOrIndex) || !(nameOrIndex in PALETTE))
      throw new Error(`palette: invalid index ${nameOrIndex}`);
    return nameOrIndex;
  }
  const idx = NAME_TO_INDEX[nameOrIndex];
  if (idx === undefined) throw new Error(`palette: unknown color name "${nameOrIndex}"`);
  return idx;
}

export function getColor(nameOrIndex) {
  return COLORS[getIndex(nameOrIndex)];
}
