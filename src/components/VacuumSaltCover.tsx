"use client";

/**
 * 首页 THE LAB 中「真空制盐」自定义封面。
 * 以对角斜线母题 + 真空蒸发罐工艺示意（卤水 → 加热 → 蒸汽 → 结晶盐）表达 3D PIPELINE 主题，
 * 取代原先仅一个「盐」字的占位封面。配色沿用 diagonal 品牌红与真空制盐领域色（卤水青蓝 / 黄卤琥珀）。
 */
export function VacuumSaltCover() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="真空制盐工艺示意：蒸发罐析出结晶盐"
    >
      <defs>
        <linearGradient id="vs-vessel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F1F0EC" />
          <stop offset="50%" stopColor="#E2E0DB" />
          <stop offset="100%" stopColor="#CFCDC7" />
        </linearGradient>
        <linearGradient id="vs-brine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7FB9D6" />
          <stop offset="100%" stopColor="#3A7CA5" />
        </linearGradient>
        <linearGradient id="vs-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F6F5F2" />
          <stop offset="100%" stopColor="#E6E4DF" />
        </linearGradient>
        <clipPath id="vs-vesselClip">
          <path d="M132,78 L188,78 L188,152 A28,7 0 0 1 132,152 Z" />
        </clipPath>
      </defs>

      {/* 对角母题：品牌红细线 */}
      <line x1="14" y1="34" x2="96" y2="10" stroke="#B33A2A" strokeOpacity="0.16" strokeWidth="2" />
      <line x1="232" y1="14" x2="306" y2="40" stroke="#B33A2A" strokeOpacity="0.10" strokeWidth="1.5" />

      {/* 进料（卤水）虚线流 */}
      <path d="M8,138 H120" stroke="#1A1A1A" strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="3 4" fill="none" />
      <path d="M120,132 L132,138 L120,144 Z" fill="#1A1A1A" fillOpacity="0.4" />

      {/* 落地投影 */}
      <ellipse cx="160" cy="164" rx="42" ry="6" fill="#1A1A1A" fillOpacity="0.06" />

      {/* 蒸发罐主体 */}
      <path
        d="M132,78 L188,78 L188,152 A28,7 0 0 1 132,152 Z"
        fill="url(#vs-vessel)"
        stroke="#1A1A1A"
        strokeOpacity="0.8"
        strokeWidth="2"
      />
      {/* 罐顶椭圆 */}
      <ellipse cx="160" cy="78" rx="28" ry="7" fill="url(#vs-top)" stroke="#1A1A1A" strokeOpacity="0.8" strokeWidth="2" />

      {/* 卤水（罐底） */}
      <path
        d="M132,130 Q146,123 160,130 T188,130 L188,160 L132,160 Z"
        fill="url(#vs-brine)"
        clipPath="url(#vs-vesselClip)"
      />
      {/* 卤水波纹高光 */}
      <path
        d="M132,130 Q146,123 160,130 T188,130"
        stroke="#FFFFFF"
        strokeOpacity="0.4"
        strokeWidth="1"
        fill="none"
        clipPath="url(#vs-vesselClip)"
      />

      {/* 加热盘管（黄卤 / 热） */}
      <path d="M139,100 q10.5,-4 21,0 t21,0" stroke="#C99A3F" strokeOpacity="0.55" strokeWidth="1.4" fill="none" />
      <path d="M139,108 q10.5,-4 21,0 t21,0" stroke="#C99A3F" strokeOpacity="0.45" strokeWidth="1.4" fill="none" />
      <path d="M139,116 q10.5,-4 21,0 t21,0" stroke="#C99A3F" strokeOpacity="0.35" strokeWidth="1.4" fill="none" />

      {/* 上升蒸汽 */}
      <path d="M150,74 C144,58 158,52 150,36" stroke="#1A1A1A" strokeOpacity="0.3" strokeWidth="1.2" fill="none" />
      <path d="M166,74 C172,58 158,52 168,36" stroke="#1A1A1A" strokeOpacity="0.25" strokeWidth="1.2" fill="none" />
      <path d="M158,74 C156,56 162,50 158,34" stroke="#1A1A1A" strokeOpacity="0.2" strokeWidth="1" fill="none" />

      {/* 结晶盐（输出） */}
      <g stroke="#B33A2A" strokeWidth="0.8">
        <rect x="146" y="24" width="9" height="9" transform="rotate(45 150.5 28.5)" fill="#FFFFFF" />
        <rect x="168" y="18" width="6" height="6" transform="rotate(45 171 21)" fill="#FFFFFF" />
        <rect x="156" y="42" width="11" height="11" transform="rotate(45 161.5 47.5)" fill="#FFFFFF" />
        <rect x="138" y="46" width="7" height="7" transform="rotate(45 141.5 49.5)" fill="#FFFFFF" />
        <rect x="180" y="40" width="6" height="6" transform="rotate(45 183 43)" fill="#FFFFFF" />
      </g>
    </svg>
  );
}
