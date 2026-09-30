import Link from "next/link";
import { ArrowUpRight, CalendarDays, Images, Mail, MapPin, Phone } from "lucide-react";
import type { ProgramCardData } from "@/server/queries/programs";
import type { ArticleCardData } from "@/server/queries/news";
import type { EventCardData } from "@/server/queries/events";
import type { StaffData } from "@/server/queries/content";
import type { AlbumCardData } from "@/server/queries/gallery";
import { dateBadge, formatDate, formatEventWhen } from "@/lib/format";
import { telHref } from "@/lib/utils";
import { CmsImage } from "@/components/ui/cms-image";

const cardClass =
  "group relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface transition-colors hover:border-primary/40";
const imageHover = "transition-transform duration-500 group-hover:scale-[1.03]";

/** Makes the whole card clickable while keeping a single, meaningful link for screen readers. */
function StretchedLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-accent">
      {children}
    </Link>
  );
}

export function ProgramCard({ program }: { program: ProgramCardData }) {
  return (
    <article className={program.image ? cardClass : `${cardClass} border-t-4 border-t-accent`}>
      {program.image && (
        <CmsImage
          media={program.image}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="aspect-[3/2]"
          imgClassName={imageHover}
        />
      )}
      <div className="flex flex-1 flex-col p-6">
        {program.gradeRange && <p className="eyebrow mb-2 text-[0.72rem]">{program.gradeRange}</p>}
        <h3 className="text-2xl">
          <StretchedLink href={`/programs/${program.slug}`}>{program.title}</StretchedLink>
        </h3>
        {program.shortDescription && <p className="mt-3 text-muted">{program.shortDescription}</p>}
        <span aria-hidden className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-primary">
          Learn more <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </article>
  );
}

export function NewsCard({ article, headingLevel = 3 }: { article: ArticleCardData; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className={article.image ? cardClass : `${cardClass} border-t-4 border-t-accent`}>
      {article.image && (
        <CmsImage
          media={article.image}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="aspect-[16/10]"
          imgClassName={imageHover}
        />
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {article.category && <span className="eyebrow text-[0.72rem]">{article.category.name}</span>}
          {article.publishedAt && (
            <time dateTime={article.publishedAt.toISOString()} className="text-muted">
              {formatDate(article.publishedAt)}
            </time>
          )}
        </div>
        <Heading className="text-xl leading-snug sm:text-[1.4rem]">
          <StretchedLink href={`/news/${article.slug}`}>{article.title}</StretchedLink>
        </Heading>
        {article.excerpt && <p className="mt-3 line-clamp-3 text-muted">{article.excerpt}</p>}
        <span aria-hidden className="mt-auto pt-5 text-sm font-semibold text-primary">
          Read more
        </span>
      </div>
    </article>
  );
}

export function EventCard({ event, headingLevel = 3 }: { event: EventCardData; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const badge = dateBadge(event.startsAt);
  return (
    <article className={`${cardClass} flex-row`}>
      <div className="flex w-20 shrink-0 flex-col items-center justify-center bg-primary px-2 py-5 text-on-primary sm:w-24">
        <span className="font-display text-3xl leading-none sm:text-4xl">{badge.day}</span>
        <span className="mt-1 text-xs font-bold tracking-widest uppercase">{badge.month}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <Heading className="text-xl leading-snug">
          <StretchedLink href={`/events/${event.slug}`}>{event.title}</StretchedLink>
        </Heading>
        <p className="mt-2 flex items-start gap-2 text-sm text-muted">
          <CalendarDays aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <time dateTime={event.startsAt.toISOString()}>{formatEventWhen(event)}</time>
        </p>
        {event.location && (
          <p className="mt-1 flex items-start gap-2 text-sm text-muted">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            {event.location}
          </p>
        )}
        {event.excerpt && <p className="mt-3 line-clamp-2 text-[0.95rem] text-muted">{event.excerpt}</p>}
      </div>
    </article>
  );
}

export function StaffCard({ member }: { member: StaffData }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface">
      <CmsImage
        media={member.photo}
        alt={member.photo?.alt || `Portrait of ${member.name}`}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-[4/5]"
        imgClassName="object-top"
      />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl">{member.name}</h3>
        <p className="mt-1 font-semibold text-primary">{member.position}</p>
        {member.department && <p className="text-sm text-muted">{member.department}</p>}
        {member.biography && <p className="mt-3 text-[0.95rem] text-muted">{member.biography}</p>}
        {(member.email || member.phone) && (
          <ul className="mt-auto space-y-1 pt-4 text-sm">
            {member.email && (
              <li>
                <a href={`mailto:${member.email}`} className="inline-flex items-center gap-2 hover:text-primary">
                  <Mail aria-hidden className="size-4 text-primary" /> {member.email}
                </a>
              </li>
            )}
            {member.phone && (
              <li>
                <a href={telHref(member.phone)} className="inline-flex items-center gap-2 hover:text-primary">
                  <Phone aria-hidden className="size-4 text-primary" /> {member.phone}
                </a>
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}

export function AlbumCard({ album }: { album: AlbumCardData }) {
  const cover = album.coverImage ?? album.items[0]?.media ?? null;
  return (
    <article className="group relative overflow-hidden rounded-card bg-secondary">
      <CmsImage
        media={cover}
        alt=""
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-[4/3]"
        imgClassName={`${imageHover} opacity-90`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <h3 className="text-xl">
          <StretchedLink href={`/gallery/${album.slug}`}>{album.title}</StretchedLink>
        </h3>
        <p className="mt-1 flex items-center gap-2 text-sm text-white/80">
          <Images aria-hidden className="size-4" />
          {album._count.items} photo{album._count.items === 1 ? "" : "s"}
          {album.date && <span>· {formatDate(album.date)}</span>}
        </p>
      </div>
    </article>
  );
}
