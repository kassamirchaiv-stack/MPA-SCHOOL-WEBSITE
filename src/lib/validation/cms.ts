import { z } from "zod";
import {
  linkSchema,
  mediaIdSchema,
  optionalDateSchema,
  optionalText,
  requiredText,
  richTextSchema,
  seoFields,
  slugSchema,
  statusSchema,
} from "./common";

/**
 * Schemas for admin forms. Forms validate the raw values in the browser
 * (zodResolver with `raw: true`) and the server actions parse them again.
 */

const optionalId = z
  .string()
  .optional()
  .transform((v) => (v ? v : undefined));

export const articleSchema = z.object({
  id: optionalId,
  title: requiredText("Title", 200),
  slug: slugSchema,
  excerpt: optionalText(400),
  content: richTextSchema,
  categoryId: mediaIdSchema,
  tags: z
    .string()
    .max(300)
    .optional()
    .transform((v) =>
      [...new Set((v ?? "").split(",").map((t) => t.trim()).filter(Boolean))].slice(0, 12),
    ),
  authorName: optionalText(120),
  imageId: mediaIdSchema,
  featured: z.boolean().default(false),
  status: statusSchema,
  publishedAt: optionalDateSchema,
  ...seoFields,
});
export type ArticleFormValues = z.input<typeof articleSchema>;

export const categorySchema = z.object({
  id: optionalId,
  name: requiredText("Name", 80),
  slug: slugSchema,
  description: optionalText(300),
});
export type CategoryFormValues = z.input<typeof categorySchema>;

export const eventSchema = z
  .object({
    id: optionalId,
    title: requiredText("Title", 200),
    slug: slugSchema,
    excerpt: optionalText(400),
    description: richTextSchema,
    startsAt: z
      .string()
      .min(1, "Start date is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
      .transform((v) => new Date(v)),
    endsAt: optionalDateSchema,
    allDay: z.boolean().default(false),
    location: optionalText(200),
    registrationUrl: linkSchema,
    imageId: mediaIdSchema,
    featured: z.boolean().default(false),
    status: statusSchema,
    ...seoFields,
  })
  .refine((e) => !e.endsAt || e.endsAt >= e.startsAt, { message: "The end must be after the start", path: ["endsAt"] });
export type EventFormValues = z.input<typeof eventSchema>;

export const programSchema = z.object({
  id: optionalId,
  title: requiredText("Title", 160),
  slug: slugSchema,
  shortDescription: optionalText(300),
  description: richTextSchema,
  gradeRange: optionalText(80),
  category: optionalText(80),
  imageId: mediaIdSchema,
  featured: z.boolean().default(false),
  status: statusSchema,
  publishedAt: optionalDateSchema,
  ...seoFields,
});
export type ProgramFormValues = z.input<typeof programSchema>;

export const albumSchema = z.object({
  id: optionalId,
  title: requiredText("Title", 160),
  slug: slugSchema,
  description: optionalText(600),
  category: optionalText(80),
  date: optionalDateSchema,
  coverImageId: mediaIdSchema,
  featured: z.boolean().default(false),
  status: statusSchema,
});
export type AlbumFormValues = z.input<typeof albumSchema>;

export const staffSchema = z.object({
  id: optionalId,
  name: requiredText("Name", 120),
  position: requiredText("Position", 120),
  department: optionalText(120),
  biography: optionalText(1500),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email")
    .transform((v) => (v === "" ? null : v.toLowerCase()))
    .optional()
    .transform((v) => v ?? null),
  phone: optionalText(40),
  photoId: mediaIdSchema,
  featured: z.boolean().default(false),
  status: statusSchema,
});
export type StaffFormValues = z.input<typeof staffSchema>;

export const faqSchema = z.object({
  id: optionalId,
  question: requiredText("Question", 300),
  answer: requiredText("Answer", 3000),
  category: optionalText(80),
  status: statusSchema,
});
export type FaqFormValues = z.input<typeof faqSchema>;

export const pageSchema = z.object({
  id: optionalId,
  title: requiredText("Title", 160),
  slug: slugSchema,
  eyebrow: optionalText(80),
  intro: optionalText(600),
  content: richTextSchema,
  heroImageId: mediaIdSchema,
  ogImageId: mediaIdSchema,
  status: statusSchema,
  ...seoFields,
});
export type PageFormValues = z.input<typeof pageSchema>;

export const heroSlideSchema = z.object({
  id: optionalId,
  eyebrow: optionalText(80),
  title: requiredText("Title", 120),
  subtitle: optionalText(160),
  description: optionalText(400),
  imageId: mediaIdSchema,
  primaryLabel: optionalText(40),
  primaryUrl: linkSchema,
  secondaryLabel: optionalText(40),
  secondaryUrl: linkSchema,
  enabled: z.boolean().default(true),
});
export type HeroSlideFormValues = z.input<typeof heroSlideSchema>;

export const homepageSectionSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
  eyebrow: optionalText(80),
  title: optionalText(160),
  subtitle: optionalText(200),
  description: optionalText(800),
  imageId: mediaIdSchema,
  ctaLabel: optionalText(40),
  ctaUrl: linkSchema,
  secondaryCtaLabel: optionalText(40),
  secondaryCtaUrl: linkSchema,
  itemLimit: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number({ error: "Enter a number" }).int().min(1, "At least 1").max(12, "At most 12").nullable(),
  ),
});
export type HomepageSectionFormValues = z.input<typeof homepageSectionSchema>;

export const HIGHLIGHT_GROUPS = ["WHY_MPA", "STUDENT_LIFE", "ADMISSION_STEP", "CAMPUS"] as const;

export const highlightSchema = z.object({
  id: optionalId,
  group: z.enum(HIGHLIGHT_GROUPS),
  title: requiredText("Title", 120),
  subtitle: optionalText(120),
  text: optionalText(600),
  icon: optionalText(40),
  href: linkSchema,
  imageId: mediaIdSchema,
  visible: z.boolean().default(true),
});
export type HighlightFormValues = z.input<typeof highlightSchema>;

export const statisticSchema = z.object({
  id: optionalId,
  value: requiredText("Number", 30),
  label: requiredText("Label", 80),
  description: optionalText(200),
  icon: optionalText(40),
  visible: z.boolean().default(true),
});
export type StatisticFormValues = z.input<typeof statisticSchema>;

export const navItemSchema = z.object({
  id: optionalId,
  location: z.enum(["HEADER", "FOOTER", "LEGAL"]),
  label: requiredText("Label", 60),
  href: linkSchema,
  parentId: mediaIdSchema,
  isExternal: z.boolean().default(false),
  openInNewTab: z.boolean().default(false),
  enabled: z.boolean().default(true),
});
export type NavItemFormValues = z.input<typeof navItemSchema>;
