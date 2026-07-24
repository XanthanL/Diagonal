import type { PendingImage } from "@/lib/admin/types";

const MIME_EXT: Record<string, string> = {
  jpeg: "jpg",
  jpg: "jpg",
  png: "png",
  webp: "webp",
  gif: "gif",
  svg: "svg",
  "svg+xml": "svg",
};

function extFromMime(mime: string): string {
  return MIME_EXT[mime.toLowerCase()] || "png";
}

export function dataUrlToParts(dataUrl: string): { mime: string; base64: string } | null {
  const m = dataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!m) return null;
  return { mime: m[1], base64: m[2] };
}

const DATA_URL_SRC = /src="(data:image\/[a-zA-Z0-9.+-]+;base64,[^"]+)"/g;

// 从多段 HTML 中提取所有内联图片，统一改写为 /images/archive/{id}/img-N.ext，
// 相同图片跨中英文共用同一文件名（按 dataURL 去重）。
export function collectInlineImages(
  htmls: string[],
  id: string
): { htmls: string[]; images: PendingImage[] } {
  const map = new Map<string, string>(); // dataUrl -> filename
  const images: PendingImage[] = [];
  let n = 0;

  const rewritten = htmls.map((html) =>
    html.replace(DATA_URL_SRC, (_full, dataUrl: string) => {
      let filename = map.get(dataUrl);
      if (!filename) {
        const parts = dataUrlToParts(dataUrl);
        n += 1;
        const ext = parts ? extFromMime(parts.mime) : "png";
        filename = `img-${n}.${ext}`;
        map.set(dataUrl, filename);
        if (parts) images.push({ filename, base64: parts.base64 });
      }
      return `src="/images/archive/${id}/${filename}"`;
    })
  );

  return { htmls: rewritten, images };
}

// 封面：若是 dataURL 则生成 cover.ext；否则视为已有路径，不需上传
export function buildCover(
  coverDataUrl: string | undefined,
  existingThumbnail: string | undefined,
  id: string
): { thumbnail?: string; image?: PendingImage } {
  if (coverDataUrl) {
    const parts = dataUrlToParts(coverDataUrl);
    if (parts) {
      const ext = extFromMime(parts.mime);
      const filename = `cover.${ext}`;
      return {
        thumbnail: `/images/archive/${id}/${filename}`,
        image: { filename, base64: parts.base64 },
      };
    }
  }
  return { thumbnail: existingThumbnail };
}
