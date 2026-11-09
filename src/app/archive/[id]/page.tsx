import fs from "fs";
import path from "path";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { archiveData } from "@/lib/data";
import { getAssetPath } from "@/lib/path";
import { ogImageUrl, pageMetadata } from "@/lib/metadata";
import { ArchiveDetailClient } from "@/components/ArchiveDetailClient";

export const dynamic = "force-static";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const item = archiveData.find((p) => p.id === params.id);
  if (!item) {
    return { title: "Document | DIAGONAL" };
  }

  const title = `${item.title} | DIAGONAL`;
  const description = `${item.title} - ${item.artist} / ${item.location.city}`;

  return {
    ...pageMetadata({
      path: `/archive/${item.id}`,
      title,
      description,
      type: "article",
    }),
    other: {
      "itemprop:name": title,
      "itemprop:description": description,
      "itemprop:image": ogImageUrl(),
      "og:image:secure_url": ogImageUrl(),
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
  // 改写图片路径以适配 basePath。
  // ⚠ 不要在这里给全部 <img> 加 loading="lazy"：ArchiveContent 会按序号给首图
  //   fetchpriority="high" 且不加 lazy，服务端先写死 lazy 会让首图 LCP 策略失效。
  //   懒加载 / srcset / 首图优先级统一由客户端 enhanceImages 一处决定。
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
  const enTitle = archiveData.find((p) => p.id === id)?.titleEn;

  return (
    <ArchiveDetailClient
      id={id}
      zhContent={zhContent}
      enContent={enContent}
      enTitle={enTitle}
      isHtml={zhResult.isHtml}
    />
  );
}
