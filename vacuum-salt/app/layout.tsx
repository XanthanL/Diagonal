import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "真空制盐工艺 3D 解构 · 自贡井卤 | DIAGONAL",
  description:
    "对角线计划子项目：以四川自贡井矿盐卤为原料的真空制盐完整工艺流程 3D 解构展示——井卤开采与净化 → 多效蒸发结晶 → 离心脱水 → 干燥筛分 → 包装仓储。科学严谨，风格统一于 DIAGONAL。",
};

// 与 diagonal 主站统一字体系统：Inter / JetBrains Mono / Newsreader + Noto Serif SC
// 采用 Google Fonts <link> 加载（在 CSS 变量中声明），避免构建期联网拉取，构建更稳定。
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&family=Newsreader:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&family=Noto+Serif+SC:wght@400;500;700&display=swap"
        />
      </head>
      <body className="antialiased font-sans bg-[#FAFAF8] text-[#1A1A1A]">
        {children}
      </body>
    </html>
  );
}
