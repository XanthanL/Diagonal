import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "DIAGONAL | 对角线计划",
  description: "对角线计划 (Diagonal) - 行为艺术档案与跨学科研究项目",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${mono.variable}`}>
      <head>
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className="antialiased min-h-screen bg-white text-black selection:bg-black selection:text-white">
        <main>{children}</main>
        <footer className="p-12 border-t border-black/10 flex justify-between items-end archive-text text-xs opacity-50">
          <div>© 2026 DIAGONAL PROJECT</div>
        </footer>
      </body>
    </html>
  );
}
