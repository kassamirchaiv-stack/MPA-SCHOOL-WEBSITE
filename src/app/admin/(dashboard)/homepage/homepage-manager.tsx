"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  heroSlideSchema,
  homepageSectionSchema,
  type HeroSlideFormValues,
  type HomepageSectionFormValues,
} from "@/lib/validation/cms";
import type { MediaSummary } from "@/lib/media-summary";
import {
  deleteHeroSlide,
  saveHeroSlide,
  saveHomepageSection,
  toggleHomepageSection,
} from "@/server/actions/homepage";
import { Button, Card, StatusBadge, inputClass, textareaClass } from "@/components/admin/ui";
import { CheckboxField, Field } from "@/components/admin/field";
import { FormDialog } from "@/components/admin/form-dialog";
import { MediaField } from "@/components/admin/media/media-picker";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

// ─── Sections ─────────────────────────────────────────────────────────────────

type SectionKey = "HERO" | "ABOUT" | "STATISTICS" | "PROGRAMS" | "WHY_MPA" | "STUDENT_LIFE" | "NEWS" | "EVENTS" | "GALLERY" | "CTA";

const SECTION_INFO: Record<SectionKey, { name: string; fields: ("heading" | "image" | "cta" | "secondary" | "limit")[]; source?: { label: string; href: string } }> = {
  HERO: { name: "Hero slideshow", fields: [], source: { label: "Edit slides below", href: "#hero-slides" } },
  STATISTICS: { name: "Statistics band", fields: [], source: { label: "Manage statistics", href: "/admin/statistics" } },
  ABOUT: { name: "About MPA", fields: ["heading", "image", "cta"] },
  PROGRAMS: { name: "Academic programs", fields: ["heading", "cta", "limit"], source: { label: "Manage programs", href: "/admin/programs" } },
  WHY_MPA: { name: "Why MPA", fields: ["heading", "cta"], source: { label: "Manage items", href: "/admin/highlights?group=WHY_MPA" } },
  STUDENT_LIFE: { name: "Student life", fields: ["heading", "cta"], source: { label: "Manage items", href: "/admin/highlights?group=STUDENT_LIFE" } },
  NEWS: { name: "Latest news", fields: ["heading", "cta", "limit"], source: { label: "Manage news", href: "/admin/news" } },
  EVENTS: { name: "Upcoming events", fields: ["heading", "cta", "limit"], source: { label: "Manage events", href: "/admin/events" } },
  GALLERY: { name: "Gallery", fields: ["heading", "cta", "limit"], source: { label: "Manage gallery", href: "/admin/gallery" } },
  CTA: { name: "Call to action band", fields: ["heading", "cta", "secondary"] },
};

type Section = HomepageSectionFormValues & { key: SectionKey; image: MediaSummary | null };

export function SectionsManager({ sections }: { sections: Section[] }) {
  const fid = useFieldId();
  const router = useRouter();
  const [editing, setEditing] = useState<Section | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<HomepageSectionFormValues>({ resolver: zodResolver(homepageSectionSchema, undefined, { raw: true }) });

  const open = (section: Section) => {
    reset(section);
    setEditing(section);
  };
  const toggle = (section: Section) =>
    startTransition(async () => {
      const result = await toggleHomepageSection({ id: section.id, enabled: !section.enabled });
      if (result.ok) {
        toast.success(section.enabled ? "Section hidden" : "Section shown");
        router.refresh();
      } else toast.error(result.error);
    });
  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveHomepageSection(values);
      if (handleResult(result, setError, "Section saved")) {
        setEditing(null);
        router.refresh();
      }
    }),
  );

  const info = editing ? SECTION_INFO[editing.key] : null;

  return (
    <Card title="Sections" description="Top to bottom, as they appear on the homepage. Sections with no content hide themselves automatically.">
      <ol className="divide-y divide-zinc-100">
        {sections.map((s, i) => {
          const meta = SECTION_INFO[s.key];
          return (
            <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
              <ReorderButtons model="homepageSection" id={s.id} label={meta.name} isFirst={i === 0} isLast={i === sections.length - 1} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{meta.name}</p>
                <p className="truncate text-xs text-zinc-500">{(s.title as string) || "—"}</p>
              </div>
              <StatusBadge status={s.enabled ? "ON" : "OFF"} label={s.enabled ? "Shown" : "Hidden"} />
              <div className="flex gap-1">
                {meta.source && (
                  <Link href={meta.source.href} className="hidden h-8 items-center rounded-md px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100 sm:inline-flex">
                    {meta.source.label}
                  </Link>
                )}
                <Button variant="ghost" size="icon" className="size-8" onClick={() => toggle(s)} disabled={pending} aria-label={s.enabled ? `Hide ${meta.name}` : `Show ${meta.name}`}>
                  {s.enabled ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
                </Button>
                {meta.fields.length > 0 && (
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => open(s)} aria-label={`Edit ${meta.name}`}>
                    <Pencil aria-hidden className="size-4" />
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <FormDialog open={editing !== null} onClose={() => setEditing(null)} title={info ? `Edit: ${info.name}` : ""} onSubmit={onSubmit} pending={pending} wide>
        {info?.fields.includes("heading") && (
          <>
            <Field label="Small heading" htmlFor={fid("h-eyebrow")} hint="Shown above the title, e.g. “Academics”">
              <input id={fid("h-eyebrow")} className={inputClass} {...register("eyebrow")} />
            </Field>
            <Field label="Title" htmlFor={fid("h-title")} error={errors.title?.message}>
              <input id={fid("h-title")} className={inputClass} {...register("title")} />
            </Field>
            <Field label="Description" htmlFor={fid("h-description")} error={errors.description?.message}>
              <textarea id={fid("h-description")} rows={3} className={textareaClass} {...register("description")} />
            </Field>
          </>
        )}
        {info?.fields.includes("image") && (
          <Field label="Image" htmlFor={fid("h-image")}>
            <Controller
              control={control}
              name="imageId"
              render={({ field }) => <MediaField key={editing?.id} id={fid("h-image")} value={field.value} onChange={field.onChange} initial={editing?.image} bucket="site-assets" />}
            />
          </Field>
        )}
        {info?.fields.includes("cta") && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Button text" htmlFor={fid("h-cta-label")}>
              <input id={fid("h-cta-label")} className={inputClass} {...register("ctaLabel")} />
            </Field>
            <Field label="Button link" htmlFor={fid("h-cta-url")} error={errors.ctaUrl?.message} hint="e.g. /admissions">
              <input id={fid("h-cta-url")} className={inputClass} {...register("ctaUrl")} />
            </Field>
          </div>
        )}
        {info?.fields.includes("secondary") && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Second button text" htmlFor={fid("h-cta2-label")}>
              <input id={fid("h-cta2-label")} className={inputClass} {...register("secondaryCtaLabel")} />
            </Field>
            <Field label="Second button link" htmlFor={fid("h-cta2-url")} error={errors.secondaryCtaUrl?.message}>
              <input id={fid("h-cta2-url")} className={inputClass} {...register("secondaryCtaUrl")} />
            </Field>
          </div>
        )}
        {info?.fields.includes("limit") && (
          <Field label="Number of items to show" htmlFor={fid("h-limit")} error={errors.itemLimit?.message}>
            <input id={fid("h-limit")} type="number" min={1} max={12} className={`${inputClass} w-28`} {...register("itemLimit")} />
          </Field>
        )}
      </FormDialog>
    </Card>
  );
}

// ─── Hero slides ──────────────────────────────────────────────────────────────

type Slide = HeroSlideFormValues & { id: string; image: MediaSummary | null };

const emptySlide: HeroSlideFormValues = {
  eyebrow: "",
  title: "",
  subtitle: "",
  description: "",
  imageId: "",
  primaryLabel: "",
  primaryUrl: "",
  secondaryLabel: "",
  secondaryUrl: "",
  enabled: true,
};

export function HeroSlidesManager({ slides }: { slides: Slide[] }) {
  const fid = useFieldId();
  const router = useRouter();
  const [editing, setEditing] = useState<{ values: HeroSlideFormValues; image: MediaSummary | null } | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<HeroSlideFormValues>({ resolver: zodResolver(heroSlideSchema, undefined, { raw: true }), defaultValues: emptySlide });

  const open = (values: HeroSlideFormValues, image: MediaSummary | null = null) => {
    reset(values);
    setEditing({ values, image });
  };
  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveHeroSlide(values);
      if (handleResult(result, setError, "Slide saved")) {
        setEditing(null);
        router.refresh();
      }
    }),
  );

  return (
    <div id="hero-slides">
      <Card
        title="Hero slides"
        description="The large banner at the top of the homepage. With more than one slide it becomes a slideshow. Use wide photos (at least 1600 px)."
        actions={
          <Button size="sm" onClick={() => open(emptySlide)}>
            <Plus aria-hidden className="size-4" /> Add slide
          </Button>
        }
      >
        {slides.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">No slides. The homepage shows the school name instead.</p>
        ) : (
          <ol className="divide-y divide-zinc-100">
            {slides.map((s, i) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                <ReorderButtons model="heroSlide" id={s.id} label={s.title} isFirst={i === 0} isLast={i === slides.length - 1} />
                <span className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-zinc-100">
                  {s.image ? (
                    <Image src={s.image.url} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <ImageIcon aria-hidden className="absolute inset-0 m-auto size-5 text-zinc-400" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.title}</p>
                  <p className="truncate text-xs text-zinc-500">{(s.eyebrow as string) || " "}</p>
                </div>
                <StatusBadge status={s.enabled ? "ON" : "OFF"} label={s.enabled ? "Shown" : "Hidden"} />
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => open(s, s.image)} aria-label={`Edit slide “${s.title}”`}>
                    <Pencil aria-hidden className="size-4" />
                  </Button>
                  <ConfirmButton
                    triggerVariant="ghost"
                    triggerSize="icon"
                    triggerLabel={`Delete slide “${s.title}”`}
                    title="Delete this slide?"
                    description="The image stays in the media library."
                    confirmLabel="Delete"
                    successMessage="Slide deleted"
                    action={() => deleteHeroSlide({ id: s.id })}
                  >
                    <Trash2 aria-hidden className="size-4 text-red-600" />
                  </ConfirmButton>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <FormDialog open={editing !== null} onClose={() => setEditing(null)} title={editing?.values.id ? "Edit slide" : "New slide"} onSubmit={onSubmit} pending={pending} wide>
        <Field label="Background image" htmlFor={fid("hs-image")}>
          <Controller
            control={control}
            name="imageId"
            render={({ field }) => (
              <MediaField key={editing?.values.id ?? "new"} id={fid("hs-image")} value={field.value} onChange={field.onChange} initial={editing?.image} bucket="site-assets" aspect="aspect-[21/9]" />
            )}
          />
        </Field>
        <Field label="Small heading" htmlFor={fid("hs-eyebrow")} hint="e.g. Private school in Tigray, Ethiopia">
          <input id={fid("hs-eyebrow")} className={inputClass} {...register("eyebrow")} />
        </Field>
        <Field label="Title" htmlFor={fid("hs-title")} required error={errors.title?.message}>
          <input id={fid("hs-title")} className={inputClass} aria-invalid={!!errors.title} {...register("title")} />
        </Field>
        <Field label="Subtitle" htmlFor={fid("hs-subtitle")}>
          <input id={fid("hs-subtitle")} className={inputClass} {...register("subtitle")} />
        </Field>
        <Field label="Description" htmlFor={fid("hs-description")}>
          <textarea id={fid("hs-description")} rows={3} className={textareaClass} {...register("description")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Main button text" htmlFor={fid("hs-p-label")}>
            <input id={fid("hs-p-label")} className={inputClass} {...register("primaryLabel")} />
          </Field>
          <Field label="Main button link" htmlFor={fid("hs-p-url")} error={errors.primaryUrl?.message}>
            <input id={fid("hs-p-url")} className={inputClass} placeholder="/admissions" {...register("primaryUrl")} />
          </Field>
          <Field label="Second button text" htmlFor={fid("hs-s-label")}>
            <input id={fid("hs-s-label")} className={inputClass} {...register("secondaryLabel")} />
          </Field>
          <Field label="Second button link" htmlFor={fid("hs-s-url")} error={errors.secondaryUrl?.message}>
            <input id={fid("hs-s-url")} className={inputClass} placeholder="/about" {...register("secondaryUrl")} />
          </Field>
        </div>
        <CheckboxField id={fid("hs-enabled")} label="Show this slide" {...register("enabled")} />
      </FormDialog>
    </div>
  );
}
