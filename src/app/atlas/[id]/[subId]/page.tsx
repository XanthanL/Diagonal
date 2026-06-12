import { atlasData } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";

export async function generateStaticParams() {
  const params: { id: string; subId: string }[] = [];
  atlasData.forEach((item) => {
    item.subCollections?.forEach((sub) => {
      params.push({ id: item.id, subId: sub.id });
    });
  });
  return params;
}

export default function SubCollectionPage({ params }: { params: { id: string; subId: string } }) {
  const item = atlasData.find((p) => p.id === params.id);
  const subCollection = item?.subCollections?.find((s) => s.id === params.subId);
  
  if (!item || !subCollection) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-60 selection:bg-diagonal-red font-sans">
      <nav className="fixed top-0 left-0 w-full z-50 p-6 mix-blend-difference">
        <div className="max-w-7xl mx-auto">
          <Link href={`/atlas/${item.id}`} className="archive-text text-sm font-bold flex items-center gap-2 group text-white">
            <span className="group-hover:-translate-x-2 transition-transform">←</span> BACK_TO_{item.title.toUpperCase()}
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-24">
            <h1 className="text-4xl md:text-6xl font-black uppercase italic">{subCollection.title}</h1>
        </header>

        <section className="columns-1 md:columns-2 gap-12 space-y-12">
          {subCollection.gallery.map((img, index) => (
            <div key={index} className="break-inside-avoid space-y-4">
              <div className="relative group p-0">
                <img 
                  src={img.url} 
                  alt={img.caption || `${subCollection.title}_${(index + 1).toString().padStart(3, '0')}`}
                  className="w-full h-auto transition-all duration-1000"
                />
              </div>
              <p className="archive-text text-[12px] opacity-40 uppercase tracking-widest pl-2">
                {img.caption || `${subCollection.title}_${(index + 1).toString().padStart(3, '0')}`}
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
