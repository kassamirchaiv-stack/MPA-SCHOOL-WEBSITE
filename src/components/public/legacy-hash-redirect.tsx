"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * The previous site was a single page with anchor sections (e.g. /#admissions).
 * URL fragments never reach the server, so old bookmarks are redirected here.
 */
const LEGACY_ANCHORS: Record<string, string> = {
  "#about": "/about",
  "#academics": "/programs",
  "#life": "/student-life",
  "#digital": "/about",
  "#admissions": "/admissions",
  "#contact": "/contact",
};

export function LegacyHashRedirect() {
  const router = useRouter();
  useEffect(() => {
    const target = LEGACY_ANCHORS[window.location.hash];
    if (target) router.replace(target);
  }, [router]);
  return null;
}
