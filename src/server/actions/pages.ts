"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/cache-tags";
import { isReservedSlug, isSystemPage } from "@/lib/pages";
import { pageSchema } from "@/lib/validation/cms";
import { statusSchema } from "@/lib/validation/common";
import { ActionError, adminAction, idSchema, jsonValue } from "./_lib";
import { changeStatus } from "./_content";

const tags = [TAGS.pages];

export async function savePage(input: z.input<typeof pageSchema>) {
  return adminAction(input, {
    permission: "content.manage",
    schema: pageSchema,
    tags,
    run: async ({ id, content, ...data }, admin) => {
      if (id) {
        const existing = await db.page.findUniqueOrThrow({ where: { id }, select: { slug: true, publishedAt: true } });
        // Built-in pages live at fixed addresses.
        if (isSystemPage(existing.slug) && data.slug !== existing.slug) {
          throw new ActionError("The address of a built-in page cannot be changed.", { slug: "Built-in pages keep their address" });
        }
        if (!isSystemPage(existing.slug) && data.slug !== existing.slug && isReservedSlug(data.slug)) {
          throw new ActionError("That address is used by another part of the website.", { slug: "Reserved — choose another" });
        }
        const page = await db.page.update({
          where: { id },
          data: { ...data, content: jsonValue(content), publishedAt: existing.publishedAt ?? (data.status === "PUBLISHED" ? new Date() : null) },
        });
        await audit(admin, { action: "page.update", entity: "Page", entityId: id, summary: `Updated page “${page.title}”` });
        return { id };
      }
      if (isReservedSlug(data.slug)) {
        throw new ActionError("That address is used by another part of the website.", { slug: "Reserved — choose another" });
      }
      const page = await db.page.create({
        data: { ...data, content: jsonValue(content), publishedAt: data.status === "PUBLISHED" ? new Date() : null },
      });
      await audit(admin, { action: "page.create", entity: "Page", entityId: page.id, summary: `Created page “${page.title}”` });
      return { id: page.id };
    },
  });
}

export async function setPageStatus(input: { id: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  return adminAction(input, {
    permission: "content.manage",
    schema: z.object({ id: z.string().min(1), status: statusSchema }),
    tags,
    run: async ({ id, status }, admin) => {
      const page = await changeStatus("page", id, status);
      await audit(admin, { action: `page.${status.toLowerCase()}`, entity: "Page", entityId: id, summary: `Set page “${page.title}” to ${status.toLowerCase()}` });
    },
  });
}

export async function deletePage(input: { id: string }) {
  return adminAction(input, {
    permission: "content.manage",
    schema: idSchema,
    tags,
    run: async ({ id }, admin) => {
      const page = await db.page.findUniqueOrThrow({ where: { id } });
      if (isSystemPage(page.slug)) throw new ActionError("Built-in pages cannot be deleted. You can edit their content instead.");
      await db.page.delete({ where: { id } });
      await audit(admin, { action: "page.delete", entity: "Page", entityId: id, summary: `Deleted page “${page.title}”` });
    },
  });
}
