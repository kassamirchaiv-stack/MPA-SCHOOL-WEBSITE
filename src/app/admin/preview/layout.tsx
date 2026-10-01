import type { Metadata } from "next";
import { Suspense } from "react";
import { getSiteSettings } from "@/server/queries/site";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { DetailSkeleton } from "@/components/public/skeletons";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/**
 * Admin-only preview of unpublished content in the real public design.
 * Each page checks permissions itself (layouts and pages render in parallel).
 * Everything sits inside Suspense: preview URLs are never prerendered.
 */
export default function PreviewLayout({ children }: LayoutProps<"/admin/preview">) {
  return (
    <>
      <div role="status" className="sticky top-0 z-50 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-black">
        Preview — this is how the page will look. It is not public until it is published.
      </div>
      <Suspense fallback={<DetailSkeleton />}>
        <PreviewChrome>{children}</PreviewChrome>
      </Suspense>
    </>
  );
}

async function PreviewChrome({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <>
      {settings && <SiteHeader settings={settings} />}
      <main id="main">{children}</main>
      {settings && <SiteFooter settings={settings} />}
    </>
  );
}
