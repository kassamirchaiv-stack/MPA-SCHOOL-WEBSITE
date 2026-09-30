import { GraduationCap } from "lucide-react";
import { getPage } from "@/server/queries/content";
import { getPublishedPrograms } from "@/server/queries/programs";
import { pageMetadata } from "@/server/page-meta";
import { PageHero } from "@/components/public/page-hero";
import { ProgramCard } from "@/components/public/cards";
import { EmptyState } from "@/components/public/empty-state";
import { RichText, hasRichText } from "@/components/public/rich-text";

export const generateMetadata = () => pageMetadata("programs", "/programs", "Academic Programmes");

export default async function ProgramsPage() {
  const [page, programs] = await Promise.all([getPage("programs"), getPublishedPrograms()]);
  return (
    <>
      <PageHero
        title={page?.title ?? "Academic Programmes"}
        eyebrow={page?.eyebrow}
        intro={page?.intro}
        image={page?.heroImage}
        breadcrumbs={[{ label: "Programs", href: "/programs" }]}
      />
      <section className="py-16 lg:py-24">
        <div className="container-site space-y-14">
          {page && hasRichText(page.content) && <RichText content={page.content} />}
          {programs.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <li key={program.id}>
                  <ProgramCard program={program} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={GraduationCap} title="Programme information is coming soon" />
          )}
        </div>
      </section>
    </>
  );
}
