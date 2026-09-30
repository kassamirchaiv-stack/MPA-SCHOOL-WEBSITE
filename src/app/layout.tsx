import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { getSiteSettings, getThemeSettings } from "@/server/queries/site";
import { themeToCss, DEFAULT_THEME } from "@/lib/theme";
import { mediaUrl } from "@/lib/media";
import { publicEnv, siteIndexingEnabled } from "@/lib/env";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const serif = Source_Serif_4({ variable: "--font-serif", subsets: ["latin"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const name = settings?.schoolName ?? "Merciful Paradise Academy";
  const defaultTitle = settings?.seoTitle || name;
  const favicon = settings?.favicon ? mediaUrl(settings.favicon) : undefined;
  const ogImage = settings?.ogImage ? mediaUrl(settings.ogImage) : undefined;

  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: { default: defaultTitle, template: `%s | ${settings?.shortName || name}` },
    description: settings?.seoDescription ?? undefined,
    applicationName: name,
    icons: favicon ? { icon: favicon, apple: favicon } : undefined,
    openGraph: {
      type: "website",
      siteName: name,
      locale: "en_US",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: { card: "summary_large_image" },
    robots: siteIndexingEnabled ? undefined : { index: false, follow: false },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const theme = await getThemeSettings();
  return { themeColor: theme?.colorPrimary ?? DEFAULT_THEME.colorPrimary };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = await getThemeSettings();
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <head>
        {/* Values are schema-validated hex colours and enums (see src/lib/theme.ts). */}
        <style id="mpa-theme" dangerouslySetInnerHTML={{ __html: themeToCss(theme) }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
