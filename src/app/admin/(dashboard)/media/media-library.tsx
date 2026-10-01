"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Archive, ArchiveRestore, Copy, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { MediaSummary } from "@/lib/media-summary";
import { BUCKETS, BUCKET_NAMES, type BucketName } from "@/lib/storage-config";
import { deleteMedia, setMediaArchived, updateMedia } from "@/server/actions/media";
import { Button, Card, inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { Field } from "@/components/admin/field";
import { FormDialog } from "@/components/admin/form-dialog";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { MediaUploader } from "@/components/admin/media/media-uploader";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

type EditValues = { id: string; title: string; alt: string; caption: string; category: string };

function formatSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function MediaLibrary({ items, total, defaultBucket }: { items: MediaSummary[]; total: number; defaultBucket: BucketName }) {
  const fid = useFieldId();
  const router = useRouter();
  const [uploadBucket, setUploadBucket] = useState<BucketName>(defaultBucket);
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState<MediaSummary | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<EditValues>();

  const open = (m: MediaSummary) => {
    reset({ id: m.id, title: m.title, alt: m.alt, caption: m.caption ?? "", category: m.category ?? "" });
    setSelected(m);
  };
  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateMedia(values);
      if (handleResult(result, setError, "File details saved")) {
        setSelected(null);
        router.refresh();
      }
    }),
  );
  const archive = (m: MediaSummary) =>
    startTransition(async () => {
      const result = await setMediaArchived({ id: m.id, archived: !m.archived });
      if (result.ok) {
        toast.success(m.archived ? "Restored" : "Archived");
        setSelected(null);
        router.refresh();
      } else toast.error(result.error);
    });
  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy — select the link and copy it manually.");
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-600">
          {total} file{total === 1 ? "" : "s"}
        </p>
        <Button onClick={() => setShowUpload((v) => !v)} aria-expanded={showUpload}>
          <Upload aria-hidden className="size-4" /> Upload files
        </Button>
      </div>

      {showUpload && (
        <Card title="Upload" className="mb-6">
          <Field label="Folder" htmlFor={fid("upload-bucket")} hint="Choose where these files belong. Documents (PDF, Word, Excel) go in Documents." className="mb-4 max-w-xs">
            <select id={fid("upload-bucket")} value={uploadBucket} onChange={(e) => setUploadBucket(e.target.value as BucketName)} className={selectClass}>
              {BUCKET_NAMES.map((b) => (
                <option key={b} value={b}>
                  {BUCKETS[b].label}
                </option>
              ))}
            </select>
          </Field>
          <MediaUploader key={uploadBucket} bucket={uploadBucket} onUploaded={() => router.refresh()} />
        </Card>
      )}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center text-sm text-zinc-500">No files found.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {items.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => open(m)}
                className="group block w-full overflow-hidden rounded-md border border-zinc-200 bg-white text-left hover:border-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900"
              >
                <span className="relative block aspect-square bg-zinc-100">
                  {m.mimeType.startsWith("image/") ? (
                    <Image src={m.url} alt="" fill sizes="200px" className="object-cover" />
                  ) : (
                    <FileText aria-hidden className="absolute inset-0 m-auto size-10 text-zinc-400" />
                  )}
                  {m.mimeType.startsWith("image/") && !m.alt && (
                    <span className="absolute top-1.5 right-1.5 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-black">No alt</span>
                  )}
                </span>
                <span className="block truncate px-2 pt-1.5 text-xs font-medium text-zinc-800">{m.title}</span>
                <span className="block truncate px-2 pb-1.5 text-[11px] text-zinc-500">{formatSize(m.size)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <FormDialog open={selected !== null} onClose={() => setSelected(null)} title="File details" onSubmit={onSubmit} pending={pending} wide>
        {selected && (
          <>
            <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
              <div className="relative aspect-square overflow-hidden rounded-md bg-zinc-100">
                {selected.mimeType.startsWith("image/") ? (
                  <Image src={selected.url} alt="" fill sizes="192px" className="object-contain" />
                ) : (
                  <FileText aria-hidden className="absolute inset-0 m-auto size-12 text-zinc-400" />
                )}
              </div>
              <dl className="space-y-1 text-xs text-zinc-600">
                <div>
                  <dt className="inline font-medium text-zinc-800">Type: </dt>
                  <dd className="inline">{selected.mimeType}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-zinc-800">Size: </dt>
                  <dd className="inline">{formatSize(selected.size)}</dd>
                </div>
                {selected.width && (
                  <div>
                    <dt className="inline font-medium text-zinc-800">Dimensions: </dt>
                    <dd className="inline">
                      {selected.width} × {selected.height}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="inline font-medium text-zinc-800">Folder: </dt>
                  <dd className="inline">{BUCKETS[selected.bucket as BucketName]?.label ?? selected.bucket}</dd>
                </div>
                <div className="pt-2">
                  <dt className="sr-only">Link</dt>
                  <dd className="flex gap-1">
                    <input readOnly value={selected.url} className={`${inputClass} text-xs`} aria-label="File link" onFocus={(e) => e.target.select()} />
                    <Button variant="secondary" size="icon" onClick={() => copy(selected.url)} aria-label="Copy link">
                      <Copy aria-hidden className="size-4" />
                    </Button>
                  </dd>
                </div>
              </dl>
            </div>
            <input type="hidden" {...register("id")} />
            <Field label="Name" htmlFor={fid("m-title")} required error={errors.title?.message}>
              <input id={fid("m-title")} className={inputClass} {...register("title", { required: "Name is required" })} />
            </Field>
            {selected.mimeType.startsWith("image/") && (
              <Field label="Alt text" htmlFor={fid("m-alt")} hint="Describe the image for people who cannot see it, e.g. “Grade 8 students in the science lab”.">
                <input id={fid("m-alt")} className={inputClass} {...register("alt")} />
              </Field>
            )}
            <Field label="Caption" htmlFor={fid("m-caption")} hint="Optional, shown under the image in galleries.">
              <textarea id={fid("m-caption")} rows={2} className={textareaClass} {...register("caption")} />
            </Field>
            <Field label="Category" htmlFor={fid("m-category")} hint="Optional label to help you search, e.g. Graduation 2026.">
              <input id={fid("m-category")} className={inputClass} {...register("category")} />
            </Field>
            <div className="flex flex-wrap gap-2 border-t border-zinc-200 pt-4">
              <Button variant="secondary" size="sm" onClick={() => archive(selected)} disabled={pending}>
                {selected.archived ? <ArchiveRestore aria-hidden className="size-4" /> : <Archive aria-hidden className="size-4" />}
                {selected.archived ? "Restore" : "Archive"}
              </Button>
              <ConfirmButton
                triggerVariant="danger-ghost"
                title="Delete this file permanently?"
                description="It will be removed from storage. If the file is still used somewhere, you will be told where."
                confirmLabel="Delete permanently"
                confirmText="delete"
                successMessage="File deleted"
                action={async () => {
                  const result = await deleteMedia({ id: selected.id });
                  if (result.ok) setSelected(null);
                  return result;
                }}
              >
                <Trash2 aria-hidden className="size-4" /> Delete
              </ConfirmButton>
            </div>
          </>
        )}
      </FormDialog>
    </>
  );
}
