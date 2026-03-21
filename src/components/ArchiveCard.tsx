import { ArchiveItem } from "@/lib/data";
import { motion } from "framer-motion";

export function ArchiveCard({ item }: { item: ArchiveItem }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group relative border-t border-black/10 pt-6 pb-12 cursor-pointer flex flex-col h-full"
    >
      <div className="archive-text text-[10px] mb-4 flex justify-between opacity-50">
        <span>{item.id}</span>
        <span>{item.year}</span>
      </div>

      <div className="aspect-[3/4] bg-diagonal-gray mb-6 relative overflow-hidden flex items-center justify-center p-8 group-hover:bg-black/5 transition-colors">
        <div className="absolute inset-0 opacity-10 diagonal-line"></div>
        <div className="archive-text text-[8px] text-center opacity-30 leading-tight">
          ARCHIVE DATA<br />[IMAGE PENDING]
        </div>
        
        {/* 悬浮时的对角线强调 */}
        <motion.div
          className="absolute bottom-0 right-0 w-0 h-[1px] bg-black group-hover:w-full transition-all duration-500"
        />
      </div>

      <div className="space-y-2 mt-auto">
        <div className="archive-text text-[10px] bg-black text-white px-2 py-0.5 inline-block mb-2">
          {item.type}
        </div>
        <h3 className="text-2xl font-bold tracking-tight leading-none uppercase group-hover:underline underline-offset-8">
          {item.title}
        </h3>
        <p className="text-sm font-medium opacity-60 italic">{item.artist}</p>
        
        <div className="flex flex-wrap gap-2 pt-4">
          {item.tags.map(tag => (
            <span key={tag} className="archive-text text-[8px] opacity-40">#{tag}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
