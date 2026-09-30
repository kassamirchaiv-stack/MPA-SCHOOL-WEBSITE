"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  caption: string | null;
  width: number | null;
  height: number | null;
};

/** Responsive photo grid; each photo opens an accessible lightbox (native <dialog>). */
export function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<number | null>(null);

  const open = (i: number) => {
    setCurrent(i);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();
  const step = useCallback(
    (delta: number) => setCurrent((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    dialog.addEventListener("keydown", onKey);
    return () => dialog.removeEventListener("keydown", onKey);
  }, [step]);

  const photo = current === null ? null : photos[current];

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => open(i)}
              className="group relative block aspect-square w-full overflow-hidden rounded-card bg-secondary/10"
              aria-label={`Open photo ${i + 1} of ${photos.length}${p.alt ? `: ${p.alt}` : ""}`}
            >
              <Image
                src={p.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label="Photo viewer"
        onClose={() => setCurrent(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-black/95 p-0 text-white backdrop:bg-black/80 open:flex open:flex-col"
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4 text-sm text-white/80">
          <span aria-live="polite">{current !== null && `${current + 1} / ${photos.length}`}</span>
          <button type="button" onClick={close} className="grid size-11 place-items-center hover:text-accent" aria-label="Close">
            <X aria-hidden className="size-6" />
          </button>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
          {photo && (
            <figure className="flex h-full w-full flex-col items-center justify-center">
              <div className="relative h-full max-h-[80dvh] w-full">
                <Image src={photo.src} alt={photo.alt} fill sizes="100vw" className="object-contain" />
              </div>
              {photo.caption && <figcaption className="mt-3 max-w-3xl text-center text-white/85">{photo.caption}</figcaption>}
            </figure>
          )}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                className="absolute top-1/2 left-2 grid size-12 -translate-y-1/2 place-items-center bg-black/40 hover:text-accent"
                aria-label="Previous photo"
              >
                <ChevronLeft aria-hidden className="size-7" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                className="absolute top-1/2 right-2 grid size-12 -translate-y-1/2 place-items-center bg-black/40 hover:text-accent"
                aria-label="Next photo"
              >
                <ChevronRight aria-hidden className="size-7" />
              </button>
            </>
          )}
        </div>
        <div className="h-8 shrink-0" />
      </dialog>
    </>
  );
}
