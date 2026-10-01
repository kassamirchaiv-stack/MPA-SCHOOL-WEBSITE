import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { telHref } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { Card, StatusBadge, buttonClass } from "@/components/admin/ui";
import { MessageActions } from "./message-actions";

export const metadata: Metadata = { title: "Message" };

const dateTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Addis_Ababa" });

export default async function MessagePage({ params }: PageProps<"/admin/messages/[id]">) {
  await requireAdminPage("messages.manage");
  const { id } = await params;
  const message = await db.contactSubmission.findUnique({ where: { id } });
  if (!message) notFound();
  const replySubject = encodeURIComponent(`Re: ${message.subject}`);

  return (
    <>
      <PageHeader
        title={message.subject}
        breadcrumbs={[{ label: "Messages", href: "/admin/messages" }, { label: message.name }]}
        actions={<StatusBadge status={message.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <Card>
          <p className="mb-4 text-xs text-zinc-500">Received {dateTime.format(message.createdAt)}</p>
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-800">{message.message}</div>
        </Card>
        <div className="space-y-6">
          <Card title="From">
            <p className="font-medium">{message.name}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href={`mailto:${message.email}`} className="inline-flex items-center gap-2 break-all text-zinc-700 hover:underline">
                  <Mail aria-hidden className="size-4 shrink-0" /> {message.email}
                </a>
              </li>
              {message.phone && (
                <li>
                  <a href={telHref(message.phone)} className="inline-flex items-center gap-2 text-zinc-700 hover:underline">
                    <Phone aria-hidden className="size-4 shrink-0" /> {message.phone}
                  </a>
                </li>
              )}
            </ul>
            <a href={`mailto:${message.email}?subject=${replySubject}`} className={`${buttonClass("primary")} mt-4 w-full`}>
              Reply by email
            </a>
          </Card>
          <MessageActions id={message.id} status={message.status} />
        </div>
      </div>
    </>
  );
}
