/** Loading placeholders shown while dynamic content streams in. */

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-current/10 ${className}`} />;
}

export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="bg-secondary text-on-secondary">
        <div className="container-site space-y-5 py-16 lg:py-20">
          <Bar className="h-4 w-40" />
          <Bar className="h-12 w-3/4 max-w-2xl" />
          <Bar className="h-5 w-full max-w-xl" />
        </div>
      </div>
      <div className="container-site space-y-4 py-16 text-text">
        <Bar className="h-5 w-full max-w-3xl" />
        <Bar className="h-5 w-full max-w-3xl" />
        <Bar className="h-5 w-2/3 max-w-2xl" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul aria-busy="true" aria-label="Loading" className="grid gap-6 text-text sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-card border border-border bg-surface">
          <Bar className="aspect-[16/10] rounded-none" />
          <div className="space-y-3 p-6">
            <Bar className="h-3 w-24" />
            <Bar className="h-6 w-4/5" />
            <Bar className="h-4 w-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}
