import { AtlasItem } from "@/lib/data";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export function AtlasCover({ item }: { item: AtlasItem }) {
  return (
    <Link href={`/atlas/${item.id}`}>
      <motion.div
        whileHover={{ y: -10 }}
        className="group relative cursor-pointer"
      >
        {/* 档案封面主体 */}
        <div className="aspect-[4/5] bg-neutral-900 relative overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors shadow-2xl">
          {/* 背景对角线 */}
          <div className="absolute inset-0 opacity-10 diagonal-line mix-blend-overlay" />
          
          {/* 封面图片 - 默认灰度 */}
          {item.cover ? (
            <div className="absolute inset-0 w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out scale-105 group-hover:scale-100">
              <img 
                src={item.cover} 
                alt={item.title} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <span className="archive-text text-[10px]">NO_VISUAL_RECORD</span>
            </div>
          )}

          {/* 封面元数据标注 */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
            <div className="archive-text text-[8px] bg-white/10 backdrop-blur-md px-2 py-1 text-white border border-white/20">
              {item.id}
            </div>
            <div className="archive-text text-[8px] text-white/40 vertical-rl tracking-[0.3em]">
              LOC: {item.location.code}_{item.region.toUpperCase().slice(0, 2)}
            </div>
          </div>

          {/* 底部交互提示 */}
          <div className="absolute bottom-0 left-0 w-full p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-t from-black/80 to-transparent">
            <span className="archive-text text-[10px] text-diagonal-red font-bold tracking-widest">
              OPEN_ATLAS+
            </span>
          </div>
        </div>

        {/* 外部标题信息 */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="archive-text text-[9px] text-white/30 tracking-widest uppercase italic">
              {item.category}
            </span>
            <span className="archive-text text-[9px] text-white/30">
              {item.location.city}
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-diagonal-red transition-colors leading-snug">
            {item.title}
          </h3>
        </div>
      </motion.div>
    </Link>
  );
}
