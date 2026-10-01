"use client";

import { useEffect, useState } from "react";
import { slugify } from "@/lib/slug";
import { inputClass } from "./ui";

type Props = {
  id: string;
  value: string;
  onChange: (slug: string) => void;
  /** Current title; the slug follows it until the admin edits the slug by hand. */
  source: string;
  prefix: string;
  /** Existing items keep their slug unless changed deliberately (changing it breaks old links). */
  locked?: boolean;
  invalid?: boolean;
};

export function SlugInput({ id, value, onChange, source, prefix, locked = false, invalid }: Props) {
  const [manual, setManual] = useState(locked);

  // Follow the title while the slug has not been edited by hand.
  useEffect(() => {
    if (!manual) onChange(slugify(source));
  }, [source, manual, onChange]);

  return (
    <div className="space-y-1">
      <div className="flex items-stretch overflow-hidden rounded-md border border-zinc-300 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-200">
        <span className="hidden items-center bg-zinc-50 px-3 text-sm text-zinc-500 sm:flex">{prefix}</span>
        <input
          id={id}
          value={value}
          aria-invalid={invalid}
          onChange={(e) => {
            setManual(true);
            onChange(e.target.value.toLowerCase().replace(/\s+/g, "-"));
          }}
          className={`${inputClass} rounded-none border-0 shadow-none focus:ring-0`}
        />
      </div>
      {locked && <p className="text-xs text-amber-700">Changing the address of published content breaks links that people may have saved.</p>}
    </div>
  );
}
