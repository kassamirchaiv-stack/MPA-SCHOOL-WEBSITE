"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/cache-tags";
import { eventSchema } from "@/lib/validation/cms";
import { statusSchema } from "@/lib/validation/common";
import { adminAction, idSchema, jsonValue } from "./_lib";
import { changeStatus } from "./_content";

const tags = [TAGS.events];

export async function saveEvent(input: z.input<typeof eventSchema>) {
  return adminAction(input, {
    permission: "events.manage",
    schema: eventSchema,
    tags,
    run: async ({ id, description, ...data }, admin) => {
      const publishedAt = data.status === "PUBLISHED" ? new Date() : null;
      if (id) {
        const existing = await db.event.findUniqueOrThrow({ where: { id }, select: { publishedAt: true } });
        const event = await db.event.update({
          where: { id },
          data: { ...data, description: jsonValue(description), publishedAt: existing.publishedAt ?? publishedAt },
        });
        await audit(admin, { action: "event.update", entity: "Event", entityId: id, summary: `Updated event “${event.title}”` });
        return { id };
      }
      const event = await db.event.create({ data: { ...data, description: jsonValue(description), publishedAt } });
      await audit(admin, { action: "event.create", entity: "Event", entityId: event.id, summary: `Created event “${event.title}”` });
      return { id: event.id };
    },
  });
}

export async function setEventStatus(input: { id: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  return adminAction(input, {
    permission: "events.manage",
    schema: z.object({ id: z.string().min(1), status: statusSchema }),
    tags,
    run: async ({ id, status }, admin) => {
      const event = await changeStatus("event", id, status);
      await audit(admin, { action: `event.${status.toLowerCase()}`, entity: "Event", entityId: id, summary: `Set event “${event.title}” to ${status.toLowerCase()}` });
    },
  });
}

export async function deleteEvent(input: { id: string }) {
  return adminAction(input, {
    permission: "events.manage",
    schema: idSchema,
    tags,
    run: async ({ id }, admin) => {
      const event = await db.event.delete({ where: { id } });
      await audit(admin, { action: "event.delete", entity: "Event", entityId: id, summary: `Deleted event “${event.title}”` });
    },
  });
}
