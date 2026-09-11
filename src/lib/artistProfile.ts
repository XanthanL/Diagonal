import profileRaw from "@/content/artists/vivienne-peng.json";

/**
 * 艺术家档案（作品集式介绍）——与「按艺术家名过滤档案条目」的旧索引互不替代。
 * 只有在本文件登记了档案的艺术家，详情页才会渲染作品集视图；
 * 未登记的艺术家（如 kerribin）继续走原有的档案条目索引。
 */
export interface ArtistWork {
  slug: string;
  title: string;
  titleEn: string;
  year: string;
  medium: string;
  mediumEn: string;
  category: string;
  categoryEn: string;
  images: string[];
  thumb: string;
  description: string;
  descriptionEn: string;
}

export interface ArtistProfile {
  slug: string;
  bio: string;
  bioEn: string;
  education: string;
  educationEn: string;
  cover: string;
  portrait: string;
  works: ArtistWork[];
}

const profiles = [profileRaw] as unknown as ArtistProfile[];

export function getArtistProfile(slug: string): ArtistProfile | undefined {
  return profiles.find((p) => p.slug === slug);
}
