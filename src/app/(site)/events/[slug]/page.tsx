import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getEvent, getEventSlugs } from "@/server/queries/events";
import { getSiteSettings } from "@/server/queries/site";
import { PLACEHOLDER_SLUG, staticParamsOrPlaceholder } from "@/server/queries/content";
import { absoluteUrl, buildMetadata, truncate } from "@/lib/seo";
import { mediaUrl } from "@/lib/media";
import { EventView } from "@/components/public/event-view";
import { JsonLd } from "@/components/public/json-ld";
import { DetailSkeleton } from "@/components/public/skeletons";

export async function generateStaticParams() {
  return staticParamsOrPlaceholder(await getEventSlugs());
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = slug === PLACEHOLDER_SLUG ? null : await getEvent(slug);
  if (!event) return { title: "Event not found", robots: { index: false } };
  return buildMetadata({
    title: event.seoTitle || event.title,
    description: event.seoDescription || truncate(event.excerpt),
    path: `/events/${event.slug}`,
    image: event.image,
  });
}

export default function EventPage({ params }: PageProps<"/events/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <EventDetail params={params} />
    </Suspense>
  );
}

async function EventDetail({ params }: Pick<PageProps<"/events/[slug]">, "params">) {
  const { slug } = await params;
  const event = slug === PLACEHOLDER_SLUG ? null : await getEvent(slug);
  if (!event) notFound();
  const settings = await getSiteSettings();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: event.title,
          description: event.excerpt ?? undefined,
          startDate: event.startsAt.toISOString(),
          endDate: event.endsAt?.toISOString(),
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          location: { "@type": "Place", name: event.location || settings?.schoolName, address: settings?.address ?? undefined },
          image: event.image ? [mediaUrl(event.image)] : undefined,
          organizer: { "@type": "EducationalOrganization", name: settings?.schoolName, url: absoluteUrl("/") },
          url: absoluteUrl(`/events/${event.slug}`),
        }}
      />
      <EventView event={event} />
      <div className="container-site pb-16">
        <Link href="/events" className="inline-flex items-center gap-2 font-semibold text-primary">
          <ArrowLeft aria-hidden className="size-4" /> All events
        </Link>
      </div>
    </>
  );
}
