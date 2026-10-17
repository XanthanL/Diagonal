import { Metadata } from "next";
import { atlasData } from "@/lib/data";
import { notFound } from "next/navigation";
import { pageMetadata, ogImageUrl } from "@/lib/metadata";
import { AtlasSubCollectionClient } from "@/components/AtlasSubCollectionClient";

export async function generateStaticParams() {
  const params: { id: string; subId: string }[] = [];
  atlasData.forEach((item) => {
    item.subCollections?.forEach((sub) => {
      params.push({ id: item.id, subId: sub.id });
    });
  });
  return params;
}

export async function generateMetadata({ params }: { params: { id: string; subId: string } }): Promise<Metadata> {
  const item = atlasData.find((p) => p.id === params.id);
  const subCollection = item?.subCollections?.find((s) => s.id === params.subId);

  if (!item || !subCollection) {
    return { title: "Atlas | DIAGONAL" };
  }

  const title = `${subCollection.title} | ${item.title} | DIAGONAL`;
  const description = item.excerpt;

  return {
    ...pageMetadata({
      path: `/atlas/${item.id}/${subCollection.id}`,
      title,
      description,
      type: "article",
    }),
    other: {
      "itemprop:name": title,
      "itemprop:description": description,
      "itemprop:image": ogImageUrl(),
      "og:image:secure_url": ogImageUrl(),
    },
  };
}

export default function SubCollectionPage({ params }: { params: { id: string; subId: string } }) {
  const item = atlasData.find((p) => p.id === params.id);
  const subCollection = item?.subCollections?.find((s) => s.id === params.subId);

  if (!item || !subCollection) {
    return notFound();
  }

  return <AtlasSubCollectionClient item={item} subId={params.subId} />;
}
