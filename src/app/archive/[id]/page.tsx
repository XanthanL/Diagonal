import fs from "fs";
import path from "path";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { archiveData } from "@/lib/data";
import { getAssetPath } from "@/lib/path";

export const dynamic = "force-static";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const item = archiveData.find((p) => p.id === params.id);
  return {
    title: item ? `${item.title} | DIAGONAL` : "Document | DIAGONAL",
  };
}

export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), "src/content/archive");
  if (!fs.existsSync(contentDir)) return [];
  
  const files = fs.readdirSync(contentDir);
  return files.map((file) => ({
    id: file.replace(".html", "").replace(".md", ""),
  }));
}

export default async function ArchiveDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  // 优先寻找 .html 文件
  const htmlPath = path.join(process.cwd(), "src/content/archive", `${id}.html`);
  const mdPath = path.join(process.cwd(), "src/content/archive", `${id}.md`);
  
  let content = "";
  let isHtml = false;

  if (fs.existsSync(htmlPath)) {
    content = fs.readFileSync(htmlPath, "utf8");
    isHtml = true;
  } else if (fs.existsSync(mdPath)) {
    // 兼容可能存在的旧 md 或过渡期文件
    content = fs.readFileSync(mdPath, "utf8");
  } else {
    return notFound();
  }

  // 修复 GitHub Pages 下图片路径问题
  const processedContent = content.replace(/src="\/images\//g, `src="${getAssetPath('/images/')}`);

  return (
    <article className="min-h-screen bg-white text-black pt-32 pb-40 selection:bg-black selection:text-white">
      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 w-full z-50 p-6 mix-blend-difference">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/#archive" className="archive-text text-sm font-bold flex items-center gap-2 group text-white">
            <span className="group-hover:-translate-x-2 transition-transform">←</span> BACK_TO_DOCUMENTS
          </Link>
          <div className="archive-text text-[10px] opacity-50 uppercase tracking-widest text-white">{id} // HTML_RECORD</div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6">
        {isHtml ? (
          /* HTML 渲染容器：应用特定的档案样式 */
          <div 
            className="archive-html-content"
            dangerouslySetInnerHTML={{ __html: processedContent }} 
          />
        ) : (
          /* 兼容旧内容的简单渲染 */
          <pre className="whitespace-pre-wrap font-sans opacity-80">{content}</pre>
        )}
      </main>

      {/* 底部验证标注 */}
      <div className="mt-60 max-w-4xl mx-auto px-6 border-t border-black/10 pt-12 flex justify-between items-end">
        <div className="archive-text text-[10px] opacity-30 tracking-[0.2em] uppercase">
          End_of_Record / {id}
        </div>
        <div className="archive-text text-[8px] opacity-20">
          DIAGONAL ARCHIVE SYSTEM V2.0 // STYLED_HTML_MODE
        </div>
      </div>
    </article>
  );
}
