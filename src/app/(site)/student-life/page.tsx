import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getHighlights, getPage } from "@/server/queries/content";
import { getUpcomingEvents } from "@/server/queries/events";
import { pageMetadata } from "@/server/page-meta";
import { PageHero } from "@/components/public/page-hero";
import { FeatureList } from "@/components/public/blocks";
import { EventCard } from "@/components/public/cards";
import { EmptyState } from "@/components/public/empty-state";
import { RichText, hasRichText } from "@/components/public/rich-text";
import { SectionHeader } from "@/components/public/section-header";

export const generateMetadata = () => pageMetadata("student-life", "/student-life", "Student Life");

export default async function StudentLifePage() {
  const [page, areas, events] = await Promise.all([getPage("student-life"), getHighlights("STUDENT_LIFE"), getUpcomingEvents(4)]);
  return (
    <>
      <PageHero
        title={page?.title ?? "Student Life"}
        eyebrow={page?.eyebrow}
        intro={page?.intro}
        image={page?.heroImage}
        breadcrumbs={[{ label: "Student Life", href: "/student-life" }]}
      />
      <section className="py-16 lg:py-24">
        <div className="container-site space-y-14">
          {page && hasRichText(page.content) && <RichText content={page.content} className="text-lg" />}
          {areas.length > 0 ? <FeatureList items={areas} /> : <EmptyState icon={Sparkles} title="More about student life is coming soon" />}
          <p className="flex flex-wrap gap-x-8 gap-y-3">
            <Link href="/gallery" className="inline-flex items-center gap-2 font-semibold text-primary">
              Photo gallery <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link href="/news" className="inline-flex items-center gap-2 font-semibold text-primary">
              School news <ArrowRight aria-hidden className="size-4" />
            </Link>
          </p>
        </div>
      </section>
      {events.length > 0 && (
        <section aria-labelledby="life-events" className="bg-surface py-16 lg:py-24">
          <div className="container-site">
            <SectionHeader id="life-events" eyebrow="Events" title="Coming up" action={{ label: "All events", href: "/events" }} />
            <ul className="grid gap-5 lg:grid-cols-2">
              {events.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
