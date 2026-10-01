import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getPage } from "@/server/queries/content";
import { getSiteSettings } from "@/server/queries/site";
import { pageMetadata } from "@/server/page-meta";
import { telHref } from "@/lib/utils";
import { safeMapEmbedUrl } from "@/lib/map";
import { PageHero } from "@/components/public/page-hero";
import { ContactForm } from "@/components/public/contact-form";

export const generateMetadata = () => pageMetadata("contact", "/contact", "Contact");

export default async function ContactPage() {
  const [page, settings] = await Promise.all([getPage("contact"), getSiteSettings()]);
  const mapUrl = safeMapEmbedUrl(settings?.mapEmbedUrl);

  const details = [
    settings?.address && { icon: MapPin, label: "Address", value: settings.address },
    settings?.phone && { icon: Phone, label: "Phone", value: settings.phone, href: telHref(settings.phone) },
    settings?.email && { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    settings?.officeHours && { icon: Clock, label: "Office hours", value: settings.officeHours },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string; href?: string }[];

  return (
    <>
      <PageHero
        title={page?.title ?? "Contact"}
        eyebrow={page?.eyebrow}
        intro={page?.intro}
        breadcrumbs={[{ label: "Contact", href: "/contact" }]}
      />
      <div className="container-site grid gap-12 py-16 lg:grid-cols-[1fr_1.4fr] lg:gap-16 lg:py-24">
        <section aria-labelledby="contact-details">
          <h2 id="contact-details" className="text-3xl">
            Get in touch
          </h2>
          <ul className="mt-8 space-y-6">
            {details.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex gap-4">
                <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-card bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold tracking-wide text-muted uppercase">{label}</p>
                  <p className="mt-1 text-lg break-words">
                    {href ? (
                      <a href={href} className="hover:text-primary">
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="contact-form" className="rounded-card border border-border bg-surface p-6 sm:p-10">
          <h2 id="contact-form" className="text-3xl">
            Send a message
          </h2>
          <p className="mt-2 mb-8 text-muted">We usually reply within a few working days.</p>
          <ContactForm />
        </section>
      </div>
      {mapUrl && (
        <section aria-label="Map">
          <iframe
            src={mapUrl}
            title={`Map showing the location of ${settings?.schoolName ?? "the school"}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-[26rem] w-full border-0"
          />
        </section>
      )}
    </>
  );
}
