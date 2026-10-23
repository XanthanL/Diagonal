"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { InkFieldEngine } from "@/lib/inkField";

/** 判定「是否悬停在可交互元素上」——命中后换成细笔尖 */
const INTERACTIVE = 'a,button,[role="button"],input,textarea,select,summary,label,.press,.press-card';

/** 背景明暗采样节流间隔：getComputedStyle 会触发样式重算，不能每帧来 */
const SAMPLE_MS = 110;

/**
 * 采样指针下方第一个「基本不透明」的背景色亮度。
 * 返回 null 表示没采到（保留上一次判断），避免在过渡区域来回抖。
 *
 * 为什么需要它：着色器拿不到页面像素，无法自己判断底色。
 * - /atlas 整页黑底，首页那块盐粒子画布是 #0c0c0e；
 * - 一律画墨（#1A1A1A）的话，这些区块上会完全看不见；
 * - 一律画浅色的话，纸面上又会浮出一圈刺眼的白边。
 * 所以由这里给出 uDark，让引擎在「墨」与「粉笔」两套色板间平滑取舍。
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
 * 墨脉：全站指针 / 触控的着色器反馈层。
 *
 * 挂载在 root layout 里、脱离 main 之外，不参与任何路由重挂载，也不吃指针事件，
 * 所以对既有页面结构零侵入 —— 全站只多了一块固定定位画布和一层 window 监听。
 */
export function InkField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const off = pathname.startsWith("/admin");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || off) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let engine: InkFieldEngine;
    try {
      engine = new InkFieldEngine(canvas, { mobile: window.innerWidth < 768 });
    } catch (err) {
      // 没有 WebGL / 着色器编译失败就安静退场，绝不影响页面任何功能。
      // 留一条 warn 而不是彻底吞掉：这是唯一能在线上回答"为什么没效果"的线索。
      console.warn("[InkField] 墨脉未启用：", err);
      return;
    }

    let lastSample = 0;
    let dark: boolean | null = null;
    let lastTarget: Element | null = null;
    let scrollPrev = window.scrollY;

    const sample = (x: number, y: number, force: boolean) => {
      const now = performance.now();
      if (!force && now - lastSample < SAMPLE_MS) return;
      lastSample = now;
      const d = sampleBackdrop(x, y);
      if (d !== null && d !== dark) {
        dark = d;
        engine.setDark(d);
      }
    };

    const onMove = (e: PointerEvent) => {
      engine.move(e.pointerId, e.clientX, e.clientY);
      const target = e.target as Element | null;
      if (target !== lastTarget) {
        lastTarget = target;
        engine.setNib(!!target?.closest?.(INTERACTIVE));
      }
      sample(e.clientX, e.clientY, dark === null);
    };

    const onDown = (e: PointerEvent) => {
      // 触屏上 pointerdown 常常早于第一次 pointermove，先补一次位置，press 才有落点
      engine.move(e.pointerId, e.clientX, e.clientY);
      engine.press(e.pointerId);
      sample(e.clientX, e.clientY, true);
    };

    // 鼠标抬起后仍然要跟着走（一直在屏幕上），所以不 release；触屏 / 触控笔则拉走
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") engine.release(e.pointerId);
    };
    const onCancel = (e: PointerEvent) => engine.release(e.pointerId);

    const onScroll = () => {
      const y = window.scrollY;
      engine.scroll(y - scrollPrev);
      scrollPrev = y;
    };

    const onVisibility = () => {
      if (document.hidden) engine.stop();
      else engine.wake();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onCancel, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      engine.dispose();
    };
  }, [off]);

  if (off) return null;

  return <canvas ref={canvasRef} className="ink-field" role="presentation" aria-hidden="true" />;
}
