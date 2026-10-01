"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { programSchema, type ProgramFormValues } from "@/lib/validation/cms";
import { fromLocalInput } from "@/lib/datetime";
import { saveProgram } from "@/server/actions/programs";
import type { MediaSummary } from "@/lib/media-summary";
import { Card, inputClass, textareaClass } from "@/components/admin/ui";
import { CheckboxField, Field } from "@/components/admin/field";
import { SlugInput } from "@/components/admin/slug-input";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { MediaField } from "@/components/admin/media/media-picker";
import { FormActions, PublishingPanel, SeoPanel } from "@/components/admin/form-panels";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

export function ProgramForm({ defaults, image }: { defaults: ProgramFormValues; image?: MediaSummary | null }) {
  const fid = useFieldId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isNew = !defaults.id;
  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<ProgramFormValues>({ resolver: zodResolver(programSchema, undefined, { raw: true }), defaultValues: defaults });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveProgram({ ...values, publishedAt: fromLocalInput(values.publishedAt as string) });
      if (handleResult(result, setError, isNew ? "Program created" : "Program saved") && result.ok) {
        if (isNew) router.push(`/admin/programs/${result.data.id}`);
        else router.refresh();
      }
    }),
  );
  const [title, shortDescription, seoTitle, seoDescription, slug] = watch(["title", "shortDescription", "seoTitle", "seoDescription", "slug"]);

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <div className="space-y-5">
              <Field label="Title" htmlFor={fid("title")} required error={errors.title?.message}>
                <input id={fid("title")} className={`${inputClass} text-base`} aria-invalid={!!errors.title} {...register("title")} />
              </Field>
              <Field label="Web address" htmlFor={fid("slug")} required error={errors.slug?.message}>
                <Controller
                  control={control}
                  name="slug"
                  render={({ field }) => (
                    <SlugInput id={fid("slug")} value={field.value} onChange={field.onChange} source={title ?? ""} prefix="/programs/" locked={!isNew} invalid={!!errors.slug} />
                  )}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Grades / level" htmlFor={fid("gradeRange")} hint="e.g. Grades 1–8">
                  <input id={fid("gradeRange")} className={inputClass} {...register("gradeRange")} />
                </Field>
                <Field label="Category" htmlFor={fid("category")} hint="Optional, e.g. Academic">
                  <input id={fid("category")} className={inputClass} {...register("category")} />
                </Field>
              </div>
              <Field label="Short description" htmlFor={fid("shortDescription")} error={errors.shortDescription?.message} hint="Shown on program cards.">
                <textarea id={fid("shortDescription")} rows={3} className={textareaClass} {...register("shortDescription")} />
              </Field>
              <Field label="Full description" htmlFor={fid("description")}>
                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => <RichTextEditor label="Full description" id={fid("description")} value={field.value} onChange={field.onChange} bucket="programs" />}
                />
              </Field>
            </div>
          </Card>
          <SeoPanel
            seoTitle={(seoTitle as string) ?? ""}
            seoDescription={(seoDescription as string) ?? ""}
            register={(name) => register(name)}
            fallbackTitle={title ?? ""}
            fallbackDescription={(shortDescription as string) ?? ""}
            path={`/programs/${slug ?? ""}`}
          />
        </div>
        <div className="space-y-6">
          <Controller
            control={control}
            name="status"
            render={({ field }) => <PublishingPanel status={field.value} onStatusChange={field.onChange} showDate={false} />}
          />
          <Card title="Options">
            <CheckboxField id={fid("featured")} label="Featured" description="Show first on the homepage." {...register("featured")} />
          </Card>
          <Card title="Image">
            <Controller
              control={control}
              name="imageId"
              render={({ field }) => <MediaField id={fid("imageId")} value={field.value} onChange={field.onChange} initial={image} bucket="programs" />}
            />
          </Card>
        </div>
      </div>
      <FormActions pending={pending} submitLabel={isNew ? "Create program" : "Save changes"} previewHref={defaults.id ? `/admin/preview/programs/${defaults.id}` : undefined} />
    </form>
  );
}
