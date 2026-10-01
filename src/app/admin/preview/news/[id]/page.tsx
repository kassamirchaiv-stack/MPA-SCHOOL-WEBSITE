import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { mediaSelect } from "@/lib/media";
import { ArticleView } from "@/components/public/article-view";

export default async function PreviewArticle({ params }: PageProps<"/admin/preview/news/[id]">) {
  await requireAdminPage("news.manage");
  const { id } = await params;
  const article = await db.article.findUnique({
    where: { id },
    include: { image: { select: mediaSelect }, category: { select: { name: true, slug: true } } },
  });
  if (!article) notFound();
  return <ArticleView article={{ ...article, publishedAt: article.publishedAt ?? new Date() }} />;
}
