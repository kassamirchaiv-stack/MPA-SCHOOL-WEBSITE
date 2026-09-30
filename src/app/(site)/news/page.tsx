import Link from "next/link";
import { Suspense } from "react";
import { Newspaper } from "lucide-react";
import { getPage } from "@/server/queries/content";
import { getArticleCategories, getArticlesPage } from "@/server/queries/news";
import { pageMetadata } from "@/server/page-meta";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/public/page-hero";
import { NewsCard } from "@/components/public/cards";
import { EmptyState } from "@/components/public/empty-state";
import { Pagination } from "@/components/public/pagination";
import { CardGridSkeleton } from "@/components/public/skeletons";

export const generateMetadata = () => pageMetadata("news", "/news", "News & Announcements");

export default async function NewsPage({ searchParams }: PageProps<"/news">) {
  const page = await getPage("news");
  return (
    <>
      <PageHero
        title={page?.title ?? "News & Announcements"}
        eyebrow={page?.eyebrow}
        intro={page?.intro}
        breadcrumbs={[{ label: "News", href: "/news" }]}
      />
      <div className="container-site py-16 lg:py-24">
        <Suspense fallback={<CardGridSkeleton />}>
          <ArticleList searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

function hrefFor(category: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/news?${query}` : "/news";
}

async function ArticleList({ searchParams }: Pick<PageProps<"/news">, "searchParams">) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const pageNumber = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);
  const [categories, { items, pageCount }] = await Promise.all([getArticleCategories(), getArticlesPage(pageNumber, category)]);

  return (
    <>
      {categories.length > 1 && (
        <nav aria-label="News categories" className="mb-10">
          <ul className="flex flex-wrap gap-2">
            {[{ name: "All", slug: undefined }, ...categories].map((c) => {
              const active = c.slug === category;
              return (
                <li key={c.slug ?? "all"}>
                  <Link
                    href={hrefFor(c.slug, 1)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 items-center rounded-btn border px-4 text-sm font-semibold",
                      active ? "border-primary bg-primary text-on-primary" : "border-border bg-surface hover:border-primary hover:text-primary",
                    )}
                  >
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
      {items.length === 0 ? (
        <EmptyState icon={Newspaper} title="No articles yet" description="News and announcements will appear here." />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((article) => (
            <li key={article.id}>
              <NewsCard article={article} headingLevel={2} />
            </li>
          ))}
        </ul>
      )}
      <Pagination page={Math.min(pageNumber, pageCount)} pageCount={pageCount} hrefFor={(p) => hrefFor(category, p)} />
    </>
  );
}
