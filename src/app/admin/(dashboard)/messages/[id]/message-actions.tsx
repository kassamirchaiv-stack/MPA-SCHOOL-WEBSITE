"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, CheckCheck, Inbox, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMessage, setMessageStatus } from "@/server/actions/messages";
import { Button, Card } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";

type Status = "NEW" | "READ" | "REPLIED" | "ARCHIVED";

export function MessageActions({ id, status }: { id: string; status: Status }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Opening an unread message marks it as read (done here, not during render,
  // so link prefetching can never mark messages as read).
  // Only once per visit, so "Mark as unread" is not immediately undone.
  const openedAsNew = useRef(status === "NEW");
  useEffect(() => {
    if (!openedAsNew.current) return;
    openedAsNew.current = false;
    void setMessageStatus({ id, status: "READ" }).then(() => router.refresh());
  }, [id, router]);

  const set = (next: Status, message: string) =>
    startTransition(async () => {
      const result = await setMessageStatus({ id, status: next });
      if (result.ok) {
        toast.success(message);
        router.refresh();
      } else toast.error(result.error);
    });

  return (
    <Card title="Actions">
      <div className="flex flex-col gap-2">
        {status !== "REPLIED" && (
          <Button variant="secondary" onClick={() => set("REPLIED", "Marked as replied")} disabled={pending}>
            <CheckCheck aria-hidden className="size-4" /> Mark as replied
          </Button>
        )}
        {status !== "NEW" && status !== "ARCHIVED" && (
          <Button variant="secondary" onClick={() => set("NEW", "Marked as unread")} disabled={pending}>
            <Inbox aria-hidden className="size-4" /> Mark as unread
          </Button>
        )}
        {status !== "ARCHIVED" ? (
          <Button variant="secondary" onClick={() => set("ARCHIVED", "Archived")} disabled={pending}>
            <Archive aria-hidden className="size-4" /> Archive
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => set("READ", "Moved to inbox")} disabled={pending}>
            <Inbox aria-hidden className="size-4" /> Move to inbox
          </Button>
        )}
        <ConfirmButton
          triggerVariant="danger-ghost"
          triggerSize="md"
          title="Delete this message permanently?"
          description="This cannot be undone. Archive it instead to keep a record."
          confirmLabel="Delete permanently"
          confirmText="delete"
          successMessage="Message deleted"
          redirectTo="/admin/messages"
          action={() => deleteMessage({ id })}
        >
          <Trash2 aria-hidden className="size-4" /> Delete
        </ConfirmButton>
      </div>
    </Card>
  );
}
