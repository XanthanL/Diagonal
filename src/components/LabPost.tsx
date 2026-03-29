import { LabItem } from "@/lib/data";
import { motion } from "framer-motion";
import Link from "next/link";

interface LabPostProps {
  item: LabItem;
  variant?: "light" | "dark";
}

export function LabPost({ item, variant = "light" }: LabPostProps) {
  const isDark = variant === "dark";
  
  return (
    <Link href={`/lab/${item.id}`} className="block">
      <motion.div
        whileHover={{ x: 10 }}
        className={`group grid grid-cols-1 md:grid-cols-12 gap-8 py-12 border-b cursor-pointer relative overflow-hidden px-4 transition-colors
          ${isDark ? "border-white/10 hover:bg-white/[0.05] text-white" : "border-black/10 hover:bg-black/[0.02] text-black"}
        `}
      >
        {/* 档案 ID 与 类别 */}
        <div className="md:col-span-2 archive-text text-[10px] opacity-40 space-y-1">
          <div>{item.id}</div>
          <div className={`${isDark ? "bg-white text-black" : "bg-black text-white"} px-1 py-0.5 inline-block`}>
            {item.category}
          </div>
        </div>
        
        {/* 标题与作者 */}
        <div className="md:col-span-6 space-y-4">
          <h3 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight group-hover:text-diagonal-red transition-colors uppercase">
            {item.title}
          </h3>
          <p className="text-sm opacity-60 font-medium font-mono uppercase italic">{item.author} — {item.date}</p>
        </div>

        {/* 摘要与进入按钮 */}
        <div className="md:col-span-4 flex flex-col justify-between">
          <p className="text-sm leading-relaxed opacity-80 italic">
            “{item.excerpt}”
          </p>
          <div className="archive-text text-[10px] mt-8 flex items-center justify-between font-bold group-hover:gap-4 transition-all">
            <span className="group-hover:tracking-[0.2em] transition-all duration-300">ACTIVATE_STUDY</span>
            <span className="text-2xl">→</span>
          </div>
        </div>

        {/* 对角线视觉装饰 */}
        <div className={`absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-10 pointer-events-none diagonal-line scale-150 rotate-45 transition-opacity 
          ${isDark ? "invert" : ""}`} 
        />
      </motion.div>
    </Link>
  );
}
