import { Metadata } from "next";
import { atlasData } from "@/lib/data";
import { notFound } from "next/navigation";
import { getAbsoluteUrl } from "@/lib/path";
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

  const ogImage = item.cover ? getAbsoluteUrl(item.cover) : undefined;

  return {
    title: `${item.title} | DIAGONAL`,
    description: `${item.excerpt}`,
    openGraph: {
      title: `${item.title} | DIAGONAL`,
      description: item.excerpt,
      url: getAbsoluteUrl(`/atlas/${item.id}`),
      siteName: "DIAGONAL",
      locale: "zh_CN",
      type: "article",
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: item.title }]
        : undefined,
    },
    twitter: ogImage
      ? {
          card: "summary_large_image",
          title: `${item.title} | DIAGONAL`,
          description: item.excerpt,
          images: [ogImage],
        }
      : undefined,
    other: ogImage
      ? {
          "itemprop:name": `${item.title} | DIAGONAL`,
          "itemprop:description": item.excerpt,
          "itemprop:image": ogImage,
          "og:image:secure_url": ogImage,
        }
      : {
          "itemprop:name": `${item.title} | DIAGONAL`,
          "itemprop:description": item.excerpt,
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
