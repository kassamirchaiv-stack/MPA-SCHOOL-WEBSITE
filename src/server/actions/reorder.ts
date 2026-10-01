"use server";

import { z } from "zod";
import type { Permission } from "@/lib/auth/permissions";
import { TAGS, type CacheTag } from "@/lib/cache-tags";
import { adminAction } from "./_lib";
import { moveItem, type OrderModel } from "./_content";

const RULES: Record<OrderModel, { permission: Permission; tags: CacheTag[] }> = {
  program: { permission: "content.manage", tags: [TAGS.programs] },
  faq: { permission: "content.manage", tags: [TAGS.faqs] },
  staffMember: { permission: "content.manage", tags: [TAGS.staff] },
  galleryAlbum: { permission: "gallery.manage", tags: [TAGS.gallery] },
  galleryItem: { permission: "gallery.manage", tags: [TAGS.gallery] },
  heroSlide: { permission: "content.manage", tags: [TAGS.homepage] },
  homepageSection: { permission: "content.manage", tags: [TAGS.homepage] },
  highlight: { permission: "content.manage", tags: [TAGS.highlights] },
  statistic: { permission: "content.manage", tags: [TAGS.statistics] },
  navigationItem: { permission: "navigation.manage", tags: [TAGS.navigation] },
  articleCategory: { permission: "news.manage", tags: [TAGS.news] },
};

const schema = z.object({
  model: z.enum(Object.keys(RULES) as [OrderModel, ...OrderModel[]]),
  id: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

/** Moves a list item one position up or down. Permission depends on the list. */
export async function reorderItem(input: z.input<typeof schema>) {
  const model = schema.shape.model.safeParse(input.model);
  const rule = model.success ? RULES[model.data] : RULES.faq;
  return adminAction(input, {
    permission: rule.permission,
    schema,
    tags: rule.tags,
    run: async ({ model: m, id, direction }) => {
      await moveItem(m, id, direction);
    },
  });
}
