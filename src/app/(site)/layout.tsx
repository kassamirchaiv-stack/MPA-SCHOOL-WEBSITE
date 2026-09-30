import { getSiteSettings } from "@/server/queries/site";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();

  if (!settings) {
    return (
      <main className="container-site grid min-h-dvh place-items-center py-24 text-center">
        <div className="max-w-lg space-y-3">
          <h1 className="text-3xl">Website not configured yet</h1>
          <p className="text-muted">
            The database has no site settings. Run <code>npm run db:seed</code> (see README) and reload.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader settings={settings} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
