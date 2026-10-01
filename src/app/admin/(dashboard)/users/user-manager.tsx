"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { createAdminUser, deleteAdminUser, resetAdminPassword, updateAdminUser } from "@/server/actions/users";
import { Button, EmptyRow, StatusBadge, TableWrap, inputClass, selectClass, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { CheckboxField, Field } from "@/components/admin/field";
import { FormDialog } from "@/components/admin/form-dialog";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

type Role = "SUPER_ADMIN" | "ADMIN";
type User = { id: string; name: string; email: string; role: Role; active: boolean; lastLoginAt: string | null };

const dateTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa" });

type CreateValues = { name: string; email: string; role: Role; password: string };
type EditValues = { id: string; name: string; role: Role; active: boolean };
type ResetValues = { id: string; password: string };

export function UserManager({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const fid = useFieldId();
  const router = useRouter();
  const [mode, setMode] = useState<null | { kind: "create" } | { kind: "edit"; user: User } | { kind: "reset"; user: User }>(null);
  const [pending, startTransition] = useTransition();
  const createForm = useForm<CreateValues>({ defaultValues: { name: "", email: "", role: "ADMIN", password: "" } });
  const editForm = useForm<EditValues>();
  const resetForm = useForm<ResetValues>();

  const done = (ok: boolean) => {
    if (ok) {
      setMode(null);
      router.refresh();
    }
  };

  const onCreate = createForm.handleSubmit((v) =>
    startTransition(async () => done(handleResult(await createAdminUser(v), createForm.setError, "User added — share the password with them securely"))),
  );
  const onEdit = editForm.handleSubmit((v) => startTransition(async () => done(handleResult(await updateAdminUser(v), editForm.setError, "User updated"))));
  const onReset = resetForm.handleSubmit((v) => startTransition(async () => done(handleResult(await resetAdminPassword(v), resetForm.setError, "Password changed"))));

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            createForm.reset({ name: "", email: "", role: "ADMIN", password: "" });
            setMode({ kind: "create" });
          }}
        >
          <Plus aria-hidden className="size-4" /> Add user
        </Button>
      </div>
      <TableWrap>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>User</th>
              <th className={thClass}>Role</th>
              <th className={`${thClass} hidden md:table-cell`}>Last sign-in</th>
              <th className={`${thClass} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && <EmptyRow colSpan={4}>No users.</EmptyRow>}
            {users.map((u) => (
              <tr key={u.id}>
                <td className={tdClass}>
                  <p className="font-medium">
                    {u.name} {u.id === currentUserId && <span className="text-xs font-normal text-zinc-500">(you)</span>}
                  </p>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                </td>
                <td className={tdClass}>
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge status={u.role === "SUPER_ADMIN" ? "PUBLISHED" : "DRAFT"} label={u.role === "SUPER_ADMIN" ? "Super admin" : "Admin"} />
                    {!u.active && <StatusBadge status="ARCHIVED" label="Deactivated" />}
                  </div>
                </td>
                <td className={`${tdClass} hidden text-zinc-600 md:table-cell`}>{u.lastLoginAt ? dateTime.format(new Date(u.lastLoginAt)) : "Never"}</td>
                <td className={`${tdClass} text-right`}>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Edit ${u.name}`}
                      onClick={() => {
                        editForm.reset({ id: u.id, name: u.name, role: u.role, active: u.active });
                        setMode({ kind: "edit", user: u });
                      }}
                    >
                      <Pencil aria-hidden className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Set a new password for ${u.name}`}
                      onClick={() => {
                        resetForm.reset({ id: u.id, password: "" });
                        setMode({ kind: "reset", user: u });
                      }}
                    >
                      <KeyRound aria-hidden className="size-4" />
                    </Button>
                    {u.id !== currentUserId && (
                      <ConfirmButton
                        triggerVariant="ghost"
                        triggerSize="icon"
                        triggerLabel={`Remove ${u.name}`}
                        title={`Remove ${u.name}?`}
                        description="Their login is deleted and they can no longer sign in. Their past activity stays in the activity log."
                        confirmLabel="Remove user"
                        confirmText="remove"
                        successMessage="User removed"
                        action={() => deleteAdminUser({ id: u.id })}
                      >
                        <Trash2 aria-hidden className="size-4 text-red-600" />
                      </ConfirmButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      <FormDialog open={mode?.kind === "create"} onClose={() => setMode(null)} title="Add user" onSubmit={onCreate} pending={pending} submitLabel="Add user">
        <Field label="Full name" htmlFor={fid("u-name")} required error={createForm.formState.errors.name?.message}>
          <input id={fid("u-name")} className={inputClass} {...createForm.register("name")} />
        </Field>
        <Field label="Email" htmlFor={fid("u-email")} required error={createForm.formState.errors.email?.message}>
          <input id={fid("u-email")} type="email" autoComplete="off" className={inputClass} {...createForm.register("email")} />
        </Field>
        <Field label="Role" htmlFor={fid("u-role")}>
          <select id={fid("u-role")} className={selectClass} {...createForm.register("role")}>
            <option value="ADMIN">Admin — manages website content</option>
            <option value="SUPER_ADMIN">Super admin — also users, theme and settings</option>
          </select>
        </Field>
        <Field label="Temporary password" htmlFor={fid("u-password")} required error={createForm.formState.errors.password?.message} hint="At least 12 characters. Ask them to change it in “My account” after signing in.">
          <input id={fid("u-password")} type="text" autoComplete="new-password" className={`${inputClass} font-mono`} {...createForm.register("password")} />
        </Field>
      </FormDialog>

      <FormDialog open={mode?.kind === "edit"} onClose={() => setMode(null)} title={mode?.kind === "edit" ? `Edit ${mode.user.name}` : ""} onSubmit={onEdit} pending={pending}>
        <input type="hidden" {...editForm.register("id")} />
        <Field label="Full name" htmlFor={fid("e-name")} required error={editForm.formState.errors.name?.message}>
          <input id={fid("e-name")} className={inputClass} {...editForm.register("name")} />
        </Field>
        <Field label="Role" htmlFor={fid("e-role")}>
          <select id={fid("e-role")} className={selectClass} {...editForm.register("role")}>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super admin</option>
          </select>
        </Field>
        <CheckboxField id={fid("e-active")} label="Active" description="Deactivated users cannot sign in." {...editForm.register("active")} />
      </FormDialog>

      <FormDialog open={mode?.kind === "reset"} onClose={() => setMode(null)} title={mode?.kind === "reset" ? `New password for ${mode.user.name}` : ""} onSubmit={onReset} pending={pending} submitLabel="Set password">
        <input type="hidden" {...resetForm.register("id")} />
        <Field label="New password" htmlFor={fid("r-password")} required error={resetForm.formState.errors.password?.message} hint="At least 12 characters. Share it with them securely.">
          <input id={fid("r-password")} type="text" autoComplete="new-password" className={`${inputClass} font-mono`} {...resetForm.register("password")} />
        </Field>
      </FormDialog>
    </>
  );
}
