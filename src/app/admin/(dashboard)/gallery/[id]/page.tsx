import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { toDateInput } from "@/lib/datetime";
import { summarizeMedia } from "@/lib/media-summary";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/ui";
import { AlbumForm } from "../album-form";
import { AlbumPhotos } from "./album-photos";

export const metadata: Metadata = { title: "Edit album" };

export default async function EditAlbumPage({ params }: PageProps<"/admin/gallery/[id]">) {
  await requireAdminPage("gallery.manage");
  const { id } = await params;
  const album = await db.galleryAlbum.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" }, include: { media: true } } },
  });
  if (!album) notFound();

  return (
    <>
      <PageHeader
        title={album.title}
        breadcrumbs={[{ label: "Gallery", href: "/admin/gallery" }, { label: "Edit album" }]}
        actions={<StatusBadge status={album.status} />}
      />
      <div className="space-y-8">
        <AlbumPhotos
          albumId={album.id}
          coverImageId={album.coverImageId}
          photos={album.items.map((item) => ({ id: item.id, caption: item.caption ?? "", media: summarizeMedia(item.media) }))}
        />
        <AlbumForm
          defaults={{
            id: album.id,
            title: album.title,
            slug: album.slug,
            description: album.description ?? "",
            category: album.category ?? "",
            date: toDateInput(album.date),
            coverImageId: album.coverImageId ?? "",
            featured: album.featured,
            status: album.status,
          }}
        />
      </div>
    </>
  );
}
