import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";
import { absoluteUrl } from "@/lib/seo";
import { publishedWhere } from "@/server/queries/published";

const STATIC_PAGES: { path: string; slug?: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/about", slug: "about", priority: 0.8 },
  { path: "/about/campuses", slug: "campuses", priority: 0.6 },
  { path: "/about/leadership", slug: "leadership", priority: 0.6 },
  { path: "/programs", slug: "programs", priority: 0.8 },
  { path: "/student-life", slug: "student-life", priority: 0.6 },
  { path: "/admissions", slug: "admissions", priority: 0.9 },
  { path: "/faq", slug: "faq", priority: 0.6 },
  { path: "/news", slug: "news", priority: 0.7 },
  { path: "/events", slug: "events", priority: 0.7 },
  { path: "/gallery", slug: "gallery", priority: 0.5 },
  { path: "/contact", slug: "contact", priority: 0.7 },
  { path: "/privacy", slug: "privacy", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheTag(TAGS.pages, TAGS.programs, TAGS.news, TAGS.events, TAGS.gallery);
  cacheLife("hours");

  const [pages, programs, articles, events, albums] = await Promise.all([
    db.page.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.program.findMany({ where: publishedWhere(), select: { slug: true, updatedAt: true } }),
    db.article.findMany({ where: publishedWhere(), select: { slug: true, updatedAt: true } }),
    db.event.findMany({ where: publishedWhere(), select: { slug: true, updatedAt: true } }),
    db.galleryAlbum.findMany({ where: publishedWhere(), select: { slug: true, updatedAt: true } }),
  ]);
  const pageUpdated = new Map(pages.map((p) => [p.slug, p.updatedAt]));

  return [
    ...STATIC_PAGES.map(({ path, slug, priority }) => ({
      url: absoluteUrl(path),
      lastModified: slug ? pageUpdated.get(slug) : undefined,
      priority,
    })),
    ...programs.map((p) => ({ url: absoluteUrl(`/programs/${p.slug}`), lastModified: p.updatedAt, priority: 0.7 })),
    ...articles.map((a) => ({ url: absoluteUrl(`/news/${a.slug}`), lastModified: a.updatedAt, priority: 0.6 })),
    ...events.map((e) => ({ url: absoluteUrl(`/events/${e.slug}`), lastModified: e.updatedAt, priority: 0.5 })),
    ...albums.map((a) => ({ url: absoluteUrl(`/gallery/${a.slug}`), lastModified: a.updatedAt, priority: 0.4 })),
  ];
}
