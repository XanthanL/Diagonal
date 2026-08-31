// 色板（门楼 · 从 0 重做版 · 23 色单一来源）
// 数据闭环：docs/STYLE.md §三  ←  本文件。任何色名/HEX 增删须两处同步；违例（表外色名）一律 throw。
// 16 建筑色（瓦/黑漆/金/朱红/白灰/砂岩/栗木/椽望/灰塑）+ 6 自然色（青山绿水）+ 1 灵光。
import * as THREE from 'three';

export const PALETTE = Object.freeze({
  1:  { name: '瓦·暗垄',       hex: '#5f636b' },
  2:  { name: '瓦·亮垄',       hex: '#8b939c' },
  3:  { name: '黑漆·主体',     hex: '#211d1b' },
  4:  { name: '黑漆·受光',     hex: '#332c28' },
  5:  { name: '金·主体',       hex: '#c9a13b' },
  6:  { name: '金·高光',       hex: '#e0bd66' },
  7:  { name: '朱红·柱',       hex: '#a03828' },
  8:  { name: '朱红·受光',     hex: '#b8503a' },
  9:  { name: '白灰墙',         hex: '#e6e1d6' },
  10: { name: '白灰·暗',       hex: '#d8d2c4' },
  11: { name: '砂岩·亮',       hex: '#98938a' },
  12: { name: '砂岩·暗',       hex: '#7e786e' },
  13: { name: '栗木格栅',       hex: '#4a352a' },
  14: { name: '栗木·受光',     hex: '#5f4636' },
  15: { name: '椽望暗层',       hex: '#2b2624' },
  16: { name: '灰塑·亮',       hex: '#efe9dc' },
  // —— 自然 · 青山绿水 ——
  17: { name: '苔绿',           hex: '#a9bfa0' },
  18: { name: '松绿',           hex: '#4f7a52' },
  19: { name: '黛绿',           hex: '#2f4a3a' },
  20: { name: '岩影',           hex: '#6b7a72' },
  21: { name: '碧水',           hex: '#6fa9ac' },
  22: { name: '深潭',           hex: '#2b6f86' },
  // —— 魔幻 · 灵光 ——
  23: { name: '灵光',           hex: '#ffe9a8' },
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
export const TOTAL_COLORS = 23;

// 入参可为「色名（中/含·号）」或「编号 1-23」；表外一律 throw。
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
