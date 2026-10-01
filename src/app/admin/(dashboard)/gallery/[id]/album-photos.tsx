"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MediaSummary } from "@/lib/media-summary";
import { addAlbumPhotos, removeAlbumPhoto, setAlbumCover, updateAlbumPhoto } from "@/server/actions/gallery";
import { Button, Card, inputClass } from "@/components/admin/ui";
import { MediaUploader } from "@/components/admin/media/media-uploader";
import { MediaPickerDialog } from "@/components/admin/media/media-picker";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { cn } from "@/lib/utils";
import { useFieldId } from "@/components/admin/use-field-id";

type Photo = { id: string; caption: string; media: MediaSummary };

export function AlbumPhotos({ albumId, coverImageId, photos }: { albumId: string; coverImageId: string | null; photos: Photo[] }) {
  const fid = useFieldId();
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success?: string) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) toast.error(result.error ?? "Something went wrong");
      else {
        if (success) toast.success(success);
        router.refresh();
      }
    });

  const add = (media: MediaSummary) => run(() => addAlbumPhotos({ albumId, mediaIds: [media.id] }));

  return (
    <Card
      title={`Photos (${photos.length})`}
      description="Upload new photos or add existing ones from the media library. Add alt text in the Media library for accessibility."
      actions={
        <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
          <ImagePlus aria-hidden className="size-4" /> Add from library
        </Button>
      }
    >
      <MediaUploader bucket="gallery" onUploaded={add} className="mb-6" />
      {photos.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">No photos in this album yet.</p>
      ) : (
        <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", pending && "opacity-70")}>
          {photos.map((photo, i) => {
            const isCover = coverImageId ? coverImageId === photo.media.id : i === 0;
            return (
              <li key={photo.id} className="overflow-hidden rounded-md border border-zinc-200 bg-white">
                <div className="relative aspect-[4/3] bg-zinc-100">
                  <Image src={photo.media.url} alt={photo.media.alt} fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
                  {isCover && <span className="absolute top-2 left-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">Cover</span>}
                  {!photo.media.alt && <span className="absolute top-2 right-2 rounded bg-amber-400 px-2 py-0.5 text-xs font-medium text-black">No alt text</span>}
                </div>
                <div className="space-y-2 p-3">
                  <label className="sr-only" htmlFor={fid(`cap-${photo.id}`)}>
                    Caption
                  </label>
                  <input
                    id={fid(`cap-${photo.id}`)}
                    defaultValue={photo.caption}
                    placeholder="Caption (optional)"
                    className={`${inputClass} text-xs`}
                    onBlur={(e) => {
                      if (e.target.value !== photo.caption) run(() => updateAlbumPhoto({ id: photo.id, caption: e.target.value }), "Caption saved");
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <ReorderButtons model="galleryItem" id={photo.id} label={photo.media.title} isFirst={i === 0} isLast={i === photos.length - 1} />
                    <div className="flex gap-1">
                      {!isCover && (
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => run(() => setAlbumCover({ albumId, mediaId: photo.media.id }), "Cover updated")} aria-label="Use as cover" title="Use as cover">
                          <Star aria-hidden className="size-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => run(() => removeAlbumPhoto({ id: photo.id }), "Removed from album")} aria-label="Remove from album" title="Remove from album (the file stays in the media library)">
                        <Trash2 aria-hidden className="size-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <MediaPickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} bucket="gallery" title="Add a photo to this album" onSelect={add} />
    </Card>
  );
}
