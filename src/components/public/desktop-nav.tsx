"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { NavItem } from "@/server/queries/site";
import { SmartLink } from "@/components/ui/smart-link";
import { cn } from "@/lib/utils";

export function isActivePath(pathname: string, href: string | null) {
  if (!href || !href.startsWith("/")) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    function onClick(e: MouseEvent) {
      if (!navRef.current?.contains(e.target as Node)) setOpenId(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const open = (id: string) => {
    clearTimeout(closeTimer.current);
    setOpenId(id);
  };
  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 150);
  };

  return (
    <nav ref={navRef} aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-0.5">
        {items.map((item) => {
          const active =
            isActivePath(pathname, item.href) || item.children.some((child) => isActivePath(pathname, child.href));
          const linkClass = cn(
            "relative inline-flex h-11 items-center gap-1 px-3 text-[0.95rem] font-medium hover:text-primary",
            "after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:bg-accent after:transition-opacity",
            active ? "text-primary after:opacity-100" : "text-text/85 after:opacity-0",
          );

          if (item.children.length === 0) {
            return (
              <li key={item.id}>
                <SmartLink
                  href={item.href}
                  external={item.isExternal}
                  newTab={item.openInNewTab}
                  className={linkClass}
                  aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                >
                  {item.label}
                </SmartLink>
              </li>
            );
          }

          const expanded = openId === item.id;
          const panelId = `nav-panel-${item.id}`;
          return (
            <li key={item.id} className="relative" onMouseEnter={() => open(item.id)} onMouseLeave={scheduleClose}>
              <button
                type="button"
                className={linkClass}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => (expanded ? setOpenId(null) : open(item.id))}
              >
                {item.label}
                <ChevronDown aria-hidden className={cn("size-4 transition-transform", expanded && "rotate-180")} />
              </button>
              <div
                id={panelId}
                hidden={!expanded}
                className="absolute top-full left-0 z-50 min-w-60 border border-border bg-surface py-2 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.18)]"
                onBlur={(e) => {
                  if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) setOpenId(null);
                }}
              >
                <ul>
                  {item.href && (
                    <li>
                      <SmartLink
                        href={item.href}
                        onClick={() => setOpenId(null)}
                        className="block px-4 py-2.5 text-[0.95rem] font-semibold hover:bg-background hover:text-primary"
                      >
                        {item.label} overview
                      </SmartLink>
                    </li>
                  )}
                  {item.children.map((child) => {
                    const childActive = isActivePath(pathname, child.href);
                    return (
                      <li key={child.id}>
                        <SmartLink
                          href={child.href}
                          external={child.isExternal}
                          newTab={child.openInNewTab}
                          onClick={() => setOpenId(null)}
                          aria-current={childActive ? "page" : undefined}
                          className={cn(
                            "block px-4 py-2.5 text-[0.95rem] hover:bg-background hover:text-primary",
                            childActive && "text-primary",
                          )}
                        >
                          {child.label}
                        </SmartLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
