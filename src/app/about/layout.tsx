import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

// 本页面与子插图页均为 "use client"，无法在 page.tsx 内导出 metadata；
// 由同级 layout（server component）承载 title/description/canonical。
export const metadata: Metadata = pageMetadata({
  path: "/about",
  title: "关于 About | DIAGONAL",
  description:
    "对角线计划的缘起与项目脉络：从 2024 年鹤岗城市实验到 2026 年自贡「生命之盐」盐文化驻留考察的时间线。",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
