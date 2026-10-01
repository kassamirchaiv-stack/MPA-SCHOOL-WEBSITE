"use client";

import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

type Result = { ok: true; data?: unknown } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Shows the outcome of a server action: success toast, or error toast plus
 * field-level errors mapped back onto the form. Returns true on success.
 */
export function handleResult<T extends FieldValues>(result: Result, setError?: UseFormSetError<T>, successMessage = "Saved"): boolean {
  if (result.ok) {
    toast.success(successMessage);
    return true;
  }
  toast.error(result.error);
  if (setError && result.fieldErrors) {
    for (const [field, message] of Object.entries(result.fieldErrors)) {
      setError(field as Path<T>, { type: "server", message });
    }
  }
  return false;
}
