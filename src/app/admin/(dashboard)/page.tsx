import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CalendarPlus, FilePlus2, GraduationCap, ImagePlus, Mail, Newspaper, Upload } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/admin/page-header";
import { Card, StatusBadge } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Dashboard" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa" });

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdminPage();
  const { denied } = await searchParams;
  const can = (p: Parameters<typeof hasPermission>[1]) => hasPermission(admin.role, p);

  const [programs, articles, drafts, events, newMessages, recentMessages, draftArticles, activity] = await Promise.all([
    db.program.count({ where: { status: "PUBLISHED" } }),
    db.article.count({ where: { status: "PUBLISHED" } }),
    db.article.count({ where: { status: "DRAFT" } }),
    db.event.count({ where: { status: "PUBLISHED", startsAt: { gte: new Date() } } }),
    db.contactSubmission.count({ where: { status: "NEW" } }),
    db.contactSubmission.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.article.findMany({ where: { status: "DRAFT" }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, updatedAt: true } }),
    can("audit.view") ? db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }) : Promise.resolve([]),
  ]);

  const stats = [
    { label: "Published programs", value: programs, icon: GraduationCap, href: "/admin/programs" },
    { label: "Published articles", value: articles, note: `${drafts} draft${drafts === 1 ? "" : "s"}`, icon: Newspaper, href: "/admin/news" },
    { label: "Upcoming events", value: events, icon: CalendarDays, href: "/admin/events" },
    { label: "Unread messages", value: newMessages, icon: Mail, href: "/admin/messages?filter=NEW" },
  ];

  const quick = [
    can("news.manage") && { label: "Write news", href: "/admin/news/new", icon: FilePlus2 },
    can("events.manage") && { label: "Add event", href: "/admin/events/new", icon: CalendarPlus },
    can("gallery.manage") && { label: "New photo album", href: "/admin/gallery/new", icon: ImagePlus },
    can("media.manage") && { label: "Upload files", href: "/admin/media", icon: Upload },
  ].filter(Boolean) as { label: string; href: string; icon: typeof Upload }[];

  return (
    <>
      <PageHeader title={`Welcome, ${admin.name.split(" ")[0]}`} description="An overview of the website content." />

      {denied && (
        <p role="alert" className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your role does not have access to that section.
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon, href }) => (
          <li key={label}>
            <Link href={href} className="block rounded-lg border border-zinc-200 bg-white p-5 hover:border-zinc-400">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-sm">{label}</span>
                <Icon aria-hidden className="size-4" />
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
              {note && <p className="mt-1 text-xs text-zinc-500">{note}</p>}
            </Link>
          </li>
        ))}
      </ul>

      {quick.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2">
          {quick.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium hover:bg-zinc-50">
                <Icon aria-hidden className="size-4" /> {label}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {can("messages.manage") && (
          <Card title="Latest messages" actions={<Link href="/admin/messages" className="text-xs font-medium text-zinc-600 hover:underline">All messages</Link>}>
            {recentMessages.length === 0 ? (
              <p className="text-sm text-zinc-500">No messages yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 text-sm">
                {recentMessages.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/admin/messages/${m.id}`} className={`min-w-0 truncate hover:underline ${m.status === "NEW" ? "font-semibold" : ""}`}>
                      {m.name} — {m.subject}
                    </Link>
                    {m.status === "NEW" && <StatusBadge status="NEW" label="Unread" />}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
        {can("news.manage") && (
          <Card title="Draft articles" actions={<Link href="/admin/news?status=DRAFT" className="text-xs font-medium text-zinc-600 hover:underline">All drafts</Link>}>
            {draftArticles.length === 0 ? (
              <p className="text-sm text-zinc-500">No drafts.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 text-sm">
                {draftArticles.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/admin/news/${a.id}`} className="min-w-0 truncate hover:underline">
                      {a.title}
                    </Link>
                    <time className="shrink-0 text-xs text-zinc-500" dateTime={a.updatedAt.toISOString()}>
                      {dateFormat.format(a.updatedAt)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      {can("audit.view") && (
        <section className="mt-8">
          <Card title="Recent activity" actions={<Link href="/admin/activity" className="text-xs font-medium text-zinc-600 hover:underline">Activity log</Link>}>
            {activity.length === 0 ? (
              <p className="text-sm text-zinc-500">No admin activity recorded yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 text-sm">
                {activity.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                    <span>
                      <span className="font-medium">{entry.userEmail ?? "System"}</span> <span className="text-zinc-600">{entry.summary ?? entry.action}</span>
                    </span>
                    <time dateTime={entry.createdAt.toISOString()} className="text-xs text-zinc-500">
                      {dateFormat.format(entry.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      )}
    </>
  );
}
