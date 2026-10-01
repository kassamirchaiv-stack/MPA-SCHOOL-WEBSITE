"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import type { MediaSummary } from "@/lib/media-summary";
import { saveSeoDefaults } from "@/server/actions/settings";
import { Card, inputClass, textareaClass } from "@/components/admin/ui";
import { Field } from "@/components/admin/field";
import { MediaField } from "@/components/admin/media/media-picker";
import { FormActions } from "@/components/admin/form-panels";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

type Values = { seoTitle: string; seoDescription: string; ogImageId: string };

export function SeoDefaultsForm({ defaults, ogImage }: { defaults: Values; ogImage: MediaSummary | null }) {
  const fid = useFieldId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, watch, setError } = useForm<Values>({ defaultValues: defaults });
  const [title, description] = watch(["seoTitle", "seoDescription"]);

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveSeoDefaults(values);
      if (handleResult(result, setError, "SEO defaults saved")) router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card title="Defaults" description="Used by the homepage and by any page without its own SEO settings.">
        <div className="grid gap-6 md:grid-cols-[1fr_16rem]">
          <div className="space-y-4">
            <Field label="Default title" htmlFor={fid("seoTitle")} hint={`${title.length}/60 characters recommended`}>
              <input id={fid("seoTitle")} className={inputClass} {...register("seoTitle")} />
            </Field>
            <Field label="Default description" htmlFor={fid("seoDescription")} hint={`${description.length}/160 characters recommended`}>
              <textarea id={fid("seoDescription")} rows={3} className={textareaClass} {...register("seoDescription")} />
            </Field>
          </div>
          <Field label="Default share image" htmlFor={fid("ogImageId")} hint="1200 × 630 px works best.">
            <Controller
              control={control}
              name="ogImageId"
              render={({ field }) => <MediaField id={fid("ogImageId")} value={field.value} onChange={(v) => field.onChange(v ?? "")} initial={ogImage} bucket="site-assets" aspect="aspect-[1200/630]" />}
            />
          </Field>
        </div>
      </Card>
      <FormActions pending={pending} submitLabel="Save SEO defaults" />
    </form>
  );
}
