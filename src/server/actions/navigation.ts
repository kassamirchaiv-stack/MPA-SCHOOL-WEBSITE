"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/cache-tags";
import { navItemSchema } from "@/lib/validation/cms";
import { ActionError, adminAction, idSchema } from "./_lib";
import { nextSortOrder } from "./_content";

const tags = [TAGS.navigation];

export async function saveNavItem(input: z.input<typeof navItemSchema>) {
  return adminAction(input, {
    permission: "navigation.manage",
    schema: navItemSchema,
    tags,
    run: async ({ id, parentId, ...data }, admin) => {
      if (parentId) {
        // Menus are two levels deep: a dropdown can only belong to a top-level item.
        const parent = await db.navigationItem.findUnique({ where: { id: parentId }, select: { parentId: true, location: true } });
        if (!parent || parent.parentId) throw new ActionError("Choose a top-level item as the dropdown parent.", { parentId: "Invalid parent" });
        if (parent.location !== data.location) throw new ActionError("The parent must be in the same menu.", { parentId: "Different menu" });
        if (parentId === id) throw new ActionError("An item cannot be its own parent.", { parentId: "Invalid parent" });
        if (id && (await db.navigationItem.count({ where: { parentId: id } })) > 0) {
          throw new ActionError("This item has its own dropdown items, so it must stay at the top level.", { parentId: "Has children" });
        }
      }
      const item = id
        ? await db.navigationItem.update({ where: { id }, data: { ...data, parentId } })
        : await db.navigationItem.create({
            data: { ...data, parentId, sortOrder: await nextSortOrder("navigationItem", { location: data.location, parentId }) },
          });
      await audit(admin, { action: id ? "navigation.update" : "navigation.create", entity: "NavigationItem", entityId: item.id, summary: `${id ? "Updated" : "Added"} menu item “${item.label}”` });
    },
  });
}

export async function toggleNavItem(input: { id: string; enabled: boolean }) {
  return adminAction(input, {
    permission: "navigation.manage",
    schema: z.object({ id: z.string().min(1), enabled: z.boolean() }),
    tags,
    run: async ({ id, enabled }, admin) => {
      const item = await db.navigationItem.update({ where: { id }, data: { enabled } });
      await audit(admin, { action: "navigation.toggle", entity: "NavigationItem", entityId: id, summary: `${enabled ? "Showed" : "Hid"} menu item “${item.label}”` });
    },
  });
}

export async function deleteNavItem(input: { id: string }) {
  return adminAction(input, {
    permission: "navigation.manage",
    schema: idSchema,
    tags,
    run: async ({ id }, admin) => {
      // Children are deleted with their parent (onDelete: Cascade).
      const item = await db.navigationItem.delete({ where: { id } });
      await audit(admin, { action: "navigation.delete", entity: "NavigationItem", entityId: id, summary: `Deleted menu item “${item.label}”` });
    },
  });
}
