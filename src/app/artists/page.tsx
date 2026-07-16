import { Metadata } from "next";
import { getAbsoluteUrl } from "@/lib/path";
import { ArtistsIndexClient } from "@/components/ArtistsIndexClient";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "艺术家 Artists | DIAGONAL",
  description: "对角线计划参展艺术家索引",
  alternates: {
    canonical: getAbsoluteUrl("/artists"),
  },
};

export default function ArtistsPage() {
  return <ArtistsIndexClient />;
}
