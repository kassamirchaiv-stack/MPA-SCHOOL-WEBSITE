"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { contactMetaSchema, contactSchema, type ContactInput } from "@/lib/validation/contact";

export type ContactResult = { ok: true } | { ok: false; error: string; fieldErrors?: Partial<Record<keyof ContactInput, string>> };

const MIN_FILL_MS = 3000;
const MAX_PER_HOUR = 5;

async function hashedClientIp(): Promise<string | null> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const secret = process.env.IP_HASH_SECRET;
  if (!ip || !secret) return null;
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export async function submitContact(values: ContactInput, meta: { website?: string; startedAt: number }): Promise<ContactResult> {
  const parsedMeta = contactMetaSchema.safeParse(meta);
  // Bots: pretend success so they learn nothing, but store nothing.
  if (!parsedMeta.success || parsedMeta.data.website || Date.now() - parsedMeta.data.startedAt < MIN_FILL_MS) {
    return { ok: true };
  }

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ContactInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ContactInput;
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }

  const ipHash = await hashedClientIp();
  if (ipHash) {
    const recent = await db.contactSubmission.count({
      where: { ipHash, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent >= MAX_PER_HOUR) {
      return { ok: false, error: "You have sent several messages recently. Please try again later or contact us by phone." };
    }
  }

  const { name, email, phone, subject, message } = parsed.data;
  try {
    await db.contactSubmission.create({
      data: { name, email: email.toLowerCase(), phone: phone || null, subject, message, ipHash },
    });
  } catch (error) {
    console.error("Failed to store contact submission", error);
    return { ok: false, error: "Something went wrong while sending your message. Please try again." };
  }
  return { ok: true };
}
