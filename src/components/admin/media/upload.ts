"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createUploadTarget, registerUpload, type MediaSummary } from "@/server/actions/media";

async function imageSize(file: File): Promise<{ width: number | null; height: number | null }> {
  if (!file.type.startsWith("image/") || file.type === "image/x-icon") return { width: null, height: null };
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: null, height: null };
  }
}

/**
 * Uploads one file: asks the server for a signed upload URL, sends the file
 * straight to Supabase Storage, then registers it (the server re-checks type/size).
 */
export async function uploadFile(file: File, bucket: string, category?: string): Promise<MediaSummary> {
  const target = await createUploadTarget({ bucket, filename: file.name, mimeType: file.type, size: file.size });
  if (!target.ok) throw new Error(target.error);

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(target.data.bucket)
    .uploadToSignedUrl(target.data.path, target.data.token, file, { contentType: file.type });
  if (error) throw new Error(`${file.name}: upload failed (${error.message})`);

  const { width, height } = await imageSize(file);
  const registered = await registerUpload({
    bucket: target.data.bucket,
    path: target.data.path,
    filename: file.name,
    width,
    height,
    alt: "",
    category: category ?? "",
  });
  if (!registered.ok) throw new Error(registered.error);
  return registered.data;
}
