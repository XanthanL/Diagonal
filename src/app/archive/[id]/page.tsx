import fs from "fs";
import path from "path";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { archiveData } from "@/lib/data";
import { getAssetPath, getAbsoluteUrl } from "@/lib/path";
import { ArchiveDetailClient } from "@/components/ArchiveDetailClient";

export const dynamic = "force-static";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const item = archiveData.find((p) => p.id === params.id);
  if (!item) {
    return { title: "Document | DIAGONAL" };
  }

  const ogImage = item.thumbnail ? getAbsoluteUrl(item.thumbnail) : undefined;

  return {
    title: `${item.title} | DIAGONAL`,
    description: `${item.title} - ${item.artist} / ${item.location.city}`,
    openGraph: {
      title: `${item.title} | DIAGONAL`,
      description: `${item.title} - ${item.artist} / ${item.location.city}`,
      url: getAbsoluteUrl(`/archive/${item.id}`),
      siteName: "DIAGONAL",
      locale: "zh_CN",
      type: "article",
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: item.title,
            },
          ]
        : undefined,
    },
    twitter: ogImage
      ? {
          card: "summary_large_image",
          title: `${item.title} | DIAGONAL`,
          description: `${item.title} - ${item.artist} / ${item.location.city}`,
          images: [ogImage],
        }
      : undefined,
    other: ogImage
      ? {
          "itemprop:name": `${item.title} | DIAGONAL`,
          "itemprop:description": `${item.title} - ${item.artist} / ${item.location.city}`,
          "itemprop:image": ogImage,
          "og:image:secure_url": ogImage,
        }
      : {
          "itemprop:name": `${item.title} | DIAGONAL`,
          "itemprop:description": `${item.title} - ${item.artist} / ${item.location.city}`,
        },
  };
}

export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), "src/content/archive");
  if (!fs.existsSync(contentDir)) return [];

  const files = fs.readdirSync(contentDir);
  const ids = new Set<string>();
  files.forEach((file) => {
    if (file.endsWith(".html") || file.endsWith(".md")) {
      ids.add(file.replace(/\.en\.html$/, "").replace(/\.html$/, "").replace(/\.md$/, ""));
    }
  });
  return Array.from(ids).map((id) => ({ id }));
}

function readContent(id: string, suffix: string): { content: string; isHtml: boolean } | null {
  const htmlPath = path.join(process.cwd(), "src/content/archive", `${id}${suffix}.html`);
  const mdPath = path.join(process.cwd(), "src/content/archive", `${id}${suffix}.md`);

  if (fs.existsSync(htmlPath)) {
    return { content: fs.readFileSync(htmlPath, "utf8"), isHtml: true };
  }
  if (fs.existsSync(mdPath)) {
    return { content: fs.readFileSync(mdPath, "utf8"), isHtml: false };
  }
  return null;
}

function processContent(content: string, isHtml: boolean): string {
  if (!isHtml) {
    return content;
  }
  return content.replace(/src="\/images\//g, `src="${getAssetPath('/images/')}`);
}

export default async function ArchiveDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const zhResult = readContent(id, "");
  if (!zhResult) {
    return notFound();
  }

  const enResult = readContent(id, ".en");

  const zhContent = processContent(zhResult.content, zhResult.isHtml);
  const enContent = enResult ? processContent(enResult.content, enResult.isHtml) : undefined;

  return (
    <ArchiveDetailClient
      id={id}
      zhContent={zhContent}
      enContent={enContent}
      isHtml={zhResult.isHtml}
    />
  );
}
