import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { mediaSelect } from "@/lib/media";
import { PageHero } from "@/components/public/page-hero";
import { RichText } from "@/components/public/rich-text";

export default async function PreviewProgram({ params }: PageProps<"/admin/preview/programs/[id]">) {
  await requireAdminPage("content.manage");
  const { id } = await params;
  const program = await db.program.findUnique({ where: { id }, include: { image: { select: mediaSelect } } });
  if (!program) notFound();
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
          <RichText content={program.description} className="text-lg" />
        </div>
      </section>
    </>
  );
}
