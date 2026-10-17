import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/atlas",
  title: "图谱 Atlas | DIAGONAL",
  description:
    "对角线计划的跨地域知识图谱：把沿线地点、人物与文献按专题编排成的可翻阅图册。",
});

export default function AtlasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
