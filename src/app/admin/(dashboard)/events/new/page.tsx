import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/page-header";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "New event" };

export default async function NewEventPage() {
  await requireAdminPage("events.manage");
  return (
    <>
      <PageHeader title="New event" breadcrumbs={[{ label: "Events", href: "/admin/events" }, { label: "New event" }]} />
      <EventForm
        defaults={{
          title: "",
          slug: "",
          excerpt: "",
          description: null,
          startsAt: "",
          endsAt: "",
          allDay: false,
          location: "",
          registrationUrl: "",
          imageId: "",
          featured: false,
          status: "DRAFT",
          seoTitle: "",
          seoDescription: "",
        }}
      />
    </>
  );
}
