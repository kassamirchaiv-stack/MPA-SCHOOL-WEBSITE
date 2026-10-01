"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/cache-tags";
import { heroSlideSchema, highlightSchema, homepageSectionSchema, statisticSchema } from "@/lib/validation/cms";
import { adminAction, idSchema } from "./_lib";
import { nextSortOrder } from "./_content";

// ─── Homepage sections ────────────────────────────────────────────────────────

export async function saveHomepageSection(input: z.input<typeof homepageSectionSchema>) {
  return adminAction(input, {
    permission: "content.manage",
    schema: homepageSectionSchema,
    tags: [TAGS.homepage],
    run: async ({ id, ...data }, admin) => {
      const section = await db.homepageSection.update({ where: { id }, data });
      await audit(admin, { action: "homepage.update", entity: "HomepageSection", entityId: id, summary: `Updated homepage section ${section.key}` });
    },
  });
}

export async function toggleHomepageSection(input: { id: string; enabled: boolean }) {
  return adminAction(input, {
    permission: "content.manage",
    schema: z.object({ id: z.string().min(1), enabled: z.boolean() }),
    tags: [TAGS.homepage],
    run: async ({ id, enabled }, admin) => {
      const section = await db.homepageSection.update({ where: { id }, data: { enabled } });
      await audit(admin, { action: "homepage.toggle", entity: "HomepageSection", entityId: id, summary: `${enabled ? "Showed" : "Hid"} homepage section ${section.key}` });
    },
  });
}

// ─── Hero slides ──────────────────────────────────────────────────────────────

export async function saveHeroSlide(input: z.input<typeof heroSlideSchema>) {
  return adminAction(input, {
    permission: "content.manage",
    schema: heroSlideSchema,
    tags: [TAGS.homepage],
    run: async ({ id, ...data }, admin) => {
      const slide = id
        ? await db.heroSlide.update({ where: { id }, data })
        : await db.heroSlide.create({ data: { ...data, sortOrder: await nextSortOrder("heroSlide") } });
      await audit(admin, { action: id ? "hero.update" : "hero.create", entity: "HeroSlide", entityId: slide.id, summary: `${id ? "Updated" : "Added"} hero slide “${slide.title}”` });
    },
  });
}

export async function deleteHeroSlide(input: { id: string }) {
  return adminAction(input, {
    permission: "content.manage",
    schema: idSchema,
    tags: [TAGS.homepage],
    run: async ({ id }, admin) => {
      const slide = await db.heroSlide.delete({ where: { id } });
      await audit(admin, { action: "hero.delete", entity: "HeroSlide", entityId: id, summary: `Deleted hero slide “${slide.title}”` });
    },
  });
}

// ─── Highlights ───────────────────────────────────────────────────────────────

export async function saveHighlight(input: z.input<typeof highlightSchema>) {
  return adminAction(input, {
    permission: "content.manage",
    schema: highlightSchema,
    tags: [TAGS.highlights],
    run: async ({ id, ...data }, admin) => {
      const item = id
        ? await db.highlight.update({ where: { id }, data })
        : await db.highlight.create({ data: { ...data, sortOrder: await nextSortOrder("highlight", { group: data.group }) } });
      await audit(admin, { action: id ? "highlight.update" : "highlight.create", entity: "Highlight", entityId: item.id, summary: `${id ? "Updated" : "Added"} “${item.title}”` });
    },
  });
}

export async function deleteHighlight(input: { id: string }) {
  return adminAction(input, {
    permission: "content.manage",
    schema: idSchema,
    tags: [TAGS.highlights],
    run: async ({ id }, admin) => {
      const item = await db.highlight.delete({ where: { id } });
      await audit(admin, { action: "highlight.delete", entity: "Highlight", entityId: id, summary: `Deleted “${item.title}”` });
    },
  });
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export async function saveStatistic(input: z.input<typeof statisticSchema>) {
  return adminAction(input, {
    permission: "content.manage",
    schema: statisticSchema,
    tags: [TAGS.statistics],
    run: async ({ id, ...data }, admin) => {
      const stat = id
        ? await db.statistic.update({ where: { id }, data })
        : await db.statistic.create({ data: { ...data, sortOrder: await nextSortOrder("statistic") } });
      await audit(admin, { action: id ? "statistic.update" : "statistic.create", entity: "Statistic", entityId: stat.id, summary: `${id ? "Updated" : "Added"} statistic “${stat.label}”` });
    },
  });
}

export async function deleteStatistic(input: { id: string }) {
  return adminAction(input, {
    permission: "content.manage",
    schema: idSchema,
    tags: [TAGS.statistics],
    run: async ({ id }, admin) => {
      const stat = await db.statistic.delete({ where: { id } });
      await audit(admin, { action: "statistic.delete", entity: "Statistic", entityId: id, summary: `Deleted statistic “${stat.label}”` });
    },
  });
}
