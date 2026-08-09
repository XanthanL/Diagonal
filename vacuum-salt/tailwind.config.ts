import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // —— DIAGONAL 品牌色（与主站统一）—— //
        diagonal: {
          black: "#000000",
          white: "#FFFFFF",
          gray: "#F2F2F2",
          warmGray: "#FAFAF8",
          surface: "#0c0c0e",
          // 从纯红改为接近盐铁氧化物的暗朱色，保留激进语气但具物质性
          red: "#B33A2A",
          redDark: "#8E2D20",
        },
        // 纸白基底（高端简洁）——对齐主站暖纸色
        paper: {
          50: "#ffffff",
          100: "#FAFAF8",
          200: "#f4f1ec",
          300: "#e9e4dc",
          400: "#ddd6cb",
        },
        // 墨色文字（暖调近黑，与主站 #1A1A1A 统一）
        ink: {
          900: "#1A1A1A",
          800: "#2A2A2A",
          700: "#3D3A36",
          600: "#57534E",
          500: "#6B6661",
          400: "#8A8580",
        },
        // 卤水青蓝（精卤主色）
        brine: {
          50: "#eef6fb",
          100: "#d9ecf6",
          200: "#b8dcef",
          300: "#8cc4e0",
          400: "#5ba3c9",
          500: "#3b86ad",
          600: "#2c6a8a",
          700: "#245570",
        },
        // 黄卤琥珀（原料/暖色点缀）
        amber: {
          100: "#f5ecd9",
          200: "#e8d4a8",
          300: "#d4b276",
          400: "#c0964a",
          500: "#a37a2f",
        },
        // 盐晶
        salt: {
          50: "#ffffff",
          100: "#f8fafc",
          200: "#eef2f7",
        },
        // 设备金属
        alloy: {
          100: "#eef2f7",
          200: "#dde4ed",
          300: "#c2cdda",
          400: "#9fb0c2",
          500: "#76889c",
          600: "#566678",
        },
        line: {
          soft: "#E7E2DA",
          med: "#D8D2C8",
        },
      },
      fontFamily: {
        // 与主站 diagonal 完全一致的字体变量
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-serif)", "var(--font-serif-cjk)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)",
        lift: "0 2px 6px rgba(15,23,42,0.06), 0 18px 40px rgba(15,23,42,0.10)",
        glow: "0 0 0 1px rgba(59,134,173,0.18), 0 8px 24px rgba(59,134,173,0.14)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(30,41,59,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.035) 1px, transparent 1px)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
