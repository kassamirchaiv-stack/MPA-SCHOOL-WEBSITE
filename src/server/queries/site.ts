import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";
import { mediaSelect } from "@/lib/media";

export async function getSiteSettings() {
  "use cache";
  cacheTag(TAGS.settings, TAGS.media);
  cacheLife("max");
  return db.siteSettings.findUnique({
    where: { id: 1 },
    include: {
      logo: { select: mediaSelect },
      footerLogo: { select: mediaSelect },
      favicon: { select: mediaSelect },
      ogImage: { select: mediaSelect },
    },
  });
}

export type SiteSettingsData = NonNullable<Awaited<ReturnType<typeof getSiteSettings>>>;

export async function getThemeSettings() {
  "use cache";
  cacheTag(TAGS.theme);
  cacheLife("max");
  return db.themeSettings.findUnique({ where: { id: 1 } });
}

export async function getNavigation(location: "HEADER" | "FOOTER" | "LEGAL") {
  "use cache";
  cacheTag(TAGS.navigation);
  cacheLife("max");
  return db.navigationItem.findMany({
    where: { location, enabled: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      label: true,
      href: true,
      isExternal: true,
      openInNewTab: true,
      children: {
        where: { enabled: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, label: true, href: true, isExternal: true, openInNewTab: true },
      },
    },
  });
}

export type NavItem = Awaited<ReturnType<typeof getNavigation>>[number];
