import { labData } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export async function generateStaticParams() {
  return labData.map((post) => ({
    id: post.id,
  }));
}

export default async function LabDetailPage({ params }: { params: { id: string } }) {
  const post = labData.find((p) => p.id === params.id);
  
  if (!post) {
    return notFound();
  }

  let content = "";
  try {
    const filePath = path.join(process.cwd(), "content/lab", `${params.id}.md`);
    if (fs.existsSync(filePath)) {
      const rawContent = fs.readFileSync(filePath, "utf-8");
      
      content = rawContent
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        .replace(/原创\s+对角线计划.*/g, '')
        .replace(/_202\d年\d+月\d+日.*_ /g, '')
        .replace(/\[ 对角线计划Diagonal \]/g, '')
        .replace(/预览时标签不可点.*/g, '')
        .replace(/阅读/g, '')
        .replace(/\*\*\*\*/g, '')
        .replace(/__/g, '')
        .replace(/\*\* \*\*/g, '')
        .replace(/^(\d+)\.(?!\s)/gm, '$1. ')
        .replace(/^([\-\*\+])(?!\s)/gm, '$1 ')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\n{2,}/g, '\n\n')
        .trim();
    } else {
      content = post.excerpt;
    }
  } catch (error) {
    console.error("Content file not found:", error);
    content = post.excerpt;
  }

  return (
    <div className="min-h-screen bg-white text-black pt-32 pb-60 selection:bg-black selection:text-white font-sans">
      <div className="max-w-3xl mx-auto px-6">
        <Link href="/" className="archive-text text-[10px] opacity-40 hover:opacity-100 mb-20 block group">
          <span className="group-hover:-translate-x-1 transition-transform inline-block mr-2">←</span> 
          RETURN_TO_DIAGONAL_INDEX
        </Link>

        <header className="mb-40 space-y-8">
          <div className="archive-text text-[10px] tracking-[0.3em] opacity-30">
            RESEARCH_RECORD / {post.category}
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase">
            {post.title}
          </h1>
          <div className="pt-12 border-t border-black flex justify-between items-end">
            <div className="space-y-1">
              <div className="archive-text text-xs font-bold uppercase italic">Principal: {post.author}</div>
              <div className="archive-text text-[10px] opacity-40">Field: Industrial Heritage & Contemporary Art</div>
            </div>
            <div className="archive-text text-[10px] opacity-30 font-mono">
              TS_{post.date.replace(/\./g, '')}
            </div>
          </div>
        </header>

        <article className="diagonal-article">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              img: () => null,

              p: ({ children }) => (
                <div className="text-xl leading-[2] mb-14 opacity-90 text-justify font-medium tracking-tight">
                  {children}
                </div>
              ),

              h1: ({ children }) => (
                <h2 className="text-3xl font-black mb-12 mt-32 uppercase border-l-8 border-black pl-6">
                  {children}
                </h2>
              ),
              h2: ({ children }) => (
                <div className="flex mb-10 mt-24">
                  <h2 className="text-2xl font-black uppercase tracking-tighter bg-black text-white px-4 py-2 inline-block">
                    {children}
                  </h2>
                </div>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-bold mb-8 mt-16 uppercase italic underline decoration-2 underline-offset-8">
                  {children}
                </h3>
              ),
              
              blockquote: ({ children }) => (
                <blockquote className="my-24 py-12 border-y border-black/10 relative">
                  <span className="absolute top-0 left-0 archive-text text-[10px] opacity-20">CORE_PERSPECTIVE</span>
                  <div className="text-3xl font-black italic opacity-80 leading-snug tracking-tighter text-center">
                    {children}
                  </div>
                  <span className="absolute bottom-0 right-0 archive-text text-[10px] opacity-20 text-diagonal-red">EOF_BLOCK</span>
                </blockquote>
              ),
              
              ul: ({ children }) => <ul className="space-y-8 mb-20 border-l border-black/5 pl-8">{children}</ul>,
              li: ({ children }) => (
                <li className="flex flex-col gap-2">
                  <span className="archive-text text-[10px] text-diagonal-red font-bold tracking-widest">POINT_ACCESS</span>
                  <div className="text-xl opacity-90 leading-relaxed font-medium">{children}</div>
                </li>
              ),

              strong: ({ children }) => (
                <strong className="font-black border-b-2 border-black/20 px-0.5">{children}</strong>
              ),

              hr: () => <hr className="my-32 border-black/10" />,

              em: ({ children }) => (
                <em className="bg-diagonal-gray px-1 py-0.5 not-italic archive-text text-sm opacity-70">
                  {children}
                </em>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </article>

        <footer className="mt-80 pt-24 border-t-4 border-black group">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <div className="archive-text text-[10px] font-bold mb-4 opacity-30">DOCUMENTATION_METADATA</div>
              <p className="text-xs opacity-40 leading-loose">
                本文档由“对角线计划”研究小组整理。内容包含艺术的在地性研究、行为剧场、装置、影像及参与性艺术的实践总结。
              </p>
            </div>
            <div className="flex flex-col items-end justify-between">
              <Link href="/" className="archive-text text-xs font-bold border-2 border-black px-12 py-4 hover:bg-black hover:text-white transition-all uppercase tracking-[0.3em]">
                Index_Archive
              </Link>
              <div className="archive-text text-[9px] opacity-20 mt-8">
                GEN_TIME: {new Date().toISOString()}<br />
                LOCATION: HARBIN / CHENGDU
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
