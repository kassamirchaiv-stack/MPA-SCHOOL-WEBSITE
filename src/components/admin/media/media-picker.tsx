"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { FileText, ImageIcon, Loader2, X } from "lucide-react";
import type { BucketName } from "@/lib/storage-config";
import { getMediaSummary, searchMedia, type MediaSummary } from "@/server/actions/media";
import { cn } from "@/lib/utils";
import { Button, inputClass } from "../ui";
import { MediaUploader } from "./media-uploader";
import { useFieldId } from "@/components/admin/use-field-id";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaSummary) => void;
  bucket: BucketName;
  imagesOnly?: boolean;
  title?: string;
};

/** Modal to choose an existing file or upload a new one. */
export function MediaPickerDialog({ open, onClose, onSelect, bucket, imagesOnly = true, title = "Choose an image" }: DialogProps) {
  const fid = useFieldId();
  const ref = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ items: MediaSummary[]; pageCount: number } | null>(null);
  const [loading, startLoading] = useTransition();

  const load = useCallback(
    (query: string, p: number) =>
      startLoading(async () => {
        setResult(await searchMedia({ q: query || undefined, imagesOnly, page: p }));
      }),
    [imagesOnly],
  );

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      load("", 1);
    }
    if (!open && dialog.open) dialog.close();
  }, [open, load]);

  const choose = (media: MediaSummary) => {
    onSelect(media);
    onClose();
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={fid("media-picker-title")}
      className="m-auto h-[min(44rem,calc(100dvh-2rem))] w-[min(56rem,calc(100vw-2rem))] rounded-lg bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40 open:flex open:flex-col"
    >
      <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
        <h2 id={fid("media-picker-title")} className="font-sans text-base font-semibold">
          {title}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X aria-hidden className="size-4" />
        </Button>
      </header>
      <div role="tablist" className="flex gap-1 border-b border-zinc-200 px-5">
        {(["library", "upload"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
              tab === t ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800",
            )}
          >
            {t === "library" ? "Media library" : "Upload new"}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {tab === "upload" ? (
          <MediaUploader bucket={bucket} multiple={false} onUploaded={choose} />
        ) : (
          <>
            <form
              role="search"
              className="mb-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                load(q, 1);
              }}
            >
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, alt text or caption" className={inputClass} aria-label="Search media" />
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
            {loading && !result ? (
              <div className="grid place-items-center py-16">
                <Loader2 aria-hidden className="size-6 animate-spin text-zinc-400" />
              </div>
            ) : result && result.items.length === 0 ? (
              <p className="py-16 text-center text-sm text-zinc-500">No files found. Upload one in the “Upload new” tab.</p>
            ) : (
              <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4", loading && "opacity-60")}>
                {result?.items.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => choose(m)}
                      className="group block w-full overflow-hidden rounded-md border border-zinc-200 text-left hover:border-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900"
                    >
                      <span className="relative block aspect-square bg-zinc-100">
                        {m.mimeType.startsWith("image/") ? (
                          <Image src={m.url} alt="" fill sizes="200px" className="object-cover" />
                        ) : (
                          <FileText aria-hidden className="absolute inset-0 m-auto size-8 text-zinc-400" />
                        )}
                      </span>
                      <span className="block truncate px-2 py-1.5 text-xs text-zinc-700">{m.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {result && result.pageCount > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => { setPage(page - 1); load(q, page - 1); }}>
                  Previous
                </Button>
                <span className="text-zinc-500">
                  Page {page} of {result.pageCount}
                </span>
                <Button variant="secondary" size="sm" disabled={page >= result.pageCount} onClick={() => { setPage(page + 1); load(q, page + 1); }}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}

type FieldProps = {
  id: string;
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  /** Summary for the initially selected media (from the server), avoids an extra request. */
  initial?: MediaSummary | null;
  bucket: BucketName;
  aspect?: string;
  label?: string;
};

/** Form control: thumbnail + choose / change / remove buttons. Stores a Media id. */
export function MediaField({ id, value, onChange, initial, bucket, aspect = "aspect-video", label = "image" }: FieldProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<MediaSummary | null>(initial ?? null);

  useEffect(() => {
    if (value && value !== selected?.id) {
      let cancelled = false;
      void getMediaSummary(value).then((m) => {
        if (!cancelled) setSelected(m);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [value, selected?.id]);

  const current = value ? selected : null;

  return (
    <div id={id} className="space-y-2">
      <div className={cn("relative w-full max-w-sm overflow-hidden rounded-md border border-zinc-200 bg-zinc-50", aspect)}>
        {current ? (
          <Image src={current.url} alt={current.alt} fill sizes="384px" className="object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-zinc-400">
            <ImageIcon aria-hidden className="size-8" />
          </span>
        )}
      </div>
      {current && !current.alt && (
        <p className="text-xs text-amber-700">This image has no alt text. Add it in the Media library for accessibility.</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          {current ? `Change ${label}` : `Choose ${label}`}
        </Button>
        {current && (
          <Button variant="danger-ghost" size="sm" onClick={() => onChange(null)}>
            Remove
          </Button>
        )}
      </div>
      <MediaPickerDialog
        open={open}
        onClose={() => setOpen(false)}
        bucket={bucket}
        onSelect={(m) => {
          setSelected(m);
          onChange(m.id);
        }}
      />
    </div>
  );
}
