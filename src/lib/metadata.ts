import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/lib/path";

/**
 * 全站 OG 图的唯一来源。
 *
 * /images/diagonal-logo.jpg 实测就是 640×640 —— 此前 layout 与各详情页按「社交惯例」
 * 写 1200×630，与实际文件不符；部分抓取端（微信、部分爬虫）核对尺寸后判定图片无效、
 * 直接丢掉缩略图。声明必须对齐实测值，这里集中定义，避免再出现一处改一处漏。
 */
export const OG_IMAGE_PATH = "/images/diagonal-logo.jpg";
export const OG_IMAGE_WIDTH = 640;
export const OG_IMAGE_HEIGHT = 640;

export const ogImageUrl = (): string => getAbsoluteUrl(OG_IMAGE_PATH);

export const ogImageObject = (alt: string): NonNullable<Metadata["openGraph"]>["images"] => [
  {
    url: ogImageUrl(),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt,
  },
];

interface PageMetaInput {
  /** 站内绝对路径，例如 "/about"；会同时用于 canonical 与 og:url */
  path: string;
  title: string;
  description: string;
  type?: "website" | "article" | "profile";
}

/**
 * 生成带 canonical 的页面 Metadata。
 *
 * 为什么必须显式写 canonical：App Router 的 metadata 是**逐字段继承**的 ——
 * 子页面只要不给 `alternates`，就会继承 root layout 的 `canonical: "/"`，
 * 于是 /archive、/artists/<slug>、/archive/<id> 几十个页面的 canonical 全部
 * 塌回首页，搜索引擎把它们当首页副本去重，子页面实质不进索引。
 */
export function pageMetadata({
  path,
  title,
  description,
  type = "website",
}: PageMetaInput): Metadata {
  const url = getAbsoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "DIAGONAL",
      locale: "zh_CN",
      type,
      images: ogImageObject(title),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl()],
    },
  };
}
