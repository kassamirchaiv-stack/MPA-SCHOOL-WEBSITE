import { publicEnv } from "@/lib/env";

export type MediaRef = {
  bucket: string;
  path: string;
  alt: string;
  width: number | null;
  height: number | null;
};

/** Public URL for an object in a public Supabase Storage bucket. */
export function mediaUrl(media: Pick<MediaRef, "bucket" | "path">): string {
  const path = media.path.split("/").map(encodeURIComponent).join("/");
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${media.bucket}/${path}`;
}

export const mediaSelect = {
  bucket: true,
  path: true,
  alt: true,
  width: true,
  height: true,
} as const;
