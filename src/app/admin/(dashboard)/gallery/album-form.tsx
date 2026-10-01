"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { albumSchema, type AlbumFormValues } from "@/lib/validation/cms";
import { fromLocalInput } from "@/lib/datetime";
import { saveAlbum } from "@/server/actions/gallery";
import { Card, inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { CheckboxField, Field } from "@/components/admin/field";
import { SlugInput } from "@/components/admin/slug-input";
import { FormActions } from "@/components/admin/form-panels";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

export function AlbumForm({ defaults }: { defaults: AlbumFormValues }) {
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
  } = useForm<AlbumFormValues>({ resolver: zodResolver(albumSchema, undefined, { raw: true }), defaultValues: defaults });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveAlbum({ ...values, date: fromLocalInput(values.date as string) });
      if (handleResult(result, setError, isNew ? "Album created — now add photos" : "Album saved") && result.ok) {
        if (isNew) router.push(`/admin/gallery/${result.data.id}`);
        else router.refresh();
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card title="Album details">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Title" htmlFor={fid("title")} required error={errors.title?.message} className="md:col-span-2">
            <input id={fid("title")} className={inputClass} aria-invalid={!!errors.title} {...register("title")} />
          </Field>
          <Field label="Web address" htmlFor={fid("slug")} required error={errors.slug?.message} className="md:col-span-2">
            <Controller
              control={control}
              name="slug"
              render={({ field }) => (
                <SlugInput id={fid("slug")} value={field.value} onChange={field.onChange} source={watch("title") ?? ""} prefix="/gallery/" locked={!isNew} invalid={!!errors.slug} />
              )}
            />
          </Field>
          <Field label="Date" htmlFor={fid("date")} error={errors.date?.message} hint="When the photos were taken (optional)">
            <input id={fid("date")} type="date" className={inputClass} {...register("date")} />
          </Field>
          <Field label="Category" htmlFor={fid("category")} hint="Optional, e.g. Sports, Graduation">
            <input id={fid("category")} className={inputClass} {...register("category")} />
          </Field>
          <Field label="Description" htmlFor={fid("description")} className="md:col-span-2">
            <textarea id={fid("description")} rows={3} className={textareaClass} {...register("description")} />
          </Field>
          <Field label="Status" htmlFor={fid("status")}>
            <select id={fid("status")} className={selectClass} {...register("status")}>
              <option value="DRAFT">Draft — not visible</option>
              <option value="PUBLISHED">Published — visible</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
          <div className="flex items-end">
            <CheckboxField id={fid("featured")} label="Featured" description="Its photos appear first on the homepage." {...register("featured")} />
          </div>
        </div>
      </Card>
      <FormActions pending={pending} submitLabel={isNew ? "Create album" : "Save details"} />
    </form>
  );
}
