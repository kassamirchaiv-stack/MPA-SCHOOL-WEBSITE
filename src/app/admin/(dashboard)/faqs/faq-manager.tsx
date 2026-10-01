"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { faqSchema, type FaqFormValues } from "@/lib/validation/cms";
import { deleteFaq, saveFaq, setFaqStatus } from "@/server/actions/people";
import { Button, EmptyRow, StatusBadge, TableWrap, inputClass, selectClass, tableClass, tdClass, textareaClass, thClass } from "@/components/admin/ui";
import { Field } from "@/components/admin/field";
import { FormDialog } from "@/components/admin/form-dialog";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

type Faq = { id: string; question: string; answer: string; category: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" };

const empty: FaqFormValues = { question: "", answer: "", category: "", status: "PUBLISHED" };

export function FaqManager({ faqs, categories }: { faqs: Faq[]; categories: string[] }) {
  const fid = useFieldId();
  const router = useRouter();
  const [editing, setEditing] = useState<FaqFormValues | null>(null);
  const [filter, setFilter] = useState("");
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FaqFormValues>({ resolver: zodResolver(faqSchema, undefined, { raw: true }), defaultValues: empty });

  const open = (values: FaqFormValues) => {
    reset(values);
    setEditing(values);
  };
  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveFaq(values);
      if (handleResult(result, setError, "FAQ saved")) {
        setEditing(null);
        router.refresh();
      }
    }),
  );

  const shown = filter ? faqs.filter((f) => f.category === filter) : faqs;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <label htmlFor={fid("faq-filter")} className="sr-only">
            Category
          </label>
          <select id={fid("faq-filter")} value={filter} onChange={(e) => setFilter(e.target.value)} className={`${selectClass} w-auto`}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={() => open(empty)}>
          <Plus aria-hidden className="size-4" /> New question
        </Button>
      </div>
      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              {!filter && <th className={thClass}>Order</th>}
              <th className={thClass}>Question</th>
              <th className={`${thClass} hidden md:table-cell`}>Category</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && <EmptyRow colSpan={5}>No questions yet.</EmptyRow>}
            {shown.map((f, i) => (
              <tr key={f.id} className="hover:bg-zinc-50">
                {!filter && (
                  <td className={`${tdClass} w-24`}>
                    <ReorderButtons model="faq" id={f.id} label={f.question} isFirst={i === 0} isLast={i === shown.length - 1} />
                  </td>
                )}
                <td className={tdClass}>
                  <button type="button" onClick={() => open(f)} className="text-left font-medium hover:underline">
                    {f.question}
                  </button>
                  <p className="line-clamp-1 text-xs text-zinc-500">{f.answer}</p>
                </td>
                <td className={`${tdClass} hidden text-zinc-600 md:table-cell`}>{f.category || "—"}</td>
                <td className={tdClass}>
                  <StatusBadge status={f.status} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <div className="flex justify-end">
                    <Button variant="secondary" size="sm" onClick={() => open(f)}>
                      Edit
                    </Button>
                    <ContentRowActions id={f.id} label={f.question} status={f.status} setStatus={setFaqStatus} remove={deleteFaq} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      <FormDialog open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? "Edit question" : "New question"} onSubmit={onSubmit} pending={pending} wide>
        <Field label="Question" htmlFor={fid("f-question")} required error={errors.question?.message}>
          <input id={fid("f-question")} className={inputClass} aria-invalid={!!errors.question} {...register("question")} />
        </Field>
        <Field label="Answer" htmlFor={fid("f-answer")} required error={errors.answer?.message}>
          <textarea id={fid("f-answer")} rows={6} className={textareaClass} aria-invalid={!!errors.answer} {...register("answer")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor={fid("f-category")} hint="Questions are grouped by category.">
            <input id={fid("f-category")} list={fid("faq-categories")} className={inputClass} {...register("category")} />
            <datalist id={fid("faq-categories")}>
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Status" htmlFor={fid("f-status")}>
            <select id={fid("f-status")} className={selectClass} {...register("status")}>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
        </div>
      </FormDialog>
    </>
  );
}
