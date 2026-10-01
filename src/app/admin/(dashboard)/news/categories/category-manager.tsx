"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { categorySchema, type CategoryFormValues } from "@/lib/validation/cms";
import { deleteCategory, saveCategory } from "@/server/actions/articles";
import { Button, EmptyRow, TableWrap, inputClass, tableClass, tdClass, textareaClass, thClass } from "@/components/admin/ui";
import { Field } from "@/components/admin/field";
import { FormDialog } from "@/components/admin/form-dialog";
import { SlugInput } from "@/components/admin/slug-input";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

type Category = { id: string; name: string; slug: string; description: string | null; articleCount: number };

const empty: CategoryFormValues = { name: "", slug: "", description: "" };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const fid = useFieldId();
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryFormValues | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema, undefined, { raw: true }), defaultValues: empty });

  const open = (values: CategoryFormValues) => {
    reset(values);
    setEditing(values);
  };

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveCategory(values);
      if (handleResult(result, setError, "Category saved")) {
        setEditing(null);
        router.refresh();
      }
    }),
  );

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => open(empty)}>
          <Plus aria-hidden className="size-4" /> New category
        </Button>
      </div>
      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Order</th>
              <th className={thClass}>Name</th>
              <th className={`${thClass} hidden sm:table-cell`}>Articles</th>
              <th className={`${thClass} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && <EmptyRow colSpan={4}>No categories yet.</EmptyRow>}
            {categories.map((c, i) => (
              <tr key={c.id}>
                <td className={`${tdClass} w-24`}>
                  <ReorderButtons model="articleCategory" id={c.id} label={c.name} isFirst={i === 0} isLast={i === categories.length - 1} />
                </td>
                <td className={tdClass}>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-zinc-500">/news?category={c.slug}</p>
                </td>
                <td className={`${tdClass} hidden text-zinc-600 sm:table-cell`}>{c.articleCount}</td>
                <td className={`${tdClass} text-right`}>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Edit “${c.name}”`}
                      onClick={() => open({ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "" })}
                    >
                      <Pencil aria-hidden className="size-4" />
                    </Button>
                    <ConfirmButton
                      triggerVariant="ghost"
                      triggerSize="icon"
                      triggerLabel={`Delete “${c.name}”`}
                      title={`Delete the category “${c.name}”?`}
                      description={
                        c.articleCount > 0
                          ? `${c.articleCount} article(s) use it. They will stay published, without a category.`
                          : "No articles use this category."
                      }
                      confirmLabel="Delete"
                      successMessage="Category deleted"
                      action={() => deleteCategory({ id: c.id })}
                    >
                      <Trash2 aria-hidden className="size-4 text-red-600" />
                    </ConfirmButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      <FormDialog open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? "Edit category" : "New category"} onSubmit={onSubmit} pending={pending}>
        <Field label="Name" htmlFor={fid("cat-name")} required error={errors.name?.message}>
          <input id={fid("cat-name")} className={inputClass} aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Web address" htmlFor={fid("cat-slug")} required error={errors.slug?.message}>
          <Controller
            control={control}
            name="slug"
            render={({ field }) => (
              <SlugInput
                key={editing?.id ?? "new"}
                id={fid("cat-slug")}
                value={field.value}
                onChange={field.onChange}
                source={watch("name") ?? ""}
                prefix="?category="
                locked={Boolean(editing?.id)}
                invalid={!!errors.slug}
              />
            )}
          />
        </Field>
        <Field label="Description" htmlFor={fid("cat-description")} error={errors.description?.message}>
          <textarea id={fid("cat-description")} rows={2} className={textareaClass} {...register("description")} />
        </Field>
      </FormDialog>
    </>
  );
}
