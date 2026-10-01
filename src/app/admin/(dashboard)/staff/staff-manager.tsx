"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, UserRound } from "lucide-react";
import { staffSchema, type StaffFormValues } from "@/lib/validation/cms";
import type { MediaSummary } from "@/lib/media-summary";
import { deleteStaff, saveStaff, setStaffStatus } from "@/server/actions/people";
import { Button, EmptyRow, StatusBadge, TableWrap, inputClass, selectClass, tableClass, tdClass, textareaClass, thClass } from "@/components/admin/ui";
import { CheckboxField, Field } from "@/components/admin/field";
import { FormDialog } from "@/components/admin/form-dialog";
import { MediaField } from "@/components/admin/media/media-picker";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

type Member = StaffFormValues & { id: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; photo: MediaSummary | null };

const empty: StaffFormValues = {
  name: "",
  position: "",
  department: "",
  biography: "",
  email: "",
  phone: "",
  photoId: "",
  featured: false,
  status: "PUBLISHED",
};

export function StaffManager({ staff }: { staff: Member[] }) {
  const fid = useFieldId();
  const router = useRouter();
  const [editing, setEditing] = useState<{ values: StaffFormValues; photo: MediaSummary | null } | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<StaffFormValues>({ resolver: zodResolver(staffSchema, undefined, { raw: true }), defaultValues: empty });

  const open = (values: StaffFormValues, photo: MediaSummary | null = null) => {
    reset(values);
    setEditing({ values, photo });
  };

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveStaff(values);
      if (handleResult(result, setError, "Staff member saved")) {
        setEditing(null);
        router.refresh();
      }
    }),
  );

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => open(empty)}>
          <Plus aria-hidden className="size-4" /> Add person
        </Button>
      </div>
      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Order</th>
              <th className={thClass}>Person</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 && <EmptyRow colSpan={4}>No staff profiles yet.</EmptyRow>}
            {staff.map((m, i) => (
              <tr key={m.id} className="hover:bg-zinc-50">
                <td className={`${tdClass} w-24`}>
                  <ReorderButtons model="staffMember" id={m.id} label={m.name} isFirst={i === 0} isLast={i === staff.length - 1} />
                </td>
                <td className={tdClass}>
                  <button type="button" onClick={() => open(m, m.photo)} className="flex items-center gap-3 text-left">
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-zinc-100">
                      {m.photo ? (
                        <Image src={m.photo.url} alt="" fill sizes="40px" className="object-cover" />
                      ) : (
                        <UserRound aria-hidden className="absolute inset-0 m-auto size-5 text-zinc-400" />
                      )}
                    </span>
                    <span>
                      <span className="block font-medium hover:underline">{m.name}</span>
                      <span className="block text-xs text-zinc-500">
                        {m.position}
                        {m.featured && " · Leadership"}
                      </span>
                    </span>
                  </button>
                </td>
                <td className={tdClass}>
                  <StatusBadge status={m.status} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <div className="flex justify-end">
                    <Button variant="secondary" size="sm" onClick={() => open(m, m.photo)}>
                      Edit
                    </Button>
                    <ContentRowActions id={m.id} label={m.name} status={m.status} setStatus={setStaffStatus} remove={deleteStaff} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      <FormDialog open={editing !== null} onClose={() => setEditing(null)} title={editing?.values.id ? "Edit person" : "Add person"} onSubmit={onSubmit} pending={pending} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor={fid("s-name")} required error={errors.name?.message}>
            <input id={fid("s-name")} className={inputClass} aria-invalid={!!errors.name} {...register("name")} />
          </Field>
          <Field label="Position" htmlFor={fid("s-position")} required error={errors.position?.message} hint="e.g. Principal">
            <input id={fid("s-position")} className={inputClass} aria-invalid={!!errors.position} {...register("position")} />
          </Field>
          <Field label="Department" htmlFor={fid("s-department")}>
            <input id={fid("s-department")} className={inputClass} {...register("department")} />
          </Field>
          <Field label="Status" htmlFor={fid("s-status")}>
            <select id={fid("s-status")} className={selectClass} {...register("status")}>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
          <Field label="Email" htmlFor={fid("s-email")} error={errors.email?.message} hint="Optional — shown publicly">
            <input id={fid("s-email")} type="email" className={inputClass} {...register("email")} />
          </Field>
          <Field label="Phone" htmlFor={fid("s-phone")} hint="Optional — shown publicly">
            <input id={fid("s-phone")} className={inputClass} {...register("phone")} />
          </Field>
        </div>
        <Field label="Short biography" htmlFor={fid("s-bio")} error={errors.biography?.message}>
          <textarea id={fid("s-bio")} rows={4} className={textareaClass} {...register("biography")} />
        </Field>
        <CheckboxField id={fid("s-featured")} label="School leadership" description="Show in the leadership section at the top." {...register("featured")} />
        <Field label="Photo" htmlFor={fid("s-photo")}>
          <Controller
            control={control}
            name="photoId"
            render={({ field }) => (
              <MediaField key={editing?.values.id ?? "new"} id={fid("s-photo")} value={field.value} onChange={field.onChange} initial={editing?.photo} bucket="staff" aspect="aspect-[4/5]" label="photo" />
            )}
          />
        </Field>
      </FormDialog>
    </>
  );
}
