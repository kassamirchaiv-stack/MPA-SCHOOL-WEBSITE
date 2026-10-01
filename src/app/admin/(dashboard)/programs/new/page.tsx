import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/page-header";
import { ProgramForm } from "../program-form";

export const metadata: Metadata = { title: "New program" };

export default async function NewProgramPage() {
  await requireAdminPage("content.manage");
  return (
    <>
      <PageHeader title="New program" breadcrumbs={[{ label: "Programs", href: "/admin/programs" }, { label: "New program" }]} />
      <ProgramForm
        defaults={{
          title: "",
          slug: "",
          shortDescription: "",
          description: null,
          gradeRange: "",
          category: "",
          imageId: "",
          featured: false,
          status: "DRAFT",
          publishedAt: "",
          seoTitle: "",
          seoDescription: "",
        }}
      />
    </>
  );
}
