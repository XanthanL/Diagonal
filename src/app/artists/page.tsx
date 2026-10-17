import { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { ArtistsIndexClient } from "@/components/ArtistsIndexClient";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  path: "/artists",
  title: "艺术家 Artists | DIAGONAL",
  description: "对角线计划参展艺术家索引",
});

export default function ArtistsPage() {
  return <ArtistsIndexClient />;
}
