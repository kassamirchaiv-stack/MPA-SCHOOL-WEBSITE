/** Hosts allowed in the contact page map iframe (admins paste an embed URL). */
const MAP_HOSTS = ["www.google.com", "maps.google.com", "www.openstreetmap.org"];

export function safeMapEmbedUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  // Accept a pasted <iframe src="..."> snippet as well as a bare URL.
  const src = value.match(/src="([^"]+)"/)?.[1] ?? value.trim();
  try {
    const url = new URL(src);
    if (url.protocol !== "https:" || !MAP_HOSTS.includes(url.hostname)) return null;
    if (url.hostname.includes("google") && !url.pathname.startsWith("/maps/embed")) return null;
    if (url.hostname.includes("openstreetmap") && !url.pathname.startsWith("/export/embed")) return null;
    return url.toString();
  } catch {
    return null;
  }
}
