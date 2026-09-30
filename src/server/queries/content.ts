import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { HighlightGroup } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";
import { mediaSelect } from "@/lib/media";
import { publishedWhere } from "./published";

/** Placeholder param so Cache Components can validate a dynamic route with no content yet. */
export const PLACEHOLDER_SLUG = "__placeholder__";

export function staticParamsOrPlaceholder(slugs: { slug: string }[]) {
  return slugs.length > 0 ? slugs : [{ slug: PLACEHOLDER_SLUG }];
}

// ─── Pages ────────────────────────────────────────────────────────────────────

export async function getPage(slug: string) {
  "use cache";
  cacheTag(TAGS.pages, TAGS.media);
  cacheLife("max");
  return db.page.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { heroImage: { select: mediaSelect }, ogImage: { select: mediaSelect } },
  });
}

export type PageData = NonNullable<Awaited<ReturnType<typeof getPage>>>;

// ─── Homepage building blocks ─────────────────────────────────────────────────

export async function getHomepageSections() {
  "use cache";
  cacheTag(TAGS.homepage, TAGS.media);
  cacheLife("max");
  return db.homepageSection.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
    include: { image: { select: mediaSelect } },
  });
}

export type HomepageSectionData = Awaited<ReturnType<typeof getHomepageSections>>[number];

export async function getHeroSlides() {
  "use cache";
  cacheTag(TAGS.homepage, TAGS.media);
  cacheLife("max");
  return db.heroSlide.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
    include: { image: { select: mediaSelect } },
  });
}

export type HeroSlideData = Awaited<ReturnType<typeof getHeroSlides>>[number];

export async function getStatistics() {
  "use cache";
  cacheTag(TAGS.statistics);
  cacheLife("max");
  return db.statistic.findMany({ where: { visible: true }, orderBy: { sortOrder: "asc" } });
}

export async function getHighlights(group: HighlightGroup) {
  "use cache";
  cacheTag(TAGS.highlights, TAGS.media);
  cacheLife("max");
  return db.highlight.findMany({
    where: { group, visible: true },
    orderBy: { sortOrder: "asc" },
    include: { image: { select: mediaSelect } },
  });
}

export type HighlightData = Awaited<ReturnType<typeof getHighlights>>[number];

// ─── Programs ─────────────────────────────────────────────────────────────────

export async function getProgram(slug: string) {
  "use cache";
  cacheTag(TAGS.programs, TAGS.media);
  cacheLife("hours");
  return db.program.findFirst({
    where: { slug, ...publishedWhere() },
    include: { image: { select: mediaSelect } },
  });
}

export async function getProgramSlugs() {
  "use cache";
  cacheTag(TAGS.programs);
  cacheLife("hours");
  return db.program.findMany({ where: publishedWhere(), select: { slug: true } });
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export async function getPublishedStaff() {
  "use cache";
  cacheTag(TAGS.staff, TAGS.media);
  cacheLife("max");
  return db.staffMember.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { photo: { select: mediaSelect } },
  });
}

export type StaffData = Awaited<ReturnType<typeof getPublishedStaff>>[number];

// ─── FAQs ─────────────────────────────────────────────────────────────────────

export async function getPublishedFaqs() {
  "use cache";
  cacheTag(TAGS.faqs);
  cacheLife("max");
  return db.faq.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }],
    select: { id: true, question: true, answer: true, category: true },
  });
}

export type FaqData = Awaited<ReturnType<typeof getPublishedFaqs>>[number];
