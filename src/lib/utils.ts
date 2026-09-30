import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Only allow http(s), mailto, tel and site-relative links from CMS input. */
export function safeHref(href: string | null | undefined): string | null {
  if (!href) return null;
  const value = href.trim();
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (value.startsWith("#")) return value;
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  return null;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
