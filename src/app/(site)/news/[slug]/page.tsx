import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getArticle, getArticleSlugs, getRelatedArticles } from "@/server/queries/news";
import { getSiteSettings } from "@/server/queries/site";
import { PLACEHOLDER_SLUG, staticParamsOrPlaceholder } from "@/server/queries/content";
import { buildMetadata, absoluteUrl, truncate } from "@/lib/seo";
import { mediaUrl } from "@/lib/media";
import { ArticleView } from "@/components/public/article-view";
import { NewsCard } from "@/components/public/cards";
import { JsonLd } from "@/components/public/json-ld";
import { DetailSkeleton } from "@/components/public/skeletons";

export async function generateStaticParams() {
  return staticParamsOrPlaceholder(await getArticleSlugs());
}

export async function generateMetadata({ params }: PageProps<"/news/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = slug === PLACEHOLDER_SLUG ? null : await getArticle(slug);
  if (!article) return { title: "Article not found", robots: { index: false } };
  return buildMetadata({
    title: article.seoTitle || article.title,
    description: article.seoDescription || truncate(article.excerpt),
    path: `/news/${article.slug}`,
    image: article.image,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
  });
}

export default function ArticlePage({ params }: PageProps<"/news/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ArticleDetail params={params} />
    </Suspense>
  );
}

async function ArticleDetail({ params }: Pick<PageProps<"/news/[slug]">, "params">) {
  const { slug } = await params;
  const article = slug === PLACEHOLDER_SLUG ? null : await getArticle(slug);
  if (!article) notFound();
  const [related, settings] = await Promise.all([getRelatedArticles(article.id, article.categoryId), getSiteSettings()]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: article.title,
          description: article.excerpt ?? undefined,
          image: article.image ? [mediaUrl(article.image)] : undefined,
          datePublished: article.publishedAt?.toISOString(),
          dateModified: article.updatedAt.toISOString(),
          author: { "@type": "Organization", name: article.authorName || settings?.schoolName },
          publisher: {
            "@type": "Organization",
            name: settings?.schoolName,
            logo: settings?.logo ? { "@type": "ImageObject", url: mediaUrl(settings.logo) } : undefined,
          },
          mainEntityOfPage: absoluteUrl(`/news/${article.slug}`),
        }}
      />
      <ArticleView article={article} />
      <div className="container-site pb-16">
        <Link href="/news" className="inline-flex items-center gap-2 font-semibold text-primary">
          <ArrowLeft aria-hidden className="size-4" /> All news
        </Link>
      </div>
      {related.length > 0 && (
        <section aria-labelledby="related" className="bg-surface py-16 lg:py-24">
          <div className="container-site">
            <h2 id="related" className="mb-10 text-3xl">
              More news
            </h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <li key={a.id}>
                  <NewsCard article={a} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
