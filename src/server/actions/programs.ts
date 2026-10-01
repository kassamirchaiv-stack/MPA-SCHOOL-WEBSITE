"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/cache-tags";
import { programSchema } from "@/lib/validation/cms";
import { statusSchema } from "@/lib/validation/common";
import { adminAction, idSchema, jsonValue } from "./_lib";
import { changeStatus, nextSortOrder, resolvePublishedAt } from "./_content";

const tags = [TAGS.programs];

export async function saveProgram(input: z.input<typeof programSchema>) {
  return adminAction(input, {
    permission: "content.manage",
    schema: programSchema,
    tags,
    run: async ({ id, description, publishedAt, ...data }, admin) => {
      if (id) {
        const existing = await db.program.findUniqueOrThrow({ where: { id }, select: { publishedAt: true } });
        const program = await db.program.update({
          where: { id },
          data: { ...data, description: jsonValue(description), publishedAt: resolvePublishedAt(data.status, publishedAt, existing.publishedAt) },
        });
        await audit(admin, { action: "program.update", entity: "Program", entityId: id, summary: `Updated program “${program.title}”` });
        return { id };
      }
      const program = await db.program.create({
        data: {
          ...data,
          description: jsonValue(description),
          publishedAt: resolvePublishedAt(data.status, publishedAt),
          sortOrder: await nextSortOrder("program"),
        },
      });
      await audit(admin, { action: "program.create", entity: "Program", entityId: program.id, summary: `Created program “${program.title}”` });
      return { id: program.id };
    },
  });
}

export async function setProgramStatus(input: { id: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  return adminAction(input, {
    permission: "content.manage",
    schema: z.object({ id: z.string().min(1), status: statusSchema }),
    tags,
    run: async ({ id, status }, admin) => {
      const program = await changeStatus("program", id, status);
      await audit(admin, { action: `program.${status.toLowerCase()}`, entity: "Program", entityId: id, summary: `Set program “${program.title}” to ${status.toLowerCase()}` });
    },
  });
}

export async function deleteProgram(input: { id: string }) {
  return adminAction(input, {
    permission: "content.manage",
    schema: idSchema,
    tags,
    run: async ({ id }, admin) => {
      const program = await db.program.delete({ where: { id } });
      await audit(admin, { action: "program.delete", entity: "Program", entityId: id, summary: `Deleted program “${program.title}”` });
    },
  });
}
