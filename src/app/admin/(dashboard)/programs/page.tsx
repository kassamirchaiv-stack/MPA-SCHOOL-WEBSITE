import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/page-header";
import { ButtonLink, EmptyRow, StatusBadge, TableWrap, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { deleteProgram, setProgramStatus } from "@/server/actions/programs";

export const metadata: Metadata = { title: "Programs" };

export default async function AdminProgramsPage() {
  await requireAdminPage("content.manage");
  const programs = await db.program.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, title: true, slug: true, status: true, gradeRange: true, featured: true },
  });

  return (
    <>
      <PageHeader
        title="Programs"
        description="Academic programmes. The order here is the order on the website."
        actions={
          <ButtonLink href="/admin/programs/new">
            <Plus aria-hidden className="size-4" /> New program
          </ButtonLink>
        }
      />
      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Order</th>
              <th className={thClass}>Program</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {programs.length === 0 && <EmptyRow colSpan={4}>No programs yet.</EmptyRow>}
            {programs.map((p, i) => (
              <tr key={p.id} className="hover:bg-zinc-50">
                <td className={`${tdClass} w-24`}>
                  <ReorderButtons model="program" id={p.id} label={p.title} isFirst={i === 0} isLast={i === programs.length - 1} />
                </td>
                <td className={tdClass}>
                  <Link href={`/admin/programs/${p.id}`} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {p.gradeRange ?? `/programs/${p.slug}`}
                    {p.featured && " · Featured"}
                  </p>
                </td>
                <td className={tdClass}>
                  <StatusBadge status={p.status} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <ContentRowActions
                    id={p.id}
                    label={p.title}
                    status={p.status}
                    editHref={`/admin/programs/${p.id}`}
                    previewHref={`/admin/preview/programs/${p.id}`}
                    setStatus={setProgramStatus}
                    remove={deleteProgram}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
