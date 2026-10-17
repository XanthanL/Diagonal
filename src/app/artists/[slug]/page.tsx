import { Metadata } from "next";
import { notFound } from "next/navigation";
import { artistsData, getArtistBySlug } from "@/lib/artists";
import { getArtistProfile } from "@/lib/artistProfile";
import { ogImageUrl, pageMetadata } from "@/lib/metadata";
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
  // 登记了作品集档案的艺术家，用自述做描述；其余退回角色
  const profile = getArtistProfile(artist.slug);
  const description = profile
    ? profile.bio
    : `${artist.name}（${artist.nameEn}）— ${artist.roleEn}`;

  return {
    ...pageMetadata({
      path: `/artists/${artist.slug}`,
      title,
      description,
      type: "profile",
    }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl()],
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
