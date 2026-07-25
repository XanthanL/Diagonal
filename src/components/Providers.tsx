"use client";

import { MotionConfig } from "framer-motion";
import { I18nProvider } from "@/lib/i18n";

/**
 * 客户端 Provider 合并层：
 * - MotionConfig: reducedMotion="user" 让所有 framer-motion 动画尊重
 *   prefers-reduced-motion 系统偏好（前庭敏感/省电模式用户自动禁用动画）
 * - I18nProvider: 语言上下文
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <I18nProvider>{children}</I18nProvider>
    </MotionConfig>
  );
}
