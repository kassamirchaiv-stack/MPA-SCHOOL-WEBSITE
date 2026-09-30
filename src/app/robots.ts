import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { siteIndexingEnabled } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  if (!siteIndexingEnabled) {
    // Preview deployments (e.g. *.vercel.app) must not compete with the live site.
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
