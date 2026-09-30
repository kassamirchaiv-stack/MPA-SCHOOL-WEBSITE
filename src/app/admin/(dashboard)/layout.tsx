import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { Toaster } from "sonner";
import { requireAdminPage } from "@/lib/auth/session";
import { hasPermission, ROLE_LABELS } from "@/lib/auth/permissions";
import { getSiteSettings } from "@/server/queries/site";
import { signOut } from "@/server/actions/auth";
import { ADMIN_NAV } from "@/components/admin/nav-config";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/sidebar";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh bg-zinc-50 font-sans text-zinc-900">
      <Suspense fallback={<ShellSkeleton />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
      <Toaster richColors position="top-right" />
    </div>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const [admin, settings] = await Promise.all([requireAdminPage(), getSiteSettings()]);
  const schoolName = settings?.schoolName ?? "Website";
  const groups = ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || hasPermission(admin.role, item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex">
      <AdminSidebar groups={groups} schoolName={schoolName} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <AdminMobileNav groups={groups} schoolName={schoolName} />
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 sm:inline-flex"
            >
              View website <ExternalLink aria-hidden className="size-3.5" />
            </Link>
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{admin.name}</p>
              <p className="text-xs text-zinc-500">{ROLE_LABELS[admin.role]}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="grid size-10 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut aria-hidden className="size-4" />
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex" aria-busy="true" aria-label="Loading admin">
      <div className="hidden h-dvh w-64 border-r border-zinc-200 bg-white lg:block" />
      <div className="flex-1">
        <div className="h-16 border-b border-zinc-200 bg-white" />
        <div className="mx-auto max-w-6xl space-y-4 px-6 py-8">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
          <div className="h-32 animate-pulse rounded bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}
