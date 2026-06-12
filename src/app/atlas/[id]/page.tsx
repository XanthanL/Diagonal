import { atlasData } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";

export async function generateStaticParams() {
  return atlasData.map((item) => ({
    id: item.id,
  }));
}

export default function AtlasDetailPage({ params }: { params: { id: string; subId?: string } }) {
  const item = atlasData.find((p) => p.id === params.id);
  
  if (!item) {
    return notFound();
  }

  // 如果有子集，且未进入特定子集ID，显示子集概览；如果进入子集，渲染对应子集画廊
  const subCollections = item.subCollections || [];

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-60 selection:bg-diagonal-red selection:text-white font-sans">
      <nav className="fixed top-0 left-0 w-full z-50 p-6 mix-blend-difference">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/#atlas" className="archive-text text-sm font-bold flex items-center gap-2 group text-white">
            <span className="group-hover:-translate-x-2 transition-transform">←</span> BACK_TO_ATLAS
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-40 grid grid-cols-1 md:grid-cols-12 gap-12 items-end">
          <div className="md:col-span-8 space-y-8">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase italic">
              {item.title}
            </h1>
          </div>
        </header>

        {subCollections.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {subCollections.map((sub) => (
              <Link key={sub.id} href={`/atlas/${item.id}/${sub.id}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden border border-white/10">
                  <img src={sub.cover} alt={sub.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h3 className="text-3xl font-bold uppercase">{sub.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <div className="py-40 text-center border border-dashed border-white/10 opacity-20 archive-text">
            NO_SUB_COLLECTIONS
          </div>
        )}
      </div>
    </div>
  );
}
