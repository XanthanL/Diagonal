/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        diagonal: {
          black: "#000000",
          white: "#FFFFFF",
          gray: "#F2F2F2",
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
