import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";
import { isSystemPage } from "@/lib/pages";
import { buildMetadata, truncate } from "@/lib/seo";
import { getPage, PLACEHOLDER_SLUG, staticParamsOrPlaceholder } from "@/server/queries/content";
import { PageHero } from "@/components/public/page-hero";
import { RichText } from "@/components/public/rich-text";
import { DetailSkeleton } from "@/components/public/skeletons";

/** Custom pages created in Admin → Pages are served at /<slug>. */

async function getCustomPageSlugs() {
  "use cache";
  cacheTag(TAGS.pages);
  cacheLife("hours");
  const pages = await db.page.findMany({ where: { status: "PUBLISHED" }, select: { slug: true } });
  return pages.filter((p) => !isSystemPage(p.slug));
}

async function getCustomPage(slug: string) {
  if (slug === PLACEHOLDER_SLUG || isSystemPage(slug)) return null;
  return getPage(slug);
}

export async function generateStaticParams() {
  return staticParamsOrPlaceholder(await getCustomPageSlugs());
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCustomPage(slug);
  if (!page) return { title: "Page not found", robots: { index: false } };
  return buildMetadata({
    title: page.seoTitle || page.title,
    description: page.seoDescription || truncate(page.intro),
    path: `/${page.slug}`,
    image: page.ogImage ?? page.heroImage,
  });
}

export default function CustomPage({ params }: PageProps<"/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <CustomPageContent params={params} />
    </Suspense>
  );
}

async function CustomPageContent({ params }: Pick<PageProps<"/[slug]">, "params">) {
  const { slug } = await params;
  const page = await getCustomPage(slug);
  if (!page) notFound();
  return (
    <>
      <PageHero
        title={page.title}
        eyebrow={page.eyebrow}
        intro={page.intro}
        image={page.heroImage}
        breadcrumbs={[{ label: page.title, href: `/${page.slug}` }]}
      />
      <section className="py-16 lg:py-24">
        <div className="container-site">
          <RichText content={page.content} className="text-lg" />
        </div>
      </section>
    </>
  );
}
