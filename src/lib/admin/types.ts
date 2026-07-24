// 与主站 src/lib/data.ts 的 ArchiveItem 保持一致的形状。
export interface ArchiveItem {
  id: string;
  title: string;
  titleEn: string;
  artist: string;
  artistEn: string;
  year: string; // 格式 "YYYY.MM.DD HH:MM"
  type: "Performance" | "Video" | "Document" | "Installation";
  typeEn: string;
  thumbnail?: string;
  tags: string[];
  tagsEn: string[];
  location: { city: string; cityEn: string; code: string; coordinates: string };
  region: "Southwest" | "Northeast" | "Transition";
  draft?: boolean;
  project: "the-salt-of-life" | "diagonal-talks" | "research-notes" | "other";
  series?: string;
}

// 一张待提交的图片（浏览器读为 base64）
export interface PendingImage {
  filename: string; // 仅文件名，如 cover.jpg
  base64: string; // 不含 data: 前缀
}

// 发布请求体
export interface PublishPayload {
  item: ArchiveItem;
  kicker: string; // header 顶部栏目号，如 DIAGONAL_EVENT
  coverCaption?: string; // 封面图说明（figcaption）
  bodyZh: string; // 富文本编辑器输出的中文正文 HTML（不含 header/section 包裹）
  bodyEn?: string; // 可选英文正文 HTML
  images: PendingImage[]; // 封面 + 正文内所有图片
  draft?: boolean;
}

// 列表项
export interface ArticleListItem {
  id: string;
  title: string;
  year?: string;
  source: "store" | "legacy"; // store=后台可编辑元数据；legacy=历史文章
  hasEn: boolean;
  draft?: boolean;
}
