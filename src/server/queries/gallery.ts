import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";
import { mediaSelect } from "@/lib/media";
import { publishedWhere } from "./published";

export async function getPublishedAlbums() {
  "use cache";
  cacheTag(TAGS.gallery, TAGS.media);
  cacheLife("hours");
  return db.galleryAlbum.findMany({
    where: publishedWhere(),
    orderBy: [{ sortOrder: "asc" }, { date: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      category: true,
      date: true,
      coverImage: { select: mediaSelect },
      items: { orderBy: { sortOrder: "asc" }, take: 1, select: { media: { select: mediaSelect } } },
      _count: { select: { items: true } },
    },
  });
}

export type AlbumCardData = Awaited<ReturnType<typeof getPublishedAlbums>>[number];

export async function getAlbum(slug: string) {
  "use cache";
  cacheTag(TAGS.gallery, TAGS.media);
  cacheLife("hours");
  return db.galleryAlbum.findFirst({
    where: { slug, ...publishedWhere() },
    include: {
      coverImage: { select: mediaSelect },
      items: {
        where: { media: { archivedAt: null } },
        orderBy: { sortOrder: "asc" },
        select: { id: true, caption: true, media: { select: { ...mediaSelect, caption: true } } },
      },
    },
  });
}

export type AlbumData = NonNullable<Awaited<ReturnType<typeof getAlbum>>>;

/** Photos for the homepage gallery strip: featured albums first, newest first. */
export async function getGalleryHighlights(limit: number) {
  "use cache";
  cacheTag(TAGS.gallery, TAGS.media);
  cacheLife("hours");
  return db.galleryItem.findMany({
    where: { album: publishedWhere(), media: { archivedAt: null } },
    orderBy: [{ album: { featured: "desc" } }, { album: { date: "desc" } }, { sortOrder: "asc" }],
    take: limit,
    select: {
      id: true,
      caption: true,
      media: { select: mediaSelect },
      album: { select: { slug: true, title: true } },
    },
  });
}

export async function getAlbumSlugs() {
  "use cache";
  cacheTag(TAGS.gallery);
  cacheLife("hours");
  return db.galleryAlbum.findMany({ where: publishedWhere(), take: 50, select: { slug: true } });
}
