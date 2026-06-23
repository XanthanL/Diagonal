import { atlasData } from "@/lib/data";
import { notFound } from "next/navigation";
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

export default function SubCollectionPage({ params }: { params: { id: string; subId: string } }) {
  const item = atlasData.find((p) => p.id === params.id);
  const subCollection = item?.subCollections?.find((s) => s.id === params.subId);

  if (!item || !subCollection) {
    return notFound();
  }

  return <AtlasSubCollectionClient item={item} subId={params.subId} />;
}
