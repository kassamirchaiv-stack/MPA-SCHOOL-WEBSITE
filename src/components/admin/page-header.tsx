import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 space-y-3">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-zinc-500">
            {breadcrumbs.map((crumb, i) => (
              <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight aria-hidden className="size-3.5" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-zinc-900">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-zinc-700">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-zinc-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
