import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/page-header";
import { FaqManager } from "./faq-manager";

export const metadata: Metadata = { title: "FAQs" };

export default async function AdminFaqsPage() {
  await requireAdminPage("content.manage");
  const faqs = await db.faq.findMany({ orderBy: { sortOrder: "asc" } });
  const categories = [...new Set(faqs.map((f) => f.category).filter(Boolean))] as string[];
  return (
    <>
      <PageHeader
        title="FAQs"
        description="Questions and answers on the FAQ page. Questions in the “Admissions” category also appear on the Admissions page."
      />
      <FaqManager
        categories={categories}
        faqs={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer, category: f.category ?? "", status: f.status }))}
      />
    </>
  );
}
