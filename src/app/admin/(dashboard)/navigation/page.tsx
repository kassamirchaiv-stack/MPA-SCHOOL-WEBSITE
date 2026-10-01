import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { SYSTEM_PAGES, isSystemPage } from "@/lib/pages";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { NavigationManager } from "./navigation-manager";

export const metadata: Metadata = { title: "Navigation" };

const LOCATIONS = {
  HEADER: { label: "Main menu", description: "The menu at the top of every page. Items with dropdown entries open a menu." },
  FOOTER: { label: "Footer links", description: "The “Explore” column in the footer." },
  LEGAL: { label: "Legal links", description: "Small links at the very bottom, e.g. Privacy Policy." },
} as const;

type Location = keyof typeof LOCATIONS;

export default async function NavigationPage({ searchParams }: PageProps<"/admin/navigation">) {
  await requireAdminPage("navigation.manage");
  const sp = await searchParams;
  const location: Location = sp.location === "FOOTER" || sp.location === "LEGAL" ? sp.location : "HEADER";

  const [items, customPages, programs] = await Promise.all([
    db.navigationItem.findMany({
      where: { location, parentId: null },
      orderBy: { sortOrder: "asc" },
      include: { children: { orderBy: { sortOrder: "asc" } } },
    }),
    db.page.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, title: true } }),
    db.program.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, title: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  // Suggestions for the link field.
  const suggestions = [
    { href: "/", label: "Home" },
    ...Object.values(SYSTEM_PAGES).map((p) => ({ href: p.path, label: p.label })),
    ...customPages.filter((p) => !isSystemPage(p.slug)).map((p) => ({ href: `/${p.slug}`, label: p.title })),
    ...programs.map((p) => ({ href: `/programs/${p.slug}`, label: `Program: ${p.title}` })),
  ];

  const toItem = (i: (typeof items)[number] | (typeof items)[number]["children"][number]) => ({
    id: i.id,
    location: i.location,
    label: i.label,
    href: i.href ?? "",
    parentId: i.parentId ?? "",
    isExternal: i.isExternal,
    openInNewTab: i.openInNewTab,
    enabled: i.enabled,
  });

  return (
    <>
      <PageHeader title="Navigation" description="Menus shown on every page of the website." />
      <nav aria-label="Menus" className="mb-6 flex flex-wrap gap-1 border-b border-zinc-200">
        {(Object.keys(LOCATIONS) as Location[]).map((loc) => (
          <Link
            key={loc}
            href={`/admin/navigation?location=${loc}`}
            aria-current={loc === location ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
              loc === location ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800",
            )}
          >
            {LOCATIONS[loc].label}
          </Link>
        ))}
      </nav>
      <p className="mb-4 text-sm text-zinc-600">{LOCATIONS[location].description}</p>
      <NavigationManager
        key={location}
        location={location}
        allowChildren={location === "HEADER"}
        suggestions={suggestions}
        items={items.map((i) => ({ ...toItem(i), children: i.children.map(toItem) }))}
      />
    </>
  );
}
