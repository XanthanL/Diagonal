"use client";

/**
 * Hero 区 DIA/GONAL 标题贯穿的对角斜线装饰。
 * 项目核心视觉母题——粗灰斜线 + 高光脊线 + 伴随细线，形成刻痕/盐结晶质感。
 */
export function DiagonalSlash() {
  return (
    <>
      {/* 外层柔化光晕：让斜线从背景中"浮"出来 */}
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
      {/* 主斜线体：加粗至 52px，带立体灰渐变 */}
      <span
        aria-hidden="true"
        className="block absolute pointer-events-none"
        style={{
          top: "3%",
          left: "50%",
          width: "52px",
          height: "98%",
          marginLeft: "-26px",
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
      {/* 伴随细线：强化层叠、速度感与刻痕张力 */}
      <span
        aria-hidden="true"
        className="block absolute pointer-events-none"
        style={{
          top: "10%",
          left: "50%",
          width: "3px",
          height: "76%",
          marginLeft: "36px",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.08) 14%, rgba(0,0,0,0.08) 86%, transparent 100%)",
          transform: "rotate(45deg)",
          transformOrigin: "center center",
          clipPath: "polygon(50% 0%, 100% 3%, 100% 97%, 50% 100%, 0% 97%, 0% 3%)",
        }}
      />
      {/* 第二伴随细线：在主斜线另一侧形成对称刻痕 */}
      <span
        aria-hidden="true"
        className="block absolute pointer-events-none"
        style={{
          top: "14%",
          left: "50%",
          width: "2px",
          height: "68%",
          marginLeft: "-40px",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.05) 18%, rgba(0,0,0,0.05) 82%, transparent 100%)",
          transform: "rotate(45deg)",
          transformOrigin: "center center",
          clipPath: "polygon(50% 0%, 100% 4%, 100% 96%, 50% 100%, 0% 96%, 0% 4%)",
        }}
      />
    </>
  );
}
