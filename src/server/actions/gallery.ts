"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/cache-tags";
import { albumSchema } from "@/lib/validation/cms";
import { optionalText, statusSchema } from "@/lib/validation/common";
import { adminAction, idSchema } from "./_lib";
import { changeStatus, nextSortOrder } from "./_content";

const tags = [TAGS.gallery];

export async function saveAlbum(input: z.input<typeof albumSchema>) {
  return adminAction(input, {
    permission: "gallery.manage",
    schema: albumSchema,
    tags,
    // The cover is changed with setAlbumCover, never by the details form.
    run: async ({ id, coverImageId: _cover, ...data }, admin) => {
      const publishedAt = data.status === "PUBLISHED" ? new Date() : null;
      if (id) {
        const existing = await db.galleryAlbum.findUniqueOrThrow({ where: { id }, select: { publishedAt: true } });
        const album = await db.galleryAlbum.update({ where: { id }, data: { ...data, publishedAt: existing.publishedAt ?? publishedAt } });
        await audit(admin, { action: "album.update", entity: "GalleryAlbum", entityId: id, summary: `Updated album “${album.title}”` });
        return { id };
      }
      const album = await db.galleryAlbum.create({ data: { ...data, publishedAt, sortOrder: await nextSortOrder("galleryAlbum") } });
      await audit(admin, { action: "album.create", entity: "GalleryAlbum", entityId: album.id, summary: `Created album “${album.title}”` });
      return { id: album.id };
    },
  });
}

export async function setAlbumStatus(input: { id: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  return adminAction(input, {
    permission: "gallery.manage",
    schema: z.object({ id: z.string().min(1), status: statusSchema }),
    tags,
    run: async ({ id, status }, admin) => {
      const album = await changeStatus("galleryAlbum", id, status);
      await audit(admin, { action: `album.${status.toLowerCase()}`, entity: "GalleryAlbum", entityId: id, summary: `Set album “${album.title}” to ${status.toLowerCase()}` });
    },
  });
}

export async function deleteAlbum(input: { id: string }) {
  return adminAction(input, {
    permission: "gallery.manage",
    schema: idSchema,
    tags,
    run: async ({ id }, admin) => {
      // Photos stay in the media library; only the album and its links are removed.
      const album = await db.galleryAlbum.delete({ where: { id } });
      await audit(admin, { action: "album.delete", entity: "GalleryAlbum", entityId: id, summary: `Deleted album “${album.title}”` });
    },
  });
}

export async function addAlbumPhotos(input: { albumId: string; mediaIds: string[] }) {
  return adminAction(input, {
    permission: "gallery.manage",
    schema: z.object({ albumId: z.string().min(1), mediaIds: z.array(z.string().min(1)).min(1).max(100) }),
    tags,
    run: async ({ albumId, mediaIds }, admin) => {
      let sortOrder = await nextSortOrder("galleryItem", { albumId });
      const result = await db.galleryItem.createMany({
        data: mediaIds.map((mediaId) => ({ albumId, mediaId, sortOrder: sortOrder++ })),
        skipDuplicates: true,
      });
      await audit(admin, { action: "album.add_photos", entity: "GalleryAlbum", entityId: albumId, summary: `Added ${result.count} photo(s) to an album` });
    },
  });
}

export async function updateAlbumPhoto(input: { id: string; caption: string }) {
  return adminAction(input, {
    permission: "gallery.manage",
    schema: z.object({ id: z.string().min(1), caption: optionalText(300) }),
    tags,
    run: async ({ id, caption }) => {
      await db.galleryItem.update({ where: { id }, data: { caption } });
    },
  });
}

export async function removeAlbumPhoto(input: { id: string }) {
  return adminAction(input, {
    permission: "gallery.manage",
    schema: idSchema,
    tags,
    run: async ({ id }, admin) => {
      const item = await db.galleryItem.delete({ where: { id } });
      await audit(admin, { action: "album.remove_photo", entity: "GalleryAlbum", entityId: item.albumId, summary: "Removed a photo from an album" });
    },
  });
}

export async function setAlbumCover(input: { albumId: string; mediaId: string }) {
  return adminAction(input, {
    permission: "gallery.manage",
    schema: z.object({ albumId: z.string().min(1), mediaId: z.string().min(1) }),
    tags,
    run: async ({ albumId, mediaId }) => {
      await db.galleryAlbum.update({ where: { id: albumId }, data: { coverImageId: mediaId } });
    },
  });
}
