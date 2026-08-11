"use client";

/**
 * 首页 THE LAB 中「天车 3D 解构」自定义封面。
 * 以自贡井盐天车（木构井架）的简约示意点出本项目核心：收分木井架（内壁竖线暗示「束柱」并束）、
 * 顶端天辊、放射风篾、地面大车（提卤巨轮）、提卤绳与汲卤筒、卤水光点。
 * 配色沿用天车 3D 场景的领域色板（暖木构 + 墨线 + 卤水青），去除品牌红以保持与 3D 模型一致。
 */
export function SaltPlantCover() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="天车 3D 解构：自贡井盐木构井架"
    >
      <defs>
        <linearGradient id="sp-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A39276" />
          <stop offset="100%" stopColor="#6E5A42" />
        </linearGradient>
      </defs>

      {/* 地面 */}
      <line x1="30" y1="172" x2="296" y2="172" stroke="#1A1A1A" strokeOpacity="0.25" strokeWidth="1.2" />

      {/* 风篾（放射拉索）+ 地桩 */}
      <g stroke="#1A1A1A" strokeOpacity="0.4" strokeWidth="1.1">
        <line x1="160" y1="58" x2="64" y2="170" />
        <line x1="160" y1="58" x2="112" y2="170" />
        <line x1="160" y1="58" x2="208" y2="170" />
        <line x1="160" y1="58" x2="256" y2="170" />
      </g>
      <g fill="#1A1A1A" fillOpacity="0.5">
        <circle cx="64" cy="170" r="2.4" />
        <circle cx="112" cy="170" r="2.4" />
        <circle cx="208" cy="170" r="2.4" />
        <circle cx="256" cy="170" r="2.4" />
      </g>

      {/* 天车主体：收分木井架 */}
      <polygon points="120,170 200,170 174,42 146,42" fill="none" stroke="url(#sp-wood)" strokeWidth="3.4" strokeLinejoin="round" />
      {/* 束柱暗示：每根主柱由多棵杉木并束（自贡天车的标志构造），内壁两道竖线示意 */}
      <g stroke="#1A1A1A" strokeOpacity="0.22" strokeWidth="0.9">
        <line x1="132" y1="170" x2="150" y2="42" />
        <line x1="188" y1="170" x2="170" y2="42" />
      </g>
      <g stroke="#1A1A1A" strokeOpacity="0.55" strokeWidth="1.4">
        <line x1="132" y1="140" x2="188" y2="140" />
        <line x1="139" y1="108" x2="181" y2="108" />
        <line x1="143" y1="76" x2="177" y2="76" />
      </g>
      <g stroke="#1A1A1A" strokeOpacity="0.4" strokeWidth="1.1">
        <line x1="120" y1="170" x2="139" y2="108" />
        <line x1="200" y1="170" x2="181" y2="108" />
        <line x1="132" y1="140" x2="181" y2="108" />
        <line x1="188" y1="140" x2="139" y2="108" />
        <line x1="139" y1="108" x2="177" y2="76" />
        <line x1="181" y1="108" x2="143" y2="76" />
      </g>

      {/* 天辊（顶端定滑轮） */}
      <g>
        <circle cx="160" cy="36" r="11" fill="none" stroke="url(#sp-wood)" strokeWidth="3" />
        <line x1="149" y1="36" x2="171" y2="36" stroke="#1A1A1A" strokeOpacity="0.6" strokeWidth="1.2" />
        <line x1="160" y1="25" x2="160" y2="47" stroke="#1A1A1A" strokeOpacity="0.6" strokeWidth="1.2" />
        <line x1="152" y1="28" x2="168" y2="44" stroke="#1A1A1A" strokeOpacity="0.6" strokeWidth="1.2" />
        <line x1="168" y1="28" x2="152" y2="44" stroke="#1A1A1A" strokeOpacity="0.6" strokeWidth="1.2" />
      </g>

      {/* 大车（提卤巨轮） */}
      <g transform="translate(214,150)">
        <circle r="19" fill="none" stroke="url(#sp-wood)" strokeWidth="3.2" />
        <circle r="19" fill="none" stroke="#1A1A1A" strokeOpacity="0.3" strokeWidth="0.8" />
        <g stroke="#1A1A1A" strokeOpacity="0.55" strokeWidth="1.2">
          <line x1="-19" y1="0" x2="19" y2="0" />
          <line x1="0" y1="-19" x2="0" y2="19" />
          <line x1="-13" y1="-13" x2="13" y2="13" />
          <line x1="13" y1="-13" x2="-13" y2="13" />
        </g>
        <circle r="2.6" fill="#1A1A1A" fillOpacity="0.7" />
      </g>

      {/* 提卤绳（墨线，非红）+ 汲卤筒：由天辊垂下、收放提卤 */}
      <path d="M160,47 C151,90 150,124 150,150" stroke="#1A1A1A" strokeOpacity="0.5" strokeWidth="1.2" fill="none" />
      <g>
        <path d="M147,150 L153,150 L152,163 L148,163 Z" fill="url(#sp-wood)" stroke="#1A1A1A" strokeOpacity="0.5" strokeWidth="0.9" strokeLinejoin="round" />
        <line x1="146" y1="150" x2="154" y2="150" stroke="#1A1A1A" strokeOpacity="0.65" strokeWidth="1" />
      </g>

      {/* 卤水（数据青） */}
      <circle cx="150" cy="170" r="4" fill="#2F6F8F" fillOpacity="0.85" />
    </svg>
  );
}
