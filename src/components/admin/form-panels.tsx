"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Eye, Loader2 } from "lucide-react";
import { Card, buttonClass, inputClass, selectClass, textareaClass } from "./ui";
import { Field } from "./field";
import { useFieldId } from "@/components/admin/use-field-id";

/** Status + publication date. Values are the raw form strings. */
export function PublishingPanel({
  status,
  onStatusChange,
  publishedAt,
  onPublishedAtChange,
  showDate = true,
  error,
}: {
  status: string;
  onStatusChange: (value: string) => void;
  publishedAt?: string;
  onPublishedAtChange?: (value: string) => void;
  showDate?: boolean;
  error?: string;
}) {
  const fid = useFieldId();
  return (
    <Card title="Publishing">
      <div className="space-y-4">
        <Field label="Status" htmlFor={fid("status")}>
          <select id={fid("status")} value={status} onChange={(e) => onStatusChange(e.target.value)} className={selectClass}>
            <option value="DRAFT">Draft — not visible on the website</option>
            <option value="PUBLISHED">Published — visible on the website</option>
            <option value="ARCHIVED">Archived — hidden, kept for records</option>
          </select>
        </Field>
        {showDate && onPublishedAtChange && (
          <Field
            label="Publication date"
            htmlFor={fid("publishedAt")}
            error={error}
            hint={
              status === "PUBLISHED"
                ? "A future date schedules it: it appears automatically at that time (Addis Ababa time). Leave empty to publish now."
                : "Optional. Used when it is published."
            }
          >
            <input
              id={fid("publishedAt")}
              type="datetime-local"
              value={publishedAt ?? ""}
              onChange={(e) => onPublishedAtChange(e.target.value)}
              className={inputClass}
            />
          </Field>
        )}
      </div>
    </Card>
  );
}

export function SeoPanel({
  seoTitle,
  seoDescription,
  register,
  fallbackTitle,
  fallbackDescription,
  path,
}: {
  seoTitle: string;
  seoDescription: string;
  register: (name: "seoTitle" | "seoDescription") => object;
  fallbackTitle: string;
  fallbackDescription?: string;
  path: string;
}) {
  const fid = useFieldId();
  const shownTitle = seoTitle || fallbackTitle || "Page title";
  const shownDescription = seoDescription || fallbackDescription || "A short description of this page for search results.";
  return (
    <Card title="Search & sharing (SEO)" description="Optional. Defaults to the title and summary.">
      <div className="space-y-4">
        <Field label="SEO title" htmlFor={fid("seoTitle")} hint={`${seoTitle.length}/60 characters recommended`}>
          <input id={fid("seoTitle")} className={inputClass} placeholder={fallbackTitle} {...register("seoTitle")} />
        </Field>
        <Field label="SEO description" htmlFor={fid("seoDescription")} hint={`${seoDescription.length}/160 characters recommended`}>
          <textarea id={fid("seoDescription")} rows={3} className={textareaClass} placeholder={fallbackDescription} {...register("seoDescription")} />
        </Field>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm" aria-label="Search result preview">
          <p className="truncate text-xs text-emerald-800">{path}</p>
          <p className="truncate text-base text-blue-800">{shownTitle}</p>
          <p className="line-clamp-2 text-xs text-zinc-600">{shownDescription}</p>
        </div>
      </div>
    </Card>
  );
}

/** Sticky save bar for editor pages. */
export function FormActions({
  pending,
  submitLabel = "Save",
  previewHref,
  extra,
}: {
  pending: boolean;
  submitLabel?: string;
  previewHref?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      {extra}
      {previewHref && (
        <Link href={previewHref} target="_blank" className={buttonClass("secondary")}>
          <Eye aria-hidden className="size-4" /> Preview
        </Link>
      )}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}
