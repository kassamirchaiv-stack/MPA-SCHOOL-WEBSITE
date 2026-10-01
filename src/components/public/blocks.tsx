import { ChevronDown } from "lucide-react";
import type { Statistic } from "@/generated/prisma/client";
import type { FaqData, HighlightData } from "@/server/queries/content";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { SmartLink } from "@/components/ui/smart-link";
import { CmsImage } from "@/components/ui/cms-image";

export function StatisticsBand({ stats }: { stats: Statistic[] }) {
  if (stats.length === 0) return null;
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border",
        stats.length >= 4 ? "lg:grid-cols-4" : stats.length === 3 ? "lg:grid-cols-3" : "",
      )}
    >
      {stats.map((stat) => {
        const Icon = getIcon(stat.icon);
        return (
          <div key={stat.id} className="flex flex-col gap-2 bg-surface p-6 sm:p-8">
            <Icon aria-hidden className="size-5 text-accent" />
            <dd className="order-first font-display text-3xl text-primary sm:text-4xl">{stat.value}</dd>
            <dt className="text-[0.95rem] leading-snug font-medium text-muted">{stat.label}</dt>
          </div>
        );
      })}
    </dl>
  );
}

/** Icon + title + text grid, used for "Why MPA" strengths and student life areas. */
export function HighlightGrid({ items, columns = 4 }: { items: HighlightData[]; columns?: 2 | 3 | 4 }) {
  if (items.length === 0) return null;
  return (
    <ul
      className={cn(
        "grid gap-x-10 gap-y-12 sm:grid-cols-2",
        columns === 4 && "lg:grid-cols-4",
        columns === 3 && "lg:grid-cols-3",
      )}
    >
      {items.map((item) => {
        const Icon = getIcon(item.icon);
        return (
          <li key={item.id} className="reveal border-t-2 border-accent pt-6">
            <Icon aria-hidden className="size-7 text-primary" strokeWidth={1.6} />
            <h3 className="mt-5 text-xl">
              {item.href ? (
                <SmartLink href={item.href} className="hover:text-primary">
                  {item.title}
                </SmartLink>
              ) : (
                item.title
              )}
            </h3>
            {item.subtitle && <p className="mt-1 text-sm font-semibold text-primary">{item.subtitle}</p>}
            {item.text && <p className="mt-3 text-muted">{item.text}</p>}
          </li>
        );
      })}
    </ul>
  );
}

/** Larger feature rows with optional images — student life areas and campuses. */
export function FeatureList({ items }: { items: HighlightData[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="grid gap-6 md:grid-cols-2">
      {items.map((item) => {
        const Icon = getIcon(item.icon);
        return (
          <li key={item.id} className="reveal flex flex-col overflow-hidden rounded-card border border-border bg-surface">
            {item.image && <CmsImage media={item.image} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/9]" />}
            <div className="flex flex-1 gap-5 p-6 sm:p-8">
              {!item.image && (
                <span className="grid size-12 shrink-0 place-items-center rounded-card bg-primary/10 text-primary">
                  <Icon aria-hidden className="size-6" />
                </span>
              )}
              <div>
                <h3 className="text-2xl">{item.title}</h3>
                {item.subtitle && <p className="mt-1 font-semibold text-primary">{item.subtitle}</p>}
                {item.text && <p className="mt-3 text-muted">{item.text}</p>}
                {item.href && (
                  <SmartLink href={item.href} className="mt-4 inline-block font-semibold text-primary underline-offset-4 hover:underline">
                    Learn more
                  </SmartLink>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Numbered process, used for admission steps. */
export function StepList({ steps }: { steps: HighlightData[] }) {
  if (steps.length === 0) return null;
  return (
    <ol className="grid gap-px overflow-hidden rounded-card border border-border bg-border md:grid-cols-3">
      {steps.map((step, i) => (
        <li key={step.id} className="bg-surface p-6 sm:p-8">
          <span className="font-display text-5xl text-primary">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="mt-4 text-xl">{step.title}</h3>
          {step.text && <p className="mt-2 text-muted">{step.text}</p>}
        </li>
      ))}
    </ol>
  );
}

type CtaProps = {
  title?: string | null;
  description?: string | null;
  primary?: { label: string | null; href: string | null };
  secondary?: { label: string | null; href: string | null };
};

export function CtaBand({ title, description, primary, secondary }: CtaProps) {
  if (!title) return null;
  return (
    <section className="bg-primary text-on-primary">
      <div className="container-site flex flex-col gap-8 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl">{title}</h2>
          {description && <p className="mt-4 text-lg text-on-primary/85">{description}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          {primary?.label && primary.href && (
            <SmartLink href={primary.href} className="btn btn-accent">
              {primary.label}
            </SmartLink>
          )}
          {secondary?.label && secondary.href && (
            <SmartLink href={secondary.href} className="btn btn-outline">
              {secondary.label}
            </SmartLink>
          )}
        </div>
      </div>
    </section>
  );
}

/** Native <details> accordion: accessible and works without JavaScript. */
export function FaqList({ faqs }: { faqs: FaqData[] }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {faqs.map((faq) => (
        <details key={faq.id} className="group py-1">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left font-display text-lg sm:text-xl [&::-webkit-details-marker]:hidden">
            {faq.question}
            <ChevronDown aria-hidden className="mt-1 size-5 shrink-0 text-primary transition-transform group-open:rotate-180" />
          </summary>
          <p className="max-w-3xl pb-6 whitespace-pre-line text-muted">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
