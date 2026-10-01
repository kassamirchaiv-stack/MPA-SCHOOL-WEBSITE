import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { DEFAULT_THEME } from "@/lib/theme";
import { summarizeOrNull } from "@/lib/media-summary";
import { PageHeader } from "@/components/admin/page-header";
import { ThemeForm } from "./theme-form";

export const metadata: Metadata = { title: "Theme" };

export default async function ThemePage() {
  await requireAdminPage("theme.manage");
  const [theme, settings] = await Promise.all([
    db.themeSettings.findUnique({ where: { id: 1 } }),
    db.siteSettings.findUniqueOrThrow({ where: { id: 1 }, include: { logo: true, footerLogo: true, favicon: true } }),
  ]);
  const t = theme ?? { ...DEFAULT_THEME };
  return (
    <>
      <PageHeader title="Theme" description="Colours, shapes and logos of the public website. Changes apply immediately after saving." />
      <ThemeForm
        schoolName={settings.schoolName}
        tagline={settings.tagline ?? ""}
        logos={{ logo: summarizeOrNull(settings.logo), footerLogo: summarizeOrNull(settings.footerLogo), favicon: summarizeOrNull(settings.favicon) }}
        defaults={{
          colorPrimary: t.colorPrimary,
          colorSecondary: t.colorSecondary,
          colorAccent: t.colorAccent,
          colorBackground: t.colorBackground,
          colorSurface: t.colorSurface,
          colorText: t.colorText,
          colorMuted: t.colorMuted,
          colorBorder: t.colorBorder,
          radius: t.radius,
          buttonStyle: t.buttonStyle,
          logoId: settings.logoId ?? "",
          footerLogoId: settings.footerLogoId ?? "",
          faviconId: settings.faviconId ?? "",
        }}
      />
    </>
  );
}
