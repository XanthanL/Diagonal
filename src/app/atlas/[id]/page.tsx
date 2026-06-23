import { atlasData } from "@/lib/data";
import { notFound } from "next/navigation";
import { AtlasDetailClient } from "@/components/AtlasDetailClient";

export async function generateStaticParams() {
  return atlasData.map((item) => ({
    id: item.id,
  }));
}

export default function AtlasDetailPage({ params }: { params: { id: string } }) {
  const item = atlasData.find((p) => p.id === params.id);

  if (!item) {
    return notFound();
  }

  return <AtlasDetailClient item={item} />;
}
