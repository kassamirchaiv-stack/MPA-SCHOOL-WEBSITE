import "server-only";
import type { Metadata } from "next";
import { getPage } from "@/server/queries/content";
import { buildMetadata, truncate } from "@/lib/seo";

/** Metadata for a CMS-managed page: SEO fields first, then title/intro, then the fallback title. */
export async function pageMetadata(slug: string, path: string, fallbackTitle: string): Promise<Metadata> {
  const page = await getPage(slug);
  return buildMetadata({
    title: page?.seoTitle || page?.title || fallbackTitle,
    description: page?.seoDescription || truncate(page?.intro),
    path,
    image: page?.ogImage ?? page?.heroImage,
  });
}
