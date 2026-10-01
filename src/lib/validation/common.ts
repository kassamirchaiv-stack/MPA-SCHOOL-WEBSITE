import { z } from "zod";

/** Shared field rules for admin forms (used on both client and server). */

export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

export const requiredText = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} is required`).max(max, `Keep this under ${max} characters`);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Web address is required")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens only");

/** Site-relative path, http(s), mailto or tel. */
export const linkSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || (/^\/(?!\/)/.test(v) || /^#/.test(v) || /^(https?:\/\/|mailto:|tel:)/i.test(v)), {
    message: "Use a page path like /admissions or a full https:// link",
  })
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .transform((v) => v ?? null);

export const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const mediaIdSchema = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .transform((v) => v ?? null);

/** Tiptap JSON document (structure is validated loosely; rendering is whitelisted). */
export const richTextSchema = z
  .object({ type: z.literal("doc"), content: z.array(z.unknown()).optional() })
  .passthrough()
  .nullable()
  .optional()
  .transform((v) => v ?? null);

/** ISO date-time string or empty. */
export const optionalDateSchema = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .refine((v) => v == null || !Number.isNaN(Date.parse(v)), "Enter a valid date")
  .transform((v) => (v ? new Date(v) : null));

export const seoFields = {
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
};
