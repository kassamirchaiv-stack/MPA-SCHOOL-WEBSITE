import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import type { MediaRef } from "@/lib/media";
import { formatEventWhen } from "@/lib/format";
import { safeHref } from "@/lib/utils";
import { CmsImage } from "@/components/ui/cms-image";
import { PageHero } from "./page-hero";
import { RichText, hasRichText } from "./rich-text";

export type EventViewData = {
  title: string;
  slug: string;
  excerpt: string | null;
  description: unknown;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  location: string | null;
  registrationUrl: string | null;
  image: MediaRef | null;
};

/** Event detail in the public design; shared by /events/[slug] and the admin preview. */
export function EventView({ event }: { event: EventViewData }) {
  const registration = safeHref(event.registrationUrl);
  return (
    <>
      <PageHero
        title={event.title}
        eyebrow="Event"
        intro={event.excerpt}
        breadcrumbs={[
          { label: "Events", href: "/events" },
          { label: event.title, href: `/events/${event.slug}` },
        ]}
      />
      <div className="container-site grid gap-12 py-16 lg:grid-cols-[2fr_1fr] lg:py-20">
        <div className="space-y-10">
          {event.image && <CmsImage media={event.image} sizes="(min-width: 1024px) 60vw, 100vw" priority className="aspect-[16/9] rounded-card" />}
          {hasRichText(event.description) && <RichText content={event.description} className="text-lg" />}
        </div>
        <aside aria-label="Event details" className="h-fit space-y-5 rounded-card border border-border bg-surface p-7 lg:sticky lg:top-28">
          <div className="flex gap-3">
            <CalendarDays aria-hidden className="mt-1 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-bold tracking-wide text-muted uppercase">When</p>
              <p className="mt-1">
                <time dateTime={event.startsAt.toISOString()}>{formatEventWhen(event)}</time>
              </p>
            </div>
          </div>
          {event.location && (
            <div className="flex gap-3">
              <MapPin aria-hidden className="mt-1 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-bold tracking-wide text-muted uppercase">Where</p>
                <p className="mt-1">{event.location}</p>
              </div>
            </div>
          )}
          {registration && (
            <a href={registration} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
              Register <ExternalLink aria-hidden className="size-4" />
            </a>
          )}
        </aside>
      </div>
    </>
  );
}
