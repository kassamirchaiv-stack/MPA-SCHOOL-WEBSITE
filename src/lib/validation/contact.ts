import { z } from "zod";

/** Shared by the public form (client-side) and the server action. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.email("Please enter a valid email address").max(200),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[+()\d\s-]*$/, "Use digits, spaces and + only")
    .optional()
    .or(z.literal("")),
  subject: z.string().trim().min(3, "Please add a subject").max(160),
  message: z.string().trim().min(10, "Please write a little more (at least 10 characters)").max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Spam-protection fields sent alongside the form values. */
export const contactMetaSchema = z.object({
  /** Honeypot — hidden from people; bots tend to fill it. */
  website: z.string().max(200).optional(),
  /** Milliseconds since epoch when the form was rendered. */
  startedAt: z.number().int().nonnegative(),
});
