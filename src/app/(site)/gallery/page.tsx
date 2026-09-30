import { Images } from "lucide-react";
import { getPage } from "@/server/queries/content";
import { getPublishedAlbums } from "@/server/queries/gallery";
import { pageMetadata } from "@/server/page-meta";
import { PageHero } from "@/components/public/page-hero";
import { AlbumCard } from "@/components/public/cards";
import { EmptyState } from "@/components/public/empty-state";

export const generateMetadata = () => pageMetadata("gallery", "/gallery", "Gallery");

export default async function GalleryPage() {
  const [page, albums] = await Promise.all([getPage("gallery"), getPublishedAlbums()]);
  return (
    <>
      <PageHero
        title={page?.title ?? "Gallery"}
        eyebrow={page?.eyebrow}
        intro={page?.intro}
        breadcrumbs={[{ label: "Gallery", href: "/gallery" }]}
      />
      <div className="container-site py-16 lg:py-24">
        {albums.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <li key={album.id}>
                <AlbumCard album={album} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Images} title="Photo albums are coming soon" />
        )}
      </div>
    </>
  );
}
