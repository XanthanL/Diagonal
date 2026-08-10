/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  future: {
    // 让所有 hover: 变体自动包裹 @media (hover: hover)
    // 触屏点击后 hover 态会「粘住」不消失，这一行全站根治
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      // 动效曲线令牌：浏览器内置 ease-out 太弱，统一用强曲线
      transitionTimingFunction: {
        // 进入 / 退出 / 按压：强 ease-out
        "out-strong": "cubic-bezier(0.23, 1, 0.32, 1)",
        // 屏幕内位移 / 形变：强 ease-in-out
        "inout-strong": "cubic-bezier(0.77, 0, 0.175, 1)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        diagonal: {
          black: "#000000",
          white: "#FFFFFF",
          gray: "#F2F2F2",
          // 微暖灰底：替代纯白背景，减少视觉疲劳
          warmGray: "#FAFAF8",
          // 暗色表面：Atlas / SaltSimulation 等暗色区段统一用此值
          surface: "#0c0c0e",
          // 从纯红 #FF0000（系统警告色）改为接近盐铁氧化物的暗朱色
          // 保留激进语气但具有物质性，与艺术机构调性匹配
          red: "#B33A2A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        // 引入衬线展示字用于标题与引文：拉丁用 Newsreader，中文回退到 Noto Serif SC（思源宋体）
        serif: ["var(--font-serif)", "var(--font-serif-cjk)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
