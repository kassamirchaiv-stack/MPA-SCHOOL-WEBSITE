"use client";

import { useId, useState } from "react";
import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import { BUCKETS, type BucketName } from "@/lib/storage-config";
import type { MediaSummary } from "@/server/actions/media";
import { cn } from "@/lib/utils";
import { uploadFile } from "./upload";

type Item = { name: string; state: "uploading" | "done" | "error"; message?: string };

type Props = {
  bucket: BucketName;
  multiple?: boolean;
  onUploaded?: (media: MediaSummary) => void;
  className?: string;
};

export function MediaUploader({ bucket, multiple = true, onUploaded, className }: Props) {
  const inputId = useId();
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const config = BUCKETS[bucket];
  const busy = items.some((i) => i.state === "uploading");

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setItems((prev) => [...list.map((f) => ({ name: f.name, state: "uploading" as const })), ...prev].slice(0, 20));
    // Sequential uploads keep things predictable on slow school connections.
    for (const file of list) {
      try {
        const media = await uploadFile(file, bucket);
        setItems((prev) => prev.map((i) => (i.name === file.name && i.state === "uploading" ? { ...i, state: "done" } : i)));
        onUploaded?.(media);
      } catch (error) {
        setItems((prev) =>
          prev.map((i) =>
            i.name === file.name && i.state === "uploading" ? { ...i, state: "error", message: (error as Error).message } : i,
          ),
        );
      }
    }
  }

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center text-sm transition-colors",
          dragging ? "border-zinc-900 bg-zinc-50" : "border-zinc-300 hover:border-zinc-400",
        )}
      >
        {busy ? <Loader2 aria-hidden className="size-6 animate-spin text-zinc-500" /> : <Upload aria-hidden className="size-6 text-zinc-500" />}
        <span className="font-medium text-zinc-800">{multiple ? "Drop files here or click to upload" : "Drop a file here or click to upload"}</span>
        <span className="text-xs text-zinc-500">
          {config.allowedMimeTypes.some((t) => t.startsWith("image/")) ? "JPG, PNG, WebP, AVIF or GIF" : "PDF, Word or Excel"} · up to{" "}
          {Math.round(config.maxBytes / 1024 / 1024)} MB each
        </span>
        <input
          id={inputId}
          type="file"
          multiple={multiple}
          accept={config.allowedMimeTypes.join(",")}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {items.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm" aria-live="polite">
          {items.map((item, i) => (
            <li key={`${item.name}-${i}`} className="flex items-start gap-2">
              {item.state === "uploading" && <Loader2 aria-hidden className="mt-0.5 size-4 shrink-0 animate-spin text-zinc-500" />}
              {item.state === "done" && <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-600" />}
              {item.state === "error" && <XCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-red-600" />}
              <span className={cn("min-w-0 break-words", item.state === "error" && "text-red-700")}>
                {item.state === "error" ? item.message : item.name}
                {item.state === "uploading" && " — uploading…"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
