import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono, Newsreader, Noto_Serif_SC } from "next/font/google";
import { getAbsoluteUrl, siteUrl } from "@/lib/path";
import { SITE_THEME_KEY } from "@/lib/themePrefs";
import { Providers } from "@/components/Providers";
import { GlobalNav } from "@/components/GlobalNav";
import { PageTransition } from "@/components/PageTransition";
import { SiteFooter } from "@/components/SiteFooter";
import { DropletLens } from "@/components/DropletLens";
import { SiteThemeBackdrop } from "@/components/SiteThemeBackdrop";
import "./globals.css";
// 草木主题生图素材的落位样式：必须在 globals.css 之后，后置覆盖旧 sprig 定位
import "./herbarium-assets.css";
// 归档正文图版：必须在 globals.css 之后，覆盖旧的 max-height/object-fit 压图规则
import "./archive-plates.css";

// 精确加载所需字重，避免加载完整可变字体
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "700", "900"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "700"] });
// Newsreader：为屏幕阅读优化的拉丁衬线展示字，用于英文标题、引文与艺术档案叙事层
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", weight: ["400", "500", "700"], style: ["normal", "italic"] });
// Noto Serif SC（思源宋体）：中文标题/引文的衬线渲染，排在拉丁衬线之后按字形回退；CJK 体量大，禁用预加载
const serifCjk = Noto_Serif_SC({ variable: "--font-serif-cjk", weight: ["400", "500", "700"], preload: false });
// Cormorant Garamond：画廊级的 display 衬线。原先只给 Xanthan摄影作品那一辑用，
// 现在草木主题会把它铺到全站标题；仍 preload:false，档案风不必为它付出首屏字节。
const floraDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-flora",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  preload: false,
});

const siteTitle = "DIAGONAL | 对角线计划";
const siteDescription = "对角线计划 (Diagonal) 是一个从东北到西南、以行为艺术档案与跨学科研究为核心的长期艺术项目。";
const ogImage = getAbsoluteUrl("/images/diagonal-logo.jpg");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  alternates: {
    // 只给 canonical。原先这里还写了 languages: { "zh-CN": "/", en: "/" } ——
    // 本站在站貌上是双语，但语言选择走客户端 Context + localStorage，
    // **并没有** per-language URL，两条 hreflang 指向同一个地址属于自指无效标记
    // （搜索引擎会直接忽略，且可能与真实语种信号冲突）。缺独立语言 URL 就别声明。
    canonical: "/",
  },
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
        // 实测 pixel size of /images/diagonal-logo.jpg；此前按惯例写成 1200×630，
        // 与实际文件不符，部分抓取端会据此判定图片无效而丢弃缩略图
        width: 640,
        height: 640,
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
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${inter.variable} ${mono.variable} ${serif.variable} ${serifCjk.variable} ${floraDisplay.variable}`}
    >
      <head>
        {/* 风格与语言都必须在 CSS 生效前落到 <html> 上：切到草木 / 英文后刷新，
            若等 React effect 再补属性，会先吃一帧档案风的中文界面。
            与 lib/themePrefs.ts 的 SITE_THEME_KEY 是同一个键。 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('${SITE_THEME_KEY}')==='herbarium'){document.documentElement.setAttribute('data-theme','herbarium')}if(localStorage.getItem('diagonal-language')==='en'){document.documentElement.setAttribute('lang','en')}}catch(e){}`,
          }}
        />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        {/* JS 禁用时撤下首次加载的过渡幕布，保证内容可读 */}
        <noscript>
          <style>{`.page-transition-overlay{display:none!important}`}</style>
        </noscript>
      </head>
      {/* 底色与字色交给 globals.css 的 body{color:var(--foreground);background:var(--background)}：
          原先写死在 className 里的 bg-[#FAFAF8] 是 utility，优先级高于那条规则，
          草木主题覆盖变量时会盖不动它。 */}
      <body className="antialiased min-h-screen">
        <Providers>
          {/* Skip-nav：键盘用户按 Tab 可跳过导航直达主内容。
              两份文案由 <html lang> + CSS 显隐，首帧就与语言一致，无水合闪烁。 */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-black focus:text-white focus:px-4 focus:py-2 focus:text-sm"
          >
            <span className="i18n-zh">跳转到主内容</span>
            <span className="i18n-en">Skip to main content</span>
          </a>
          {/* 草木主题的虚焦花汁底光：由 CSS 按 data-theme 显隐，档案风下不下载图 */}
          <SiteThemeBackdrop />
          <GlobalNav />
          <PageTransition>{children}</PageTransition>
          <SiteFooter />
          {/* 水滴透镜：压在页面之上、导航之下的着色器反馈层，自身不接收指针事件 */}
          <DropletLens />
        </Providers>
      </body>
    </html>
  );
}
