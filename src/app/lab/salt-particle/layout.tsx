import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/lab/salt-particle",
  title: "盐粒子模拟 Salt Particle | DIAGONAL",
  description:
    "对角线计划实验场：盐结晶粒子的实时模拟，按住并拖拽可搅动这团结晶云。",
});

export default function SaltParticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
