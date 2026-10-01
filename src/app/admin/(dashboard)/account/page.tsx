import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/admin/ui";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const admin = await requireAdminPage();
  return (
    <>
      <PageHeader title="My account" />
      <div className="grid max-w-3xl gap-6">
        <Card title="Profile">
          <dl className="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
            <dt className="text-zinc-500">Name</dt>
            <dd>{admin.name}</dd>
            <dt className="text-zinc-500">Email</dt>
            <dd>{admin.email}</dd>
            <dt className="text-zinc-500">Role</dt>
            <dd>{ROLE_LABELS[admin.role]}</dd>
          </dl>
        </Card>
        <PasswordForm />
      </div>
    </>
  );
}
