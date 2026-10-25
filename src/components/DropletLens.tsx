"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { DropletLensEngine, type DropletFrame } from "@/lib/dropletLens";

/** 判定「是否悬停在可交互元素上」——命中后水滴收紧一点，像被吸住 */
const INTERACTIVE = 'a,button,[role="button"],input,textarea,select,summary,label,.press,.press-card';

/** 背景明暗采样节流间隔：getComputedStyle 会触发样式重算，不能每帧来 */
const SAMPLE_MS = 110;

/**
 * 镜体放大倍率。真透镜的放大率由曲率决定，玻璃珠大约就是这个量级；
 * 再大就成放大镜 UI 了，跟「一滴水」不是一回事。
 */
const MAG = 1.5;

/**
 * 收集 fixed 元素时的遍历深度上限。顶栏 / 吸底跳条都在很浅的一两层，
 * 而这一趟是按元素逐个读 computed style 的 —— 深度从 6 收到 3，构建耗时降一大截。
 */
const FIXED_DEPTH = 3;

/**
 * 在原 DOM 上收集所有 `position: fixed` 元素的索引路径。
 *
 * 为什么非要绕这一圈：副本在插入文档之前查不到 computed style，插入之后再查
 * 又要为整页副本强制一次布局。而原 DOM 早已布局完，读 position 是缓存命中。
 * 这些元素本来也压在水滴之上（顶栏 z-80 / 抽屉 z-70），水滴经过它们时看不见，
 * 所以直接从副本里删掉 —— 留着反而会以副本容器为参照系乱飞。
 */
function collectFixed(root: Element): number[][] {
  const out: number[][] = [];
  const walk = (el: Element, path: number[], depth: number): void => {
    if (depth > FIXED_DEPTH) return;
    const kids = el.children;
    for (let i = 0; i < kids.length; i++) {
      const kid = kids[i];
      const p = [...path, i];
      const pos = getComputedStyle(kid).position;
      if (pos === "fixed") {
        out.push(p); // 整棵子树一起删，不再往下走
        continue;
      }
      walk(kid, p, depth + 1);
    }
  };
  walk(root, [], 0);
  return out;
}

/** 超大字号阈值：字比镜体还大时，折射只会把笔画放大成黑团 —— 干脆不折射。 */
const HUGE_PX = 96;

/**
 * 指针下（含短祖先链）是否有超大字。hero 标题是 18vw，230px 的衬线在
 * 112px 镜体里放大 1.5 倍就是一团墨渍 —— 这种位置放大层应当退场。
 */
function sampleHuge(x: number, y: number): boolean {
  let node = document.elementFromPoint(x, y) as HTMLElement | null;
  let guard = 0;
  while (node && guard++ < 4) {
    if (parseFloat(getComputedStyle(node).fontSize) >= HUGE_PX) return true;
    node = node.parentElement;
  }
  return false;
}

/**
 * 采样指针下方第一个「基本不透明」的背景色亮度。
 * 返回 null 表示没采到（保留上一次判断），避免在过渡区域来回抖。
 *
 * 为什么需要它：着色器拿不到页面像素，无法自己判断底色。
 * - /atlas 整页黑底，首页那块盐粒子画布是 #0c0c0e；
 * - 一律走湿痕（压暗）的话，这些区块上会完全看不见；
 * - 一律走浅色的话，纸面上又会浮出一圈刺眼的白边。
 * 所以由这里给出 uDark，让引擎在「湿痕」与「粉笔」两套色板间平滑取舍。
 */
function sampleBackdrop(x: number, y: number): boolean | null {
  if (x < 0 || y < 0) return null;
  const el = document.elementFromPoint(x, y);
  let node: HTMLElement | null = el as HTMLElement | null;
  let guard = 0;
  while (node && guard++ < 8) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== "transparent") {
      const rgba = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?/.exec(bg);
      if (rgba) {
        const alpha = rgba[4] === undefined ? 1 : parseFloat(rgba[4]);
        if (!(alpha < 0.55)) {
          const luma =
            (0.2126 * Number(rgba[1]) + 0.7152 * Number(rgba[2]) + 0.0722 * Number(rgba[3])) / 255;
          return luma < 0.42;
        }
      }
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * 水滴透镜：全站指针 / 触控的着色器反馈层。
 *
 * 挂载在 root layout 里、脱离 main 之外，不参与任何路由重挂载，也不吃指针事件，
 * 所以对既有页面结构零侵入 —— 全站只多了一块固定定位的小画布和一层 window 监听。
 *
 * 画布不再铺满屏幕（只有 200px 见方，靠 transform 跟手），
 * 所以既不会出现满屏墨痕，也不必在每帧遍历整个视口。
 */
export function DropletLens() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const magRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const buildRef = useRef<(() => void) | null>(null);
  const pathname = usePathname();
  const off = pathname.startsWith("/admin");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || off) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let engine: DropletLensEngine;
    try {
      engine = new DropletLensEngine(canvas, { mobile: window.innerWidth < 768 });
    } catch (err) {
      // 没有 WebGL / 着色器编译失败就安静退场，绝不影响页面任何功能。
      // 留一条 warn 而不是彻底吞掉：这是唯一能在线上回答"为什么没效果"的线索。
      console.warn("[DropletLens] 水滴透镜未启用：", err);
      return;
    }

    // 镜体几何：容器与画布同尺寸，镜体居中，直径取水滴的 0.56×画布 —— 环和放大区必须等大
    const d = engine.lensDiameter();
    const size = d / 0.56;
    const mag = magRef.current;
    if (mag) {
      mag.style.width = size + "px";
      mag.style.height = size + "px";
    }
    const lens = lensRef.current;
    if (lens) {
      lens.style.width = d + "px";
      lens.style.height = d + "px";
      // 镜体在容器内居中即可，跟随由容器负责 —— 它自己再叠一次视口级 translate 就会偏双倍
      lens.style.left = `calc(50% - ${d / 2}px)`;
      lens.style.top = `calc(50% - ${d / 2}px)`;
    }

    let lastK = -1;
    // 每帧把位置 / 直径交给 DOM 副本。着色器那枚水滴和这两层内容是同一枚水滴的两半，
    // 各走各的会立刻露馅（环圈住的范围和放大范围对不上）。
    engine.onFrame = (f: DropletFrame) => {
      const m = magRef.current;
      const zoom = zoomRef.current;
      const doc = docRef.current;
      if (!m || !zoom || !doc) return;

      const r = d / 2;
      m.style.transform = `translate3d(${f.x - size / 2}px, ${f.y - size / 2}px, 0)`;

      // 放大层：把指针所在的文档点 P 推到镜心，再整体放大 MAG 倍
      const px = f.x + window.scrollX;
      const py = f.y + window.scrollY;
      doc.style.transform = `translate(${r - MAG * px}px, ${r - MAG * py}px) scale(${MAG})`;

      // 半径只在明显变化时写：改 --k 会让这层重新光栅化 mask
      if (Math.abs(f.k - lastK) > 0.004) {
        zoom.style.setProperty("--k", String(f.k));
        lastK = f.k;
      }
    };

    // 副本留到真正要用时再建（首次移动），别拖慢首屏；路由换了由克隆 effect 清空重建。
    const scheduleBuild = () => {
      if (docRef.current && docRef.current.childElementCount > 0) return;
      const run = () => buildRef.current?.();
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(run, { timeout: 600 });
      } else {
        window.setTimeout(run, 200);
      }
    };

    let lastSample = 0;
    let dark: boolean | null = null;
    let lastHuge = false;
    let lastTarget: Element | null = null;

    const sample = (x: number, y: number, force: boolean) => {
      const now = performance.now();
      if (!force && now - lastSample < SAMPLE_MS) return;
      lastSample = now;
      const d = sampleBackdrop(x, y);
      if (d !== null && d !== dark) {
        dark = d;
        engine.setDark(d);
      }
      // 超大字上放大层退场（同受节流管，getComputedStyle 不能每帧来）
      const huge = sampleHuge(x, y);
      if (huge !== lastHuge) {
        lastHuge = huge;
        zoomRef.current?.classList.toggle("mag-dim", huge);
      }
    };

    const onMove = (e: PointerEvent) => {
      scheduleBuild();
      engine.move(e.pointerId, e.clientX, e.clientY);
      const target = e.target as Element | null;
      if (target !== lastTarget) {
        lastTarget = target;
        engine.setNib(!!target?.closest?.(INTERACTIVE));
      }
      sample(e.clientX, e.clientY, dark === null);
    };

    const onDown = (e: PointerEvent) => {
      // 触屏上 pointerdown 常常早于第一次 pointermove，先补一次位置，水滴才有落点
      engine.move(e.pointerId, e.clientX, e.clientY);
      engine.press(e.pointerId);
      sample(e.clientX, e.clientY, true);
    };

    // 鼠标抬起后水滴仍要跟着走（指针还在屏幕上），所以不 release；
    // 触屏 / 触控笔抬手后留一小段余韵再蒸发。
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") engine.release(e.pointerId, 260);
    };
    // 页面上只要手指一滑，Chrome 就把它判成滚动手势并 pointercancel。
    // 不能立刻消失（那样触屏等于一动就没），留 600ms 让水滴跟完那一小截。
    const onCancel = (e: PointerEvent) => engine.release(e.pointerId, 600);

    // 指针移出文档（鼠标划出窗口）→ 淡出
    const onLeave = () => engine.release(-1, 350);

    const onResize = () => engine.resize();

    const onVisibility = () => {
      if (document.hidden) engine.stop();
      else engine.wake();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onCancel, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      engine.dispose();
    };
  }, [off]);

  /**
   * 镜体内容：页面的一份真实 DOM 副本。
   *
   * 只做桌面：触屏没有悬停，水滴是点一下就没的瞬时反馈，为它保留整页副本不划算，
   * 移动端留环和高光就够了。副本由首次指针移动触发（requestIdleCallback），
   * 路由换了会清空重建。
   */
  useEffect(() => {
    const doc = docRef.current;
    const zoom = zoomRef.current;
    if (off || !doc || !zoom) return;
    if (window.innerWidth < 768) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let built = false;
    const build = () => {
      if (built || !document.body) return;
      built = true;
      const body = document.body;
      doc.style.width = body.clientWidth + "px";

      const paths = collectFixed(body);
      const frag = document.createDocumentFragment();
      for (const child of Array.from(body.children)) {
        frag.appendChild(child.cloneNode(true));
      }
      doc.replaceChildren(frag);

      // 先按索引路径删 fixed（此刻索引仍与原始一致），再清掉那些拷过来也没用的节点
      for (const p of paths) {
        let el: Element | null = doc;
        for (const i of p) el = el ? el.children[i] ?? null : null;
        if (el) el.remove();
      }
      doc.querySelectorAll("script,noscript,iframe,video,canvas").forEach((n) => n.remove());
      zoom.setAttribute("data-ready", "1");
    };
    buildRef.current = build;

    // 副本只用来「被看」：不进无障碍树、不吃焦点
    doc.setAttribute("aria-hidden", "true");
    doc.setAttribute("inert", "");

    return () => {
      buildRef.current = null;
      zoom.removeAttribute("data-ready");
      zoom.classList.remove("mag-dim");
      doc.replaceChildren();
    };
  }, [off, pathname]);

  if (off) return null;

  return (
    <>
      <div ref={magRef} className="droplet-mag" role="presentation" aria-hidden="true">
        {/* 只一层副本：径向 mask 把放大内容渐隐到透明，露出的就是真实页面本身 —— 
            比再垫一层 1:1 副本更无缝，也省掉一整份 DOM。 */}
        <div ref={lensRef} className="mag-lens">
          <div ref={zoomRef} className="mag-zoom">
            <div ref={docRef} className="mag-doc" />
          </div>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="droplet-lens"
        role="presentation"
        aria-hidden="true"
      />
    </>
  );
}
