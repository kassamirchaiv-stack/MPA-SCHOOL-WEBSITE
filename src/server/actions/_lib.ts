import "server-only";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { AuthorizationError, requirePermission, type CurrentAdmin } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/permissions";
import type { CacheTag } from "@/lib/cache-tags";

/** Every admin server action returns this shape so forms can show errors consistently. */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    out[key] ??= issue.message;
  }
  return out;
}

function friendlyDbError(error: unknown): { error: string; fieldErrors?: Record<string, string> } | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      // Classic engines report meta.target; driver adapters (Prisma 7 + pg) report the
      // constraint name (e.g. "Article_slug_key") under meta.driverAdapterError.
      const target = JSON.stringify(error.meta ?? {});
      if (target.includes("slug")) {
        return { error: "That web address (slug) is already used.", fieldErrors: { slug: "Already used — choose another" } };
      }
      if (target.includes("email")) return { error: "That email address is already used.", fieldErrors: { email: "Already used" } };
      return { error: "That value is already used." };
    }
    if (error.code === "P2025") return { error: "This item no longer exists. It may have been deleted." };
    if (error.code === "P2003") return { error: "This item is still used elsewhere, so it cannot be removed." };
  }
  return null;
}

type AdminActionOptions<S extends z.ZodType, R> = {
  permission: Permission;
  schema: S;
  /** Cache tags to refresh on success so the public site shows the change immediately. */
  tags?: CacheTag[];
  run: (input: z.infer<S>, admin: CurrentAdmin) => Promise<R>;
};

/**
 * Wraps an admin mutation: authorises on the server, validates input with Zod,
 * maps database errors to readable messages and refreshes public caches.
 */
export async function adminAction<S extends z.ZodType, R = undefined>(
  raw: unknown,
  { permission, schema, tags = [], run }: AdminActionOptions<S, R>,
): Promise<ActionResult<R>> {
  let admin: CurrentAdmin;
  try {
    admin = await requirePermission(permission);
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, error: error.message };
    throw error;
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    const data = await run(parsed.data, admin);
    for (const tag of tags) updateTag(tag);
    // Send the updated admin page back in the same response, so lists reflect
    // the change immediately without a separate (race-prone) client refresh.
    refresh();
    return { ok: true, data } as ActionResult<R>;
  } catch (error) {
    if (error instanceof ActionError) return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    const friendly = friendlyDbError(error);
    if (friendly) return { ok: false, ...friendly };
    console.error("Admin action failed", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/** Throw inside `run` to return a specific message to the form. */
export class ActionError extends Error {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ActionError";
  }
}

export const idSchema = z.object({ id: z.string().min(1) });

/** Prisma needs Prisma.DbNull (not null) to clear a JSON column. */
export function jsonValue(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return value == null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}
