"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { highlightSchema, type HighlightFormValues } from "@/lib/validation/cms";
import type { MediaSummary } from "@/lib/media-summary";
import { getIcon } from "@/lib/icons";
import { deleteHighlight, saveHighlight } from "@/server/actions/homepage";
import { Button, Card, StatusBadge, inputClass, textareaClass } from "@/components/admin/ui";
import { CheckboxField, Field } from "@/components/admin/field";
import { FormDialog } from "@/components/admin/form-dialog";
import { IconPicker } from "@/components/admin/icon-picker";
import { MediaField } from "@/components/admin/media/media-picker";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

type Group = HighlightFormValues["group"];
type Item = HighlightFormValues & { id: string; image: MediaSummary | null };

export function HighlightManager({ group, groupLabel, items }: { group: Group; groupLabel: string; items: Item[] }) {
  const fid = useFieldId();
  const router = useRouter();
  const empty: HighlightFormValues = { group, title: "", subtitle: "", text: "", icon: "", href: "", imageId: "", visible: true };
  const [editing, setEditing] = useState<{ values: HighlightFormValues; image: MediaSummary | null } | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<HighlightFormValues>({ resolver: zodResolver(highlightSchema, undefined, { raw: true }), defaultValues: empty });

  const open = (values: HighlightFormValues, image: MediaSummary | null = null) => {
    reset(values);
    setEditing({ values, image });
  };
  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveHighlight(values);
      if (handleResult(result, setError, "Saved")) {
        setEditing(null);
        router.refresh();
      }
    }),
  );

  const isStep = group === "ADMISSION_STEP";
  const usesImage = group === "STUDENT_LIFE" || group === "CAMPUS";

  return (
    <Card
      title={groupLabel}
      actions={
        <Button size="sm" onClick={() => open(empty)}>
          <Plus aria-hidden className="size-4" /> Add item
        </Button>
      }
    >
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">No items yet. This part of the website is hidden until you add one.</p>
      ) : (
        <ol className="divide-y divide-zinc-100">
          {items.map((item, i) => {
            const Icon = getIcon(item.icon as string);
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                <ReorderButtons model="highlight" id={item.id} label={item.title} isFirst={i === 0} isLast={i === items.length - 1} />
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-700">
                  {isStep ? <span className="text-sm font-semibold">{i + 1}</span> : <Icon aria-hidden className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="line-clamp-1 text-xs text-zinc-500">{(item.subtitle as string) || (item.text as string)}</p>
                </div>
                {!item.visible && <StatusBadge status="OFF" label="Hidden" />}
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => open(item, item.image)} aria-label={`Edit “${item.title}”`}>
                    <Pencil aria-hidden className="size-4" />
                  </Button>
                  <ConfirmButton
                    triggerVariant="ghost"
                    triggerSize="icon"
                    triggerLabel={`Delete “${item.title}”`}
                    title={`Delete “${item.title}”?`}
                    confirmLabel="Delete"
                    successMessage="Deleted"
                    action={() => deleteHighlight({ id: item.id })}
                  >
                    <Trash2 aria-hidden className="size-4 text-red-600" />
                  </ConfirmButton>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <FormDialog open={editing !== null} onClose={() => setEditing(null)} title={editing?.values.id ? "Edit item" : "New item"} onSubmit={onSubmit} pending={pending} wide>
        <Field label="Title" htmlFor={fid("hl-title")} required error={errors.title?.message}>
          <input id={fid("hl-title")} className={inputClass} aria-invalid={!!errors.title} {...register("title")} />
        </Field>
        {!isStep && (
          <Field label="Subtitle" htmlFor={fid("hl-subtitle")} hint={group === "CAMPUS" ? "e.g. Grades 1–12" : "Optional"}>
            <input id={fid("hl-subtitle")} className={inputClass} {...register("subtitle")} />
          </Field>
        )}
        <Field label="Text" htmlFor={fid("hl-text")} error={errors.text?.message}>
          <textarea id={fid("hl-text")} rows={3} className={textareaClass} {...register("text")} />
        </Field>
        {!isStep && (
          <Field label="Icon" htmlFor={fid("hl-icon")} hint="Shown when there is no image.">
            <Controller control={control} name="icon" render={({ field }) => <IconPicker id={fid("hl-icon")} value={(field.value as string) ?? ""} onChange={field.onChange} />} />
          </Field>
        )}
        {usesImage && (
          <Field label="Image" htmlFor={fid("hl-image")} hint="Optional">
            <Controller
              control={control}
              name="imageId"
              render={({ field }) => (
                <MediaField key={editing?.values.id ?? "new"} id={fid("hl-image")} value={field.value} onChange={field.onChange} initial={editing?.image} bucket="site-assets" />
              )}
            />
          </Field>
        )}
        {!isStep && (
          <Field label="Link" htmlFor={fid("hl-href")} error={errors.href?.message} hint="Optional, e.g. /programs">
            <input id={fid("hl-href")} className={inputClass} {...register("href")} />
          </Field>
        )}
        <CheckboxField id={fid("hl-visible")} label="Show on the website" {...register("visible")} />
      </FormDialog>
    </Card>
  );
}
