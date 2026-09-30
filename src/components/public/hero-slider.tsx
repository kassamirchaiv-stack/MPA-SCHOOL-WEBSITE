"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { SmartLink } from "@/components/ui/smart-link";
import { cn } from "@/lib/utils";

export type HeroSlideView = {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: { src: string; alt: string } | null;
  primary: { label: string; href: string } | null;
  secondary: { label: string; href: string } | null;
};

const INTERVAL_MS = 8000;

export function HeroSlider({ slides }: { slides: HeroSlideView[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = slides.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const go = useCallback((next: number) => setIndex((next + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || userPaused || reducedMotion) return;
    const id = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(id);
  }, [index, count, paused, userPaused, reducedMotion, go]);

  if (count === 0) return null;
  const autoplay = count > 1 && !reducedMotion;

  return (
    <section
      aria-roledescription={count > 1 ? "carousel" : undefined}
      aria-label="Welcome"
      className="relative isolate grid overflow-hidden bg-secondary text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((slide, i) => {
        const active = i === index;
        const Heading = i === 0 ? "h1" : "h2";
        return (
          <div
            key={slide.id}
            role={count > 1 ? "group" : undefined}
            aria-roledescription={count > 1 ? "slide" : undefined}
            aria-label={count > 1 ? `${i + 1} of ${count}` : undefined}
            aria-hidden={!active}
            inert={!active}
            className={cn(
              "relative grid min-h-[34rem] transition-opacity duration-700 [grid-area:1/1] sm:min-h-[38rem] lg:min-h-[44rem]",
              active ? "z-0 opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            {slide.image && (
              <Image
                src={slide.image.src}
                alt={slide.image.alt}
                fill
                priority={i === 0}
                sizes="100vw"
                className="-z-10 object-cover"
              />
            )}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(4_24_29/0.88)_0%,rgb(4_24_29/0.65)_45%,rgb(4_24_29/0.15)_100%)]"
            />
            <div className="container-site flex flex-col justify-end pt-24 pb-24 sm:pb-28 lg:justify-center lg:pb-20">
              <div className="max-w-2xl">
                {slide.eyebrow && (
                  <p className="eyebrow mb-4 flex items-center gap-3 text-accent">
                    <span aria-hidden className="h-px w-10 bg-accent" />
                    {slide.eyebrow}
                  </p>
                )}
                <Heading className="text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl">{slide.title}</Heading>
                {slide.subtitle && <p className="mt-4 font-display text-xl text-white/90 sm:text-2xl">{slide.subtitle}</p>}
                {slide.description && <p className="mt-5 max-w-xl text-lg text-white/85">{slide.description}</p>}
                {(slide.primary || slide.secondary) && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    {slide.primary && (
                      <SmartLink href={slide.primary.href} className="btn btn-accent">
                        {slide.primary.label}
                      </SmartLink>
                    )}
                    {slide.secondary && (
                      <SmartLink href={slide.secondary.href} className="btn btn-outline text-white">
                        {slide.secondary.label}
                      </SmartLink>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-6 z-10">
          <div className="container-site flex items-center gap-3">
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="grid size-11 place-items-center border border-white/30 hover:border-accent hover:text-accent"
              aria-label="Previous slide"
            >
              <ChevronLeft aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="grid size-11 place-items-center border border-white/30 hover:border-accent hover:text-accent"
              aria-label="Next slide"
            >
              <ChevronRight aria-hidden className="size-5" />
            </button>
            {autoplay && (
              <button
                type="button"
                onClick={() => setUserPaused((v) => !v)}
                className="grid size-11 place-items-center border border-white/30 hover:border-accent hover:text-accent"
                aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
              >
                {userPaused ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
              </button>
            )}
            <div className="ml-2 flex gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show slide ${i + 1}`}
                  aria-current={i === index}
                  className="grid h-11 w-8 place-items-center"
                >
                  <span className={cn("h-1 w-full transition-colors", i === index ? "bg-accent" : "bg-white/40")} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
