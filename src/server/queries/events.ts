import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";
import { mediaSelect } from "@/lib/media";
import { publishedWhere } from "./published";

const eventCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  startsAt: true,
  endsAt: true,
  allDay: true,
  location: true,
  featured: true,
  image: { select: mediaSelect },
} as const;

/** An event is "upcoming" until it has ended (or until its start, if it has no end). */
function upcomingWhere(now: Date) {
  return {
    AND: [publishedWhere(), { OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: startOfDay(now) } }] }],
  };
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function getUpcomingEvents(limit?: number) {
  "use cache";
  cacheTag(TAGS.events, TAGS.media);
  cacheLife("hours");
  return db.event.findMany({
    where: upcomingWhere(new Date()),
    orderBy: { startsAt: "asc" },
    take: limit,
    select: eventCardSelect,
  });
}

export type EventCardData = Awaited<ReturnType<typeof getUpcomingEvents>>[number];

export async function getPastEvents(limit = 12) {
  "use cache";
  cacheTag(TAGS.events, TAGS.media);
  cacheLife("hours");
  const now = new Date();
  return db.event.findMany({
    where: {
      AND: [publishedWhere(), { OR: [{ endsAt: { lt: now } }, { endsAt: null, startsAt: { lt: startOfDay(now) } }] }],
    },
    orderBy: { startsAt: "desc" },
    take: limit,
    select: eventCardSelect,
  });
}

export async function getEvent(slug: string) {
  "use cache";
  cacheTag(TAGS.events, TAGS.media);
  cacheLife("hours");
  return db.event.findFirst({
    where: { slug, ...publishedWhere() },
    include: { image: { select: mediaSelect } },
  });
}

export type EventData = NonNullable<Awaited<ReturnType<typeof getEvent>>>;

export async function getEventSlugs() {
  "use cache";
  cacheTag(TAGS.events);
  cacheLife("hours");
  return db.event.findMany({ where: publishedWhere(), orderBy: { startsAt: "desc" }, take: 50, select: { slug: true } });
}
