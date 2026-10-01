"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventFormValues } from "@/lib/validation/cms";
import { fromLocalInput } from "@/lib/datetime";
import { saveEvent } from "@/server/actions/events";
import type { MediaSummary } from "@/lib/media-summary";
import { Card, inputClass, textareaClass } from "@/components/admin/ui";
import { CheckboxField, Field } from "@/components/admin/field";
import { SlugInput } from "@/components/admin/slug-input";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { MediaField } from "@/components/admin/media/media-picker";
import { FormActions, PublishingPanel, SeoPanel } from "@/components/admin/form-panels";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

export function EventForm({ defaults, image }: { defaults: EventFormValues; image?: MediaSummary | null }) {
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
  } = useForm<EventFormValues>({ resolver: zodResolver(eventSchema, undefined, { raw: true }), defaultValues: defaults });

  const allDay = watch("allDay");
  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveEvent({
        ...values,
        startsAt: fromLocalInput(values.startsAt as string),
        endsAt: fromLocalInput(values.endsAt as string),
      });
      if (handleResult(result, setError, isNew ? "Event created" : "Event saved") && result.ok) {
        if (isNew) router.push(`/admin/events/${result.data.id}`);
        else router.refresh();
      }
    }),
  );

  const [title, excerpt, seoTitle, seoDescription, slug] = watch(["title", "excerpt", "seoTitle", "seoDescription", "slug"]);
  const dateType = allDay ? "date" : "datetime-local";

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
                    <SlugInput id={fid("slug")} value={field.value} onChange={field.onChange} source={title ?? ""} prefix="/events/" locked={!isNew} invalid={!!errors.slug} />
                  )}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Starts" htmlFor={fid("startsAt")} required error={errors.startsAt?.message} hint="Addis Ababa time">
                  <input
                    id={fid("startsAt")}
                    type={dateType}
                    className={inputClass}
                    aria-invalid={!!errors.startsAt}
                    {...register("startsAt", { setValueAs: (v: string) => (allDay && v ? v.slice(0, 10) : v) })}
                  />
                </Field>
                <Field label="Ends" htmlFor={fid("endsAt")} error={errors.endsAt?.message} hint="Optional">
                  <input
                    id={fid("endsAt")}
                    type={dateType}
                    className={inputClass}
                    aria-invalid={!!errors.endsAt}
                    {...register("endsAt", { setValueAs: (v: string) => (allDay && v ? v.slice(0, 10) : v) })}
                  />
                </Field>
              </div>
              <CheckboxField id={fid("allDay")} label="All-day event" description="Hide start and end times." {...register("allDay")} />
              <Field label="Location" htmlFor={fid("location")} error={errors.location?.message} hint="e.g. Mekelle Campus main hall">
                <input id={fid("location")} className={inputClass} {...register("location")} />
              </Field>
              <Field label="Registration link" htmlFor={fid("registrationUrl")} error={errors.registrationUrl?.message} hint="Optional — shows a Register button.">
                <input id={fid("registrationUrl")} className={inputClass} placeholder="https://" {...register("registrationUrl")} />
              </Field>
              <Field label="Summary" htmlFor={fid("excerpt")} error={errors.excerpt?.message} hint="Shown on event cards.">
                <textarea id={fid("excerpt")} rows={2} className={textareaClass} {...register("excerpt")} />
              </Field>
              <Field label="Details" htmlFor={fid("description")}>
                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => <RichTextEditor label="Event details" id={fid("description")} value={field.value} onChange={field.onChange} bucket="events" />}
                />
              </Field>
            </div>
          </Card>
          <SeoPanel
            seoTitle={(seoTitle as string) ?? ""}
            seoDescription={(seoDescription as string) ?? ""}
            register={(name) => register(name)}
            fallbackTitle={title ?? ""}
            fallbackDescription={(excerpt as string) ?? ""}
            path={`/events/${slug ?? ""}`}
          />
        </div>
        <div className="space-y-6">
          <Controller
            control={control}
            name="status"
            render={({ field }) => <PublishingPanel status={field.value} onStatusChange={field.onChange} showDate={false} />}
          />
          <Card title="Options">
            <CheckboxField id={fid("featured")} label="Featured" description="Highlight this event." {...register("featured")} />
          </Card>
          <Card title="Image">
            <Controller
              control={control}
              name="imageId"
              render={({ field }) => <MediaField id={fid("imageId")} value={field.value} onChange={field.onChange} initial={image} bucket="events" />}
            />
          </Card>
        </div>
      </div>
      <FormActions pending={pending} submitLabel={isNew ? "Create event" : "Save changes"} previewHref={defaults.id ? `/admin/preview/events/${defaults.id}` : undefined} />
    </form>
  );
}
