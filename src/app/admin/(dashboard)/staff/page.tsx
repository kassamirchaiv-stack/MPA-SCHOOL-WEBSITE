import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { summarizeOrNull } from "@/lib/media-summary";
import { PageHeader } from "@/components/admin/page-header";
import { StaffManager } from "./staff-manager";

export const metadata: Metadata = { title: "Staff" };

export default async function AdminStaffPage() {
  await requireAdminPage("content.manage");
  const staff = await db.staffMember.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { photo: true } });
  return (
    <>
      <PageHeader
        title="Staff & leadership"
        description="Published people appear on the Leadership & Staff page. “Featured” people are shown first, as school leadership."
      />
      <StaffManager
        staff={staff.map((m) => ({
          id: m.id,
          name: m.name,
          position: m.position,
          department: m.department ?? "",
          biography: m.biography ?? "",
          email: m.email ?? "",
          phone: m.phone ?? "",
          photoId: m.photoId ?? "",
          featured: m.featured,
          status: m.status,
          photo: summarizeOrNull(m.photo),
        }))}
      />
    </>
  );
}
