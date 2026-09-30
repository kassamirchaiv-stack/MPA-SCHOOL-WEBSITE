import type { Metadata } from "next";
import { publicEnv } from "@/lib/env";
import { mediaUrl, type MediaRef } from "@/lib/media";

type SeoInput = {
  title: string;
  description?: string | null;
  /** Site-relative path, used for the canonical URL. */
  path: string;
  image?: MediaRef | null;
  type?: "website" | "article";
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
};

export function absoluteUrl(path: string) {
  return `${publicEnv.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Per-page metadata. Site-wide defaults (name, default OG image, robots) come from the root layout. */
export function buildMetadata({ title, description, path, image, type = "website", publishedTime, modifiedTime }: SeoInput): Metadata {
  const images = image ? [{ url: mediaUrl(image), width: image.width ?? undefined, height: image.height ?? undefined, alt: image.alt }] : undefined;
  return {
    title,
    description: description ?? undefined,
    alternates: { canonical: path },
    openGraph: {
      type,
      title,
      description: description ?? undefined,
      url: path,
      images,
      ...(type === "article"
        ? { publishedTime: publishedTime?.toISOString(), modifiedTime: modifiedTime?.toISOString() }
        : {}),
    },
    twitter: { card: "summary_large_image", title, description: description ?? undefined, images: images?.map((i) => i.url) },
  };
}

/** Shortens text for meta descriptions without cutting words. */
export function truncate(text: string | null | undefined, max = 160): string | undefined {
  if (!text) return undefined;
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
