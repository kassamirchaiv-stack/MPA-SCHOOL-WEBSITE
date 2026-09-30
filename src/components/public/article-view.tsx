import Link from "next/link";
import type { MediaRef } from "@/lib/media";
import { formatDate } from "@/lib/format";
import { CmsImage } from "@/components/ui/cms-image";
import { RichText } from "./rich-text";

export type ArticleViewData = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: unknown;
  authorName: string | null;
  tags: string[];
  publishedAt: Date | null;
  image: MediaRef | null;
  category: { name: string; slug: string } | null;
};

/**
 * Article body in the public design. Shared by /news/[slug] and the admin preview
 * so previews look exactly like the published page.
 */
export function ArticleView({ article }: { article: ArticleViewData }) {
  return (
    <article>
      <header className="container-site max-w-4xl pt-12 pb-10 sm:pt-16">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
          <ol className="flex flex-wrap gap-1.5">
            <li>
              <Link href="/" className="hover:text-primary">
                Home
              </Link>{" "}
              /
            </li>
            <li>
              <Link href="/news" className="hover:text-primary">
                News
              </Link>{" "}
              /
            </li>
            <li aria-current="page" className="text-text">
              {article.title}
            </li>
          </ol>
        </nav>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {article.category && (
            <Link href={`/news?category=${article.category.slug}`} className="eyebrow hover:underline">
              {article.category.name}
            </Link>
          )}
          {article.publishedAt && (
            <time dateTime={article.publishedAt.toISOString()} className="text-muted">
              {formatDate(article.publishedAt)}
            </time>
          )}
          {article.authorName && <span className="text-muted">By {article.authorName}</span>}
        </div>
        <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">{article.title}</h1>
        {article.excerpt && <p className="mt-5 text-xl text-muted">{article.excerpt}</p>}
      </header>
      {article.image && (
        <div className="container-site max-w-5xl">
          <CmsImage media={article.image} sizes="(min-width: 1024px) 64rem, 100vw" priority className="aspect-[16/9] rounded-card" />
        </div>
      )}
      <div className="container-site max-w-4xl py-12">
        <RichText content={article.content} className="text-lg" />
        {article.tags.length > 0 && (
          <ul className="mt-12 flex flex-wrap gap-2" aria-label="Tags">
            {article.tags.map((tag) => (
              <li key={tag} className="border border-border px-3 py-1 text-sm text-muted">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
