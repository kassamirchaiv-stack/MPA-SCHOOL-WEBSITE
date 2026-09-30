import { CalendarDays } from "lucide-react";
import { getPage } from "@/server/queries/content";
import { getPastEvents, getUpcomingEvents } from "@/server/queries/events";
import { pageMetadata } from "@/server/page-meta";
import { PageHero } from "@/components/public/page-hero";
import { EventCard } from "@/components/public/cards";
import { EmptyState } from "@/components/public/empty-state";
import { SectionHeader } from "@/components/public/section-header";

export const generateMetadata = () => pageMetadata("events", "/events", "Events");

export default async function EventsPage() {
  const [page, upcoming, past] = await Promise.all([getPage("events"), getUpcomingEvents(), getPastEvents(8)]);
  return (
    <>
      <PageHero
        title={page?.title ?? "Events"}
        eyebrow={page?.eyebrow}
        intro={page?.intro}
        breadcrumbs={[{ label: "Events", href: "/events" }]}
      />
      <div className="container-site space-y-20 py-16 lg:py-24">
        <section aria-labelledby="upcoming">
          <SectionHeader id="upcoming" title="Upcoming events" />
          {upcoming.length > 0 ? (
            <ul className="grid gap-5 lg:grid-cols-2">
              {upcoming.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CalendarDays} title="No upcoming events right now" description="Please check back soon." />
          )}
        </section>
        {past.length > 0 && (
          <section aria-labelledby="past">
            <SectionHeader id="past" title="Past events" />
            <ul className="grid gap-5 opacity-90 lg:grid-cols-2">
              {past.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
