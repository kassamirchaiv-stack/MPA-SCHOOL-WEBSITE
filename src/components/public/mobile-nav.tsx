"use client";

import { useRef, useState } from "react";
import { ChevronDown, Mail, Menu, Phone, X } from "lucide-react";
import type { NavItem } from "@/server/queries/site";
import { SmartLink } from "@/components/ui/smart-link";
import { cn, telHref } from "@/lib/utils";

type Props = {
  items: NavItem[];
  schoolName: string;
  cta?: { label: string; href: string } | null;
  phone?: string | null;
  email?: string | null;
};

/** Uses a native modal <dialog>: focus trapping, Escape-to-close and inert background come for free. */
export function MobileNav({ items, schoolName, cta, phone, email }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const openMenu = () => dialogRef.current?.showModal();
  const closeMenu = () => dialogRef.current?.close();

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={openMenu}
        className="grid size-11 place-items-center text-text hover:text-primary"
        aria-label="Open menu"
        aria-haspopup="dialog"
      >
        <Menu aria-hidden className="size-6" />
      </button>

      <dialog
        ref={dialogRef}
        aria-label={`${schoolName} menu`}
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-surface p-0 text-text backdrop:bg-black/50 open:flex open:flex-col"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeMenu();
        }}
      >
        <div className="flex h-18 shrink-0 items-center justify-between border-b border-border px-4">
          <span className="font-display text-lg font-semibold">Menu</span>
          <button
            type="button"
            onClick={closeMenu}
            className="grid size-11 place-items-center hover:text-primary"
            aria-label="Close menu"
          >
            <X aria-hidden className="size-6" />
          </button>
        </div>

        <nav aria-label="Main" className="flex-1 overflow-y-auto px-2 py-3">
          <ul>
            {items.map((item) => {
              if (item.children.length === 0) {
                return (
                  <li key={item.id}>
                    <SmartLink
                      href={item.href}
                      external={item.isExternal}
                      newTab={item.openInNewTab}
                      onClick={closeMenu}
                      className="flex min-h-12 items-center px-3 text-lg font-medium hover:text-primary"
                    >
                      {item.label}
                    </SmartLink>
                  </li>
                );
              }
              const isOpen = expanded === item.id;
              const panelId = `mnav-${item.id}`;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                    className="flex min-h-12 w-full items-center justify-between px-3 text-left text-lg font-medium hover:text-primary"
                  >
                    {item.label}
                    <ChevronDown aria-hidden className={cn("size-5 transition-transform", isOpen && "rotate-180")} />
                  </button>
                  <ul id={panelId} hidden={!isOpen} className="mb-2 ml-3 border-l-2 border-accent/60">
                    {item.href && (
                      <li>
                        <SmartLink
                          href={item.href}
                          onClick={closeMenu}
                          className="flex min-h-11 items-center px-4 font-semibold hover:text-primary"
                        >
                          {item.label} overview
                        </SmartLink>
                      </li>
                    )}
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <SmartLink
                          href={child.href}
                          external={child.isExternal}
                          newTab={child.openInNewTab}
                          onClick={closeMenu}
                          className="flex min-h-11 items-center px-4 text-text/85 hover:text-primary"
                        >
                          {child.label}
                        </SmartLink>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 space-y-4 border-t border-border p-4">
          {cta && (
            <SmartLink href={cta.href} onClick={closeMenu} className="btn btn-primary w-full">
              {cta.label}
            </SmartLink>
          )}
          <div className="flex flex-col gap-2 text-sm text-muted">
            {phone && (
              <a href={telHref(phone)} className="inline-flex min-h-8 items-center gap-2 hover:text-primary">
                <Phone aria-hidden className="size-4" /> {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="inline-flex min-h-8 items-center gap-2 hover:text-primary">
                <Mail aria-hidden className="size-4" /> {email}
              </a>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
