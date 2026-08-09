"use client";

import { useEffect, useState } from "react";

/** 响应式断点监听（用于桌面/移动选择不同抽屉形态） */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/** 是否桌面（md 断点以上） */
export function useIsDesktop() {
  return useMediaQuery("(min-width: 768px)");
}
