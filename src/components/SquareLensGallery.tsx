"use client";

import { useEffect, useRef } from "react";
import { getCloudinaryUrl, getCloudinarySrcSet } from "@/lib/path";
import { SquareLensEngine, loadCors } from "@/lib/squareLens";

export interface LensPhoto {
  url: string;
  caption: string;
  width?: number;
  height?: number;
}

/**
 * 纹理另取一个宽度：与页面 <img> 的 URL 不同 → 独立的缓存条目。
 * 否则带 CORS 的请求会撞上那个没有 Access-Control-Allow-Origin 的缓存副本，
 * 然后整块画布被判污染（这是最常见的「本地能跑线上不行」）。
 */
const LENS_W = 1200;

type Orientation = "landscape" | "portrait";

/** 画幅未知时按横幅处理：宁可整幅铺开，也不要把一张大图硬塞进小格子 */
function orientationOf(p: LensPhoto): Orientation {
  return p.width && p.height && p.width < p.height ? "portrait" : "landscape";
}

/**
 * 图集照片墙，照片上带一枚跟随指针的方形取样框。
 *
 * 结构上只有一个 canvas 在整段里复用：指针移到哪张照片上，就把这块画布
 * 挪进那张照片的容器。66 张图如果各建一个 WebGL 上下文，显存和上下文上限
 * 都撑不住 —— 而同一时刻本来也只有一块取样框。
 *
 * 两种排布：
 * - masonry（默认）：等高砖墙，适合同一台相机、同一画幅的成组照片
 * - sequence：按画幅分区 —— 横幅整幅铺开，竖幅压成小格。画幅差得远时
 *   （比如 2.16:1 的全景配 1:2.16 的竖幅）砖墙会读成一堆碎条
 */
export function SquareLensGallery({
  photos,
  label,
  layout = "masonry",
}: {
  photos: LensPhoto[];
  label: string;
  layout?: "masonry" | "sequence";
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  // 依赖不能直接用 photos：它是每次 render 新建的数组，会让下面的引擎反复重建。
  // 用内容指纹做依赖，最新数据走 ref。
  const key = photos.map((p) => p.url).join("|");

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    // 前庭敏感 / 省电模式：整层不启用
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // 触屏没有 hover 语义，手指一按就滚页，取样框只会碍事
    if (window.innerWidth < 768) return;
    if (photosRef.current.length < 2) return;

    let eng: SquareLensEngine;
    let cv: HTMLCanvasElement;
    try {
      cv = document.createElement("canvas");
      cv.className = "lens-canvas";
      eng = new SquareLensEngine(cv);
    } catch {
      return; // 没有 WebGL 就老老实实显示图片，页面不受影响
    }
    // 淡入淡出与着色器同源：框从中心扩开的同时，整块画布也从不透明底下浮上来。
    // 框外画的就是这张照片本身，所以透明度怎么变都不会有跳变。
    eng.onEnter = (e) => {
      cv.style.opacity = String(e);
    };

    let cur = -1;
    let token = 0;
    let box: HTMLElement | null = null;
    let ro: ResizeObserver | null = null;
    // 指针的最新视口坐标。**必须**一直记着，不能只在 box 就位时才记：
    // 纹理加载那几秒里产生的 pointermove 全都是有效输入，丢掉它们的话
    // 方框会停在「发起加载时」那个早就过时的位置 —— 鼠标移得越快偏得越远。
    let lastX = 0;
    let lastY = 0;
    let hasPointer = false;

    const unwatch = () => {
      if (ro) {
        ro.disconnect();
        ro = null;
      }
    };

    const detach = () => {
      cur = -1;
      unwatch();
      box = null;
      if (cv.parentNode) cv.parentNode.removeChild(cv);
      eng.hide();
    };

    const moveAt = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      hasPointer = true;
      sync();
    };

    /** 用**最新**的指针位置定位，而不是某个事件里记下的旧坐标 */
    const sync = () => {
      if (!box || !hasPointer) return;
      const r = box.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // v 向上：WebGL 的纹理坐标原点在左下，DOM 在左上
      eng.move((lastX - r.left) / r.width, 1 - (lastY - r.top) / r.height);
    };

    const attach = async (el: HTMLElement) => {
      const list = photosRef.current;
      const i = Number(el.dataset.lensIndex);
      if (!Number.isFinite(i) || i < 0 || i >= list.length) return;

      if (i === cur) {
        // 还是同一张：纹理还在，直接把框叫回来，别再下一轮网络
        sync();
        eng.show();
        return;
      }

      token += 1;
      const my = token;
      const next = list[(i + 1) % list.length];
      const [out, ins] = await Promise.all([
        loadCors(getCloudinaryUrl(list[i].url, LENS_W)),
        loadCors(getCloudinaryUrl(next.url, LENS_W)),
      ]);
      // 期间指针已经移到别的照片上了 —— 这次结果作废
      if (my !== token) return;
      if (!out || !ins || !eng.setSource(out, ins)) {
        detach(); // 跨域拿不到纹理：静默退回纯图片
        return;
      }

      unwatch();
      box = el;
      el.appendChild(cv);
      const r = el.getBoundingClientRect();
      eng.setSize(r.width, r.height);
      ro = new ResizeObserver(() => {
        // masonry 是 columns 布局，窗口一变每列的宽度和高度都会重排
        const rr = el.getBoundingClientRect();
        eng.setSize(rr.width, rr.height);
        sync(); // 容器一挪，方框也得跟着重新对位
      });
      ro.observe(el);
      cur = i;
      eng.jump(); // 换图就别从上一张的位置飞过来
      sync();
      eng.show();
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      lastX = e.clientX;
      lastY = e.clientY;
      hasPointer = true;
      const t = e.target as HTMLElement | null;
      const el = t && t.closest ? (t.closest("[data-lens-index]") as HTMLElement | null) : null;
      if (el) void attach(el);
      else eng.hide();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      moveAt(e);
    };

    const onLeave = () => eng.hide();
    // 滚动时指针在屏幕上一动不动，但照片从它底下走了过去 ——
    // 方框不重新对位就会赖在照片上的老地方不动
    const onScroll = () => sync();

    section.addEventListener("pointerover", onOver);
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      token += 1;
      section.removeEventListener("pointerover", onOver);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      unwatch();
      if (cv.parentNode) cv.parentNode.removeChild(cv);
      eng.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const captionOf = (img: LensPhoto, index: number) =>
    img.caption || `${label}_${(index + 1).toString().padStart(3, "0")}`;

  const figure = (img: LensPhoto, index: number, sizes: string) => (
    <figure className="space-y-4">
      <div data-lens-index={index} className="relative group p-0">
        <img
          src={getCloudinaryUrl(img.url, 1080)}
          srcSet={getCloudinarySrcSet(img.url) || undefined}
          sizes={sizes}
          width={img.width}
          height={img.height}
          alt={captionOf(img, index)}
          loading="lazy"
          decoding="async"
          className="w-full h-auto"
        />
      </div>
      <figcaption className="archive-text text-[12px] opacity-65 uppercase tracking-widest pl-2">
        {captionOf(img, index)}
      </figcaption>
    </figure>
  );

  if (layout === "masonry") {
    return (
      <section ref={sectionRef} className="columns-1 md:columns-2 gap-12 space-y-12">
        {photos.map((img, index) => (
          <div key={index} className="break-inside-avoid">
            {figure(img, index, "(min-width: 768px) 620px, 100vw")}
          </div>
        ))}
      </section>
    );
  }

  // —— sequence：把**连续**的同画幅照片归成一区。不重排顺序，
  // 因为顺序本身是作者排的（拍摄次序），这里只负责给不同画幅不同的版面。
  const groups: { orientation: Orientation; items: { img: LensPhoto; index: number }[] }[] = [];
  photos.forEach((img, index) => {
    const orientation = orientationOf(img);
    const last = groups[groups.length - 1];
    if (last && last.orientation === orientation) last.items.push({ img, index });
    else groups.push({ orientation, items: [{ img, index }] });
  });

  return (
    <section ref={sectionRef} className="space-y-24 md:space-y-28">
      {groups.map((g, gi) => (
        <div key={gi}>
          {groups.length > 1 && (
            <div className="archive-text mb-8 flex items-center gap-4 text-[10px] tracking-[0.3em] opacity-55">
              <span>{g.orientation === "landscape" ? "横幅 / HORIZONTAL" : "竖幅 / VERTICAL"}</span>
              <span className="h-px flex-1 bg-white/15" />
              <span>
                {String(g.items[0].index + 1).padStart(2, "0")}–
                {String(g.items[g.items.length - 1].index + 1).padStart(2, "0")}
              </span>
            </div>
          )}
          {g.orientation === "landscape" ? (
            // 横幅整幅铺开：2.16:1 的全景缩到半栏就只剩一条缝了
            <div className="mx-auto max-w-5xl space-y-16 md:space-y-20">
              {g.items.map(({ img, index }) => (
                <div key={index}>{figure(img, index, "(min-width: 1024px) 1024px, 100vw")}</div>
              ))}
            </div>
          ) : (
            // 竖幅压成小格：1:2.16 按整幅宽度走会有两三屏高
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 md:gap-x-8">
              {g.items.map(({ img, index }) => (
                <div key={index}>{figure(img, index, "(min-width: 768px) 25vw, 45vw")}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
