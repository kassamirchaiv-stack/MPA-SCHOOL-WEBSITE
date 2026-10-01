"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { DEFAULT_THEME, contrastWarnings, readableOn, themeSchema, type ThemeValues } from "@/lib/theme";
import type { MediaSummary } from "@/lib/media-summary";
import { saveTheme } from "@/server/actions/settings";
import { Button, Card, inputClass } from "@/components/admin/ui";
import { Field } from "@/components/admin/field";
import { MediaField } from "@/components/admin/media/media-picker";
import { FormActions } from "@/components/admin/form-panels";
import { handleResult } from "@/components/admin/form-utils";
import { cn } from "@/lib/utils";
import { useFieldId } from "@/components/admin/use-field-id";

type Values = ThemeValues & { logoId: string; footerLogoId: string; faviconId: string };

const COLORS: { key: keyof ThemeValues; label: string; hint: string }[] = [
  { key: "colorPrimary", label: "Primary", hint: "Buttons, links, headings accents" },
  { key: "colorSecondary", label: "Secondary", hint: "Top bar, footer, page headers" },
  { key: "colorAccent", label: "Accent", hint: "Highlights and small details" },
  { key: "colorBackground", label: "Background", hint: "Page background" },
  { key: "colorSurface", label: "Surface", hint: "Cards and panels" },
  { key: "colorText", label: "Text", hint: "Main text" },
  { key: "colorMuted", label: "Muted text", hint: "Secondary text" },
  { key: "colorBorder", label: "Borders", hint: "Lines and card borders" },
];

const RADIUS = { NONE: "0px", SMALL: "4px", MEDIUM: "8px", LARGE: "14px" } as const;
const BUTTON = { SQUARE: "0px", ROUNDED: "6px", PILL: "999px" } as const;

export function ThemeForm({
  defaults,
  logos,
  schoolName,
  tagline,
}: {
  defaults: Values;
  logos: { logo: MediaSummary | null; footerLogo: MediaSummary | null; favicon: MediaSummary | null };
  schoolName: string;
  tagline: string;
}) {
  const fid = useFieldId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm<Values>({ defaultValues: defaults });

  const values = watch();
  const parsed = themeSchema.safeParse(values);
  const warnings = parsed.success ? contrastWarnings(parsed.data) : [];

  const onSubmit = handleSubmit((v) =>
    startTransition(async () => {
      const result = await saveTheme(v);
      if (handleResult(result, setError, "Theme saved")) router.refresh();
    }),
  );

  const resetColors = () => {
    for (const { key } of COLORS) setValue(key, DEFAULT_THEME[key] as never, { shouldDirty: true });
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card
            title="Colours"
            actions={
              <Button size="sm" variant="ghost" onClick={resetColors}>
                <RotateCcw aria-hidden className="size-4" /> MPA defaults
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {COLORS.map(({ key, label, hint }) => {
                const value = (values[key] as string) ?? "";
                const valid = /^#[0-9a-fA-F]{6}$/.test(value);
                return (
                  <Field key={key} label={label} htmlFor={key} hint={hint} error={valid ? (errors[key]?.message as string | undefined) : "Use a 6-digit hex colour like #125a68"}>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        aria-label={`${label} colour picker`}
                        value={valid ? value : "#000000"}
                        onChange={(e) => setValue(key, e.target.value as never, { shouldDirty: true })}
                        className="h-9 w-12 shrink-0 cursor-pointer rounded border border-zinc-300 bg-white p-0.5"
                      />
                      <input id={key} className={cn(inputClass, "font-mono")} aria-invalid={!valid} {...register(key)} />
                    </div>
                  </Field>
                );
              })}
            </div>
            {warnings.length > 0 && (
              <div role="status" className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="flex items-center gap-2 font-medium">
                  <AlertTriangle aria-hidden className="size-4" /> Readability warning
                </p>
                <ul className="mt-1 list-disc pl-6">
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card title="Shapes">
            <div className="grid gap-6 sm:grid-cols-2">
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Card corners</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(RADIUS) as (keyof typeof RADIUS)[]).map((r) => (
                    <label key={r} className={cn("flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm", values.radius === r ? "border-zinc-900" : "border-zinc-200")}>
                      <input type="radio" value={r} className="accent-zinc-900" {...register("radius")} />
                      <span className="size-5 border-2 border-zinc-700" style={{ borderRadius: RADIUS[r] }} />
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Buttons</legend>
                <div className="grid gap-2">
                  {(Object.keys(BUTTON) as (keyof typeof BUTTON)[]).map((b) => (
                    <label key={b} className={cn("flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm", values.buttonStyle === b ? "border-zinc-900" : "border-zinc-200")}>
                      <input type="radio" value={b} className="accent-zinc-900" {...register("buttonStyle")} />
                      <span className="h-5 w-12 bg-zinc-700" style={{ borderRadius: BUTTON[b] }} />
                      {b.charAt(0) + b.slice(1).toLowerCase()}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </Card>

          <Card title="Logos" description="PNG with a transparent background works best.">
            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Main logo" htmlFor={fid("logoId")} hint="Header">
                <Controller control={control} name="logoId" render={({ field }) => <MediaField id={fid("logoId")} value={field.value} onChange={(v) => field.onChange(v ?? "")} initial={logos.logo} bucket="site-assets" aspect="aspect-[3/2]" label="logo" />} />
              </Field>
              <Field label="Footer logo" htmlFor={fid("footerLogoId")} hint="Optional — defaults to the main logo">
                <Controller control={control} name="footerLogoId" render={({ field }) => <MediaField id={fid("footerLogoId")} value={field.value} onChange={(v) => field.onChange(v ?? "")} initial={logos.footerLogo} bucket="site-assets" aspect="aspect-[3/2]" label="logo" />} />
              </Field>
              <Field label="Browser icon (favicon)" htmlFor={fid("faviconId")} hint="Square, at least 180 × 180 px">
                <Controller control={control} name="faviconId" render={({ field }) => <MediaField id={fid("faviconId")} value={field.value} onChange={(v) => field.onChange(v ?? "")} initial={logos.favicon} bucket="site-assets" aspect="aspect-square" label="icon" />} />
              </Field>
            </div>
          </Card>
        </div>

        <div className="xl:sticky xl:top-20 xl:h-fit">
          <Card title="Preview">
            <ThemePreview values={values} schoolName={schoolName} tagline={tagline} />
          </Card>
        </div>
      </div>
      <FormActions pending={pending} submitLabel="Save theme" />
    </form>
  );
}

function ThemePreview({ values: v, schoolName, tagline }: { values: Values; schoolName: string; tagline: string }) {
  const safe = (c: string, fallback: string) => (/^#[0-9a-fA-F]{6}$/.test(c) ? c : fallback);
  const primary = safe(v.colorPrimary, DEFAULT_THEME.colorPrimary);
  const secondary = safe(v.colorSecondary, DEFAULT_THEME.colorSecondary);
  const accent = safe(v.colorAccent, DEFAULT_THEME.colorAccent);
  const radius = RADIUS[v.radius] ?? "4px";
  const btn = BUTTON[v.buttonStyle] ?? "6px";
  return (
    <div aria-hidden className="overflow-hidden rounded-md border border-zinc-200 text-[13px]" style={{ background: safe(v.colorBackground, "#ffffff"), color: safe(v.colorText, "#111111") }}>
      <div className="px-3 py-1.5 text-[10px]" style={{ background: secondary, color: readableOn(secondary) }}>
        +251 … · info@…
      </div>
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ background: safe(v.colorSurface, "#ffffff"), borderColor: safe(v.colorBorder, "#dddddd") }}>
        <div>
          <p className="font-display text-sm font-semibold">{schoolName}</p>
          <p className="text-[10px] font-semibold" style={{ color: primary }}>
            {tagline}
          </p>
        </div>
        <span className="px-2 py-1 text-[10px] font-semibold" style={{ background: primary, color: readableOn(primary), borderRadius: btn }}>
          Apply
        </span>
      </div>
      <div className="space-y-3 p-3">
        <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: primary }}>
          — Section
        </p>
        <p className="font-display text-lg leading-tight">A heading on the page</p>
        <p style={{ color: safe(v.colorMuted, "#666666") }}>Muted supporting text looks like this.</p>
        <div className="border p-3" style={{ background: safe(v.colorSurface, "#ffffff"), borderColor: safe(v.colorBorder, "#dddddd"), borderRadius: radius, borderTop: `3px solid ${accent}` }}>
          <p className="font-semibold">A card</p>
          <p className="text-xs" style={{ color: primary }}>
            Read more
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1.5 text-xs font-semibold" style={{ background: accent, color: readableOn(accent), borderRadius: btn }}>
            Accent
          </span>
          <span className="border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: primary, color: primary, borderRadius: btn }}>
            Outline
          </span>
        </div>
      </div>
      <div className="px-3 py-3 text-[10px]" style={{ background: secondary, color: readableOn(secondary) }}>
        Footer
      </div>
    </div>
  );
}
