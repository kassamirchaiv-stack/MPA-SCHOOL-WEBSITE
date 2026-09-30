import { z } from "zod";

export const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "youtube",
  "x",
  "tiktok",
  "telegram",
  "whatsapp",
  "linkedin",
  "website",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X (Twitter)",
  tiktok: "TikTok",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
  website: "Website",
};

export const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: z.url({ protocol: /^https?$/ }),
});

export const socialLinksSchema = z.array(socialLinkSchema).max(12);

export type SocialLink = z.infer<typeof socialLinkSchema>;

/** Parses the JSON column defensively: invalid entries are dropped. */
export function parseSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = socialLinkSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}
