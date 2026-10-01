import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { summarizeOrNull } from "@/lib/media-summary";
import { SYSTEM_PAGES, pagePath } from "@/lib/pages";
import { siteIndexingEnabled, publicEnv } from "@/lib/env";
import { PageHeader } from "@/components/admin/page-header";
import { Card, TableWrap, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { SeoDefaultsForm } from "./seo-form";

export const metadata: Metadata = { title: "SEO" };

export default async function SeoPage() {
  await requireAdminPage("settings.manage");
  const [settings, pages, missingAlt, articlesNoExcerpt] = await Promise.all([
    db.siteSettings.findUniqueOrThrow({ where: { id: 1 }, include: { ogImage: true } }),
    db.page.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true, slug: true, seoTitle: true, seoDescription: true, intro: true } }),
    db.media.count({ where: { alt: "", archivedAt: null, mimeType: { startsWith: "image/" } } }),
    db.article.count({ where: { status: "PUBLISHED", excerpt: null, seoDescription: null } }),
  ]);

  const checks = [
    { ok: siteIndexingEnabled, label: siteIndexingEnabled ? "Search engines may index the website." : "Search engines are blocked (SITE_INDEXING is not “true”). Expected until the school’s domain is live." },
    { ok: publicEnv.siteUrl.startsWith("https://"), label: `Site address: ${publicEnv.siteUrl}` },
    { ok: Boolean(settings.ogImageId), label: settings.ogImageId ? "A default share image is set." : "No default share image is set." },
    { ok: missingAlt === 0, label: missingAlt === 0 ? "All images have alt text." : `${missingAlt} image(s) have no alt text.`, href: "/admin/media?show=missing-alt" },
    { ok: articlesNoExcerpt === 0, label: articlesNoExcerpt === 0 ? "All published articles have a summary." : `${articlesNoExcerpt} published article(s) have no summary or SEO description.`, href: "/admin/news" },
  ];

  return (
    <>
      <PageHeader title="SEO" description="How the website appears in Google and when shared on social media." />
      <div className="space-y-6">
        <Card title="Health check">
          <ul className="space-y-2 text-sm">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2">
                {c.ok ? <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-600" />}
                <span>
                  {c.label}{" "}
                  {!c.ok && c.href && (
                    <Link href={c.href} className="font-medium underline">
                      Fix
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-zinc-500">
            Sitemap: <a className="underline" href="/sitemap.xml" target="_blank">/sitemap.xml</a> · Robots: <a className="underline" href="/robots.txt" target="_blank">/robots.txt</a>
          </p>
        </Card>

        <SeoDefaultsForm
          ogImage={summarizeOrNull(settings.ogImage)}
          defaults={{ seoTitle: settings.seoTitle ?? "", seoDescription: settings.seoDescription ?? "", ogImageId: settings.ogImageId ?? "" }}
        />

        <Card title="Pages" description="Each page can override its search title and description. Articles, events and programs have their own SEO fields in their editors.">
          <TableWrap>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Page</th>
                  <th className={thClass}>Search title</th>
                  <th className={`${thClass} hidden md:table-cell`}>Description</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id}>
                    <td className={tdClass}>
                      <Link href={`/admin/pages/${p.id}`} className="font-medium hover:underline">
                        {SYSTEM_PAGES[p.slug]?.label ?? p.title}
                      </Link>
                      <p className="text-xs text-zinc-500">{pagePath(p.slug)}</p>
                    </td>
                    <td className={`${tdClass} text-zinc-600`}>{p.seoTitle || <span className="text-zinc-500">Uses page title</span>}</td>
                    <td className={`${tdClass} hidden text-zinc-600 md:table-cell`}>
                      {p.seoDescription ? (
                        <span className="line-clamp-2">{p.seoDescription}</span>
                      ) : p.intro ? (
                        <span className="text-zinc-500">Uses introduction</span>
                      ) : (
                        <span className="text-amber-700">Missing</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      </div>
    </>
  );
}
