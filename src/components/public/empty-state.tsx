import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-border bg-surface px-6 py-14 text-center">
      <Icon aria-hidden className="mx-auto size-8 text-primary/60" />
      <p className="mt-4 font-display text-xl">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-muted">{description}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
