import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { getAbsoluteUrl } from "@/lib/path";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "DIAGONAL | 对角线计划",
  description: "对角线计划 (Diagonal) - 行为艺术档案与跨学科研究项目",
  openGraph: {
    title: "DIAGONAL | 对角线计划",
    description: "对角线计划 (Diagonal) - 行为艺术档案与跨学科研究项目",
    url: getAbsoluteUrl("/"),
    siteName: "DIAGONAL",
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: getAbsoluteUrl("/images/archive/DIAGONAL-2026-ZG03/cover.jpg"),
        width: 1200,
        height: 630,
        alt: "DIAGONAL 对角线计划",
      },
    ],
  },
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
        <I18nProvider>
          <main>{children}</main>
          <footer className="p-12 border-t border-black/10 flex justify-between items-end archive-text text-xs opacity-50">
            <div>© 2026 DIAGONAL PROJECT</div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
