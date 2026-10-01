import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { SYSTEM_PAGES, isSystemPage, pagePath } from "@/lib/pages";
import { formatShortDate } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import { ButtonLink, EmptyRow, StatusBadge, TableWrap, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { deletePage, setPageStatus } from "@/server/actions/pages";

export const metadata: Metadata = { title: "Pages" };

export default async function AdminPagesPage() {
  await requireAdminPage("content.manage");
  const pages = await db.page.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, slug: true, status: true, updatedAt: true } });
  const order = Object.keys(SYSTEM_PAGES);
  const system = pages.filter((p) => isSystemPage(p.slug)).sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
  const custom = pages.filter((p) => !isSystemPage(p.slug));

  const table = (rows: typeof pages, isSystem: boolean) => (
    <TableWrap>
      <table className={tableClass}>
        <thead>
          <tr>
            <th className={thClass}>Page</th>
            <th className={`${thClass} hidden md:table-cell`}>Address</th>
            <th className={thClass}>Status</th>
            <th className={`${thClass} hidden sm:table-cell`}>Updated</th>
            <th className={`${thClass} text-right`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={5}>No custom pages yet. Create one for things like a uniform policy or school calendar.</EmptyRow>}
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-zinc-50">
              <td className={tdClass}>
                <Link href={`/admin/pages/${p.id}`} className="font-medium hover:underline">
                  {isSystem ? SYSTEM_PAGES[p.slug].label : p.title}
                </Link>
              </td>
              <td className={`${tdClass} hidden md:table-cell`}>
                <a href={pagePath(p.slug)} target="_blank" className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-900">
                  {pagePath(p.slug)} <ExternalLink aria-hidden className="size-3" />
                </a>
              </td>
              <td className={tdClass}>
                <StatusBadge status={p.status} />
              </td>
              <td className={`${tdClass} hidden text-zinc-600 sm:table-cell`}>{formatShortDate(p.updatedAt)}</td>
              <td className={`${tdClass} text-right`}>
                <ContentRowActions
                  id={p.id}
                  label={p.title}
                  status={p.status}
                  editHref={`/admin/pages/${p.id}`}
                  previewHref={`/admin/preview/pages/${p.id}`}
                  setStatus={setPageStatus}
                  remove={isSystem ? undefined : deletePage}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );

  return (
    <>
      <PageHeader
        title="Pages"
        description="Text and images for each page of the website."
        actions={
          <ButtonLink href="/admin/pages/new">
            <Plus aria-hidden className="size-4" /> New page
          </ButtonLink>
        }
      />
      <section className="space-y-3">
        <h2 className="font-sans text-sm font-semibold text-zinc-700">Built-in pages</h2>
        {table(system, true)}
      </section>
      <section className="mt-10 space-y-3">
        <h2 className="font-sans text-sm font-semibold text-zinc-700">Custom pages</h2>
        {table(custom, false)}
      </section>
    </>
  );
}
