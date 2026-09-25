"use client";

import type { CSSProperties } from "react";

/**
 * Hero 区 DIA/GONAL 标题贯穿的对角斜线装饰。
 * 项目核心视觉母题——粗灰斜线 + 高光脊线 + 伴随细线，形成刻痕/盐结晶质感。
 *
 * —— 几何约定（动参数前先读这段）——
 * 五道线全部以 h1 的水平中点（left:50%）为轴心，靠 marginLeft 把「线心」推到目标位置：
 *     线心 = marginLeft + width / 2   →   marginLeft = 线心 - width / 2
 *
 * ⚠️ 一、间距要按「可见边」算，不能按盒子边算。
 *    主斜线被 clip-path 裁到 32%~68%，可见体只有 52 × 36% = 18.72px 宽（±9.36），
 *    比 52px 的盒子窄得多。按盒子边（±26）算会得出错误的净间隙。
 *
 * ⚠️ 二、两根 45° 斜线的垂直间距 = |Δx + Δy| / √2（Δ = 两线中心的屏幕偏移）。
 *    也就是说**纵向位置差会被折进垂直间距里**。原先两条伴随细线的 top 是 10% / 14%，
 *    中心 y 比主斜线高 10.4px，结果右线实际只有 19.2px、左线却有 34.9px——
 *    参数上只差 1.5px 的「间距」，视觉上差了 16px。
 *    所以伴随细线的纵向中心必须与主斜线重合（见下方 COMPANION_TOP / HEIGHT）。
 *
 * 伴随细线是**一对镜像**：同宽、同长、同纵向位置、同透明度、到轴心等距。
 * 写成下面的常量 + 一个共用的 style 工厂，是为了让「对称」由结构保证，
 * 而不是靠人肉同步两条线的六个参数（历史上就是这么跑偏的）。
 */

// 主斜线：盒宽 52px，clip 到 32%~68%
const MAIN_WIDTH = 52;
const MAIN_CLIP_FROM = 0.32;
const MAIN_CLIP_TO = 0.68;
/** 主斜线裁切后的可见半宽 = 9.36px —— 一切「间隙」都以它为基准 */
const MAIN_VISIBLE_HALF = (MAIN_WIDTH * (MAIN_CLIP_TO - MAIN_CLIP_FROM)) / 2;
/** 主斜线的纵向中心 = top 3% + height 98% / 2 = 52%（伴随细线必须与它对齐） */
const MAIN_AXIS_CENTER = 0.03 + 0.98 / 2;

// 伴随细线：一对镜像
const COMPANION_WIDTH = 2;
/**
 * 设计参数是「净间隙」——伴随细线内缘到主斜线可见边的距离，两侧取同一值。
 * 45° 会把横向偏移折成 1/√2，所以横向偏移要从间隙反推，别直接写偏移量：
 *     垂直间距 = 横向偏移 / √2   →   横向偏移 = 垂直间距 × √2
 * 这里 9.36 + 16.5 + 1 = 26.86 的垂直间距，对应 ≈38px 的横向偏移。
 */
const COMPANION_GAP = 16.5;
const COMPANION_OFFSET = (MAIN_VISIBLE_HALF + COMPANION_GAP + COMPANION_WIDTH / 2) * Math.SQRT2;
/** 纵向：与主斜线同轴心 —— 16% + 72%/2 = 52% = MAIN_AXIS_CENTER */
const COMPANION_HEIGHT_PCT = 72;
const COMPANION_TOP_PCT = MAIN_AXIS_CENTER * 100 - COMPANION_HEIGHT_PCT / 2;
const COMPANION_TOP = `${COMPANION_TOP_PCT}%`;
const COMPANION_HEIGHT = `${COMPANION_HEIGHT_PCT}%`;
/** marginLeft = 线心 - width/2 */
const COMPANION_ML = COMPANION_OFFSET - COMPANION_WIDTH / 2;

/** 两条伴随细线共用同一份样式，只差 marginLeft 的正负 */
function companionStyle(side: 1 | -1): CSSProperties {
  return {
    top: COMPANION_TOP,
    left: "50%",
    width: `${COMPANION_WIDTH}px`,
    height: COMPANION_HEIGHT,
    marginLeft: `${side * COMPANION_ML}px`,
    background:
      "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.08) 14%, rgba(0,0,0,0.08) 86%, transparent 100%)",
    transform: "rotate(45deg)",
    transformOrigin: "center center",
    clipPath: "polygon(50% 0%, 100% 3%, 100% 97%, 50% 100%, 0% 97%, 0% 3%)",
  };
}

export function DiagonalSlash() {
  return (
    <>
      {/* 外层柔化光晕：让斜线从背景中"浮"出来。宽 76px，两侧各比主斜线外扩 12px，
          外缘落在 ±38，与伴随细线的轴心（±COMPANION_OFFSET ≈ 37.99）基本重合 */}
      <span
        aria-hidden="true"
        className="block absolute pointer-events-none"
        style={{
          top: "2%",
          left: "50%",
          width: "76px",
          height: "100%",
          marginLeft: "-38px",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.03) 8%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.03) 92%, transparent 100%)",
          transform: "rotate(45deg)",
          transformOrigin: "center center",
          filter: "blur(10px)",
        }}
      />
      {/* 主斜线体：带立体灰渐变 */}
      <span
        aria-hidden="true"
        className="block absolute pointer-events-none"
        style={{
          top: "3%",
          left: "50%",
          width: `${MAIN_WIDTH}px`,
          height: "98%",
          marginLeft: `${-MAIN_WIDTH / 2}px`,
          background:
            "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.06) 5%, rgba(75,75,75,0.22) 18%, rgba(45,45,45,0.32) 50%, rgba(75,75,75,0.22) 82%, rgba(0,0,0,0.06) 95%, transparent 100%)",
          transform: "rotate(45deg)",
          transformOrigin: "center center",
          clipPath:
            "polygon(46% 0%, 54% 0%, 62% 1.5%, 68% 4.5%, 68% 95.5%, 62% 98.5%, 54% 100%, 46% 100%, 38% 98.5%, 32% 95.5%, 32% 4.5%, 38% 1.5%)",
          filter: "drop-shadow(0 0 6px rgba(0,0,0,0.08)) drop-shadow(-4px 0 12px rgba(0,0,0,0.06))",
        }}
      />
      {/* 内层高光脊线：强化体积感与金属边缘 */}
      <span
        aria-hidden="true"
        className="block absolute pointer-events-none"
        style={{
          top: "3%",
          left: "50%",
          width: "2px",
          height: "98%",
          marginLeft: "-1px",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.28) 16%, rgba(255,255,255,0.28) 84%, transparent 100%)",
          transform: "rotate(45deg)",
          transformOrigin: "center center",
          mixBlendMode: "screen",
        }}
      />
      {/* 伴随细线（右）：净间隙 = COMPANION_OFFSET/√2 − MAIN_VISIBLE_HALF − COMPANION_WIDTH/2 */}
      <span aria-hidden="true" className="block absolute pointer-events-none" style={companionStyle(1)} />
      {/* 伴随细线（左）：与右侧完全镜像 */}
      <span aria-hidden="true" className="block absolute pointer-events-none" style={companionStyle(-1)} />
    </>
  );
}
