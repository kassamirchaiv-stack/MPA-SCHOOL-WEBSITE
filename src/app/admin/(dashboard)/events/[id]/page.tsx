import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { toDateInput, toLocalInput } from "@/lib/datetime";
import { summarizeOrNull } from "@/lib/media-summary";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/ui";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "Edit event" };

export default async function EditEventPage({ params }: PageProps<"/admin/events/[id]">) {
  await requireAdminPage("events.manage");
  const { id } = await params;
  const event = await db.event.findUnique({ where: { id }, include: { image: true } });
  if (!event) notFound();
  const toInput = event.allDay ? toDateInput : toLocalInput;

  return (
    <>
      <PageHeader
        title={event.title}
        breadcrumbs={[{ label: "Events", href: "/admin/events" }, { label: "Edit event" }]}
        actions={<StatusBadge status={event.status} />}
      />
      <EventForm
        image={summarizeOrNull(event.image)}
        defaults={{
          id: event.id,
          title: event.title,
          slug: event.slug,
          excerpt: event.excerpt ?? "",
          description: event.description as never,
          startsAt: toInput(event.startsAt),
          endsAt: toInput(event.endsAt),
          allDay: event.allDay,
          location: event.location ?? "",
          registrationUrl: event.registrationUrl ?? "",
          imageId: event.imageId ?? "",
          featured: event.featured,
          status: event.status,
          seoTitle: event.seoTitle ?? "",
          seoDescription: event.seoDescription ?? "",
        }}
      />
    </>
  );
}
