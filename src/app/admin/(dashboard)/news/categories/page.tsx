import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryManager } from "./category-manager";

export const metadata: Metadata = { title: "News categories" };

export default async function CategoriesPage() {
  await requireAdminPage("news.manage");
  const categories = await db.articleCategory.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, description: true, _count: { select: { articles: true } } },
  });
  return (
    <>
      <PageHeader
        title="News categories"
        description="Used to group articles and as filters on the public News page."
        breadcrumbs={[{ label: "News", href: "/admin/news" }, { label: "Categories" }]}
      />
      <CategoryManager categories={categories.map((c) => ({ ...c, articleCount: c._count.articles }))} />
    </>
  );
}
