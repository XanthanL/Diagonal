import { archiveData, ArchiveItem } from "@/lib/data";

export interface Artist {
  slug: string;
  name: string;
  nameEn: string;
  role: "Resident Artist" | "Invited Artist";
  roleEn: string;
  bio?: string;
  bioEn?: string;
}

export const artistsData: Artist[] = [
  {
    slug: "kerribin",
    name: "孙晓鸣",
    nameEn: "Kerribin",
    role: "Resident Artist",
    roleEn: "驻留艺术家",
  },
  {
    slug: "li-juan",
    name: "李娟",
    nameEn: "Li Juan",
    role: "Invited Artist",
    roleEn: "特邀艺术家",
  },
  {
    slug: "li-yongzheng",
    name: "李勇政",
    nameEn: "Li Yongzheng",
    role: "Invited Artist",
    roleEn: "特邀艺术家",
  },
  {
    slug: "ni-weihua",
    name: "倪卫华",
    nameEn: "Ni Weihua",
    role: "Invited Artist",
    roleEn: "特邀艺术家",
  },
  {
    slug: "vivienne-peng",
    name: "彭玮雯",
    nameEn: "Vivienne Peng",
    role: "Resident Artist",
    roleEn: "驻留艺术家",
  },
  {
    slug: "yang-chuanwei",
    name: "杨川威",
    nameEn: "Yang Chuanwei",
    role: "Invited Artist",
    roleEn: "特邀艺术家",
  },
  {
    slug: "yang-qian",
    name: "杨茜",
    nameEn: "Yang Qian",
    role: "Invited Artist",
    roleEn: "特邀艺术家",
  },
  {
    slug: "lannie-lan",
    name: "兰雅杰",
    nameEn: "Lannie",
    role: "Invited Artist",
    roleEn: "特邀艺术家",
  },
];

export function getArtistBySlug(slug: string): Artist | undefined {
  return artistsData.find((a) => a.slug === slug);
}

export function getArtistArchiveItems(artist: Artist): ArchiveItem[] {
  return archiveData.filter(
    (item) =>
      item.artist.includes(artist.name) ||
      item.artistEn.includes(artist.nameEn)
  );
}
