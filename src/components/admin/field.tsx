import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClass = cn(
  "block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs",
  "placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 focus:outline-none",
  "aria-invalid:border-red-400 aria-invalid:focus:ring-red-100 disabled:bg-zinc-50 disabled:text-zinc-500",
);

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-800">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
