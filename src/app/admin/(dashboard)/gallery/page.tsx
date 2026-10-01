import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { mediaUrl } from "@/lib/media";
import { formatShortDate } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import { ButtonLink, EmptyRow, StatusBadge, TableWrap, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { deleteAlbum, setAlbumStatus } from "@/server/actions/gallery";

export const metadata: Metadata = { title: "Gallery" };

export default async function AdminGalleryPage() {
  await requireAdminPage("gallery.manage");
  const albums = await db.galleryAlbum.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      coverImage: true,
      items: { take: 1, orderBy: { sortOrder: "asc" }, include: { media: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Gallery"
        description="Photo albums. The order here is the order on the Gallery page."
        actions={
          <ButtonLink href="/admin/gallery/new">
            <Plus aria-hidden className="size-4" /> New album
          </ButtonLink>
        }
      />
      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Order</th>
              <th className={thClass}>Album</th>
              <th className={`${thClass} hidden sm:table-cell`}>Photos</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {albums.length === 0 && <EmptyRow colSpan={5}>No albums yet. Create one and upload photos.</EmptyRow>}
            {albums.map((a, i) => {
              const cover = a.coverImage ?? a.items[0]?.media;
              return (
                <tr key={a.id} className="hover:bg-zinc-50">
                  <td className={`${tdClass} w-24`}>
                    <ReorderButtons model="galleryAlbum" id={a.id} label={a.title} isFirst={i === 0} isLast={i === albums.length - 1} />
                  </td>
                  <td className={tdClass}>
                    <Link href={`/admin/gallery/${a.id}`} className="flex items-center gap-3">
                      <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-zinc-100">
                        {cover ? (
                          <Image src={mediaUrl(cover)} alt="" fill sizes="64px" className="object-cover" />
                        ) : (
                          <ImageIcon aria-hidden className="absolute inset-0 m-auto size-5 text-zinc-400" />
                        )}
                      </span>
                      <span>
                        <span className="block font-medium hover:underline">{a.title}</span>
                        <span className="block text-xs text-zinc-500">{a.date ? formatShortDate(a.date) : `/gallery/${a.slug}`}</span>
                      </span>
                    </Link>
                  </td>
                  <td className={`${tdClass} hidden text-zinc-600 sm:table-cell`}>{a._count.items}</td>
                  <td className={tdClass}>
                    <StatusBadge status={a.status} />
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <ContentRowActions id={a.id} label={a.title} status={a.status} editHref={`/admin/gallery/${a.id}`} setStatus={setAlbumStatus} remove={deleteAlbum} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
