"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, X } from "lucide-react";
import { settingsSchema, type SettingsFormValues } from "@/lib/validation/settings";
import { SOCIAL_LABELS, SOCIAL_PLATFORMS } from "@/lib/social";
import { safeMapEmbedUrl } from "@/lib/map";
import { saveSiteSettings } from "@/server/actions/settings";
import { Button, Card, inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { Field } from "@/components/admin/field";
import { FormActions } from "@/components/admin/form-panels";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

function ValuesInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const fid = useFieldId();
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-2" aria-label="Core values">
        {value.map((v) => (
          <li key={v} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 py-1 pr-1 pl-3 text-sm">
            {v}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} className="grid size-6 place-items-center rounded-full hover:bg-zinc-200" aria-label={`Remove ${v}`}>
              <X aria-hidden className="size-3" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          id={fid("coreValues")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a value and press Enter"
          className={inputClass}
        />
        <Button variant="secondary" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}

export function SettingsForm({ defaults }: { defaults: SettingsFormValues }) {
  const fid = useFieldId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<SettingsFormValues>({ resolver: zodResolver(settingsSchema, undefined, { raw: true }), defaultValues: defaults });
  const social = useFieldArray({ control, name: "socialLinks" });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveSiteSettings(values);
      if (handleResult(result, setError, "Settings saved")) router.refresh();
    }),
  );

  const mapValue = watch("mapEmbedUrl") as string;
  const mapOk = !mapValue || Boolean(safeMapEmbedUrl(mapValue));

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Card title="School identity">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="School name" htmlFor={fid("schoolName")} required error={errors.schoolName?.message}>
            <input id={fid("schoolName")} className={inputClass} {...register("schoolName")} />
          </Field>
          <Field label="Short name" htmlFor={fid("shortName")} required error={errors.shortName?.message} hint="e.g. MPA — used in page titles">
            <input id={fid("shortName")} className={inputClass} {...register("shortName")} />
          </Field>
          <Field label="Motto / tagline" htmlFor={fid("tagline")}>
            <input id={fid("tagline")} className={inputClass} {...register("tagline")} />
          </Field>
          <Field label="Founded" htmlFor={fid("foundedYear")} hint="e.g. 1996 E.C.">
            <input id={fid("foundedYear")} className={inputClass} {...register("foundedYear")} />
          </Field>
          <Field label="Short description" htmlFor={fid("description")} className="md:col-span-2" hint="Shown in the footer and used as a fallback description.">
            <textarea id={fid("description")} rows={3} className={textareaClass} {...register("description")} />
          </Field>
        </div>
      </Card>

      <Card title="Vision, mission and values" description="Shown on the About page; the vision also appears on the homepage.">
        <div className="space-y-5">
          <Field label="Vision" htmlFor={fid("vision")}>
            <textarea id={fid("vision")} rows={2} className={textareaClass} {...register("vision")} />
          </Field>
          <Field label="Mission" htmlFor={fid("mission")}>
            <textarea id={fid("mission")} rows={3} className={textareaClass} {...register("mission")} />
          </Field>
          <Field label="Core values" htmlFor={fid("coreValues")}>
            <Controller control={control} name="coreValues" render={({ field }) => <ValuesInput value={field.value} onChange={field.onChange} />} />
          </Field>
        </div>
      </Card>

      <Card title="Contact details" description="Shown in the top bar, footer and Contact page.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Phone" htmlFor={fid("phone")}>
            <input id={fid("phone")} className={inputClass} {...register("phone")} />
          </Field>
          <Field label="Email" htmlFor={fid("email")} error={errors.email?.message}>
            <input id={fid("email")} type="email" className={inputClass} {...register("email")} />
          </Field>
          <Field label="Address" htmlFor={fid("address")} className="md:col-span-2">
            <input id={fid("address")} className={inputClass} {...register("address")} />
          </Field>
          <Field label="Office hours" htmlFor={fid("officeHours")}>
            <input id={fid("officeHours")} className={inputClass} {...register("officeHours")} />
          </Field>
          <Field
            label="Map"
            htmlFor={fid("mapEmbedUrl")}
            error={mapOk ? undefined : "Paste the embed link from Google Maps (Share → Embed a map) or OpenStreetMap."}
            hint="Google Maps → Share → Embed a map → copy HTML, and paste it here."
          >
            <input id={fid("mapEmbedUrl")} className={inputClass} {...register("mapEmbedUrl")} />
          </Field>
        </div>
      </Card>

      <Card
        title="Social media"
        description="Shown as icons in the top bar and footer."
        actions={
          <Button size="sm" variant="secondary" onClick={() => social.append({ platform: "facebook", url: "" })}>
            <Plus aria-hidden className="size-4" /> Add link
          </Button>
        }
      >
        {social.fields.length === 0 ? (
          <p className="text-sm text-zinc-500">No social media links yet.</p>
        ) : (
          <ul className="space-y-3">
            {social.fields.map((f, i) => (
              <li key={f.id} className="grid gap-2 sm:grid-cols-[11rem_1fr_auto]">
                <label className="sr-only" htmlFor={fid(`social-${i}-platform`)}>
                  Platform
                </label>
                <select id={fid(`social-${i}-platform`)} className={selectClass} {...register(`socialLinks.${i}.platform`)}>
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {SOCIAL_LABELS[p]}
                    </option>
                  ))}
                </select>
                <div>
                  <label className="sr-only" htmlFor={fid(`social-${i}-url`)}>
                    Link
                  </label>
                  <input
                    id={fid(`social-${i}-url`)}
                    placeholder="https://www.facebook.com/…"
                    className={inputClass}
                    aria-invalid={!!errors.socialLinks?.[i]?.url}
                    {...register(`socialLinks.${i}.url`)}
                  />
                  {errors.socialLinks?.[i]?.url && <p className="mt-1 text-xs text-red-700">Enter the full link, starting with https://</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => social.remove(i)} aria-label="Remove link">
                  <Trash2 aria-hidden className="size-4 text-red-600" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Header and footer">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Header button text" htmlFor={fid("headerCtaLabel")} hint="Leave empty to hide the button.">
            <input id={fid("headerCtaLabel")} className={inputClass} {...register("headerCtaLabel")} />
          </Field>
          <Field label="Header button link" htmlFor={fid("headerCtaUrl")} error={errors.headerCtaUrl?.message}>
            <input id={fid("headerCtaUrl")} className={inputClass} {...register("headerCtaUrl")} />
          </Field>
          <Field label="Copyright line" htmlFor={fid("copyright")} className="md:col-span-2" hint="{year} is replaced with the current year.">
            <input id={fid("copyright")} className={inputClass} {...register("copyright")} />
          </Field>
        </div>
      </Card>

      <FormActions pending={pending} submitLabel="Save settings" />
    </form>
  );
}
