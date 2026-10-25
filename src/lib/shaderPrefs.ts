/**
 * 两层着色器的开关（顶栏可勾选）。
 *
 * 两个键：
 * - droplet —— 圆形的那枚水滴透镜（跟随指针、全站生效）
 * - square  —— 方形的照片取样框（图集照片上，指针 / 全屏点按出现）
 *
 * 存 localStorage，跨页面 / 刷新都记得；同页内多个消费者（顶栏、DropletLens、
 * SquareLensGallery）通过订阅同步 —— 不引入 Context，是因为水滴那一层挂在
 * root layout 的 body 末尾，走一棵 Provider 树反而多绑一层。
 */

export type ShaderKey = "droplet" | "square";
export type ShaderPrefs = Record<ShaderKey, boolean>;

const STORAGE_KEY = "diagonal:shaders";
const DEFAULTS: ShaderPrefs = { droplet: true, square: true };

let cached: ShaderPrefs | null = null;
const listeners = new Set<(prefs: ShaderPrefs) => void>();

function load(): ShaderPrefs {
  if (cached) return cached;
  const next: ShaderPrefs = { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ShaderPrefs>;
      if (typeof parsed.droplet === "boolean") next.droplet = parsed.droplet;
      if (typeof parsed.square === "boolean") next.square = parsed.square;
    }
  } catch {
    // 隐私模式 / 坏数据：用默认值，绝不让开关拖垮页面
  }
  cached = next;
  return next;
}

/** 只读一份快照。首次调用会读 localStorage，之后走缓存。 */
export function readShaderPrefs(): ShaderPrefs {
  return load();
}

export function setShaderPref(key: ShaderKey, value: boolean): void {
  const next: ShaderPrefs = { ...load(), [key]: value };
  cached = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 存不下就算了，本次会话内仍然生效 */
  }
  listeners.forEach((fn) => fn(next));
}

/** 订阅变更，返回退订函数 */
export function subscribeShaderPrefs(fn: (prefs: ShaderPrefs) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
