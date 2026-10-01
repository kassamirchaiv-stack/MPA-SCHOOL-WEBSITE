import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/page-header";
import { PageForm } from "../page-form";

export const metadata: Metadata = { title: "New page" };

export default async function NewPagePage() {
  await requireAdminPage("content.manage");
  return (
    <>
      <PageHeader title="New page" breadcrumbs={[{ label: "Pages", href: "/admin/pages" }, { label: "New page" }]} />
      <PageForm
        systemPath={null}
        note="New pages are published at their own address. To show one in the menu, add it in Navigation."
        defaults={{ title: "", slug: "", eyebrow: "", intro: "", content: null, heroImageId: "", ogImageId: "", status: "DRAFT", seoTitle: "", seoDescription: "" }}
      />
    </>
  );
}
