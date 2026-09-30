import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  pageCount: number;
  /** Builds the URL for a given page number. */
  hrefFor: (page: number) => string;
};

function pageWindow(page: number, pageCount: number): (number | "…")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? (["…", p] as const) : [p]));
}

export function Pagination({ page, pageCount, hrefFor }: Props) {
  if (pageCount <= 1) return null;
  const itemClass = "grid h-11 min-w-11 place-items-center rounded-btn px-3 text-sm font-semibold";
  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(itemClass, "hover:bg-surface")} aria-label="Previous page">
          <ChevronLeft aria-hidden className="size-4" />
        </Link>
      ) : (
        <span className={cn(itemClass, "opacity-30")} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}
      {pageWindow(page, pageCount).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className={cn(itemClass, "text-muted")} aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={cn(itemClass, p === page ? "bg-primary text-on-primary" : "hover:bg-surface")}
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={cn(itemClass, "hover:bg-surface")} aria-label="Next page">
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span className={cn(itemClass, "opacity-30")} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
