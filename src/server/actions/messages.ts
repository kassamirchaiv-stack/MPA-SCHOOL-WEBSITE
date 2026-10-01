"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { adminAction, idSchema } from "./_lib";

const statusInput = z.object({ id: z.string().min(1), status: z.enum(["NEW", "READ", "REPLIED", "ARCHIVED"]) });

export async function setMessageStatus(input: z.input<typeof statusInput>) {
  return adminAction(input, {
    permission: "messages.manage",
    schema: statusInput,
    run: async ({ id, status }, admin) => {
      const now = new Date();
      const message = await db.contactSubmission.update({
        where: { id },
        data: {
          status,
          ...(status === "READ" ? { readAt: now } : {}),
          ...(status === "REPLIED" ? { repliedAt: now, readAt: now } : {}),
        },
      });
      if (status !== "READ") {
        await audit(admin, {
          action: `message.${status.toLowerCase()}`,
          entity: "ContactSubmission",
          entityId: id,
          summary: `Marked message from ${message.name} as ${status.toLowerCase()}`,
        });
      }
    },
  });
}

export async function deleteMessage(input: { id: string }) {
  return adminAction(input, {
    permission: "messages.manage",
    schema: idSchema,
    run: async ({ id }, admin) => {
      const message = await db.contactSubmission.delete({ where: { id } });
      await audit(admin, { action: "message.delete", entity: "ContactSubmission", entityId: id, summary: `Deleted message from ${message.name}` });
    },
  });
}
