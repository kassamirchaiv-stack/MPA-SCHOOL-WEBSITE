import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { toLocalInput } from "@/lib/datetime";
import { summarizeOrNull } from "@/lib/media-summary";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge, contentStatus } from "@/components/admin/ui";
import { ArticleForm } from "../article-form";

export const metadata: Metadata = { title: "Edit article" };

export default async function EditArticlePage({ params }: PageProps<"/admin/news/[id]">) {
  await requireAdminPage("news.manage");
  const { id } = await params;
  const [article, categories] = await Promise.all([
    db.article.findUnique({ where: { id }, include: { image: true } }),
    db.articleCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!article) notFound();

  return (
    <>
      <PageHeader
        title={article.title}
        breadcrumbs={[{ label: "News", href: "/admin/news" }, { label: "Edit article" }]}
        actions={<StatusBadge status={contentStatus(article.status, article.publishedAt)} />}
      />
      <ArticleForm
        categories={categories}
        image={summarizeOrNull(article.image)}
        defaults={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt ?? "",
          content: article.content as never,
          categoryId: article.categoryId ?? "",
          tags: article.tags.join(", "),
          authorName: article.authorName ?? "",
          imageId: article.imageId ?? "",
          featured: article.featured,
          status: article.status,
          publishedAt: toLocalInput(article.publishedAt),
          seoTitle: article.seoTitle ?? "",
          seoDescription: article.seoDescription ?? "",
        }}
      />
    </>
  );
}
