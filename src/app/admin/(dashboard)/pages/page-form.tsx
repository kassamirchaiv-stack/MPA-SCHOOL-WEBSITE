"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pageSchema, type PageFormValues } from "@/lib/validation/cms";
import { savePage } from "@/server/actions/pages";
import type { MediaSummary } from "@/lib/media-summary";
import { Card, inputClass, textareaClass } from "@/components/admin/ui";
import { Field } from "@/components/admin/field";
import { SlugInput } from "@/components/admin/slug-input";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { MediaField } from "@/components/admin/media/media-picker";
import { FormActions, PublishingPanel, SeoPanel } from "@/components/admin/form-panels";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

type Props = {
  defaults: PageFormValues;
  /** Fixed public address for built-in pages; null for custom pages. */
  systemPath: string | null;
  heroImage?: MediaSummary | null;
  ogImage?: MediaSummary | null;
  /** Explains what else appears on this page (lists come from other sections). */
  note?: string;
};

export function PageForm({ defaults, systemPath, heroImage, ogImage, note }: Props) {
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
  } = useForm<PageFormValues>({ resolver: zodResolver(pageSchema, undefined, { raw: true }), defaultValues: defaults });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await savePage(values);
      if (handleResult(result, setError, isNew ? "Page created" : "Page saved") && result.ok) {
        if (isNew) router.push(`/admin/pages/${result.data.id}`);
        else router.refresh();
      }
    }),
  );
  const [title, intro, seoTitle, seoDescription, slug] = watch(["title", "intro", "seoTitle", "seoDescription", "slug"]);
  const path = systemPath ?? `/${slug ?? ""}`;

  return (
    <form onSubmit={onSubmit} noValidate>
      {note && <p className="mb-6 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">{note}</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <div className="space-y-5">
              <Field label="Small heading above the title" htmlFor={fid("eyebrow")} hint="Optional, e.g. About MPA">
                <input id={fid("eyebrow")} className={inputClass} {...register("eyebrow")} />
              </Field>
              <Field label="Title" htmlFor={fid("title")} required error={errors.title?.message}>
                <input id={fid("title")} className={`${inputClass} text-base`} aria-invalid={!!errors.title} {...register("title")} />
              </Field>
              {systemPath ? (
                <Field label="Web address" htmlFor={fid("slug")} hint="Built-in pages have a fixed address.">
                  <input id={fid("slug")} value={systemPath} readOnly className={`${inputClass} bg-zinc-50 text-zinc-600`} />
                </Field>
              ) : (
                <Field label="Web address" htmlFor={fid("slug")} required error={errors.slug?.message}>
                  <Controller
                    control={control}
                    name="slug"
                    render={({ field }) => (
                      <SlugInput id={fid("slug")} value={field.value} onChange={field.onChange} source={title ?? ""} prefix="/" locked={!isNew} invalid={!!errors.slug} />
                    )}
                  />
                </Field>
              )}
              <Field label="Introduction" htmlFor={fid("intro")} error={errors.intro?.message} hint="Shown under the title.">
                <textarea id={fid("intro")} rows={3} className={textareaClass} {...register("intro")} />
              </Field>
              <Field label="Page content" htmlFor={fid("content")}>
                <Controller
                  control={control}
                  name="content"
                  render={({ field }) => <RichTextEditor label="Page content" id={fid("content")} value={field.value} onChange={field.onChange} bucket="site-assets" />}
                />
              </Field>
            </div>
          </Card>
          <SeoPanel
            seoTitle={(seoTitle as string) ?? ""}
            seoDescription={(seoDescription as string) ?? ""}
            register={(name) => register(name)}
            fallbackTitle={title ?? ""}
            fallbackDescription={(intro as string) ?? ""}
            path={path}
          />
        </div>
        <div className="space-y-6">
          <Controller
            control={control}
            name="status"
            render={({ field }) => <PublishingPanel status={field.value} onStatusChange={field.onChange} showDate={false} />}
          />
          <Card title="Header image" description="Optional, shown beside the title.">
            <Controller
              control={control}
              name="heroImageId"
              render={({ field }) => <MediaField id={fid("heroImageId")} value={field.value} onChange={field.onChange} initial={heroImage} bucket="site-assets" />}
            />
          </Card>
          <Card title="Share image" description="Used when the page is shared on social media.">
            <Controller
              control={control}
              name="ogImageId"
              render={({ field }) => <MediaField id={fid("ogImageId")} value={field.value} onChange={field.onChange} initial={ogImage} bucket="site-assets" />}
            />
          </Card>
        </div>
      </div>
      <FormActions pending={pending} submitLabel={isNew ? "Create page" : "Save changes"} previewHref={defaults.id ? `/admin/preview/pages/${defaults.id}` : undefined} />
    </form>
  );
}
