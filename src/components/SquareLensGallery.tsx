"use client";

import { useEffect, useRef, useState } from "react";
import { getCloudinaryUrl, getCloudinarySrcSet } from "@/lib/path";
import { useI18n } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { SquareLensEngine, loadCors } from "@/lib/squareLens";
import { readShaderPrefs, subscribeShaderPrefs } from "@/lib/shaderPrefs";

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

/**
 * 方框半边长 = uBox × 画布短边（必须与着色器里的 uBox 同步）。
 * 网格里照片小、框按比例就够；全屏那张 2.16:1 的全景只有 166px 高，
 * 0.2 算出来才 66px，框里认不出「下一张底片」，所以在全屏视图里放大到 0.28。
 */
const BOX_HALF_GRID = 0.2;
const BOX_HALF_STAGE = 0.28;

type Orientation = "landscape" | "portrait";

/** 画幅未知时按横幅处理：宁可整幅铺开，也不要把一张大图硬塞进小格子 */
function orientationOf(p: LensPhoto): Orientation {
  return p.width && p.height && p.width < p.height ? "portrait" : "landscape";
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * 取样框的对外接口。桌面悬停与手机全屏共用同一台引擎、同一块画布 ——
 * 一个页面只需要一个 WebGL 上下文。
 */
type LensApi = {
  /** 把画布挪进 el 并备好 index 这张（及下一张）的纹理。返回 false = 这一层用不了 */
  attach: (el: HTMLElement, index: number, boxHalf?: number) => Promise<boolean>;
  /** 按视口坐标移动（内部换算成画布归一化坐标） */
  move: (clientX: number, clientY: number) => void;
  show: () => void;
  hide: () => void;
  detach: () => void;
  /** 覆盖着色器强度（全屏视图里要更克制，不然框小、色散大＝一团彩虹） */
  tune: (t: { lens?: number; chroma?: number; wave?: number; grain?: number }) => void;
};

/** 网格里那一档（与桌面悬停一致） */
const TUNING_GRID = { lens: 0.55, chroma: 0.7, wave: 0.35, grain: 0.35 };
/** 全屏那一档：框只有一两百像素，色散收掉一半才看得出框里是另一张底片 */
const TUNING_STAGE = { lens: 0.24, chroma: 0.08, wave: 0.2, grain: 0.22 };

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
 *
 * 两种入口：
 * - 桌面（有 hover）：指针扫过照片，框跟着走
 * - 手机（无 hover）：点开照片进入全屏，再点一下把框取出来。框一旦取出就
 *   像个弹窗——**必须按在框里**才能拖它；按在别处是「关掉，回相册」
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
  const { lang } = useI18n();
  const sectionRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const lens = useRef<LensApi | null>(null);
  const [openAt, setOpenAt] = useState<number | null>(null);
  // 触屏：点开全屏才有意义（桌面靠 hover 已经能取样，不必多一层）
  const [touchLike, setTouchLike] = useState(false);
  // 顶栏可以勾掉方形这一层；勾掉后照片仍能点开看，只是不再出取样框
  const [squareOn, setSquareOn] = useState(true);
  /**
   * 刚关掉全屏的时刻。
   *
   * 全屏是在 pointerup 里关的，可浏览器随后照样会把这一手势补发成 click ——
   * 那时弹窗已经卸载，click 的目标就落到它底下的那张照片上，于是「点一下
   * 返回」当场又把它点开了，表现为怎么点都关不掉。记个时刻，400ms 内的
   * 打开一律忽略，正是同一个手势的余波。
   */
  const closedAt = useRef(0);

  useEffect(() => {
    setSquareOn(readShaderPrefs().square);
    return subscribeShaderPrefs((p) => setSquareOn(p.square));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setTouchLike(mq.matches || window.innerWidth < 768);
    update();
    mq.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // 依赖不能直接用 photos：它是每次 render 新建的数组，会让下面的引擎反复重建。
  // 用内容指纹做依赖，最新数据走 ref。
  const key = photos.map((p) => p.url).join("|");

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    // 顶栏勾掉了方形着色器：整层不启用（画面上的 canvas 也随之卸掉）
    if (!squareOn) return;
    // 前庭敏感 / 省电模式：整层不启用
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // 引擎按需创建：桌面首次悬停 / 手机首次点开才真正拿 WebGL 上下文
    let eng: SquareLensEngine | null = null;
    let canvasEl: HTMLCanvasElement | null = null;

    const ensure = (): boolean => {
      if (eng) return true;
      try {
        const cv = document.createElement("canvas");
        cv.className = "lens-canvas";
        const e = new SquareLensEngine(cv);
        // 淡入淡出与着色器同源：框从中心扩开的同时，整块画布也从不透明底下浮上来。
        e.onEnter = (v) => {
          cv.style.opacity = String(v);
        };
        eng = e;
        canvasEl = cv;
        return true;
      } catch {
        eng = null;
        canvasEl = null;
        return false; // 没有 WebGL 就老老实实显示图片，页面不受影响
      }
    };

    let cur = -1;
    let token = 0;
    // 卸载后外部若还握着旧的 api（比如全屏视图正在退场），detach 必须变成空操作，
    // 否则会去 wake 一台已经 dispose 的引擎
    let alive = true;
    let target: HTMLElement | null = null;
    let ro: ResizeObserver | null = null;
    // 指针的最新视口坐标。**必须**一直记着，不能只在容器就位时才记：
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
      if (!alive) return;
      cur = -1;
      unwatch();
      target = null;
      if (canvasEl && canvasEl.parentNode) canvasEl.parentNode.removeChild(canvasEl);
      eng?.hide();
    };

    /** 用**最新**的指针位置定位，而不是某个事件里记下的旧坐标 */
    const sync = () => {
      if (!target || !hasPointer) return;
      const r = target.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // v 向上：WebGL 的纹理坐标原点在左下，DOM 在左上
      eng?.move((lastX - r.left) / r.width, 1 - (lastY - r.top) / r.height);
    };

    const attach = async (el: HTMLElement, index: number, boxHalf = BOX_HALF_GRID): Promise<boolean> => {
      const list = photosRef.current;
      // 一张图谈不上「翻到下一张」，这一层就不必启用
      if (list.length < 2) return false;
      if (!Number.isFinite(index) || index < 0 || index >= list.length) return false;
      if (!ensure()) return false;
      eng!.setBox(boxHalf);

      if (index === cur && target === el) {
        // 还是同一张、同一个容器：纹理还在，直接叫回来，别再下一轮网络
        sync();
        return true;
      }

      const my = ++token;
      const next = list[(index + 1) % list.length];
      const [out, ins] = await Promise.all([
        loadCors(getCloudinaryUrl(list[index].url, LENS_W)),
        loadCors(getCloudinaryUrl(next.url, LENS_W)),
      ]);
      // 期间换到别的照片 / 组件已经卸载 —— 这次结果作废
      if (my !== token) return false;
      if (!out || !ins || !eng || !canvasEl || !eng.setSource(out, ins)) {
        detach(); // 跨域拿不到纹理：静默退回纯图片
        return false;
      }

      unwatch();
      target = el;
      el.appendChild(canvasEl);
      const r = el.getBoundingClientRect();
      eng.setSize(r.width, r.height);
      ro = new ResizeObserver(() => {
        // masonry 是 columns 布局，窗口一变每列的宽度和高度都会重排
        const rr = el.getBoundingClientRect();
        eng?.setSize(rr.width, rr.height);
        sync(); // 容器一挪，方框也得跟着重新对位
      });
      ro.observe(el);
      cur = index;
      eng.jump(); // 换图就别从上一张的位置飞过来
      sync();
      return true;
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      lastX = e.clientX;
      lastY = e.clientY;
      hasPointer = true;
      const el = (e.target as HTMLElement | null)?.closest?.("[data-lens-index]") as HTMLElement | null;
      if (el) {
        const i = Number(el.dataset.lensIndex);
        void attach(el, i).then((ok) => {
          if (ok && el === target) eng?.show();
        });
      } else {
        eng?.hide();
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      lastX = e.clientX;
      lastY = e.clientY;
      hasPointer = true;
      sync();
    };

    const onLeave = () => eng?.hide();
    // 滚动时指针在屏幕上一动不动，但照片从它底下走了过去 ——
    // 方框不重新对位就会赖在照片上的老地方不动
    const onScroll = () => sync();

    section.addEventListener("pointerover", onOver);
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    lens.current = {
      attach,
      move: (x, y) => {
        lastX = x;
        lastY = y;
        hasPointer = true;
        sync();
      },
      show: () => eng?.show(),
      hide: () => eng?.hide(),
      detach,
      tune: (t) => eng?.setTuning(t),
    };

    return () => {
      alive = false;
      token += 1;
      lens.current = null;
      section.removeEventListener("pointerover", onOver);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      unwatch();
      if (canvasEl && canvasEl.parentNode) canvasEl.parentNode.removeChild(canvasEl);
      eng?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, squareOn]);

  const captionOf = (img: LensPhoto, index: number) =>
    img.caption || `${label}_${(index + 1).toString().padStart(3, "0")}`;

  const openLightbox = (index: number) => {
    // 上一手势刚把全屏关掉，浏览器补发的那个 click 不算「打开」
    if (performance.now() - closedAt.current < 400) return;
    setOpenAt(index);
  };
  const closeLightbox = () => {
    closedAt.current = performance.now();
    setOpenAt(null);
  };

  const figure = (img: LensPhoto, index: number, sizes: string) => (
    <figure className="space-y-4">
      <div
        data-lens-index={index}
        className="relative group p-0"
        onClick={touchLike ? () => openLightbox(index) : undefined}
        role={touchLike ? "button" : undefined}
        tabIndex={touchLike ? 0 : undefined}
        aria-label={touchLike ? captionOf(img, index) : undefined}
        onKeyDown={
          touchLike
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") openLightbox(index);
              }
            : undefined
        }
      >
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
          draggable={false}
        />
      </div>
      <figcaption className="archive-text flex items-baseline gap-3 pl-2 text-[12px] uppercase tracking-widest opacity-65">
        <span className="opacity-70">{String(index + 1).padStart(2, "0")}</span>
        <span>{captionOf(img, index)}</span>
      </figcaption>
    </figure>
  );

  const lightbox = openAt !== null && (
    <PhotoLightbox
      photos={photos}
      index={openAt}
      label={label}
      lang={lang}
      lens={lens}
      enabled={squareOn}
      onClose={closeLightbox}
    />
  );

  if (layout === "masonry") {
    return (
      <>
        <section ref={sectionRef} className="columns-1 md:columns-2 gap-12 space-y-12">
          {photos.map((img, index) => (
            <div key={index} className="break-inside-avoid">
              {figure(img, index, "(min-width: 768px) 620px, 100vw")}
            </div>
          ))}
        </section>
        {lightbox}
      </>
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
    <>
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
      {lightbox}
    </>
  );
}

/**
 * 全屏看照片（手机端）。
 *
 * 交互是一条明确的规则，不靠猜：
 * 1. 点开照片 → 全屏，此时**没有**取样框
 * 2. 点/拖动画面 → 取样框从落点取出来
 * 3. 框取出来之后，它像一扇窗：**按在框里**才能拖它；
 *    按在框外的任何地方（含黑底）= 关掉，回相册
 *
 * 之所以要「先选中再拖」，是因为满屏都能拖的话，想关掉时手一抖就成了挪框。
 */
function PhotoLightbox({
  photos,
  index,
  label,
  lang,
  lens,
  enabled,
  onClose,
}: {
  photos: LensPhoto[];
  index: number;
  label: string;
  lang: "zh" | "en";
  lens: React.MutableRefObject<LensApi | null>;
  /** 顶栏是否勾了方形着色器。勾掉之后这里就只是个看图窗口 */
  enabled: boolean;
  onClose: () => void;
}) {
  const photo = photos[index];
  const stageRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);

  /** 框心，画布归一化坐标（0..1，左上为原点）。命中判定用**目标**位置，
   *  不用弹簧里的当前位置 —— 弹簧还在追的时候，手感上它已经在落点了 */
  const center = useRef({ nx: 0.5, ny: 0.5 });
  const dragging = useRef(false);
  const pendingClose = useRef(false);
  const downAt = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const api = lens.current; // 卸载时 ref 可能已经指向别处，先抓住这一份
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    api?.tune(TUNING_STAGE);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      api?.tune(TUNING_GRID); // 回到图集里那档，别把悬停的手感改掉了
      api?.detach();
    };
  }, [lens, onClose]);

  /** 纹理与画布是否已经就位。没就位就点，只能等它加载完再把框放到落点上 */
  const ready = useRef(false);

  // 一打开就把纹理备好（画布 opacity 还是 0）：第一次点按时不必等网络
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !enabled) return;
    ready.current = false;
    void lens.current?.attach(stage, index, BOX_HALF_STAGE).then((ok) => {
      ready.current = ok;
    });
  }, [index, lens, enabled]);

  const rectOf = () => stageRef.current?.getBoundingClientRect() ?? null;

  /** 就地取框：按在哪儿，框就落在哪儿（画布还没就位时要等纹理） */
  const armAt = async (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    const api = lens.current;
    if (!stage || !api) return;
    const ok = await api.attach(stage, index, BOX_HALF_STAGE);
    ready.current = ok;
    if (!ok) return; // 拿不到纹理（跨域 / 无 WebGL）：就当这一层不存在
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const nx = clamp01((clientX - r.left) / r.width);
    const ny = clamp01((clientY - r.top) / r.height);
    center.current = { nx, ny };
    api.move(r.left + nx * r.width, r.top + ny * r.height);
    api.show();
    setArmed(true);
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // 方形着色器被勾掉了：这里退回「点一下退出」的普通看图窗口
    if (!enabled) {
      pendingClose.current = true;
      downAt.current = { x: e.clientX, y: e.clientY };
      return;
    }
    const rect = rectOf();
    if (!rect) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const inStage = nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1;
    const half = BOX_HALF_STAGE * Math.min(rect.width, rect.height);
    // 指尖比鼠标粗：命中区向外放 16px，否则「明明按在框上」却关掉了相册
    const tolX = (half + 16) / rect.width;
    const tolY = (half + 16) / rect.height;
    const onBox =
      armed && Math.abs(nx - center.current.nx) <= tolX && Math.abs(ny - center.current.ny) <= tolY;

    downAt.current = { x: e.clientX, y: e.clientY };
    pendingClose.current = false;

    // 还没取框：这一下就是「取出取样框」
    if (inStage && !armed) {
      if (ready.current) {
        // 纹理已就位 —— 直接落位，而且这一手势就能接着拖
        dragging.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        center.current = { nx: clamp01(nx), ny: clamp01(ny) };
        lens.current?.move(e.clientX, e.clientY);
        lens.current?.show();
        setArmed(true);
      } else {
        // 纹理还在路上：等它就位再落位，别先摆一个空框
        void armAt(e.clientX, e.clientY);
      }
      return;
    }

    // 框已取出，这一下按在框上 = 选中它，可以拖
    if (inStage && onBox) {
      dragging.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      center.current = { nx: clamp01(nx), ny: clamp01(ny) };
      lens.current?.move(e.clientX, e.clientY);
      return;
    }

    // 框已经取出来了，这一下按在框外 —— 抬手就返回相册（拖动不算，那多半是想滚）
    pendingClose.current = true;
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const rect = rectOf();
    if (!rect) return;
    const nx = clamp01((e.clientX - rect.left) / rect.width);
    const ny = clamp01((e.clientY - rect.top) / rect.height);
    center.current = { nx, ny };
    lens.current?.move(rect.left + nx * rect.width, rect.top + ny * rect.height);
  };

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging.current) {
      dragging.current = false;
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      return;
    }
    if (!pendingClose.current) return;
    pendingClose.current = false;
    const dx = e.clientX - downAt.current.x;
    const dy = e.clientY - downAt.current.y;
    if (Math.hypot(dx, dy) < 12) onClose();
  };

  // 手指一滑，Chrome 会补发 pointercancel：按下标作废，但别顺手关掉相册
  const onCancel = () => {
    dragging.current = false;
    pendingClose.current = false;
  };

  const caption = photo.caption || `${label}_${String(index + 1).padStart(3, "0")}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={caption}
      className="fixed inset-0 z-[95] flex select-none flex-col bg-black/95 backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-5">
        <span className="archive-text text-[10px] tracking-[0.3em] text-white/50">{label}</span>
        <button
          type="button"
          onClick={onClose}
          className="archive-text border border-white/20 px-3 py-1.5 text-[10px] tracking-[0.3em] text-white/70 transition-colors hover:border-white/50 hover:text-white"
        >
          {t(lang, "photoClose")} ✕
        </button>
      </div>

      {/* 照片与图注当成一个整体居中 —— 图注钉在屏幕底会在 2.16:1 的横幅上下留出两片黑洞 */}
      <div
        className="relative flex min-h-0 flex-1 touch-none flex-col items-center justify-center gap-6 pb-10"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        <div ref={stageRef} className="relative inline-block">
          <img
            src={getCloudinaryUrl(photo.url, 1600)}
            alt={caption}
            // 写明宽高：大图还在路上时，框就有了正确比例，不会先塌成 0×0 ——
            // 取样框的画布尺寸跟着容器走，容器塌了框也就没地方待
            width={photo.width}
            height={photo.height}
            className="block h-auto w-auto max-h-[58vh] max-w-full"
            draggable={false}
            decoding="async"
          />
        </div>

        <div className="space-y-2 px-5 text-center">
          <div className="archive-text flex items-baseline justify-center gap-3 text-[11px] tracking-[0.25em] text-white/75">
            <span className="text-diagonal-red">{String(index + 1).padStart(2, "0")}</span>
            <span className="uppercase">{caption}</span>
          </div>
          <div className="archive-text text-[10px] tracking-[0.2em] text-white/35">
            {!enabled
              ? t(lang, "photoHintOff")
              : armed
                ? t(lang, "photoHintArmed")
                : t(lang, "photoHintIdle")}
          </div>
        </div>
      </div>
    </div>
  );
}
