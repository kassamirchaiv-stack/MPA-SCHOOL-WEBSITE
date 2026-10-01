import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export { inputClass, selectClass, textareaClass } from "./ui";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
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

export function CheckboxField({
  id,
  label,
  description,
  ...props
}: React.ComponentProps<"input"> & { id: string; label: string; description?: string }) {
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" className="mt-0.5 size-4 rounded border-zinc-300 accent-zinc-900" {...props} />
      <label htmlFor={id} className="text-sm">
        <span className="font-medium text-zinc-800">{label}</span>
        {description && <span className="block text-xs text-zinc-500">{description}</span>}
      </label>
    </div>
  );
}
