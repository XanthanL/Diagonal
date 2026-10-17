import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/colophon",
  title: "版本说明 Colophon | DIAGONAL",
  description:
    "对角线计划站内所用技术、外部作品与开源组件的来源清单，以及作者的其他项目枢纽入口。",
});

export default function ColophonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
