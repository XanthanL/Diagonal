"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  readShaderPrefs,
  setShaderPref,
  subscribeShaderPrefs,
  type ShaderKey,
  type ShaderPrefs,
} from "@/lib/shaderPrefs";

/**
 * 顶栏里的着色器开关：两个复选框，控制
 * - 圆形：全站跟随指针的水滴透镜
 * - 方形：图集照片上的取样框
 *
 * 状态活在 localStorage 里（见 lib/shaderPrefs），所以顶栏、DropletLens、
 * 图集照片墙三处读到的是同一份，勾掉哪一层，那一层当场退场。
 *
 * 首屏渲染一律画「勾上」：服务端不知道 localStorage 里是什么，
 * 差异留到 effect 里补，避免 hydration 对不上。
 */
export function ShaderToggles({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  const [prefs, setPrefs] = useState<ShaderPrefs>({ droplet: true, square: true });

  useEffect(() => {
    setPrefs(readShaderPrefs());
    return subscribeShaderPrefs(setPrefs);
  }, []);

  const items: { key: ShaderKey; label: string; hint: string }[] = [
    {
      key: "droplet",
      label: lang === "zh" ? "圆形" : "ROUND",
      hint: lang === "zh" ? "圆形着色器：跟随指针的水滴" : "Round shader: the pointer droplet",
    },
    {
      key: "square",
      label: lang === "zh" ? "方形" : "SQUARE",
      hint: lang === "zh" ? "方形着色器：照片上的取样框" : "Square shader: the sample box on photos",
    },
  ];

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {items.map((item) => {
        const on = prefs[item.key];
        return (
          <button
            key={item.key}
            type="button"
            role="checkbox"
            aria-checked={on}
            aria-label={item.hint}
            title={item.hint}
            onClick={() => setShaderPref(item.key, !on)}
            className={`press archive-text flex items-center gap-1.5 text-[10px] tracking-[0.14em] ${
              on ? "opacity-80" : "opacity-35"
            } hover:opacity-100`}
          >
            {/* 手画的勾选框：一像素边 + 内里一个实心块。不用原生 input，
                是为了在任何底色（顶栏走 mix-blend-difference）上都跟着字色走 */}
            <span className="grid size-[11px] shrink-0 place-items-center border border-current">
              {on && <span className="size-[5px] bg-current" />}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
