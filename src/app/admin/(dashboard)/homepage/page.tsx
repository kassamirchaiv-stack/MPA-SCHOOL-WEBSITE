import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { summarizeOrNull } from "@/lib/media-summary";
import { PageHeader } from "@/components/admin/page-header";
import { HeroSlidesManager, SectionsManager } from "./homepage-manager";

export const metadata: Metadata = { title: "Homepage" };

export default async function AdminHomepagePage() {
  await requireAdminPage("content.manage");
  const [sections, slides] = await Promise.all([
    db.homepageSection.findMany({ orderBy: { sortOrder: "asc" }, include: { image: true } }),
    db.heroSlide.findMany({ orderBy: { sortOrder: "asc" }, include: { image: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Homepage"
        description="Choose which sections appear, in what order, and edit their headings. The items inside each section come from their own areas (Programs, News, Highlights…)."
      />
      <div className="space-y-10">
        <SectionsManager
          sections={sections.map((s) => ({
            id: s.id,
            key: s.key,
            enabled: s.enabled,
            eyebrow: s.eyebrow ?? "",
            title: s.title ?? "",
            subtitle: s.subtitle ?? "",
            description: s.description ?? "",
            imageId: s.imageId ?? "",
            ctaLabel: s.ctaLabel ?? "",
            ctaUrl: s.ctaUrl ?? "",
            secondaryCtaLabel: s.secondaryCtaLabel ?? "",
            secondaryCtaUrl: s.secondaryCtaUrl ?? "",
            itemLimit: s.itemLimit ?? "",
            image: summarizeOrNull(s.image),
          }))}
        />
        <HeroSlidesManager
          slides={slides.map((s) => ({
            id: s.id,
            eyebrow: s.eyebrow ?? "",
            title: s.title,
            subtitle: s.subtitle ?? "",
            description: s.description ?? "",
            imageId: s.imageId ?? "",
            primaryLabel: s.primaryLabel ?? "",
            primaryUrl: s.primaryUrl ?? "",
            secondaryLabel: s.secondaryLabel ?? "",
            secondaryUrl: s.secondaryUrl ?? "",
            enabled: s.enabled,
            image: summarizeOrNull(s.image),
          }))}
        />
      </div>
    </>
  );
}
