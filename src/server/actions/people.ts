"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/cache-tags";
import { faqSchema, staffSchema } from "@/lib/validation/cms";
import { statusSchema } from "@/lib/validation/common";
import { adminAction, idSchema } from "./_lib";
import { changeStatus, nextSortOrder } from "./_content";

// ─── Staff ────────────────────────────────────────────────────────────────────

export async function saveStaff(input: z.input<typeof staffSchema>) {
  return adminAction(input, {
    permission: "content.manage",
    schema: staffSchema,
    tags: [TAGS.staff],
    run: async ({ id, ...data }, admin) => {
      const member = id
        ? await db.staffMember.update({ where: { id }, data })
        : await db.staffMember.create({ data: { ...data, sortOrder: await nextSortOrder("staffMember") } });
      await audit(admin, {
        action: id ? "staff.update" : "staff.create",
        entity: "StaffMember",
        entityId: member.id,
        summary: `${id ? "Updated" : "Added"} staff member ${member.name}`,
      });
      return { id: member.id };
    },
  });
}

export async function setStaffStatus(input: { id: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  return adminAction(input, {
    permission: "content.manage",
    schema: z.object({ id: z.string().min(1), status: statusSchema }),
    tags: [TAGS.staff],
    run: async ({ id, status }, admin) => {
      const member = await changeStatus("staffMember", id, status);
      await audit(admin, { action: `staff.${status.toLowerCase()}`, entity: "StaffMember", entityId: id, summary: `Set ${member.name} to ${status.toLowerCase()}` });
    },
  });
}

export async function deleteStaff(input: { id: string }) {
  return adminAction(input, {
    permission: "content.manage",
    schema: idSchema,
    tags: [TAGS.staff],
    run: async ({ id }, admin) => {
      const member = await db.staffMember.delete({ where: { id } });
      await audit(admin, { action: "staff.delete", entity: "StaffMember", entityId: id, summary: `Deleted staff member ${member.name}` });
    },
  });
}

// ─── FAQs ─────────────────────────────────────────────────────────────────────

export async function saveFaq(input: z.input<typeof faqSchema>) {
  return adminAction(input, {
    permission: "content.manage",
    schema: faqSchema,
    tags: [TAGS.faqs],
    run: async ({ id, ...data }, admin) => {
      const faq = id
        ? await db.faq.update({ where: { id }, data })
        : await db.faq.create({ data: { ...data, sortOrder: await nextSortOrder("faq") } });
      await audit(admin, { action: id ? "faq.update" : "faq.create", entity: "Faq", entityId: faq.id, summary: `${id ? "Updated" : "Added"} FAQ “${faq.question}”` });
    },
  });
}

export async function setFaqStatus(input: { id: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  return adminAction(input, {
    permission: "content.manage",
    schema: z.object({ id: z.string().min(1), status: statusSchema }),
    tags: [TAGS.faqs],
    run: async ({ id, status }, admin) => {
      const faq = await changeStatus("faq", id, status);
      await audit(admin, { action: `faq.${status.toLowerCase()}`, entity: "Faq", entityId: id, summary: `Set FAQ “${faq.question}” to ${status.toLowerCase()}` });
    },
  });
}

export async function deleteFaq(input: { id: string }) {
  return adminAction(input, {
    permission: "content.manage",
    schema: idSchema,
    tags: [TAGS.faqs],
    run: async ({ id }, admin) => {
      const faq = await db.faq.delete({ where: { id } });
      await audit(admin, { action: "faq.delete", entity: "Faq", entityId: id, summary: `Deleted FAQ “${faq.question}”` });
    },
  });
}
