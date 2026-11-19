import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/colophon",
  title: "其他作品 Colophon | DIAGONAL",
  description: "XanthanL 的其他两处作品入口：项目观测站与 GAME LAB 游戏实验场。",
});

export default function ColophonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
