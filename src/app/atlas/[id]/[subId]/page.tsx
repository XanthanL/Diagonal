import { Metadata } from "next";
import { atlasData } from "@/lib/data";
import { notFound } from "next/navigation";
import { getAbsoluteUrl } from "@/lib/path";
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

  const ogImage = subCollection.cover.startsWith("http")
    ? subCollection.cover
    : getAbsoluteUrl(subCollection.cover);
  const title = `${subCollection.title} | ${item.title}`;
  const description = item.excerpt;

  return {
    title: `${title} | DIAGONAL`,
    description,
    openGraph: {
      title: `${title} | DIAGONAL`,
      description,
      url: getAbsoluteUrl(`/atlas/${item.id}/${subCollection.id}`),
      siteName: "DIAGONAL",
      locale: "zh_CN",
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: subCollection.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | DIAGONAL`,
      description,
      images: [ogImage],
    },
    other: {
      "itemprop:name": `${title} | DIAGONAL`,
      "itemprop:description": description,
      "itemprop:image": ogImage,
      "og:image:secure_url": ogImage,
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
