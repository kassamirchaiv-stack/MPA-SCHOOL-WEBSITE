"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import {
  CalendarDays,
  CircleUser,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Images,
  LayoutDashboard,
  ListOrdered,
  Mail,
  Menu,
  Navigation,
  Newspaper,
  Palette,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AdminNavGroup } from "./nav-config";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "file-text": FileText,
  home: Home,
  sparkles: Sparkles,
  "list-ordered": ListOrdered,
  "graduation-cap": GraduationCap,
  newspaper: Newspaper,
  "calendar-days": CalendarDays,
  images: Images,
  image: ImageIcon,
  users: Users,
  "help-circle": HelpCircle,
  navigation: Navigation,
  palette: Palette,
  settings: Settings,
  mail: Mail,
  "user-cog": UserCog,
  "scroll-text": ScrollText,
  search: Search,
  "circle-user": CircleUser,
};

function NavLinks({ groups, onNavigate }: { groups: AdminNavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-6">
      {groups.map((group, i) => (
        <div key={group.label ?? i}>
          {group.label && (
            <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">{group.label}</p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon] ?? FileText;
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    // Admin pages are always rendered fresh; prefetching ~20 of them per view only adds load.
                    prefetch={false}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                      active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
                    )}
                  >
                    <Icon aria-hidden className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({ groups, schoolName }: { groups: AdminNavGroup[]; schoolName: string }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white lg:block">
      <div className="sticky top-0 flex h-dvh flex-col">
        <div className="flex h-16 items-center border-b border-zinc-200 px-5">
          <Link href="/admin" className="truncate text-sm font-semibold text-zinc-900">
            {schoolName}
            <span className="block text-xs font-normal text-zinc-500">Website admin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks groups={groups} />
        </div>
      </div>
    </aside>
  );
}

export function AdminMobileNav({ groups, schoolName }: { groups: AdminNavGroup[]; schoolName: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="grid size-10 place-items-center rounded-md text-zinc-700 hover:bg-zinc-100"
        aria-label="Open admin menu"
      >
        <Menu aria-hidden className="size-5" />
      </button>
      <dialog
        ref={ref}
        aria-label="Admin menu"
        className="m-0 h-dvh max-h-none w-72 max-w-[85vw] bg-white p-0 backdrop:bg-black/40 open:flex open:flex-col"
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4">
          <span className="truncate text-sm font-semibold">{schoolName}</span>
          <button
            type="button"
            onClick={close}
            className="grid size-10 place-items-center rounded-md hover:bg-zinc-100"
            aria-label="Close admin menu"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks groups={groups} onNavigate={close} />
        </div>
      </dialog>
    </div>
  );
}
