"use client";

import { useCallback, useId } from "react";

/**
 * Unique element ids per component instance. Next.js keeps recently visited pages
 * mounted (hidden) for instant back navigation, so fixed ids like "title" would be
 * duplicated across pages and labels could point at a hidden field.
 */
export function useFieldId() {
  const base = useId();
  return useCallback((name: string) => `${base}${name}`, [base]);
}
