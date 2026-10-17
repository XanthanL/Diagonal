import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/archive",
  title: "档案 Archive | DIAGONAL",
  description:
    "对角线计划的行为、影像、文献与装置档案库，可按类型、地域与所属项目筛选检索。",
});

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
