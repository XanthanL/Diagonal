import fs from "fs";
import path from "path";
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { notFound } from "next/navigation";

// 强制为静态生成
export const dynamic = "force-static";

export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), "src/content/archive");
  if (!fs.existsSync(contentDir)) return [];
  
  const files = fs.readdirSync(contentDir);
  return files.map((file) => ({
    id: file.replace(".md", ""),
  }));
}

// 将组件改为 async 异步函数，这是 Next.js Server Component 的标准写法
export default async function ArchiveDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const filePath = path.join(process.cwd(), "src/content/archive", `${id}.md`);

  if (!fs.existsSync(filePath)) {
    return notFound();
  }

  // 在服务端读取文件
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContent);

  return (
    <article className="min-h-screen bg-white text-black pt-32 pb-40">
      {/* 顶部导航与返回 */}
      <nav className="fixed top-0 left-0 w-full z-50 p-6 mix-blend-difference">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/#archive" className="archive-text text-sm font-bold flex items-center gap-2 group">
            <span className="group-hover:-translate-x-2 transition-transform">←</span> BACK_TO_BOX
          </Link>
          <div className="archive-text text-xs opacity-50 uppercase tracking-widest">{id}</div>
        </div>
      </nav>

      {/* 档案标题区 */}
      <header className="max-w-4xl mx-auto px-6 mb-24 space-y-8">
        <div className="inline-block bg-black text-white px-3 py-1 archive-text text-xs tracking-widest">
          {data.category || "ARCHIVE_RECORD"}
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight uppercase italic">
          {data.title}
        </h1>
        <div className="h-px w-full bg-black/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-diagonal-red w-1/4 animate-scan" />
        </div>
      </header>

      {/* 正文内容区 */}
      <main className="max-w-3xl mx-auto px-6 prose prose-neutral prose-lg">
        <div className="archive-markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </main>

      {/* 底部装饰 - 简化为极小的标注 */}
      <div className="mt-40 max-w-3xl mx-auto px-6 opacity-30 archive-text text-[10px] tracking-[0.2em] uppercase">
        End_of_Record / {id}
      </div>
    </article>
  );
}
