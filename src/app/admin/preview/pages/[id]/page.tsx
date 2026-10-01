import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { mediaSelect } from "@/lib/media";
import { PageHero } from "@/components/public/page-hero";
import { RichText } from "@/components/public/rich-text";
import { pagePath } from "@/lib/pages";

export default async function PreviewPage({ params }: PageProps<"/admin/preview/pages/[id]">) {
  await requireAdminPage("content.manage");
  const { id } = await params;
  const page = await db.page.findUnique({ where: { id }, include: { heroImage: { select: mediaSelect } } });
  if (!page) notFound();
  return (
    <>
      <PageHero
        title={page.title}
        eyebrow={page.eyebrow}
        intro={page.intro}
        image={page.heroImage}
        breadcrumbs={[{ label: page.title, href: pagePath(page.slug) }]}
      />
      <section className="py-16 lg:py-24">
        <div className="container-site">
          <RichText content={page.content} className="text-lg" />
        </div>
      </section>
    </>
  );
}
