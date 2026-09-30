import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Images } from "lucide-react";
import { getAlbum, getAlbumSlugs } from "@/server/queries/gallery";
import { PLACEHOLDER_SLUG, staticParamsOrPlaceholder } from "@/server/queries/content";
import { buildMetadata, truncate } from "@/lib/seo";
import { mediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/format";
import { PageHero } from "@/components/public/page-hero";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { EmptyState } from "@/components/public/empty-state";
import { DetailSkeleton } from "@/components/public/skeletons";

export async function generateStaticParams() {
  return staticParamsOrPlaceholder(await getAlbumSlugs());
}

export async function generateMetadata({ params }: PageProps<"/gallery/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const album = slug === PLACEHOLDER_SLUG ? null : await getAlbum(slug);
  if (!album) return { title: "Album not found", robots: { index: false } };
  return buildMetadata({
    title: album.title,
    description: truncate(album.description),
    path: `/gallery/${album.slug}`,
    image: album.coverImage ?? album.items[0]?.media,
  });
}

export default function AlbumPage({ params }: PageProps<"/gallery/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <AlbumDetail params={params} />
    </Suspense>
  );
}

async function AlbumDetail({ params }: Pick<PageProps<"/gallery/[slug]">, "params">) {
  const { slug } = await params;
  const album = slug === PLACEHOLDER_SLUG ? null : await getAlbum(slug);
  if (!album) notFound();

  const photos = album.items.map((item) => ({
    id: item.id,
    src: mediaUrl(item.media),
    alt: item.media.alt,
    caption: item.caption ?? item.media.caption,
    width: item.media.width,
    height: item.media.height,
  }));

  return (
    <>
      <PageHero
        title={album.title}
        eyebrow={[album.category, album.date && formatDate(album.date)].filter(Boolean).join(" · ") || "Gallery"}
        intro={album.description}
        breadcrumbs={[
          { label: "Gallery", href: "/gallery" },
          { label: album.title, href: `/gallery/${album.slug}` },
        ]}
      />
      <div className="container-site py-16 lg:py-20">
        {photos.length > 0 ? <GalleryGrid photos={photos} /> : <EmptyState icon={Images} title="This album has no photos yet" />}
        <Link href="/gallery" className="mt-12 inline-flex items-center gap-2 font-semibold text-primary">
          <ArrowLeft aria-hidden className="size-4" /> All albums
        </Link>
      </div>
    </>
  );
}
