import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { MediaRef } from "@/lib/media";
import { absoluteUrl } from "@/lib/seo";
import { CmsImage } from "@/components/ui/cms-image";
import { JsonLd } from "./json-ld";

export type Crumb = { label: string; href: string };

type Props = {
  title: string;
  eyebrow?: string | null;
  intro?: string | null;
  /** Trail after "Home"; the last entry is the current page. */
  breadcrumbs: Crumb[];
  image?: MediaRef | null;
  children?: React.ReactNode;
};

export function PageHero({ title, eyebrow, intro, breadcrumbs, image, children }: Props) {
  const trail: Crumb[] = [{ label: "Home", href: "/" }, ...breadcrumbs];
  return (
    <section className="relative overflow-hidden bg-secondary text-on-secondary">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: trail.map((crumb, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: crumb.label,
            item: absoluteUrl(crumb.href),
          })),
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 size-[28rem] rounded-full border-[3rem] border-white/[0.04]"
      />
      <div className="container-site relative grid gap-10 py-14 sm:py-16 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:py-20">
        <div>
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-on-secondary/70">
              {trail.map((crumb, i) => {
                const last = i === trail.length - 1;
                return (
                  <li key={crumb.href} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight aria-hidden className="size-3.5" />}
                    {last ? (
                      <span aria-current="page" className="text-on-secondary">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link href={crumb.href} className="hover:text-accent">
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          {eyebrow && <p className="eyebrow mb-3 text-accent">{eyebrow}</p>}
          <h1 className="max-w-3xl text-4xl sm:text-5xl lg:text-[3.5rem]">{title}</h1>
          {intro && <p className="mt-5 max-w-2xl text-lg text-on-secondary/85 sm:text-xl">{intro}</p>}
          {children}
        </div>
        {image && (
          <CmsImage
            media={image}
            sizes="(min-width: 1024px) 40vw, 100vw"
            priority
            className="aspect-[4/3] rounded-card lg:aspect-[5/4]"
          />
        )}
      </div>
    </section>
  );
}
