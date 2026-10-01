import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { mediaSelect } from "@/lib/media";
import { EventView } from "@/components/public/event-view";

export default async function PreviewEvent({ params }: PageProps<"/admin/preview/events/[id]">) {
  await requireAdminPage("events.manage");
  const { id } = await params;
  const event = await db.event.findUnique({ where: { id }, include: { image: { select: mediaSelect } } });
  if (!event) notFound();
  return <EventView event={event} />;
}
