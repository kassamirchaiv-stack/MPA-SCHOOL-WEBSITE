import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";
import { mediaSelect } from "@/lib/media";
import { publishedWhere } from "./published";

const programCardSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  gradeRange: true,
  category: true,
  featured: true,
  image: { select: mediaSelect },
} as const;

export async function getPublishedPrograms(limit?: number) {
  "use cache";
  cacheTag(TAGS.programs, TAGS.media);
  cacheLife("hours");
  return db.program.findMany({
    where: publishedWhere(),
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    take: limit,
    select: programCardSelect,
  });
}

export type ProgramCardData = Awaited<ReturnType<typeof getPublishedPrograms>>[number];
