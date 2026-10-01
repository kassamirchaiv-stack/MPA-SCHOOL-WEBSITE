"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";
import { Button, buttonClass } from "./ui";
import { useFieldId } from "@/components/admin/use-field-id";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  pending?: boolean;
  submitLabel?: string;
  wide?: boolean;
  children: ReactNode;
};

/** Modal form (native <dialog>: focus trap and Escape handling are built in). */
export function FormDialog({ open, onClose, title, onSubmit, pending, submitLabel = "Save", wide, children }: Props) {
  const fid = useFieldId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={fid("form-dialog-title")}
      className={`m-auto max-h-[calc(100dvh-2rem)] overflow-hidden rounded-lg bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40 open:flex open:flex-col`}
      style={{ width: `min(${wide ? "44rem" : "32rem"}, calc(100vw - 2rem))` }}
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
          <h2 id={fid("form-dialog-title")} className="font-sans text-base font-semibold">
            {title}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden className="size-4" />
          </Button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">{children}</div>
        <footer className="flex justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-3">
          <button type="button" className={buttonClass("secondary")} onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button type="submit" className={buttonClass("primary")} disabled={pending}>
            {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {submitLabel}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
