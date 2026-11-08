/**
 * 档案排序的唯一真相。
 *
 * `ArchiveItem.year` 不是「年份」，而是发布时间字符串 `YYYY.MM.DD HH:mm`
 * （公众号推文来自微信 create_time，legacy 条目同样是完整时间戳）。
 * 旧实现用 `b.year.localeCompare(a.year)` 比较格式化字符串：
 *   - 结果依赖运行环境的 locale / ICU 排序规则；
 *   - 一旦出现 `2026.1.7` 这类非补零写法就会排错；
 *   - 同一时间戳的多篇（微信同分钟群发）顺序由数组原始顺序决定，不稳定。
 * 这里统一解析成纯数字再比较，并给同时间戳一个确定的 id 兜底顺序。
 */
export interface DatedArchiveItem {
  id: string;
  year?: string;
}

/**
 * 把 `YYYY.MM.DD HH:mm` 转成可直接相减的定长数字（202611071909）。
 * 不用 Date：避免时区偏移与无效日期被默默归一化。解析不了返回 0，永远排最后。
 */
export function archiveTimestamp(year?: string): number {
  if (!year) return 0;
  const m = /^(\d{4})\.(\d{1,2})\.(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/.exec(year.trim());
  if (!m) return 0;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4] || 0);
  const mi = Number(m[5] || 0);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return 0;
  return (((y * 100 + mo) * 100 + d) * 100 + h) * 100 + mi;
}

function cmpId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** 默认排序：最近发布在前（严格时间倒序）。 */
export function compareByPublishDesc<T extends DatedArchiveItem>(a: T, b: T): number {
  const diff = archiveTimestamp(b.year) - archiveTimestamp(a.year);
  return diff !== 0 ? diff : cmpId(a.id, b.id);
}

/** 可选排序：最早发布在前（严格时间正序）。 */
export function compareByPublishAsc<T extends DatedArchiveItem>(a: T, b: T): number {
  const diff = archiveTimestamp(a.year) - archiveTimestamp(b.year);
  return diff !== 0 ? diff : cmpId(a.id, b.id);
}

/** 年份分隔行用；无日期的条目归到 UNDATED。 */
export function archiveYear(item: DatedArchiveItem): string {
  return /^\d{4}/.test(item.year || "") ? item.year!.slice(0, 4) : "UNDATED";
}
