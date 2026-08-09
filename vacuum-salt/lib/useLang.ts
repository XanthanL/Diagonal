"use client";

import { useCallback, useEffect, useState } from "react";

export type Lang = "zh" | "en";

const STORE_KEY = "v_salt_lang";

export function useLang() {
  const [lang, setLang] = useState<Lang>("zh");

  useEffect(() => {
    const saved = localStorage.getItem(STORE_KEY) as Lang | null;
    if (saved === "zh" || saved === "en") setLang(saved);
  }, []);

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next = prev === "zh" ? "en" : "zh";
      localStorage.setItem(STORE_KEY, next);
      return next;
    });
  }, []);

  return { lang, setLang, toggle };
}
