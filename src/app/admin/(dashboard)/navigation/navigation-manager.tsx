"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CornerDownRight, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { navItemSchema, type NavItemFormValues } from "@/lib/validation/cms";
import { deleteNavItem, saveNavItem, toggleNavItem } from "@/server/actions/navigation";
import { Button, Card, StatusBadge, inputClass, selectClass } from "@/components/admin/ui";
import { CheckboxField, Field } from "@/components/admin/field";
import { FormDialog } from "@/components/admin/form-dialog";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { handleResult } from "@/components/admin/form-utils";
import { useFieldId } from "@/components/admin/use-field-id";

type Location = "HEADER" | "FOOTER" | "LEGAL";
type Item = NavItemFormValues & { id: string; label: string; enabled: boolean };
type TopItem = Item & { children: Item[] };

type Props = {
  location: Location;
  allowChildren: boolean;
  items: TopItem[];
  suggestions: { href: string; label: string }[];
};

export function NavigationManager({ location, allowChildren, items, suggestions }: Props) {
  const fid = useFieldId();
  const router = useRouter();
  const empty: NavItemFormValues = { location, label: "", href: "", parentId: "", isExternal: false, openInNewTab: false, enabled: true };
  const [editing, setEditing] = useState<NavItemFormValues | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<NavItemFormValues>({ resolver: zodResolver(navItemSchema, undefined, { raw: true }), defaultValues: empty });

  const open = (values: NavItemFormValues) => {
    reset(values);
    setEditing(values);
  };
  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveNavItem(values);
      if (handleResult(result, setError, "Menu saved")) {
        setEditing(null);
        router.refresh();
      }
    }),
  );
  const toggle = (item: Item) =>
    startTransition(async () => {
      const result = await toggleNavItem({ id: item.id, enabled: !item.enabled });
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });

  const row = (item: Item, index: number, siblings: Item[], isChild: boolean, childCount = 0) => (
    <li key={item.id} className={`flex flex-wrap items-center gap-3 py-2.5 ${isChild ? "pl-8" : ""}`}>
      <ReorderButtons model="navigationItem" id={item.id} label={item.label} isFirst={index === 0} isLast={index === siblings.length - 1} />
      {isChild && <CornerDownRight aria-hidden className="size-4 text-zinc-400" />}
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${item.enabled ? "" : "text-zinc-500 line-through"}`}>{item.label}</p>
        <p className="truncate text-xs text-zinc-500">
          {(item.href as string) || (childCount > 0 ? `Dropdown (${childCount} item${childCount === 1 ? "" : "s"})` : "No link")}
        </p>
      </div>
      {!item.enabled && <StatusBadge status="OFF" label="Hidden" />}
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="size-8" onClick={() => toggle(item)} disabled={pending} aria-label={item.enabled ? `Hide “${item.label}”` : `Show “${item.label}”`}>
          {item.enabled ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={() => open(item)} aria-label={`Edit “${item.label}”`}>
          <Pencil aria-hidden className="size-4" />
        </Button>
        <ConfirmButton
          triggerVariant="ghost"
          triggerSize="icon"
          triggerLabel={`Delete “${item.label}”`}
          title={`Delete “${item.label}” from the menu?`}
          description={childCount > 0 ? `Its ${childCount} dropdown item(s) will be deleted too. Pages themselves are not affected.` : "The page itself is not affected."}
          confirmLabel="Delete"
          successMessage="Menu item deleted"
          action={() => deleteNavItem({ id: item.id })}
        >
          <Trash2 aria-hidden className="size-4 text-red-600" />
        </ConfirmButton>
      </div>
    </li>
  );

  const parentId = watch("parentId");

  return (
    <Card
      title="Menu items"
      actions={
        <Button size="sm" onClick={() => open(empty)}>
          <Plus aria-hidden className="size-4" /> Add item
        </Button>
      }
    >
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">This menu is empty.</p>
      ) : (
        <ol className="divide-y divide-zinc-100">
          {items.map((item, i) => (
            <li key={item.id}>
              <ol>{row(item, i, items, false, item.children.length)}</ol>
              {item.children.length > 0 && <ol className="border-t border-dashed border-zinc-100">{item.children.map((c, ci) => row(c, ci, item.children, true))}</ol>}
            </li>
          ))}
        </ol>
      )}

      <FormDialog open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? "Edit menu item" : "New menu item"} onSubmit={onSubmit} pending={pending}>
        <Field label="Label" htmlFor={fid("n-label")} required error={errors.label?.message}>
          <input id={fid("n-label")} className={inputClass} aria-invalid={!!errors.label} {...register("label")} />
        </Field>
        <Field
          label="Link"
          htmlFor={fid("n-href")}
          error={errors.href?.message}
          hint={allowChildren && !parentId ? "Leave empty for a dropdown heading that only opens its sub-items." : "A page like /admissions or a full https:// link."}
        >
          <input id={fid("n-href")} list={fid("nav-suggestions")} className={inputClass} aria-invalid={!!errors.href} {...register("href")} />
          <datalist id={fid("nav-suggestions")}>
            {suggestions.map((s) => (
              <option key={s.href} value={s.href}>
                {s.label}
              </option>
            ))}
          </datalist>
        </Field>
        {allowChildren && (
          <Field label="Show inside dropdown" htmlFor={fid("n-parent")} error={errors.parentId?.message}>
            <select id={fid("n-parent")} className={selectClass} {...register("parentId")}>
              <option value="">No — top-level item</option>
              {items
                .filter((i) => i.id !== editing?.id)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    Under “{i.label}”
                  </option>
                ))}
            </select>
          </Field>
        )}
        <CheckboxField
          id={fid("n-external")}
          label="External website"
          description="Link goes to another website."
          {...register("isExternal", { onChange: (e) => e.target.checked && setValue("openInNewTab", true) })}
        />
        <CheckboxField id={fid("n-newtab")} label="Open in a new tab" {...register("openInNewTab")} />
        <CheckboxField id={fid("n-enabled")} label="Show in the menu" {...register("enabled")} />
      </FormDialog>
    </Card>
  );
}
