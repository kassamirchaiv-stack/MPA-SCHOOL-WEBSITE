import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { toLocalInput } from "@/lib/datetime";
import { summarizeOrNull } from "@/lib/media-summary";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/ui";
import { ProgramForm } from "../program-form";

export const metadata: Metadata = { title: "Edit program" };

export default async function EditProgramPage({ params }: PageProps<"/admin/programs/[id]">) {
  await requireAdminPage("content.manage");
  const { id } = await params;
  const program = await db.program.findUnique({ where: { id }, include: { image: true } });
  if (!program) notFound();

  return (
    <>
      <PageHeader
        title={program.title}
        breadcrumbs={[{ label: "Programs", href: "/admin/programs" }, { label: "Edit program" }]}
        actions={<StatusBadge status={program.status} />}
      />
      <ProgramForm
        image={summarizeOrNull(program.image)}
        defaults={{
          id: program.id,
          title: program.title,
          slug: program.slug,
          shortDescription: program.shortDescription ?? "",
          description: program.description as never,
          gradeRange: program.gradeRange ?? "",
          category: program.category ?? "",
          imageId: program.imageId ?? "",
          featured: program.featured,
          status: program.status,
          publishedAt: toLocalInput(program.publishedAt),
          seoTitle: program.seoTitle ?? "",
          seoDescription: program.seoDescription ?? "",
        }}
      />
    </>
  );
}
