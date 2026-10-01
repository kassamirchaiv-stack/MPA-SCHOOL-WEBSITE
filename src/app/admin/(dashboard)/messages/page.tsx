import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/page-header";
import { AdminPagination, EmptyRow, StatusBadge, TableWrap, hrefWith, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

const PAGE_SIZE = 25;
const FILTERS = [
  { value: "inbox", label: "Inbox" },
  { value: "NEW", label: "Unread" },
  { value: "REPLIED", label: "Replied" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

const dateTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa" });

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requireAdminPage("messages.manage");
  const sp = await searchParams;
  const filter = FILTERS.some((f) => f.value === sp.filter) ? (sp.filter as (typeof FILTERS)[number]["value"]) : "inbox";
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);
  const q = typeof sp.q === "string" && sp.q.trim() ? sp.q.trim() : undefined;

  const where = {
    ...(filter === "inbox" ? { status: { not: "ARCHIVED" as const } } : { status: filter }),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { subject: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [messages, total] = await Promise.all([
    db.contactSubmission.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.contactSubmission.count({ where }),
  ]);

  return (
    <>
      <PageHeader title="Messages" description="Enquiries sent through the contact form." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Message filters" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={hrefWith("/admin/messages", { filter: f.value === "inbox" ? undefined : f.value })}
              aria-current={f.value === filter ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                f.value === filter ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
              )}
            >
              {f.label}
            </Link>
          ))}
        </nav>
        <form method="get" role="search" className="flex gap-2">
          {filter !== "inbox" && <input type="hidden" name="filter" value={filter} />}
          <label className="contents">
            <span className="sr-only">Search messages</span>
            <input name="q" defaultValue={q} placeholder="Search name, email, subject" className="h-9 w-56 rounded-md border border-zinc-300 px-3 text-sm" />
          </label>
        </form>
      </div>
      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>From</th>
              <th className={thClass}>Subject</th>
              <th className={`${thClass} hidden md:table-cell`}>Received</th>
              <th className={thClass}>Status</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 && <EmptyRow colSpan={4}>No messages here.</EmptyRow>}
            {messages.map((m) => (
              <tr key={m.id} className={cn("hover:bg-zinc-50", m.status === "NEW" && "font-semibold")}>
                <td className={tdClass}>
                  <Link href={`/admin/messages/${m.id}`} className="hover:underline">
                    {m.name}
                  </Link>
                  <p className="text-xs font-normal text-zinc-500">{m.email}</p>
                </td>
                <td className={tdClass}>
                  <Link href={`/admin/messages/${m.id}`} className="line-clamp-1 hover:underline">
                    {m.subject}
                  </Link>
                </td>
                <td className={`${tdClass} hidden font-normal text-zinc-600 md:table-cell`}>{dateTime.format(m.createdAt)}</td>
                <td className={tdClass}>
                  <StatusBadge status={m.status} label={m.status === "NEW" ? "Unread" : undefined} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <AdminPagination
        page={page}
        pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        hrefFor={(p) => hrefWith("/admin/messages", { filter: filter === "inbox" ? undefined : filter, q, page: p })}
      />
    </>
  );
}
