import { Metadata } from "next";
import { atlasData } from "@/lib/data";
import { notFound } from "next/navigation";
import { pageMetadata, ogImageUrl } from "@/lib/metadata";
import { AtlasDetailClient } from "@/components/AtlasDetailClient";

export async function generateStaticParams() {
  return atlasData.map((item) => ({
    id: item.id,
  }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const item = atlasData.find((p) => p.id === params.id);
  if (!item) {
    return { title: "Atlas | DIAGONAL" };
  }

  const title = `${item.title} | DIAGONAL`;

  return {
    ...pageMetadata({
      path: `/atlas/${item.id}`,
      title,
      description: item.excerpt,
      type: "article",
    }),
    other: {
      "itemprop:name": title,
      "itemprop:description": item.excerpt,
      "itemprop:image": ogImageUrl(),
      "og:image:secure_url": ogImageUrl(),
    },
  };
}

export default function AtlasDetailPage({ params }: { params: { id: string } }) {
  const item = atlasData.find((p) => p.id === params.id);

  if (!item) {
    return notFound();
  }

  return <AtlasDetailClient item={item} />;
}
