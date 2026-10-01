import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { parseSocialLinks } from "@/lib/social";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Site settings" };

export default async function SettingsPage() {
  await requireAdminPage("settings.manage");
  const s = await db.siteSettings.findUniqueOrThrow({ where: { id: 1 } });
  return (
    <>
      <PageHeader title="Site settings" description="School details used across the whole website: header, footer, contact page and search results." />
      <SettingsForm
        defaults={{
          schoolName: s.schoolName,
          shortName: s.shortName,
          tagline: s.tagline ?? "",
          description: s.description ?? "",
          foundedYear: s.foundedYear ?? "",
          vision: s.vision ?? "",
          mission: s.mission ?? "",
          coreValues: s.coreValues,
          phone: s.phone ?? "",
          email: s.email ?? "",
          address: s.address ?? "",
          mapEmbedUrl: s.mapEmbedUrl ?? "",
          officeHours: s.officeHours ?? "",
          socialLinks: parseSocialLinks(s.socialLinks),
          copyright: s.copyright ?? "",
          headerCtaLabel: s.headerCtaLabel ?? "",
          headerCtaUrl: s.headerCtaUrl ?? "",
        }}
      />
    </>
  );
}
