import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, GraduationCap, Mail, Newspaper } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Dashboard" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdminPage();
  const { denied } = await searchParams;

  const [programs, articles, drafts, events, newMessages, activity] = await Promise.all([
    db.program.count({ where: { status: "PUBLISHED" } }),
    db.article.count({ where: { status: "PUBLISHED" } }),
    db.article.count({ where: { status: "DRAFT" } }),
    db.event.count({ where: { status: "PUBLISHED", startsAt: { gte: new Date() } } }),
    db.contactSubmission.count({ where: { status: "NEW" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const cards = [
    { label: "Published programs", value: programs, icon: GraduationCap },
    { label: "Published articles", value: articles, note: `${drafts} draft${drafts === 1 ? "" : "s"}`, icon: Newspaper },
    { label: "Upcoming events", value: events, icon: CalendarDays },
    { label: "New messages", value: newMessages, icon: Mail },
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${admin.name.split(" ")[0]}`} description="An overview of the website content." />

      {denied && (
        <p role="alert" className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your role does not have access to that section.
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon }) => (
          <li key={label} className="rounded-lg border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-sm">{label}</span>
              <Icon aria-hidden className="size-4" />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
            {note && <p className="mt-1 text-xs text-zinc-500">{note}</p>}
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="mb-3 font-sans text-base font-semibold">Recent activity</h2>
        {activity.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
            No admin activity recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {activity.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{entry.userEmail ?? "System"}</span>{" "}
                  <span className="text-zinc-600">{entry.summary ?? entry.action}</span>
                </span>
                <time dateTime={entry.createdAt.toISOString()} className="text-xs text-zinc-500">
                  {dateFormat.format(entry.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm">
          <Link href="/" className="text-zinc-600 underline hover:text-zinc-900">
            Open the public website
          </Link>
        </p>
      </section>
    </>
  );
}
