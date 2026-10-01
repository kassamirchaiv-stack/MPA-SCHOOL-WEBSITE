import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { formatEventWhen } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import {
  AdminPagination,
  ButtonLink,
  EmptyRow,
  ListToolbar,
  STATUS_OPTIONS,
  StatusBadge,
  TableWrap,
  hrefWith,
  listParams,
  selectClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { deleteEvent, setEventStatus } from "@/server/actions/events";

export const metadata: Metadata = { title: "Events" };

const PAGE_SIZE = 20;

export default async function AdminEventsPage({ searchParams }: PageProps<"/admin/events">) {
  await requireAdminPage("events.manage");
  const sp = await searchParams;
  const { q, status, page } = listParams(sp);
  const when = sp.when === "past" ? "past" : sp.when === "all" ? "all" : "upcoming";
  const now = new Date();

  const where = {
    ...(status ? { status } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    ...(when === "upcoming" ? { OR: [{ startsAt: { gte: now } }, { endsAt: { gte: now } }] } : {}),
    ...(when === "past" ? { startsAt: { lt: now }, OR: [{ endsAt: null }, { endsAt: { lt: now } }] } : {}),
  };
  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { startsAt: when === "past" ? "desc" : "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, title: true, slug: true, status: true, startsAt: true, endsAt: true, allDay: true, location: true },
    }),
    db.event.count({ where }),
  ]);

  return (
    <>
      <PageHeader
        title="Events"
        description="School events shown on the Events page and homepage."
        actions={
          <ButtonLink href="/admin/events/new">
            <Plus aria-hidden className="size-4" /> New event
          </ButtonLink>
        }
      />
      <ListToolbar
        q={q}
        status={status}
        statusOptions={STATUS_OPTIONS}
        placeholder="Search events"
        extra={
          <>
            <label className="contents">
              <span className="sr-only">Time</span>
              <select name="when" defaultValue={when} className={`${selectClass} w-auto`}>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="all">All dates</option>
              </select>
            </label>
          </>
        }
      />
      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Event</th>
              <th className={`${thClass} hidden md:table-cell`}>When</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && <EmptyRow colSpan={4}>No {when === "all" ? "" : when} events found.</EmptyRow>}
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-zinc-50">
                <td className={tdClass}>
                  <Link href={`/admin/events/${e.id}`} className="font-medium hover:underline">
                    {e.title}
                  </Link>
                  {e.location && <p className="text-xs text-zinc-500">{e.location}</p>}
                </td>
                <td className={`${tdClass} hidden text-zinc-600 md:table-cell`}>{formatEventWhen(e)}</td>
                <td className={tdClass}>
                  <StatusBadge status={e.status} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <ContentRowActions
                    id={e.id}
                    label={e.title}
                    status={e.status}
                    editHref={`/admin/events/${e.id}`}
                    previewHref={`/admin/preview/events/${e.id}`}
                    setStatus={setEventStatus}
                    remove={deleteEvent}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <AdminPagination
        page={page}
        pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        hrefFor={(p) => hrefWith("/admin/events", { q, status, when, page: p })}
      />
    </>
  );
}
