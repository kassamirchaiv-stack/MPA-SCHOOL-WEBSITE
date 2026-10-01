import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/page-header";
import { AdminPagination, EmptyRow, TableWrap, hrefWith, selectClass, tableClass, tdClass, thClass, buttonClass } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Activity log" };

const PAGE_SIZE = 50;
const dateTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa" });

export default async function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  await requireAdminPage("audit.view");
  const sp = await searchParams;
  const entity = typeof sp.entity === "string" && sp.entity ? sp.entity : undefined;
  const user = typeof sp.user === "string" && sp.user ? sp.user : undefined;
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const where = { ...(entity ? { entity } : {}), ...(user ? { userEmail: user } : {}) };
  const [entries, total, entities, users] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.auditLog.count({ where }),
    db.auditLog.findMany({ distinct: ["entity"], select: { entity: true }, orderBy: { entity: "asc" } }),
    db.auditLog.findMany({ distinct: ["userEmail"], select: { userEmail: true }, where: { userEmail: { not: null } }, orderBy: { userEmail: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Activity log" description="A read-only record of changes made in the admin." />
      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <label className="contents">
          <span className="sr-only">Type</span>
          <select name="entity" defaultValue={entity ?? ""} className={`${selectClass} w-auto`}>
            <option value="">All types</option>
            {entities.map((e) => (
              <option key={e.entity} value={e.entity}>
                {e.entity}
              </option>
            ))}
          </select>
        </label>
        <label className="contents">
          <span className="sr-only">User</span>
          <select name="user" defaultValue={user ?? ""} className={`${selectClass} w-auto`}>
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.userEmail} value={u.userEmail ?? ""}>
                {u.userEmail}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={buttonClass("secondary")}>
          Filter
        </button>
      </form>
      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>When</th>
              <th className={thClass}>Who</th>
              <th className={thClass}>What</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && <EmptyRow colSpan={3}>No activity recorded.</EmptyRow>}
            {entries.map((e) => (
              <tr key={e.id}>
                <td className={`${tdClass} whitespace-nowrap text-zinc-600`}>{dateTime.format(e.createdAt)}</td>
                <td className={`${tdClass} text-zinc-600`}>{e.userEmail ?? "System"}</td>
                <td className={tdClass}>
                  {e.summary ?? e.action}
                  <span className="ml-2 text-xs text-zinc-500">{e.action}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <AdminPagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))} hrefFor={(p) => hrefWith("/admin/activity", { entity, user, page: p })} />
    </>
  );
}
