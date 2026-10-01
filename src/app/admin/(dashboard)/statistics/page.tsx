import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/page-header";
import { StatisticManager } from "./statistic-manager";

export const metadata: Metadata = { title: "Statistics" };

export default async function StatisticsPage() {
  await requireAdminPage("content.manage");
  const stats = await db.statistic.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader title="Statistics" description="Numbers shown in the band under the homepage hero. Only use figures the school can confirm." />
      <StatisticManager
        stats={stats.map((s) => ({ id: s.id, value: s.value, label: s.label, description: s.description ?? "", icon: s.icon ?? "", visible: s.visible }))}
      />
    </>
  );
}
