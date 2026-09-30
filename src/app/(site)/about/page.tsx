import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getHighlights, getPage, getPublishedStaff } from "@/server/queries/content";
import { getSiteSettings } from "@/server/queries/site";
import { pageMetadata } from "@/server/page-meta";
import { PageHero } from "@/components/public/page-hero";
import { RichText, hasRichText } from "@/components/public/rich-text";
import { SectionHeader } from "@/components/public/section-header";

export const generateMetadata = () => pageMetadata("about", "/about", "About MPA");

export default async function AboutPage() {
  const [page, settings, campuses, staff] = await Promise.all([
    getPage("about"),
    getSiteSettings(),
    getHighlights("CAMPUS"),
    getPublishedStaff(),
  ]);

  const explore = [
    campuses.length > 0 && { href: "/about/campuses", title: "Our Campuses", text: campuses.map((c) => c.title).join(" · ") },
    staff.length > 0 && { href: "/about/leadership", title: "Leadership & Staff", text: "Meet the people who lead the school." },
    { href: "/programs", title: "Academic Programmes", text: "What and how our students learn." },
    { href: "/admissions", title: "Admissions", text: "How to register a student at MPA." },
  ].filter(Boolean) as { href: string; title: string; text: string }[];

  return (
    <>
      <PageHero
        title={page?.title ?? "About MPA"}
        eyebrow={page?.eyebrow}
        intro={page?.intro}
        image={page?.heroImage}
        breadcrumbs={[{ label: "About", href: "/about" }]}
      />

      {page && hasRichText(page.content) && (
        <section className="py-16 lg:py-24">
          <div className="container-site grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div>
              {settings?.foundedYear && (
                <p className="border-l-2 border-accent pl-5">
                  <span className="block text-sm font-bold tracking-[0.14em] text-primary uppercase">Founded</span>
                  <span className="font-display text-4xl">{settings.foundedYear}</span>
                </p>
              )}
            </div>
            <RichText content={page.content} className="text-lg" />
          </div>
        </section>
      )}

      {(settings?.vision || settings?.mission || (settings?.coreValues.length ?? 0) > 0) && (
        <section aria-labelledby="purpose" className="bg-secondary py-16 text-on-secondary lg:py-24">
          <div className="container-site">
            <SectionHeader id="purpose" eyebrow="Purpose" title="Vision, Mission and Values" inverted />
            <div className="grid gap-px overflow-hidden rounded-card bg-white/15 lg:grid-cols-3">
              {settings?.vision && (
                <div className="bg-secondary p-8">
                  <h3 className="text-2xl text-accent">Vision</h3>
                  <p className="mt-4 text-lg text-on-secondary/90">{settings.vision}</p>
                </div>
              )}
              {settings?.mission && (
                <div className="bg-secondary p-8">
                  <h3 className="text-2xl text-accent">Mission</h3>
                  <p className="mt-4 text-lg text-on-secondary/90">{settings.mission}</p>
                </div>
              )}
              {settings && settings.coreValues.length > 0 && (
                <div className="bg-secondary p-8">
                  <h3 className="text-2xl text-accent">Core values</h3>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {settings.coreValues.map((value) => (
                      <li key={value} className="border border-white/25 px-3 py-1.5 text-[0.95rem]">
                        {value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="explore" className="py-16 lg:py-24">
        <div className="container-site">
          <SectionHeader id="explore" eyebrow="Explore" title="Learn more about MPA" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {explore.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex h-full flex-col rounded-card border border-border bg-surface p-6 hover:border-primary/50"
                >
                  <span className="font-display text-xl">{item.title}</span>
                  <span className="mt-2 text-muted">{item.text}</span>
                  <ArrowRight aria-hidden className="mt-auto size-5 pt-4 text-primary transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
