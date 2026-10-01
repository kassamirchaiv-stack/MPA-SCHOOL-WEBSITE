"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { statisticSchema, type StatisticFormValues } from "@/lib/validation/cms";
import { getIcon } from "@/lib/icons";
import { deleteStatistic, saveStatistic } from "@/server/actions/homepage";
import { Button, Card, StatusBadge, inputClass } from "@/components/admin/ui";
import { CheckboxField, Field } from "@/components/admin/field";
import { FormDialog } from "@/components/admin/form-dialog";
import { IconPicker } from "@/components/admin/icon-picker";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

type Stat = StatisticFormValues & { id: string };
const empty: StatisticFormValues = { value: "", label: "", description: "", icon: "", visible: true };

export function StatisticManager({ stats }: { stats: Stat[] }) {
  const fid = useFieldId();
  const router = useRouter();
  const [editing, setEditing] = useState<StatisticFormValues | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<StatisticFormValues>({ resolver: zodResolver(statisticSchema, undefined, { raw: true }), defaultValues: empty });

  const open = (values: StatisticFormValues) => {
    reset(values);
    setEditing(values);
  };
  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveStatistic(values);
      if (handleResult(result, setError, "Statistic saved")) {
        setEditing(null);
        router.refresh();
      }
    }),
  );

  return (
    <Card
      title="Statistics"
      actions={
        <Button size="sm" onClick={() => open(empty)}>
          <Plus aria-hidden className="size-4" /> Add statistic
        </Button>
      }
    >
      {stats.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">No statistics. The band is hidden.</p>
      ) : (
        <ol className="divide-y divide-zinc-100">
          {stats.map((s, i) => {
            const Icon = getIcon(s.icon as string);
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                <ReorderButtons model="statistic" id={s.id} label={s.label} isFirst={i === 0} isLast={i === stats.length - 1} />
                <Icon aria-hidden className="size-4 text-zinc-500" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{s.value}</p>
                  <p className="text-xs text-zinc-500">{s.label}</p>
                </div>
                {!s.visible && <StatusBadge status="OFF" label="Hidden" />}
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => open(s)} aria-label={`Edit “${s.label}”`}>
                    <Pencil aria-hidden className="size-4" />
                  </Button>
                  <ConfirmButton
                    triggerVariant="ghost"
                    triggerSize="icon"
                    triggerLabel={`Delete “${s.label}”`}
                    title={`Delete “${s.label}”?`}
                    confirmLabel="Delete"
                    successMessage="Deleted"
                    action={() => deleteStatistic({ id: s.id })}
                  >
                    <Trash2 aria-hidden className="size-4 text-red-600" />
                  </ConfirmButton>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <FormDialog open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? "Edit statistic" : "New statistic"} onSubmit={onSubmit} pending={pending} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Number" htmlFor={fid("st-value")} required error={errors.value?.message} hint="e.g. 1,200+ or G1–12">
            <input id={fid("st-value")} className={inputClass} aria-invalid={!!errors.value} {...register("value")} />
          </Field>
          <Field label="Label" htmlFor={fid("st-label")} required error={errors.label?.message} hint="e.g. Students">
            <input id={fid("st-label")} className={inputClass} aria-invalid={!!errors.label} {...register("label")} />
          </Field>
        </div>
        <Field label="Icon" htmlFor={fid("st-icon")}>
          <Controller control={control} name="icon" render={({ field }) => <IconPicker id={fid("st-icon")} value={(field.value as string) ?? ""} onChange={field.onChange} />} />
        </Field>
        <CheckboxField id={fid("st-visible")} label="Show on the website" {...register("visible")} />
      </FormDialog>
    </Card>
  );
}
