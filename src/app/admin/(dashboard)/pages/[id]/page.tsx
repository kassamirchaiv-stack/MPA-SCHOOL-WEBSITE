import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { SYSTEM_PAGES } from "@/lib/pages";
import { summarizeOrNull } from "@/lib/media-summary";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/ui";
import { PageForm } from "../page-form";

export const metadata: Metadata = { title: "Edit page" };

/** What else appears on built-in pages, so editors know where to change it. */
const NOTES: Record<string, string> = {
  about: "Vision, mission and core values are edited in Site Settings.",
  campuses: "The campus cards are edited in Highlights → Campuses.",
  leadership: "The people shown here are managed in Staff.",
  programs: "The program cards are managed in Programs.",
  "student-life": "The activity cards are edited in Highlights → Student life. Upcoming events appear automatically.",
  admissions: "The numbered steps are edited in Highlights → Admission steps. FAQs in the “Admissions” category appear below.",
  faq: "Questions and answers are managed in FAQs.",
  news: "Articles are managed in News.",
  events: "Events are managed in Events.",
  gallery: "Albums are managed in Gallery.",
  contact: "Address, phone, email, hours and the map are edited in Site Settings.",
};

export default async function EditPagePage({ params }: PageProps<"/admin/pages/[id]">) {
  await requireAdminPage("content.manage");
  const { id } = await params;
  const page = await db.page.findUnique({ where: { id }, include: { heroImage: true, ogImage: true } });
  if (!page) notFound();
  const system = SYSTEM_PAGES[page.slug];

  return (
    <>
      <PageHeader
        title={system?.label ?? page.title}
        breadcrumbs={[{ label: "Pages", href: "/admin/pages" }, { label: "Edit page" }]}
        actions={<StatusBadge status={page.status} />}
      />
      <PageForm
        systemPath={system?.path ?? null}
        note={NOTES[page.slug]}
        heroImage={summarizeOrNull(page.heroImage)}
        ogImage={summarizeOrNull(page.ogImage)}
        defaults={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          eyebrow: page.eyebrow ?? "",
          intro: page.intro ?? "",
          content: page.content as never,
          heroImageId: page.heroImageId ?? "",
          ogImageId: page.ogImageId ?? "",
          status: page.status,
          seoTitle: page.seoTitle ?? "",
          seoDescription: page.seoDescription ?? "",
        }}
      />
    </>
  );
}
