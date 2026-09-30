import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";
import { mediaSelect } from "@/lib/media";
import { publishedWhere } from "./published";

export const NEWS_PAGE_SIZE = 9;

const articleCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  publishedAt: true,
  featured: true,
  image: { select: mediaSelect },
  category: { select: { name: true, slug: true } },
} as const;

export async function getLatestArticles(limit: number) {
  "use cache";
  cacheTag(TAGS.news, TAGS.media);
  cacheLife("hours");
  return db.article.findMany({
    where: publishedWhere(),
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: articleCardSelect,
  });
}

export type ArticleCardData = Awaited<ReturnType<typeof getLatestArticles>>[number];

export async function getArticlesPage(page: number, categorySlug?: string) {
  "use cache";
  cacheTag(TAGS.news, TAGS.media);
  cacheLife("hours");
  const where = {
    ...publishedWhere(),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
  };
  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * NEWS_PAGE_SIZE,
      take: NEWS_PAGE_SIZE,
      select: articleCardSelect,
    }),
    db.article.count({ where }),
  ]);
  return { items, total, pageCount: Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE)) };
}

export async function getArticleCategories() {
  "use cache";
  cacheTag(TAGS.news);
  cacheLife("hours");
  return db.articleCategory.findMany({
    where: { articles: { some: publishedWhere() } },
    orderBy: { sortOrder: "asc" },
    select: { name: true, slug: true },
  });
}

export async function getArticle(slug: string) {
  "use cache";
  cacheTag(TAGS.news, TAGS.media);
  cacheLife("hours");
  return db.article.findFirst({
    where: { slug, ...publishedWhere() },
    include: { image: { select: mediaSelect }, category: { select: { name: true, slug: true } } },
  });
}

export type ArticleData = NonNullable<Awaited<ReturnType<typeof getArticle>>>;

export async function getRelatedArticles(articleId: string, categoryId: string | null, limit = 3) {
  "use cache";
  cacheTag(TAGS.news, TAGS.media);
  cacheLife("hours");
  return db.article.findMany({
    where: { ...publishedWhere(), id: { not: articleId }, ...(categoryId ? { categoryId } : {}) },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: articleCardSelect,
  });
}

export async function getArticleSlugs() {
  "use cache";
  cacheTag(TAGS.news);
  cacheLife("hours");
  return db.article.findMany({
    where: publishedWhere(),
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: { slug: true },
  });
}
