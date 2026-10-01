import { mediaUrl } from "@/lib/media";

export type MediaSummary = {
  id: string;
  url: string;
  title: string;
  alt: string;
  caption: string | null;
  category: string | null;
  bucket: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  size: number;
  archived: boolean;
  createdAt: string;
};

export type MediaRow = {
  id: string;
  bucket: string;
  path: string;
  title: string;
  alt: string;
  caption: string | null;
  category: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  size: number;
  archivedAt: Date | null;
  createdAt: Date;
};

/** Serializable view of a Media row for admin UI (pickers, thumbnails). */
export function summarizeMedia(m: MediaRow): MediaSummary {
  return {
    id: m.id,
    url: mediaUrl(m),
    title: m.title,
    alt: m.alt,
    caption: m.caption,
    category: m.category,
    bucket: m.bucket,
    mimeType: m.mimeType,
    width: m.width,
    height: m.height,
    size: m.size,
    archived: Boolean(m.archivedAt),
    createdAt: m.createdAt.toISOString(),
  };
}

export function summarizeOrNull(m: MediaRow | null | undefined): MediaSummary | null {
  return m ? summarizeMedia(m) : null;
}
