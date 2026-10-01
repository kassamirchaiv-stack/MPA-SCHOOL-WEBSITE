import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Buttons ──────────────────────────────────────────────────────────────────

const variants = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-800",
  secondary: "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-zinc-700 hover:bg-zinc-100",
  "danger-ghost": "text-red-700 hover:bg-red-50",
} as const;

const sizes = { sm: "h-8 px-3 text-xs", md: "h-9 px-4 text-sm", icon: "size-9" } as const;

export type ButtonVariant = keyof typeof variants;

export function buttonClass(variant: ButtonVariant = "primary", size: keyof typeof sizes = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: keyof typeof sizes }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: keyof typeof sizes }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

// ─── Form controls ────────────────────────────────────────────────────────────

const control =
  "block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 focus:outline-none aria-invalid:border-red-400 disabled:bg-zinc-50 disabled:text-zinc-500";

export const inputClass = control;
export const textareaClass = cn(control, "min-h-24 resize-y");
export const selectClass = cn(control, "pr-8");

// ─── Layout ───────────────────────────────────────────────────────────────────

export function Card({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-zinc-200 bg-white", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
          <div>
            {title && <h2 className="font-sans text-sm font-semibold text-zinc-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-zinc-500">
        {children}
      </td>
    </tr>
  );
}

export const tableClass = "w-full text-left text-sm";
export const thClass = "border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase";
export const tdClass = "border-b border-zinc-100 px-4 py-3 align-middle";

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">{children}</div>;
}

// ─── Status ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  SCHEDULED: "bg-sky-50 text-sky-700 ring-sky-600/20",
  DRAFT: "bg-zinc-100 text-zinc-700 ring-zinc-500/20",
  ARCHIVED: "bg-amber-50 text-amber-800 ring-amber-600/20",
  NEW: "bg-sky-50 text-sky-700 ring-sky-600/20",
  READ: "bg-zinc-100 text-zinc-700 ring-zinc-500/20",
  REPLIED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  ON: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  OFF: "bg-zinc-100 text-zinc-700 ring-zinc-500/20",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT,
      )}
    >
      {label ?? status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

/** Effective public status: a published item with a future date is "Scheduled". */
export function contentStatus(status: string, publishedAt: Date | null): string {
  if (status === "PUBLISHED" && publishedAt && publishedAt.getTime() > Date.now()) return "SCHEDULED";
  return status;
}

// ─── Toolbar & pagination (plain GET forms — no client JS needed) ─────────────

export function ListToolbar({
  q,
  status,
  statusOptions,
  extra,
  placeholder = "Search…",
}: {
  q?: string;
  status?: string;
  statusOptions?: { value: string; label: string }[];
  extra?: ReactNode;
  placeholder?: string;
}) {
  return (
    <form method="get" className="mb-4 flex flex-wrap items-center gap-2" role="search">
      <label className="contents">
        <span className="sr-only">Search</span>
        <input name="q" defaultValue={q} placeholder={placeholder} className={cn(inputClass, "w-full sm:w-64")} />
      </label>
      {statusOptions && (
        <>
          <label className="contents">
            <span className="sr-only">Status</span>
            <select name="status" defaultValue={status ?? ""} className={cn(selectClass, "w-auto")}>
            <option value="">All statuses</option>
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      {extra}
      <button type="submit" className={buttonClass("secondary")}>
        Filter
      </button>
    </form>
  );
}

export function AdminPagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (p: number) => string }) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm text-zinc-600">
      <span>
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <ButtonLink href={hrefFor(page - 1)} variant="secondary" size="sm">
            Previous
          </ButtonLink>
        ) : null}
        {page < pageCount ? (
          <ButtonLink href={hrefFor(page + 1)} variant="secondary" size="sm">
            Next
          </ButtonLink>
        ) : null}
      </div>
    </nav>
  );
}

export const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

/** Reads common list params (q, status, page) from searchParams. */
export function listParams(sp: Record<string, string | string[] | undefined>) {
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const status = str(sp.status);
  return {
    q: str(sp.q)?.trim() || undefined,
    status: status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status) ? (status as "DRAFT" | "PUBLISHED" | "ARCHIVED") : undefined,
    page: Math.max(1, Number.parseInt(str(sp.page) ?? "1", 10) || 1),
  };
}

export function hrefWith(base: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "" && !(k === "page" && v === 1)) search.set(k, String(v));
  const s = search.toString();
  return s ? `${base}?${s}` : base;
}
