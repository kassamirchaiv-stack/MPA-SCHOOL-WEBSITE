import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getProgram, getProgramSlugs, PLACEHOLDER_SLUG, staticParamsOrPlaceholder } from "@/server/queries/content";
import { getPublishedPrograms } from "@/server/queries/programs";
import { buildMetadata, truncate } from "@/lib/seo";
import { PageHero } from "@/components/public/page-hero";
import { RichText, hasRichText } from "@/components/public/rich-text";
import { CtaBand } from "@/components/public/blocks";
import { ProgramCard } from "@/components/public/cards";
import { DetailSkeleton } from "@/components/public/skeletons";

export async function generateStaticParams() {
  return staticParamsOrPlaceholder(await getProgramSlugs());
}

export async function generateMetadata({ params }: PageProps<"/programs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const program = slug === PLACEHOLDER_SLUG ? null : await getProgram(slug);
  if (!program) return { title: "Programme not found", robots: { index: false } };
  return buildMetadata({
    title: program.seoTitle || program.title,
    description: program.seoDescription || truncate(program.shortDescription),
    path: `/programs/${program.slug}`,
    image: program.image,
  });
}

export default function ProgramPage({ params }: PageProps<"/programs/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProgramDetail params={params} />
    </Suspense>
  );
}

async function ProgramDetail({ params }: Pick<PageProps<"/programs/[slug]">, "params">) {
  const { slug } = await params;
  const program = slug === PLACEHOLDER_SLUG ? null : await getProgram(slug);
  if (!program) notFound();
  const others = (await getPublishedPrograms()).filter((p) => p.id !== program.id).slice(0, 3);

  return (
    <>
      <PageHero
        title={program.title}
        eyebrow={program.gradeRange ?? program.category}
        intro={program.shortDescription}
        image={program.image}
        breadcrumbs={[
          { label: "Programs", href: "/programs" },
          { label: program.title, href: `/programs/${program.slug}` },
        ]}
      />
      <section className="py-16 lg:py-24">
        <div className="container-site">
          {hasRichText(program.description) && <RichText content={program.description} className="text-lg" />}
          <Link href="/programs" className="mt-12 inline-flex items-center gap-2 font-semibold text-primary">
            <ArrowLeft aria-hidden className="size-4" /> All programmes
          </Link>
        </div>
      </section>
      {others.length > 0 && (
        <section aria-labelledby="other-programs" className="bg-surface py-16 lg:py-24">
          <div className="container-site">
            <h2 id="other-programs" className="mb-10 text-3xl">
              Other programmes
            </h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((p) => (
                <li key={p.id}>
                  <ProgramCard program={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <CtaBand
        title="Interested in joining MPA?"
        description="Contact the registrar office for placement, documentation and fee guidance."
        primary={{ label: "Admissions", href: "/admissions" }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </>
  );
}
