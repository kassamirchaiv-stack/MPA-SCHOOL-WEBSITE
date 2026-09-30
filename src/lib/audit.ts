import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { CurrentAdmin } from "@/lib/auth/session";

type AuditInput = {
  action: string; // e.g. "article.publish"
  entity: string; // e.g. "Article"
  entityId?: string | null;
  summary?: string;
  metadata?: Prisma.InputJsonValue;
};

/** Records an admin action. Failures are logged but never block the action itself. */
export async function audit(admin: CurrentAdmin, input: AuditInput) {
  try {
    await db.auditLog.create({
      data: { userId: admin.id, userEmail: admin.email, ...input },
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}
