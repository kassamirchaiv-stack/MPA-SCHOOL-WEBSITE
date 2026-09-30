import { MapPin } from "lucide-react";
import { getHighlights, getPage } from "@/server/queries/content";
import { pageMetadata } from "@/server/page-meta";
import { PageHero } from "@/components/public/page-hero";
import { FeatureList } from "@/components/public/blocks";
import { EmptyState } from "@/components/public/empty-state";
import { RichText, hasRichText } from "@/components/public/rich-text";

export const generateMetadata = () => pageMetadata("campuses", "/about/campuses", "Our Campuses");

export default async function CampusesPage() {
  const [page, campuses] = await Promise.all([getPage("campuses"), getHighlights("CAMPUS")]);
  return (
    <>
      <PageHero
        title={page?.title ?? "Our Campuses"}
        eyebrow={page?.eyebrow}
        intro={page?.intro}
        image={page?.heroImage}
        breadcrumbs={[
          { label: "About", href: "/about" },
          { label: page?.title ?? "Our Campuses", href: "/about/campuses" },
        ]}
      />
      <section className="py-16 lg:py-24">
        <div className="container-site space-y-14">
          {campuses.length > 0 ? (
            <FeatureList items={campuses} />
          ) : (
            <EmptyState icon={MapPin} title="Campus information is coming soon" />
          )}
          {page && hasRichText(page.content) && <RichText content={page.content} />}
        </div>
      </section>
    </>
  );
}
