"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/cache-tags";
import { themeSchema } from "@/lib/theme";
import { mediaIdSchema, optionalText } from "@/lib/validation/common";
import { settingsSchema } from "@/lib/validation/settings";
import { adminAction } from "./_lib";

export async function saveSiteSettings(input: z.input<typeof settingsSchema>) {
  return adminAction(input, {
    permission: "settings.manage",
    schema: settingsSchema,
    tags: [TAGS.settings],
    run: async (data, admin) => {
      await db.siteSettings.update({ where: { id: 1 }, data });
      await audit(admin, { action: "settings.update", entity: "SiteSettings", entityId: "1", summary: "Updated site settings" });
    },
  });
}

const seoDefaultsSchema = z.object({
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
  ogImageId: mediaIdSchema,
});

export async function saveSeoDefaults(input: z.input<typeof seoDefaultsSchema>) {
  return adminAction(input, {
    permission: "settings.manage",
    schema: seoDefaultsSchema,
    tags: [TAGS.settings],
    run: async (data, admin) => {
      await db.siteSettings.update({ where: { id: 1 }, data });
      await audit(admin, { action: "seo.update", entity: "SiteSettings", entityId: "1", summary: "Updated default SEO settings" });
    },
  });
}

const themeFormSchema = themeSchema.extend({
  logoId: mediaIdSchema,
  footerLogoId: mediaIdSchema,
  faviconId: mediaIdSchema,
});

export async function saveTheme(input: z.input<typeof themeFormSchema>) {
  return adminAction(input, {
    permission: "theme.manage",
    schema: themeFormSchema,
    tags: [TAGS.theme, TAGS.settings],
    run: async ({ logoId, footerLogoId, faviconId, ...theme }, admin) => {
      await db.$transaction([
        db.themeSettings.update({ where: { id: 1 }, data: theme }),
        db.siteSettings.update({ where: { id: 1 }, data: { logoId, footerLogoId, faviconId } }),
      ]);
      await audit(admin, { action: "theme.update", entity: "ThemeSettings", entityId: "1", summary: "Changed the website theme", metadata: theme });
    },
  });
}
