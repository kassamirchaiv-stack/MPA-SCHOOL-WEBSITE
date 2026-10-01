import { z } from "zod";
import { socialLinksSchema } from "@/lib/social";
import { linkSchema, optionalText, requiredText } from "./common";

export const settingsSchema = z.object({
  schoolName: requiredText("School name", 120),
  shortName: requiredText("Short name", 20),
  tagline: optionalText(120),
  description: optionalText(400),
  foundedYear: optionalText(30),
  vision: optionalText(600),
  mission: optionalText(1000),
  coreValues: z.array(z.string().trim().min(1).max(60)).max(16),
  phone: optionalText(40),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email")
    .transform((v) => (v === "" ? null : v)),
  address: optionalText(300),
  mapEmbedUrl: optionalText(2000),
  officeHours: optionalText(200),
  socialLinks: socialLinksSchema,
  copyright: optionalText(200),
  headerCtaLabel: optionalText(40),
  headerCtaUrl: linkSchema,
});

export type SettingsFormValues = z.input<typeof settingsSchema>;
