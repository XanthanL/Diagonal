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
      <body className="antialiased min-h-screen bg-white text-black selection:bg-black selection:text-white">
        <header className="fixed top-0 left-0 w-full z-50 p-6 mix-blend-difference">
          <nav className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="archive-text font-bold text-xl tracking-tighter">DIAGONAL</div>
            <ul className="flex space-x-8 archive-text text-sm">
              <li><a href="#archive" className="hover:line-through">Archive</a></li>
              <li><a href="#lab" className="hover:line-through">Lab</a></li>
              <li><a href="#about" className="hover:line-through">About</a></li>
              <li className="font-bold cursor-pointer">EN/中</li>
            </ul>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="p-12 border-t border-black/10 flex justify-between items-end archive-text text-xs opacity-50">
          <div>© 2026 DIAGONAL PROJECT</div>
          <div>POWERED BY UP-ON PERFORMANCE ART ARCHIVE</div>
        </footer>
      </body>
    </html>
  );
}
