"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { articleSchema, type ArticleFormValues } from "@/lib/validation/cms";
import { fromLocalInput } from "@/lib/datetime";
import { saveArticle } from "@/server/actions/articles";
import type { MediaSummary } from "@/server/actions/media";
import { Card, inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { CheckboxField, Field } from "@/components/admin/field";
import { SlugInput } from "@/components/admin/slug-input";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { MediaField } from "@/components/admin/media/media-picker";
import { FormActions, PublishingPanel, SeoPanel } from "@/components/admin/form-panels";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

type Props = {
  defaults: ArticleFormValues;
  categories: { id: string; name: string }[];
  image?: MediaSummary | null;
};

export function ArticleForm({ defaults, categories, image }: Props) {
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
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema, undefined, { raw: true }),
    defaultValues: defaults,
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveArticle({ ...values, publishedAt: fromLocalInput(values.publishedAt as string) });
      if (handleResult(result, setError, isNew ? "Article created" : "Article saved") && result.ok) {
        if (isNew) router.push(`/admin/news/${result.data.id}`);
        else router.refresh();
      }
    }),
  );

  const [title, excerpt, seoTitle, seoDescription, slug] = watch(["title", "excerpt", "seoTitle", "seoDescription", "slug"]);

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
                    <SlugInput id={fid("slug")} value={field.value} onChange={field.onChange} source={title ?? ""} prefix="/news/" locked={!isNew} invalid={!!errors.slug} />
                  )}
                />
              </Field>
              <Field label="Summary" htmlFor={fid("excerpt")} error={errors.excerpt?.message} hint="Shown on news cards and in search results.">
                <textarea id={fid("excerpt")} rows={3} className={textareaClass} {...register("excerpt")} />
              </Field>
              <Field label="Article" htmlFor={fid("content")}>
                <Controller
                  control={control}
                  name="content"
                  render={({ field }) => <RichTextEditor label="Article" id={fid("content")} value={field.value} onChange={field.onChange} bucket="articles" />}
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
            path={`/news/${slug ?? ""}`}
          />
        </div>

        <div className="space-y-6">
          <Controller
            control={control}
            name="status"
            render={({ field: statusField }) => (
              <Controller
                control={control}
                name="publishedAt"
                render={({ field: dateField }) => (
                  <PublishingPanel
                    status={statusField.value}
                    onStatusChange={statusField.onChange}
                    publishedAt={(dateField.value as string) ?? ""}
                    onPublishedAtChange={dateField.onChange}
                    error={errors.publishedAt?.message}
                  />
                )}
              />
            )}
          />
          <Card title="Details">
            <div className="space-y-4">
              <Field label="Category" htmlFor={fid("categoryId")}>
                <select id={fid("categoryId")} className={selectClass} {...register("categoryId")}>
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tags" htmlFor={fid("tags")} hint="Separate with commas, e.g. exams, grade 12">
                <input id={fid("tags")} className={inputClass} {...register("tags")} />
              </Field>
              <Field label="Author" htmlFor={fid("authorName")} hint="e.g. MPA Registrar Office">
                <input id={fid("authorName")} className={inputClass} {...register("authorName")} />
              </Field>
              <CheckboxField id={fid("featured")} label="Featured" description="Highlight this article." {...register("featured")} />
            </div>
          </Card>
          <Card title="Featured image">
            <Controller
              control={control}
              name="imageId"
              render={({ field }) => <MediaField id={fid("imageId")} value={field.value} onChange={field.onChange} initial={image} bucket="articles" />}
            />
          </Card>
        </div>
      </div>
      <FormActions pending={pending} submitLabel={isNew ? "Create article" : "Save changes"} previewHref={defaults.id ? `/admin/preview/news/${defaults.id}` : undefined} />
    </form>
  );
}
