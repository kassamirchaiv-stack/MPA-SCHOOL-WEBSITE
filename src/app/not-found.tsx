import type { Metadata } from "next";
import { getSiteSettings } from "@/server/queries/site";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { NotFoundContent } from "@/components/public/not-found-content";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** Unmatched URLs render outside the (site) layout, so this adds the site chrome itself. */
export default async function NotFound() {
  const settings = await getSiteSettings();
  if (!settings) return <NotFoundContent />;
  return (
    <>
      <SiteHeader settings={settings} />
      <main id="main">
        <NotFoundContent />
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
