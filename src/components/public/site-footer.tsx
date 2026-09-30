import Link from "next/link";
import { cacheLife } from "next/cache";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getNavigation, type SiteSettingsData } from "@/server/queries/site";
import { getPublishedPrograms } from "@/server/queries/programs";
import { parseSocialLinks, SOCIAL_LABELS } from "@/lib/social";
import { telHref } from "@/lib/utils";
import { SmartLink } from "@/components/ui/smart-link";
import { BrandMark } from "./brand-mark";
import { SocialIcon } from "./social-icon";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 font-sans text-sm font-bold tracking-[0.14em] text-accent uppercase">{children}</h2>;
}

export async function SiteFooter({ settings }: { settings: SiteSettingsData }) {
  const [footerLinks, legalLinks, programs] = await Promise.all([
    getNavigation("FOOTER"),
    getNavigation("LEGAL"),
    getPublishedPrograms(6),
  ]);
  const socials = parseSocialLinks(settings.socialLinks);
  const year = settings.copyright?.includes("{year}");

  return (
    <footer className="bg-secondary text-on-secondary">
      <div className="container-site grid grid-cols-2 gap-x-6 gap-y-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:gap-10">
        <div className="col-span-2 space-y-5 lg:col-span-1">
          <BrandMark settings={settings} logo={settings.footerLogo ?? settings.logo} inverted />
          {settings.description && <p className="max-w-sm text-[0.95rem] opacity-80">{settings.description}</p>}
          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {socials.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LABELS[link.platform]}
                    className="grid size-10 place-items-center border border-white/20 hover:border-accent hover:text-accent"
                  >
                    <SocialIcon platform={link.platform} className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {footerLinks.length > 0 && (
          <nav aria-label="Footer">
            <FooterHeading>Explore</FooterHeading>
            <ul className="space-y-2.5">
              {footerLinks.map((link) => (
                <li key={link.id}>
                  <SmartLink
                    href={link.href}
                    external={link.isExternal}
                    newTab={link.openInNewTab}
                    className="opacity-85 hover:text-accent hover:opacity-100"
                  >
                    {link.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {programs.length > 0 && (
          <div>
            <FooterHeading>Programs</FooterHeading>
            <ul className="space-y-2.5">
              {programs.map((program) => (
                <li key={program.id}>
                  <Link href={`/programs/${program.slug}`} className="opacity-85 hover:text-accent hover:opacity-100">
                    {program.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="col-span-2 lg:col-span-1">
          <FooterHeading>Contact</FooterHeading>
          <ul className="space-y-3 text-[0.95rem]">
            {settings.address && (
              <li className="flex gap-3">
                <MapPin aria-hidden className="mt-1 size-4 shrink-0 text-accent" />
                <span className="opacity-85">{settings.address}</span>
              </li>
            )}
            {settings.phone && (
              <li className="flex gap-3">
                <Phone aria-hidden className="mt-1 size-4 shrink-0 text-accent" />
                <a href={telHref(settings.phone)} className="opacity-85 hover:text-accent hover:opacity-100">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.email && (
              <li className="flex gap-3">
                <Mail aria-hidden className="mt-1 size-4 shrink-0 text-accent" />
                <a href={`mailto:${settings.email}`} className="break-all opacity-85 hover:text-accent hover:opacity-100">
                  {settings.email}
                </a>
              </li>
            )}
            {settings.officeHours && (
              <li className="flex gap-3">
                <Clock aria-hidden className="mt-1 size-4 shrink-0 text-accent" />
                <span className="opacity-85">{settings.officeHours}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="container-site flex flex-col gap-3 py-6 text-sm opacity-75 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {year ? (
              <CopyrightYear template={settings.copyright!} />
            ) : (
              (settings.copyright ?? `© ${settings.schoolName}`)
            )}
          </p>
          {legalLinks.length > 0 && (
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.id}>
                  <SmartLink href={link.href} external={link.isExternal} className="hover:text-accent">
                    {link.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}

/** Replaces {year}; re-evaluated daily so the year rolls over on its own. */
async function CopyrightYear({ template }: { template: string }) {
  "use cache";
  cacheLife("days");
  return template.replace("{year}", String(new Date().getFullYear()));
}
