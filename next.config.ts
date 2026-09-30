import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;
const isLocalSupabase = ["127.0.0.1", "localhost"].includes(supabaseHost?.hostname ?? "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // Local Supabase (supabase start) serves storage from 127.0.0.1, which Next.js
    // blocks by default. Only relaxed when the configured Supabase URL is local.
    dangerouslyAllowLocalIP: isLocalSupabase,
    remotePatterns: supabaseHost
      ? [
          {
            protocol: supabaseHost.protocol.replace(":", "") as "http" | "https",
            hostname: supabaseHost.hostname,
            port: supabaseHost.port,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    // BUILD_SINGLE_WORKER=1 builds with one worker and one render at a time. Only needed for
    // single-connection local databases (e.g. `prisma dev`); Supabase does not need it.
    ...(process.env.BUILD_SINGLE_WORKER === "1" ? { cpus: 1, staticGenerationMaxConcurrency: 1 } : {}),
  },
  // URLs from the previous single-page site (see docs/url-migration.md).
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/admin.html", destination: "/admin", permanent: true },
    ];
  },
};

export default nextConfig;
