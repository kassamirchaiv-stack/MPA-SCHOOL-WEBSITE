import Image from "next/image";
import Link from "next/link";
import type { SiteSettingsData } from "@/server/queries/site";
import { mediaUrl, type MediaRef } from "@/lib/media";
import { cn } from "@/lib/utils";

type Props = {
  settings: SiteSettingsData;
  logo?: MediaRef | null;
  inverted?: boolean;
  className?: string;
};

export function BrandMark({ settings, logo, inverted, className }: Props) {
  const image = logo ?? settings.logo;
  return (
    <Link href="/" className={cn("flex min-w-0 items-center gap-3", className)}>
      {image && (
        <Image
          src={mediaUrl(image)}
          alt=""
          width={image.width ?? 96}
          height={image.height ?? 96}
          sizes="56px"
          priority={!inverted}
          className={cn("size-12 shrink-0 object-contain sm:size-14", inverted && "rounded bg-white p-1")}
        />
      )}
      <span className="min-w-0">
        <span className="block truncate font-display text-lg leading-tight font-semibold sm:text-xl">
          {settings.schoolName}
        </span>
        {settings.tagline && (
          <span
            className={cn(
              "block truncate text-xs font-semibold tracking-wide sm:text-sm",
              inverted ? "text-accent" : "text-primary",
            )}
          >
            {settings.tagline}
          </span>
        )}
      </span>
    </Link>
  );
}
