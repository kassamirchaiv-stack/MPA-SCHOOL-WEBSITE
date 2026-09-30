import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { mediaUrl, type MediaRef } from "@/lib/media";
import { cn } from "@/lib/utils";

type Props = {
  media: MediaRef | null | undefined;
  /** Responsive sizes hint, e.g. "(min-width: 1024px) 33vw, 100vw". */
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /** Overrides the stored alt text (use "" for decorative images). */
  alt?: string;
};

/**
 * Fills its (relatively positioned, sized) container with a CMS image. When no
 * image has been uploaded yet it renders a quiet branded placeholder instead of
 * a broken image.
 */
export function CmsImage({ media, sizes, className, imgClassName, priority, alt }: Props) {
  return (
    <div className={cn("relative overflow-hidden bg-secondary/8", className)}>
      {media ? (
        <Image
          src={mediaUrl(media)}
          alt={alt ?? media.alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imgClassName)}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(135deg,transparent_0_14px,color-mix(in_srgb,var(--color-primary)_6%,transparent)_14px_15px)]"
        >
          <ImageIcon className="size-8 text-primary/25" />
        </div>
      )}
    </div>
  );
}
