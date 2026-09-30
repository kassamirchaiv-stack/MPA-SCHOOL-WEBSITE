import { Mail, MapPin, Phone } from "lucide-react";
import type { SiteSettingsData } from "@/server/queries/site";
import { parseSocialLinks, SOCIAL_LABELS } from "@/lib/social";
import { telHref } from "@/lib/utils";
import { SocialIcon } from "./social-icon";

export function TopBar({ settings }: { settings: SiteSettingsData }) {
  const socials = parseSocialLinks(settings.socialLinks);
  const hasContent = settings.phone || settings.email || settings.address || socials.length > 0;
  if (!hasContent) return null;

  return (
    <div className="hidden bg-secondary text-sm text-on-secondary md:block">
      <div className="container-site flex h-10 items-center justify-between gap-6">
        <ul className="flex min-w-0 items-center gap-6">
          {settings.phone && (
            <li>
              <a href={telHref(settings.phone)} className="inline-flex items-center gap-2 opacity-90 hover:opacity-100">
                <Phone aria-hidden className="size-3.5" />
                {settings.phone}
              </a>
            </li>
          )}
          {settings.email && (
            <li>
              <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2 opacity-90 hover:opacity-100">
                <Mail aria-hidden className="size-3.5" />
                {settings.email}
              </a>
            </li>
          )}
          {settings.address && (
            <li className="hidden min-w-0 items-center gap-2 opacity-90 lg:inline-flex">
              <MapPin aria-hidden className="size-3.5 shrink-0" />
              <span className="truncate">{settings.address}</span>
            </li>
          )}
        </ul>
        {socials.length > 0 && (
          <ul className="flex items-center gap-1">
            {socials.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOCIAL_LABELS[link.platform]}
                  className="grid size-8 place-items-center opacity-85 hover:opacity-100"
                >
                  <SocialIcon platform={link.platform} className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
