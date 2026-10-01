"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { changeOwnPassword } from "@/server/actions/users";
import { Card, inputClass } from "@/components/admin/ui";
import { Field } from "@/components/admin/field";
import { FormActions } from "@/components/admin/form-panels";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

type Values = { currentPassword: string; newPassword: string; confirm: string };

export function PasswordForm() {
  const fid = useFieldId();
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<Values>({
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
  });
  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      if (handleResult(await changeOwnPassword(values), setError, "Password changed")) reset();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card title="Change password">
        <div className="grid max-w-md gap-4">
          <Field label="Current password" htmlFor={fid("currentPassword")} error={errors.currentPassword?.message}>
            <input id={fid("currentPassword")} type="password" autoComplete="current-password" className={inputClass} {...register("currentPassword")} />
          </Field>
          <Field label="New password" htmlFor={fid("newPassword")} error={errors.newPassword?.message} hint="At least 12 characters.">
            <input id={fid("newPassword")} type="password" autoComplete="new-password" className={inputClass} {...register("newPassword")} />
          </Field>
          <Field label="Repeat new password" htmlFor={fid("confirm")} error={errors.confirm?.message}>
            <input id={fid("confirm")} type="password" autoComplete="new-password" className={inputClass} {...register("confirm")} />
          </Field>
        </div>
      </Card>
      <FormActions pending={pending} submitLabel="Change password" />
    </form>
  );
}
