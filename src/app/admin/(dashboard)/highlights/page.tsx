import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { summarizeOrNull } from "@/lib/media-summary";
import { HIGHLIGHT_GROUPS } from "@/lib/validation/cms";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { HighlightManager } from "./highlight-manager";

export const metadata: Metadata = { title: "Highlights" };

const GROUPS: Record<(typeof HIGHLIGHT_GROUPS)[number], { label: string; description: string }> = {
  WHY_MPA: { label: "Why MPA", description: "School strengths shown on the homepage. Keep them factual." },
  STUDENT_LIFE: { label: "Student life", description: "Activities and programmes shown on the homepage and Student Life page." },
  ADMISSION_STEP: { label: "Admission steps", description: "Numbered registration steps on the Admissions page, in order." },
  CAMPUS: { label: "Campuses", description: "Campus cards on the Our Campuses page. Use the subtitle for grades." },
};

export default async function HighlightsPage({ searchParams }: PageProps<"/admin/highlights">) {
  await requireAdminPage("content.manage");
  const sp = await searchParams;
  const group = HIGHLIGHT_GROUPS.includes(sp.group as never) ? (sp.group as (typeof HIGHLIGHT_GROUPS)[number]) : "WHY_MPA";
  const items = await db.highlight.findMany({ where: { group }, orderBy: { sortOrder: "asc" }, include: { image: true } });

  return (
    <>
      <PageHeader title="Highlights" description="Short repeatable items used in several places on the website." />
      <nav aria-label="Highlight groups" className="mb-6 flex flex-wrap gap-1 border-b border-zinc-200">
        {HIGHLIGHT_GROUPS.map((g) => (
          <Link
            key={g}
            href={`/admin/highlights?group=${g}`}
            aria-current={g === group ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
              g === group ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800",
            )}
          >
            {GROUPS[g].label}
          </Link>
        ))}
      </nav>
      <p className="mb-4 text-sm text-zinc-600">{GROUPS[group].description}</p>
      <HighlightManager
        key={group}
        group={group}
        groupLabel={GROUPS[group].label}
        items={items.map((h) => ({
          id: h.id,
          group: h.group,
          title: h.title,
          subtitle: h.subtitle ?? "",
          text: h.text ?? "",
          icon: h.icon ?? "",
          href: h.href ?? "",
          imageId: h.imageId ?? "",
          visible: h.visible,
          image: summarizeOrNull(h.image),
        }))}
      />
    </>
  );
}
