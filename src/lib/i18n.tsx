"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Language = "zh" | "en";

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextType>({
  lang: "zh",
  setLang: () => {},
  toggleLang: () => {},
});

const STORAGE_KEY = "diagonal-language";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("zh");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem(STORAGE_KEY) as Language | null) : null;
    if (stored === "zh" || stored === "en") {
      setLangState(stored);
      document.documentElement.lang = stored === "zh" ? "zh-CN" : "en";
    }
    setMounted(true);
  }, []);

  const setLang = useCallback((nextLang: Language) => {
    setLangState(nextLang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, nextLang);
      document.documentElement.lang = nextLang === "zh" ? "zh-CN" : "en";
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "zh" ? "en" : "zh";
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
      }
      return next;
    });
  }, []);

  // 避免首次客户端渲染与水合不匹配：水合完成前强制使用默认中文
  const effectiveLang = mounted ? lang : "zh";

  return (
    <I18nContext.Provider value={{ lang: effectiveLang, setLang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
