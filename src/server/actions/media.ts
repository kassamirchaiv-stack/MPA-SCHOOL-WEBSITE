"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/cache-tags";
import { summarizeMedia as summarize, type MediaSummary } from "@/lib/media-summary";
import { slugify } from "@/lib/slug";
import { BUCKETS, isBucketName } from "@/lib/storage-config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/session";
import { optionalText } from "@/lib/validation/common";
import { ActionError, adminAction, idSchema, type ActionResult } from "./_lib";

export type { MediaSummary };

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

// ─── Upload (two steps: signed URL → register) ────────────────────────────────

const uploadTargetSchema = z.object({
  bucket: z.string().refine(isBucketName, "Unknown storage bucket"),
  filename: z.string().trim().min(1).max(200),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

export async function createUploadTarget(input: z.input<typeof uploadTargetSchema>) {
  return adminAction(input, {
    permission: "media.manage",
    schema: uploadTargetSchema,
    run: async ({ bucket, filename, mimeType, size }) => {
      const config = BUCKETS[bucket as keyof typeof BUCKETS];
      if (!(config.allowedMimeTypes as readonly string[]).includes(mimeType)) {
        throw new ActionError(`${filename}: this file type is not allowed here.`);
      }
      if (size > config.maxBytes) {
        throw new ActionError(`${filename} is larger than ${Math.round(config.maxBytes / 1024 / 1024)} MB.`);
      }
      const base = slugify(filename.replace(/\.[^.]+$/, "")) || "file";
      const now = new Date();
      const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${base}-${randomBytes(4).toString("hex")}.${EXTENSIONS[mimeType] ?? "bin"}`;
      const { data, error } = await createSupabaseAdminClient().storage.from(bucket).createSignedUploadUrl(path);
      if (error || !data) throw new ActionError("Could not prepare the upload. Please try again.");
      return { bucket, path: data.path, token: data.token };
    },
  });
}

const registerSchema = z.object({
  bucket: z.string().refine(isBucketName, "Unknown storage bucket"),
  path: z.string().min(1).max(300),
  filename: z.string().trim().min(1).max(200),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  alt: z.string().trim().max(300).default(""),
  category: optionalText(80),
});

export async function registerUpload(input: z.input<typeof registerSchema>): Promise<ActionResult<MediaSummary>> {
  return adminAction(input, {
    permission: "media.manage",
    schema: registerSchema,
    tags: [TAGS.media],
    run: async ({ bucket, path, filename, width, height, alt, category }, admin) => {
      const storage = createSupabaseAdminClient().storage.from(bucket);
      // Trust what storage actually received, not what the browser claimed.
      const { data: info, error } = await storage.info(path);
      if (error || !info) throw new ActionError("The upload could not be found. Please try again.");
      const mimeType = info.contentType ?? "";
      const size = info.size ?? 0;
      const config = BUCKETS[bucket as keyof typeof BUCKETS];
      if (!(config.allowedMimeTypes as readonly string[]).includes(mimeType) || size > config.maxBytes) {
        await storage.remove([path]);
        throw new ActionError(`${filename}: file type or size not allowed.`);
      }
      const media = await db.media.create({
        data: {
          bucket,
          path,
          filename,
          title: filename.replace(/\.[^.]+$/, ""),
          mimeType,
          size,
          width,
          height,
          alt,
          category,
          uploadedById: admin.id,
        },
      });
      await audit(admin, { action: "media.upload", entity: "Media", entityId: media.id, summary: `Uploaded ${filename}` });
      return summarize(media);
    },
  });
}

// ─── Browse ───────────────────────────────────────────────────────────────────

const searchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  bucket: z.string().optional(),
  imagesOnly: z.boolean().optional(),
  includeArchived: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
});

const MEDIA_PAGE_SIZE = 24;

export async function searchMedia(input: z.input<typeof searchSchema>) {
  await requirePermission("media.manage");
  const { q, bucket, imagesOnly, includeArchived, page } = searchSchema.parse(input);
  const where = {
    ...(includeArchived ? {} : { archivedAt: null }),
    ...(bucket && isBucketName(bucket) ? { bucket } : {}),
    ...(imagesOnly ? { mimeType: { startsWith: "image/" } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { filename: { contains: q, mode: "insensitive" as const } },
            { alt: { contains: q, mode: "insensitive" as const } },
            { caption: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.media.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * MEDIA_PAGE_SIZE, take: MEDIA_PAGE_SIZE }),
    db.media.count({ where }),
  ]);
  return { items: rows.map(summarize), total, pageCount: Math.max(1, Math.ceil(total / MEDIA_PAGE_SIZE)) };
}

export async function getMediaSummary(id: string): Promise<MediaSummary | null> {
  await requirePermission("media.manage");
  const media = await db.media.findUnique({ where: { id } });
  return media ? summarize(media) : null;
}

// ─── Edit / archive / delete ──────────────────────────────────────────────────

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, "Name is required").max(200),
  alt: z.string().trim().max(300),
  caption: optionalText(500),
  category: optionalText(80),
});

export async function updateMedia(input: z.input<typeof updateSchema>) {
  return adminAction(input, {
    permission: "media.manage",
    schema: updateSchema,
    tags: [TAGS.media],
    run: async ({ id, ...data }, admin) => {
      await db.media.update({ where: { id }, data });
      await audit(admin, { action: "media.update", entity: "Media", entityId: id, summary: `Edited media “${data.title}”` });
    },
  });
}

export async function setMediaArchived(input: { id: string; archived: boolean }) {
  return adminAction(input, {
    permission: "media.manage",
    schema: z.object({ id: z.string().min(1), archived: z.boolean() }),
    tags: [TAGS.media, TAGS.gallery],
    run: async ({ id, archived }, admin) => {
      const media = await db.media.update({ where: { id }, data: { archivedAt: archived ? new Date() : null } });
      await audit(admin, {
        action: archived ? "media.archive" : "media.restore",
        entity: "Media",
        entityId: id,
        summary: `${archived ? "Archived" : "Restored"} “${media.title}”`,
      });
    },
  });
}

/** Where a media item is referenced, as human-readable labels. */
async function mediaUsage(id: string): Promise<string[]> {
  const m = await db.media.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          logoFor: true,
          footerLogoFor: true,
          faviconFor: true,
          ogImageFor: true,
          pageHeroFor: true,
          pageOgFor: true,
          homepageSections: true,
          heroSlides: true,
          highlights: true,
          programs: true,
          articles: true,
          events: true,
          albumCovers: true,
          galleryItems: true,
          staff: true,
        },
      },
    },
  });
  if (!m) return [];
  const labels: Record<string, string> = {
    logoFor: "site logo",
    footerLogoFor: "footer logo",
    faviconFor: "favicon",
    ogImageFor: "default share image",
    pageHeroFor: "page images",
    pageOgFor: "page share images",
    homepageSections: "homepage sections",
    heroSlides: "hero slides",
    highlights: "highlights",
    programs: "programs",
    articles: "news articles",
    events: "events",
    albumCovers: "album covers",
    galleryItems: "gallery albums",
    staff: "staff profiles",
  };
  return Object.entries(m._count)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${labels[key]} (${count})`);
}

export async function deleteMedia(input: { id: string }) {
  return adminAction(input, {
    permission: "media.manage",
    schema: idSchema,
    tags: [TAGS.media],
    run: async ({ id }, admin) => {
      const usage = await mediaUsage(id);
      if (usage.length > 0) {
        throw new ActionError(`This file is still used in: ${usage.join(", ")}. Remove it there first, or archive it instead.`);
      }
      const media = await db.media.findUniqueOrThrow({ where: { id } });
      const { error } = await createSupabaseAdminClient().storage.from(media.bucket).remove([media.path]);
      if (error) throw new ActionError("The file could not be removed from storage. Please try again.");
      await db.media.delete({ where: { id } });
      await audit(admin, { action: "media.delete", entity: "Media", entityId: id, summary: `Deleted “${media.title}”` });
    },
  });
}
