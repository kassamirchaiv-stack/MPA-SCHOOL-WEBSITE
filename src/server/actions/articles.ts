"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/cache-tags";
import { articleSchema, categorySchema } from "@/lib/validation/cms";
import { statusSchema } from "@/lib/validation/common";
import { adminAction, idSchema, jsonValue } from "./_lib";
import { changeStatus, nextSortOrder, resolvePublishedAt } from "./_content";

const tags = [TAGS.news];

export async function saveArticle(input: z.input<typeof articleSchema>) {
  return adminAction(input, {
    permission: "news.manage",
    schema: articleSchema,
    tags,
    run: async ({ id, publishedAt, content, ...data }, admin) => {
      if (id) {
        const existing = await db.article.findUniqueOrThrow({ where: { id }, select: { publishedAt: true, status: true } });
        const article = await db.article.update({
          where: { id },
          data: { ...data, content: jsonValue(content), publishedAt: resolvePublishedAt(data.status, publishedAt, existing.publishedAt) },
        });
        const published = existing.status !== "PUBLISHED" && article.status === "PUBLISHED";
        await audit(admin, {
          action: published ? "article.publish" : "article.update",
          entity: "Article",
          entityId: id,
          summary: `${published ? "Published" : "Updated"} article “${article.title}”`,
        });
        return { id };
      }
      const article = await db.article.create({
        data: { ...data, content: jsonValue(content), publishedAt: resolvePublishedAt(data.status, publishedAt), createdById: admin.id },
      });
      await audit(admin, {
        action: "article.create",
        entity: "Article",
        entityId: article.id,
        summary: `Created article “${article.title}” (${article.status.toLowerCase()})`,
      });
      return { id: article.id };
    },
  });
}

export async function setArticleStatus(input: { id: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  return adminAction(input, {
    permission: "news.manage",
    schema: z.object({ id: z.string().min(1), status: statusSchema }),
    tags,
    run: async ({ id, status }, admin) => {
      const article = await changeStatus("article", id, status);
      const verb = { DRAFT: "Unpublished", PUBLISHED: "Published", ARCHIVED: "Archived" }[status];
      await audit(admin, { action: `article.${status.toLowerCase()}`, entity: "Article", entityId: id, summary: `${verb} article “${article.title}”` });
    },
  });
}

export async function deleteArticle(input: { id: string }) {
  return adminAction(input, {
    permission: "news.manage",
    schema: idSchema,
    tags,
    run: async ({ id }, admin) => {
      const article = await db.article.delete({ where: { id } });
      await audit(admin, { action: "article.delete", entity: "Article", entityId: id, summary: `Deleted article “${article.title}”` });
    },
  });
}

export async function saveCategory(input: z.input<typeof categorySchema>) {
  return adminAction(input, {
    permission: "news.manage",
    schema: categorySchema,
    tags,
    run: async ({ id, ...data }, admin) => {
      const category = id
        ? await db.articleCategory.update({ where: { id }, data })
        : await db.articleCategory.create({ data: { ...data, sortOrder: await nextSortOrder("articleCategory") } });
      await audit(admin, {
        action: id ? "category.update" : "category.create",
        entity: "ArticleCategory",
        entityId: category.id,
        summary: `${id ? "Updated" : "Created"} news category “${category.name}”`,
      });
    },
  });
}

export async function deleteCategory(input: { id: string }) {
  return adminAction(input, {
    permission: "news.manage",
    schema: idSchema,
    tags,
    run: async ({ id }, admin) => {
      // Articles keep existing; they simply lose the category (onDelete: SetNull).
      const category = await db.articleCategory.delete({ where: { id } });
      await audit(admin, { action: "category.delete", entity: "ArticleCategory", entityId: id, summary: `Deleted news category “${category.name}”` });
    },
  });
}
