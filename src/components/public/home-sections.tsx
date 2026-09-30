import Image from "next/image";
import Link from "next/link";
import { Quote } from "lucide-react";
import type { HomepageSectionData } from "@/server/queries/content";
import { getHeroSlides, getHighlights, getStatistics } from "@/server/queries/content";
import { getPublishedPrograms } from "@/server/queries/programs";
import { getLatestArticles } from "@/server/queries/news";
import { getUpcomingEvents } from "@/server/queries/events";
import { getGalleryHighlights } from "@/server/queries/gallery";
import type { SiteSettingsData } from "@/server/queries/site";
import { mediaUrl } from "@/lib/media";
import { safeHref } from "@/lib/utils";
import { CmsImage } from "@/components/ui/cms-image";
import { SmartLink } from "@/components/ui/smart-link";
import { SectionHeader } from "./section-header";
import { HeroSlider, type HeroSlideView } from "./hero-slider";
import { CtaBand, FeatureList, HighlightGrid, StatisticsBand } from "./blocks";
import { EventCard, NewsCard, ProgramCard } from "./cards";

export type SectionProps = {
  section: HomepageSectionData;
  settings: SiteSettingsData;
  /** Key of the section rendered just before this one. */
  previousKey?: string;
};

function action(section: HomepageSectionData) {
  return { label: section.ctaLabel, href: section.ctaUrl };
}

function link(label: string | null, href: string | null) {
  const safe = safeHref(href);
  return label && safe ? { label, href: safe } : null;
}

export async function HeroSection({ settings }: SectionProps) {
  const slides = await getHeroSlides();
  const views: HeroSlideView[] = slides.map((slide) => ({
    id: slide.id,
    eyebrow: slide.eyebrow,
    title: slide.title,
    subtitle: slide.subtitle,
    description: slide.description,
    image: slide.image ? { src: mediaUrl(slide.image), alt: slide.image.alt } : null,
    primary: link(slide.primaryLabel, slide.primaryUrl),
    secondary: link(slide.secondaryLabel, slide.secondaryUrl),
  }));
  if (views.length === 0) {
    // No slides configured: a plain branded hero keeps the page's h1.
    views.push({
      id: "fallback",
      eyebrow: null,
      title: settings.schoolName,
      subtitle: settings.tagline,
      description: settings.description,
      image: null,
      primary: link(settings.headerCtaLabel, settings.headerCtaUrl),
      secondary: null,
    });
  }
  return <HeroSlider slides={views} />;
}

export async function StatisticsSection({ previousKey }: SectionProps) {
  const stats = await getStatistics();
  if (stats.length === 0) return null;
  // Overlaps the hero only when it directly follows it.
  const overlap = previousKey === "HERO";
  return (
    <section aria-label="At a glance" className={overlap ? "relative z-10 -mt-10 sm:-mt-14" : "py-16"}>
      <div className="container-site">
        <StatisticsBand stats={stats} />
      </div>
    </section>
  );
}

export function AboutSection({ section, settings }: SectionProps) {
  return (
    <section aria-labelledby="home-about" className="py-20 lg:py-28">
      <div
        className={
          section.image ? "container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20" : "container-site max-w-4xl"
        }
      >
        {section.image && (
          <div className="reveal relative">
            <CmsImage media={section.image} sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[4/3] rounded-card lg:aspect-[5/4]" />
            {settings.foundedYear && (
              <p className="absolute -bottom-6 left-6 bg-accent px-6 py-4 text-on-accent sm:left-auto sm:-right-6">
                <span className="block text-xs font-bold tracking-[0.14em] uppercase">Founded</span>
                <span className="font-display text-3xl">{settings.foundedYear}</span>
              </p>
            )}
          </div>
        )}
        <div>
          <SectionHeader id="home-about" eyebrow={section.eyebrow} title={section.title} className="mb-6 lg:mb-6" />
          {section.description && <p className="text-lg text-muted">{section.description}</p>}
          {settings.vision && (
            <figure className="mt-8 border-l-2 border-accent pl-6">
              <Quote aria-hidden className="size-6 text-accent" />
              <blockquote className="mt-2 font-display text-xl leading-snug sm:text-2xl">{settings.vision}</blockquote>
              <figcaption className="mt-3 text-sm font-semibold tracking-wide text-primary uppercase">Our vision</figcaption>
            </figure>
          )}
          {section.ctaLabel && section.ctaUrl && (
            <SmartLink href={section.ctaUrl} className="btn btn-primary mt-10">
              {section.ctaLabel}
            </SmartLink>
          )}
        </div>
      </div>
    </section>
  );
}

export async function ProgramsSection({ section }: SectionProps) {
  const programs = await getPublishedPrograms(section.itemLimit ?? 3);
  if (programs.length === 0) return null;
  return (
    <section aria-labelledby="home-programs" className="bg-surface py-20 lg:py-28">
      <div className="container-site">
        <SectionHeader id="home-programs" eyebrow={section.eyebrow} title={section.title} description={section.description} action={action(section)} />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <li key={program.id} className="reveal">
              <ProgramCard program={program} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export async function WhyMpaSection({ section }: SectionProps) {
  const items = await getHighlights("WHY_MPA");
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="home-why" className="py-20 lg:py-28">
      <div className="container-site">
        <SectionHeader id="home-why" eyebrow={section.eyebrow} title={section.title} description={section.description} action={action(section)} />
        <HighlightGrid items={items} columns={items.length === 3 ? 3 : 4} />
      </div>
    </section>
  );
}

export async function StudentLifeSection({ section }: SectionProps) {
  const items = await getHighlights("STUDENT_LIFE");
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="home-life" className="bg-secondary py-20 text-on-secondary lg:py-28">
      <div className="container-site">
        <SectionHeader id="home-life" eyebrow={section.eyebrow} title={section.title} description={section.description} action={action(section)} inverted />
        <div className="text-text">
          <FeatureList items={items} />
        </div>
      </div>
    </section>
  );
}

export async function NewsSection({ section }: SectionProps) {
  const articles = await getLatestArticles(section.itemLimit ?? 3);
  if (articles.length === 0) return null;
  return (
    <section aria-labelledby="home-news" className="bg-surface py-20 lg:py-28">
      <div className="container-site">
        <SectionHeader id="home-news" eyebrow={section.eyebrow} title={section.title} description={section.description} action={action(section)} />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id} className="reveal">
              <NewsCard article={article} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export async function EventsSection({ section }: SectionProps) {
  const events = await getUpcomingEvents(section.itemLimit ?? 3);
  if (events.length === 0) return null;
  return (
    <section aria-labelledby="home-events" className="py-20 lg:py-28">
      <div className="container-site">
        <SectionHeader id="home-events" eyebrow={section.eyebrow} title={section.title} description={section.description} action={action(section)} />
        <ul className="grid gap-5 lg:grid-cols-2">
          {events.map((event) => (
            <li key={event.id} className="reveal">
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export async function GallerySection({ section }: SectionProps) {
  const photos = await getGalleryHighlights(section.itemLimit ?? 6);
  if (photos.length === 0) return null;
  return (
    <section aria-labelledby="home-gallery" className="bg-surface py-20 lg:py-28">
      <div className="container-site">
        <SectionHeader id="home-gallery" eyebrow={section.eyebrow} title={section.title} description={section.description} action={action(section)} />
        <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          {photos.map((photo, i) => (
            <li key={photo.id} className={i === 0 ? "col-span-2 row-span-2 lg:col-span-2" : undefined}>
              <Link href={`/gallery/${photo.album.slug}`} className="group relative block aspect-square overflow-hidden rounded-card">
                <Image
                  src={mediaUrl(photo.media)}
                  alt={photo.media.alt || photo.album.title}
                  fill
                  sizes={i === 0 ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, 50vw"}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function CtaSection({ section }: SectionProps) {
  return (
    <CtaBand
      title={section.title}
      description={section.description}
      primary={{ label: section.ctaLabel, href: section.ctaUrl }}
      secondary={{ label: section.secondaryCtaLabel, href: section.secondaryCtaUrl }}
    />
  );
}
