"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonClass, inputClass, type ButtonVariant } from "./ui";
import { useFieldId } from "@/components/admin/use-field-id";

type Result = { ok: boolean; error?: string };

type Props = {
  /** Trigger button content. */
  children: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  variant?: ButtonVariant;
  triggerVariant?: ButtonVariant;
  triggerSize?: "sm" | "md" | "icon";
  triggerLabel?: string;
  /** Require typing this word before confirming (for permanent deletion). */
  confirmText?: string;
  successMessage?: string;
  redirectTo?: string;
  action: () => Promise<Result>;
};

/** Button that asks for confirmation in a modal dialog before running a server action. */
export function ConfirmButton({
  children,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
  triggerVariant = "secondary",
  triggerSize = "sm",
  triggerLabel,
  confirmText,
  successMessage,
  redirectTo,
  action,
}: Props) {
  const fid = useFieldId();
  const ref = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = () =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error ?? "Something went wrong");
        return;
      }
      ref.current?.close();
      if (successMessage) toast.success(successMessage);
      if (redirectTo) router.push(redirectTo);
    });

  const blocked = confirmText ? typed.trim().toLowerCase() !== confirmText.toLowerCase() : false;

  return (
    <>
      <Button
        variant={triggerVariant}
        size={triggerSize}
        aria-label={triggerLabel}
        title={triggerLabel}
        onClick={() => {
          setTyped("");
          ref.current?.showModal();
        }}
      >
        {children}
      </Button>
      <dialog
        ref={ref}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40"
        aria-labelledby={fid("confirm-title")}
      >
        <div className="space-y-3 p-6">
          <h2 id={fid("confirm-title")} className="font-sans text-base font-semibold">
            {title}
          </h2>
          {description && <div className="text-sm text-zinc-600">{description}</div>}
          {confirmText && (
            <label className="block space-y-1.5 text-sm">
              <span>
                Type <strong>{confirmText}</strong> to confirm.
              </span>
              <input value={typed} onChange={(e) => setTyped(e.target.value)} className={inputClass} autoComplete="off" />
            </label>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-6 py-3">
          <button type="button" className={buttonClass("secondary")} onClick={() => ref.current?.close()} disabled={pending}>
            Cancel
          </button>
          <button type="button" className={buttonClass(variant)} onClick={run} disabled={pending || blocked}>
            {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
