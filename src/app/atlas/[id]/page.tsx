import { atlasData } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";

export async function generateStaticParams() {
  return atlasData.map((item) => ({
    id: item.id,
  }));
}

export default function AtlasDetailPage({ params }: { params: { id: string } }) {
  const item = atlasData.find((p) => p.id === params.id);
  
  if (!item) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-60 selection:bg-diagonal-red selection:text-white font-sans">
      {/* 导航 */}
      <nav className="fixed top-0 left-0 w-full z-50 p-6 mix-blend-difference">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/#atlas" className="archive-text text-sm font-bold flex items-center gap-2 group text-white">
            <span className="group-hover:-translate-x-2 transition-transform">←</span> BACK_TO_ATLAS
          </Link>
          <div className="archive-text text-xs opacity-50 uppercase tracking-widest text-white">
            {item.id} / {item.location.code}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        {/* 头部信息 */}
        <header className="mb-40 grid grid-cols-1 md:grid-cols-12 gap-12 items-end">
          <div className="md:col-span-8 space-y-8">
            <div className="archive-text text-xs text-diagonal-red font-bold tracking-[0.4em]">
              {item.region.toUpperCase()} / {item.category.toUpperCase()}
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase italic">
              {item.title}
            </h1>
          </div>
          <div className="md:col-span-4 space-y-4 border-l border-white/10 pl-8 pb-2">
            <div className="archive-text text-[10px] opacity-40 uppercase">Investigator</div>
            <div className="text-xl font-bold italic">{item.author}</div>
            <div className="archive-text text-[10px] opacity-40 uppercase pt-4">Timeline</div>
            <div className="text-xl font-bold italic">{item.date}</div>
          </div>
        </header>

        {/* 项目简介 */}
        <section className="max-w-3xl mb-40">
          <p className="text-2xl leading-[1.6] opacity-80 font-light text-justify italic">
            {item.excerpt}
          </p>
          <div className="mt-12 h-px w-32 bg-diagonal-red" />
        </section>

        {/* 视觉档案库 - 瀑布流展示 */}
        <section className="space-y-32">
          {item.gallery && item.gallery.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-start">
              {item.gallery.map((img, index) => (
                <div 
                  key={index} 
                  className={`space-y-6 ${index % 2 === 1 ? "md:mt-40" : ""}`}
                >
                  <div className="relative group overflow-hidden border border-white/5 bg-white/5">
                    <img 
                      src={img.url} 
                      alt={img.caption}
                      className="w-full h-auto filter grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out"
                    />
                    <div className="absolute top-4 left-4 archive-text text-[8px] opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm px-2 py-1">
                      IMG_REF: {item.id}_{index.toString().padStart(3, '0')}
                    </div>
                  </div>
                  <div className="flex gap-4 items-start border-l border-diagonal-red/30 pl-4">
                    <span className="archive-text text-[10px] opacity-20 mt-1">[{index.toString().padStart(2, '0')}]</span>
                    <p className="text-sm opacity-60 leading-relaxed tracking-wide uppercase font-medium">
                      {img.caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-40 text-center border border-dashed border-white/10 opacity-20 archive-text">
              PENDING_VISUAL_RECORDS_UPLOAD
            </div>
          )}
        </section>

        {/* 底部验证 */}
        <footer className="mt-60 pt-24 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 archive-text text-[10px] opacity-20 tracking-[0.3em]">
          <div>LOC: {item.location.coordinates}</div>
          <div>DATA_INTEGRITY_VERIFIED // {new Date().getFullYear()}</div>
          <div>SYSTEM_INDEX: {item.id}</div>
        </footer>
      </div>
    </div>
  );
}
