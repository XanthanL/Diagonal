import { Metadata } from "next";
import { notFound } from "next/navigation";
import { artistsData, getArtistBySlug } from "@/lib/artists";
import { getAbsoluteUrl } from "@/lib/path";
import { ArtistDetailClient } from "@/components/ArtistDetailClient";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return artistsData.map((artist) => ({ slug: artist.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const artist = getArtistBySlug(params.slug);
  if (!artist) {
    return { title: "Artist | DIAGONAL" };
  }

  const title = `${artist.name} ${artist.nameEn} | DIAGONAL`;
  const url = getAbsoluteUrl(`/artists/${artist.slug}`);

  return {
    title,
    description: `${artist.name} (${artist.nameEn}) - ${artist.roleEn}`,
    openGraph: {
      title,
      url,
      siteName: "DIAGONAL",
      locale: "zh_CN",
      type: "profile",
    },
  };
}

export default async function ArtistPage({
  params,
}: {
  params: { slug: string };
}) {
  const artist = getArtistBySlug(params.slug);
  if (!artist) {
    return notFound();
  }

  return <ArtistDetailClient artist={artist} />;
}
