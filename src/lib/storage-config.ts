/**
 * Supabase Storage buckets. Plain module (no server-only) so scripts can import it.
 * SVG is deliberately excluded: it can carry scripts and is served from the same
 * public storage origin.
 */

const MB = 1024 * 1024;

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"] as const;

export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export type BucketConfig = {
  public: boolean;
  allowedMimeTypes: readonly string[];
  maxBytes: number;
  label: string;
};

export const BUCKETS = {
  "site-assets": {
    public: true,
    allowedMimeTypes: [...IMAGE_MIME_TYPES, "image/x-icon", "image/vnd.microsoft.icon"],
    maxBytes: 5 * MB,
    label: "Website images & logos",
  },
  articles: { public: true, allowedMimeTypes: IMAGE_MIME_TYPES, maxBytes: 10 * MB, label: "News images" },
  programs: { public: true, allowedMimeTypes: IMAGE_MIME_TYPES, maxBytes: 10 * MB, label: "Program images" },
  events: { public: true, allowedMimeTypes: IMAGE_MIME_TYPES, maxBytes: 10 * MB, label: "Event images" },
  gallery: { public: true, allowedMimeTypes: IMAGE_MIME_TYPES, maxBytes: 10 * MB, label: "Gallery photos" },
  staff: { public: true, allowedMimeTypes: IMAGE_MIME_TYPES, maxBytes: 5 * MB, label: "Staff photos" },
  // Downloadable forms and brochures linked from public pages.
  documents: { public: true, allowedMimeTypes: DOCUMENT_MIME_TYPES, maxBytes: 20 * MB, label: "Documents" },
} as const satisfies Record<string, BucketConfig>;

export type BucketName = keyof typeof BUCKETS;

export const BUCKET_NAMES = Object.keys(BUCKETS) as BucketName[];

export function isBucketName(value: string): value is BucketName {
  return value in BUCKETS;
}
