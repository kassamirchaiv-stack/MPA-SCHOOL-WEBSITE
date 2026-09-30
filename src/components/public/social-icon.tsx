import { siFacebook, siInstagram, siTelegram, siTiktok, siWhatsapp, siX, siYoutube } from "simple-icons";
import { Globe } from "lucide-react";
import type { SocialPlatform } from "@/lib/social";

const BRAND_PATHS: Partial<Record<SocialPlatform, string>> = {
  facebook: siFacebook.path,
  instagram: siInstagram.path,
  youtube: siYoutube.path,
  x: siX.path,
  tiktok: siTiktok.path,
  telegram: siTelegram.path,
  whatsapp: siWhatsapp.path,
};

export function SocialIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  const path = BRAND_PATHS[platform];
  if (!path) return <Globe aria-hidden className={className} />;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d={path} />
    </svg>
  );
}
