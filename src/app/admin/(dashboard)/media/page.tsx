import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { summarizeMedia } from "@/lib/media-summary";
import { BUCKETS, BUCKET_NAMES, isBucketName } from "@/lib/storage-config";
import { PageHeader } from "@/components/admin/page-header";
import { AdminPagination, ListToolbar, hrefWith, selectClass } from "@/components/admin/ui";
import { MediaLibrary } from "./media-library";

export const metadata: Metadata = { title: "Media library" };

const PAGE_SIZE = 36;

export default async function MediaPage({ searchParams }: PageProps<"/admin/media">) {
  await requireAdminPage("media.manage");
  const sp = await searchParams;
  const q = typeof sp.q === "string" && sp.q.trim() ? sp.q.trim() : undefined;
  const bucket = typeof sp.bucket === "string" && isBucketName(sp.bucket) ? sp.bucket : undefined;
  const show = sp.show === "archived" ? "archived" : sp.show === "missing-alt" ? "missing-alt" : "active";
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const where = {
    ...(bucket ? { bucket } : {}),
    ...(show === "archived" ? { archivedAt: { not: null } } : { archivedAt: null }),
    ...(show === "missing-alt" ? { alt: "", mimeType: { startsWith: "image/" } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { filename: { contains: q, mode: "insensitive" as const } },
            { alt: { contains: q, mode: "insensitive" as const } },
            { caption: { contains: q, mode: "insensitive" as const } },
            { category: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.media.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.media.count({ where }),
  ]);

  return (
    <>
      <PageHeader title="Media library" description="All uploaded images and documents. Files are stored in Supabase Storage." />
      <ListToolbar
        q={q}
        placeholder="Search name, alt text, caption"
        extra={
          <>
            <label className="contents">
              <span className="sr-only">Folder</span>
              <select name="bucket" defaultValue={bucket ?? ""} className={`${selectClass} w-auto`}>
                <option value="">All folders</option>
                {BUCKET_NAMES.map((b) => (
                  <option key={b} value={b}>
                    {BUCKETS[b].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="contents">
              <span className="sr-only">Show</span>
              <select name="show" defaultValue={show} className={`${selectClass} w-auto`}>
                <option value="active">Active files</option>
                <option value="missing-alt">Images missing alt text</option>
                <option value="archived">Archived files</option>
              </select>
            </label>
          </>
        }
      />
      <MediaLibrary items={rows.map(summarizeMedia)} total={total} defaultBucket={bucket ?? "site-assets"} />
      <AdminPagination
        page={page}
        pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        hrefFor={(p) => hrefWith("/admin/media", { q, bucket, show: show === "active" ? undefined : show, page: p })}
      />
    </>
  );
}
