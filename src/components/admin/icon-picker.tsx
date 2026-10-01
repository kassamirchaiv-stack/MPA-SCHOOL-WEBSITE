"use client";

import { ICONS, ICON_NAMES } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** Grid of the curated icons; value is the icon name (or "" for none). */
export function IconPicker({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  return (
    <div id={id} role="radiogroup" aria-label="Icon" className="grid grid-cols-8 gap-1 rounded-md border border-zinc-200 p-2 sm:grid-cols-11">
      {ICON_NAMES.map((name) => {
        const Icon = ICONS[name];
        const selected = value === name;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={name.replace(/-/g, " ")}
            title={name.replace(/-/g, " ")}
            onClick={() => onChange(selected ? "" : name)}
            className={cn("grid aspect-square place-items-center rounded", selected ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100")}
          >
            <Icon aria-hidden className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
