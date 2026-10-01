import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/page-header";
import { ArticleForm } from "../article-form";

export const metadata: Metadata = { title: "New article" };

export default async function NewArticlePage() {
  await requireAdminPage("news.manage");
  const [categories, settings] = await Promise.all([
    db.articleCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.siteSettings.findUnique({ where: { id: 1 }, select: { schoolName: true } }),
  ]);
  return (
    <>
      <PageHeader title="New article" breadcrumbs={[{ label: "News", href: "/admin/news" }, { label: "New article" }]} />
      <ArticleForm
        categories={categories}
        defaults={{
          title: "",
          slug: "",
          excerpt: "",
          content: null,
          categoryId: "",
          tags: "",
          authorName: settings?.schoolName ?? "",
          imageId: "",
          featured: false,
          status: "DRAFT",
          publishedAt: "",
          seoTitle: "",
          seoDescription: "",
        }}
      />
    </>
  );
}
