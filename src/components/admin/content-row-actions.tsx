"use client";

import Link from "next/link";
import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Eye, MoreHorizontal, Pencil, Send, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui";
import { ConfirmButton } from "./confirm-button";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type Result = { ok: true } | { ok: false; error: string };

type Props = {
  id: string;
  label: string;
  status: Status;
  editHref?: string;
  previewHref?: string;
  setStatus?: (input: { id: string; status: Status }) => Promise<Result>;
  remove?: (input: { id: string }) => Promise<Result>;
};

/** Row actions for publishable content: edit, preview, publish/unpublish, archive, delete. */
export function ContentRowActions({ id, label, status, editHref, previewHref, setStatus, remove }: Props) {
  const router = useRouter();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [pending, startTransition] = useTransition();

  const change = (next: Status, message: string) =>
    startTransition(async () => {
      if (!setStatus) return;
      const result = await setStatus({ id, status: next });
      if (menuRef.current) menuRef.current.open = false;
      if (result.ok) {
        toast.success(message);
        router.refresh();
      } else toast.error(result.error);
    });

  return (
    <div className="flex items-center justify-end gap-1">
      {editHref && (
        <Link href={editHref} className="grid size-8 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100" aria-label={`Edit “${label}”`} title="Edit">
          <Pencil aria-hidden className="size-4" />
        </Link>
      )}
      {previewHref && (
        <Link href={previewHref} target="_blank" className="grid size-8 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100" aria-label={`Preview “${label}”`} title="Preview">
          <Eye aria-hidden className="size-4" />
        </Link>
      )}
      {setStatus && (
        <details ref={menuRef} className="relative">
          <summary
            className="grid size-8 cursor-pointer list-none place-items-center rounded-md text-zinc-600 hover:bg-zinc-100 [&::-webkit-details-marker]:hidden"
            aria-label={`More actions for “${label}”`}
            title="More"
          >
            <MoreHorizontal aria-hidden className="size-4" />
          </summary>
          <div className="absolute right-0 z-30 mt-1 w-44 rounded-md border border-zinc-200 bg-white py-1 text-left shadow-lg">
            {status !== "PUBLISHED" && (
              <Button variant="ghost" size="sm" className="w-full justify-start rounded-none" disabled={pending} onClick={() => change("PUBLISHED", "Published")}>
                <Send aria-hidden className="size-4" /> Publish
              </Button>
            )}
            {status === "PUBLISHED" && (
              <Button variant="ghost" size="sm" className="w-full justify-start rounded-none" disabled={pending} onClick={() => change("DRAFT", "Moved to drafts")}>
                <Undo2 aria-hidden className="size-4" /> Unpublish
              </Button>
            )}
            {status !== "ARCHIVED" && (
              <Button variant="ghost" size="sm" className="w-full justify-start rounded-none" disabled={pending} onClick={() => change("ARCHIVED", "Archived")}>
                <Archive aria-hidden className="size-4" /> Archive
              </Button>
            )}
          </div>
        </details>
      )}
      {remove && (
        <ConfirmButton
          triggerVariant="ghost"
          triggerSize="icon"
          triggerLabel={`Delete “${label}”`}
          title={`Delete “${label}” permanently?`}
          description="This cannot be undone. To hide it from the website but keep a record, archive it instead."
          confirmLabel="Delete permanently"
          confirmText="delete"
          successMessage="Deleted"
          action={() => remove({ id })}
        >
          <Trash2 aria-hidden className="size-4 text-red-600" />
        </ConfirmButton>
      )}
    </div>
  );
}
