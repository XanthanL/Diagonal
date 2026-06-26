import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { getAbsoluteUrl } from "@/lib/path";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const siteTitle = "DIAGONAL | 对角线计划";
const siteDescription = "对角线计划 (Diagonal) 是一个从东北到西南、以行为艺术档案与跨学科研究为核心的长期艺术项目。";
const ogImage = getAbsoluteUrl("/images/og-cover.jpg");

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: getAbsoluteUrl("/"),
    siteName: "DIAGONAL",
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [ogImage],
  },
  other: {
    "itemprop:name": siteTitle,
    "itemprop:description": siteDescription,
    "itemprop:image": ogImage,
    "og:image:secure_url": ogImage,
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
        <meta name="referrer" content="strict-origin-when-cross-origin" />
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
