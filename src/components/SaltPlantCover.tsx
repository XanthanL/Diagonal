"use client";

/**
 * 首页 THE LAB 中「盐厂 3D 解构」自定义封面。
 * 以对角斜线母题 + 连排工艺单元（进卤 → 蒸发结晶 → 包装）的简约示意表达「整厂 3D 解构」主题，
 * 与 VacuumSaltCover 的单蒸发罐形成区分。配色沿用 diagonal 暖灰设备 + 品牌红焦点 + 卤水青蓝。
 */
export function SaltPlantCover() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="盐厂 3D 解构：连排工艺单元"
    >
      <defs>
        <linearGradient id="sp-vessel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F1F0EC" />
          <stop offset="50%" stopColor="#E2E0DB" />
          <stop offset="100%" stopColor="#CFCDC7" />
        </linearGradient>
        <linearGradient id="sp-brine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7FB9D6" />
          <stop offset="100%" stopColor="#3A7CA5" />
        </linearGradient>
      </defs>

      {/* 对角母题 */}
      <line x1="14" y1="30" x2="92" y2="8" stroke="#B33A2A" strokeOpacity="0.16" strokeWidth="2" />
      <line x1="236" y1="12" x2="306" y2="36" stroke="#B33A2A" strokeOpacity="0.10" strokeWidth="1.5" />

      {/* 进卤虚线 */}
      <path d="M6,150 H52" stroke="#1A1A1A" strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="3 4" fill="none" />
      <path d="M52,144 L64,150 L52,156 Z" fill="#1A1A1A" fillOpacity="0.4" />

      {/* 连排厂房地面 */}
      <line x1="40" y1="170" x2="290" y2="170" stroke="#1A1A1A" strokeOpacity="0.25" strokeWidth="1.2" />
      <ellipse cx="160" cy="172" rx="120" ry="5" fill="#1A1A1A" fillOpacity="0.05" />

      {/* 连接管路 A→B→C */}
      <path d="M96,150 H132" stroke="#1A1A1A" strokeOpacity="0.5" strokeWidth="2" fill="none" />
      <path d="M186,150 H224" stroke="#1A1A1A" strokeOpacity="0.5" strokeWidth="2" fill="none" />
      <path d="M132,144 L144,150 L132,156 Z" fill="#1A1A1A" fillOpacity="0.45" />
      <path d="M224,144 L236,150 L224,156 Z" fill="#1A1A1A" fillOpacity="0.45" />

      {/* 单元 A：进卤槽 */}
      <rect x="64" y="96" width="32" height="74" rx="4" fill="url(#sp-vessel)" stroke="#1A1A1A" strokeOpacity="0.8" strokeWidth="2" />
      <rect x="64" y="150" width="32" height="20" rx="2" fill="url(#sp-brine)" />

      {/* 单元 B：蒸发结晶（焦点·品牌红） */}
      <rect x="134" y="70" width="52" height="100" rx="4" fill="url(#sp-vessel)" stroke="#1A1A1A" strokeOpacity="0.8" strokeWidth="2" />
      <rect x="134" y="70" width="52" height="100" rx="4" fill="none" stroke="#B33A2A" strokeOpacity="0.55" strokeWidth="2.4" />
      <rect x="140" y="120" width="40" height="46" rx="2" fill="url(#sp-brine)" fillOpacity="0.85" />
      <path d="M150,66 C146,54 158,50 152,38" stroke="#1A1A1A" strokeOpacity="0.28" strokeWidth="1.2" fill="none" />
      <path d="M170,66 C174,54 162,50 170,38" stroke="#1A1A1A" strokeOpacity="0.22" strokeWidth="1.2" fill="none" />

      {/* 单元 C：包装 / 成品 */}
      <rect x="224" y="108" width="40" height="62" rx="4" fill="url(#sp-vessel)" stroke="#1A1A1A" strokeOpacity="0.8" strokeWidth="2" />
      <rect x="224" y="150" width="40" height="20" rx="2" fill="#9A8C7A" />

      {/* 品牌红对角流程线（贯穿全厂） */}
      <path d="M58,158 C120,140 200,118 276,96" stroke="#B33A2A" strokeOpacity="0.5" strokeWidth="1.6" fill="none" strokeDasharray="2 5" />
      <path d="M268,90 L280,94 L270,102 Z" fill="#B33A2A" fillOpacity="0.6" />

      {/* 结晶盐（输出·白钻 + 红描边） */}
      <g stroke="#B33A2A" strokeWidth="0.8">
        <rect x="250" y="86" width="9" height="9" transform="rotate(45 254.5 90.5)" fill="#FFFFFF" />
        <rect x="266" y="80" width="6" height="6" transform="rotate(45 269 83)" fill="#FFFFFF" />
        <rect x="258" y="98" width="11" height="11" transform="rotate(45 263.5 103.5)" fill="#FFFFFF" />
        <rect x="240" y="96" width="6" height="6" transform="rotate(45 243 99)" fill="#FFFFFF" />
      </g>
    </svg>
  );
}
