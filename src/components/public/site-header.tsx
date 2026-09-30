import { getNavigation, type SiteSettingsData } from "@/server/queries/site";
import { SmartLink } from "@/components/ui/smart-link";
import { BrandMark } from "./brand-mark";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { TopBar } from "./top-bar";

export async function SiteHeader({ settings }: { settings: SiteSettingsData }) {
  const items = await getNavigation("HEADER");
  const cta =
    settings.headerCtaLabel && settings.headerCtaUrl
      ? { label: settings.headerCtaLabel, href: settings.headerCtaUrl }
      : null;

  return (
    <>
      <TopBar settings={settings} />
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/90">
        <div className="container-site flex h-18 items-center gap-4 lg:h-20">
          <BrandMark settings={settings} className="mr-auto" />
          <DesktopNav items={items} />
          {cta && (
            <SmartLink href={cta.href} className="btn btn-primary hidden sm:inline-flex">
              {cta.label}
            </SmartLink>
          )}
          <MobileNav
            items={items}
            schoolName={settings.schoolName}
            cta={cta}
            phone={settings.phone}
            email={settings.email}
          />
        </div>
      </header>
    </>
  );
}
