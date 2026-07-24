import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/AdminGate";

export const metadata: Metadata = {
  title: "对角线计划 · 内容后台",
  description: "Diagonal 自助文章发布后台",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-100 text-black">
      <AdminGate>{children}</AdminGate>
    </div>
  );
}
